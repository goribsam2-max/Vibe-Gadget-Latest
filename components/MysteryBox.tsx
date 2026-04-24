import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';
import { useNavigate } from 'react-router-dom';

const MysteryBox: React.FC<{ products: any[] }> = ({ products }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [revealedProduct, setRevealedProduct] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const hasOpenedToday = localStorage.getItem('mystery_box_opened_date');
    const today = new Date().toDateString();
    // Do not auto open, just check if they opened today so we don't show it as available if we want to restrict
  }, []);

  const handleOpen = () => {
    if (products.length === 0) return;
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
      setIsOpen(true);
      const randomProd = products[Math.floor(Math.random() * products.length)];
      setRevealedProduct(randomProd);
      localStorage.setItem('mystery_box_opened_date', new Date().toDateString());
    }, 1500);
  };

  if (products.length === 0) return null;

  return (
    <>
      <motion.div 
        className="fixed top-1/3 right-0 z-50 translate-x-4 hover:translate-x-0 transition-transform cursor-pointer group shadow-2xl"
        whileHover={{ scale: 1.05 }}
        onClick={handleOpen}
      >
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 pl-4 pr-6 rounded-l-3xl shadow-xl flex items-center space-x-3 border border-r-0 border-white/20">
          <motion.div 
            animate={{ rotate: isShaking ? [0, -15, 15, -15, 15, 0] : 0 }}
            transition={{ duration: 0.5, repeat: isShaking ? Infinity : 0 }}
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-inner"
          >
            <Icon name="gift" className="text-white text-lg drop-shadow-md" />
          </motion.div>
          <div className="flex flex-col">
            <span className="text-white font-black text-[10px] tracking-widest uppercase shadow-sm">Mystery Drop</span>
            <span className="text-purple-200 text-[8px] font-bold uppercase tracking-widest">Tap to unbox</span>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isOpen && revealedProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setIsOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.5, y: 50, rotate: -10 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.5 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full relative overflow-hidden shadow-2xl border-4 border-purple-500/30 text-center"
            >
              <div className="absolute inset-0 bg-mesh-pattern opacity-5 pointer-events-none mix-blend-overlay"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400 rounded-full blur-[60px] opacity-20"></div>
              
              <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-zinc-100 rounded-full hover:bg-zinc-200 transition-colors">
                <Icon name="times" className="text-xs" />
              </button>

              <div className="inline-block px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-[9px] font-black uppercase tracking-widest mb-6">
                You Unlocked a Deal!
              </div>

              <div className="relative w-40 h-40 mx-auto mb-6 bg-zinc-50 rounded-[2rem] p-4 border border-zinc-100 shadow-inner group">
                <img src={revealedProduct.image} alt={revealedProduct.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute -bottom-3 -right-3 bg-red-500 text-white w-12 h-12 rounded-full flex flex-col items-center justify-center font-black animate-bounce shadow-lg border-2 border-white rotate-12">
                  <span className="text-[10px] leading-none">EXTRA</span>
                  <span className="text-xs leading-none">10%</span>
                </div>
              </div>

              <h3 className="font-black text-lg text-zinc-900 mb-2 leading-tight tracking-tight px-4">{revealedProduct.name}</h3>
              
              <div className="flex justify-center items-center space-x-2 mb-8">
                <span className="text-2xl font-black text-purple-600">৳{Math.floor(revealedProduct.price * 0.9)}</span>
                <span className="text-xs font-bold text-zinc-400 line-through">৳{revealedProduct.price}</span>
              </div>

              <button 
                onClick={() => {
                  setIsOpen(false);
                  navigate(`/product/${revealedProduct.id}`);
                }}
                className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-purple-600/30 hover:bg-purple-700 active:scale-95 transition-all"
              >
                Claim Offer Now
              </button>
              <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-4">Offer valid for 1 hour only</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MysteryBox;
