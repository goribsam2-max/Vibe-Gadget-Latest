
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot, deleteDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Product, Review } from '../types';
import { useNotify } from '../components/Notifications';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../components/Icon';

const ProductDetails: React.FC = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [direction, setDirection] = useState(0); 
  const [fullScreenImg, setFullScreenImg] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [bundleItems, setBundleItems] = useState<Product[]>([]);
  
  const notify = useNotify();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProduct = async () => {
      if (!id) return;
      const snap = await getDoc(doc(db, 'products', id));
      if (snap.exists()) {
        const productData = { id: snap.id, ...snap.data() } as Product;
        setProduct(productData);
        // Increment views
        try {
           const { increment, updateDoc } = await import('firebase/firestore');
           await updateDoc(doc(db, 'products', id), { views: increment(1) });
        } catch(e) {}
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (id) {
      const q = query(collection(db, 'reviews'), where('productId', '==', id));
      const unsubscribeReviews = onSnapshot(q, (snapshot) => {
        const reviewList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
        reviewList.sort((a, b) => b.createdAt - a.createdAt);
        setReviews(reviewList);
      }, (err) => console.warn("Reviews fetch error:", err.message));

      let unsubscribeWishlist = () => {};
      if (auth.currentUser) {
        const wishlistRef = doc(db, 'users', auth.currentUser.uid, 'wishlist', id);
        unsubscribeWishlist = onSnapshot(wishlistRef, (snap) => {
          setIsWishlisted(snap.exists());
        }, (err) => console.warn("Wishlist fetch error:", err.message));
      }

      if (id) {
        const productQ = query(collection(db, 'products'));
        onSnapshot(productQ, (snap) => {
           const allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
           const others = allProducts.filter(p => p.id !== id).slice(0, 2);
           setBundleItems(others);
        });
      }
      return () => {
        unsubscribeReviews();
        unsubscribeWishlist();
      }
    }
  }, [id, auth.currentUser]);

  const toggleWishlist = async () => {
    if (!auth.currentUser) return notify("Please sign in to save items", "info");
    if (!product || !id) return;

    const wishlistRef = doc(db, 'users', auth.currentUser.uid, 'wishlist', id);
    try {
      if (isWishlisted) {
        await deleteDoc(wishlistRef);
        notify("Removed from wishlist.", "info");
      } else {
        await setDoc(wishlistRef, {
          productId: id,
          name: product.name,
          image: product.image,
          price: product.price,
          rating: product.rating,
          addedAt: Date.now()
        });
        notify("Added to wishlist!", "success");
      }
    } catch (e) {
      notify("Failed to update wishlist.", "error");
    }
  };

  const addToCart = (redirect = false) => {
    if (!product) return;
    const cart = JSON.parse(localStorage.getItem('f_cart') || '[]');
    const existingIndex = cart.findIndex((item: any) => item.id === product.id);
    
    const offerPrice = product.isOffer && product.offerPrice ? product.offerPrice : product.price;

    if (existingIndex > -1) {
      cart[existingIndex].quantity += 1;
      cart[existingIndex].price = offerPrice; // Update to the correct price
    } else {
      cart.push({ ...product, price: offerPrice, originalPrice: product.price, quantity: 1 });
    }

    localStorage.setItem('f_cart', JSON.stringify(cart));
    
    if (redirect) {
      navigate('/checkout');
    } else {
      notify("Added to cart!", "success");
      navigate('/cart');
    }
  };

  const changeImage = (index: number) => {
    setDirection(index > activeImg ? 1 : -1);
    setActiveImg(index);
  };

  const handleBundleAddToCart = () => {
    if (!product) return;
    const itemsToAdd = [product, ...bundleItems];
    let cart: any[] = [];
    try { cart = JSON.parse(localStorage.getItem('f_cart') || '[]'); } catch(e) {}
    
    itemsToAdd.forEach(item => {
       const offerPrice = item.isOffer && item.offerPrice ? item.offerPrice : item.price;
       const existing = cart.find(c => c.id === item.id);
       if (existing) {
          existing.quantity += 1;
       } else {
          cart.push({ ...item, quantity: 1, originalPrice: item.price, price: offerPrice * 0.90 }); // 10% bundle discount
       }
    });
    localStorage.setItem('f_cart', JSON.stringify(cart));
    notify("Bundle added to cart with 15% discount!", "success");
    navigate('/cart');
  };

  if (!product) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-10 h-10 border-4 border-black border-t-transparent rounded-full" />
    </div>
  );

  const images = product.images || [product.image];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 500 : -500,
      opacity: 0,
      scale: 0.9,
      filter: 'blur(10px)'
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)'
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 500 : -500,
      opacity: 0,
      scale: 0.9,
      filter: 'blur(10px)'
    })
  };

  return (
    <div className="animate-fade-in bg-white min-h-screen pb-32 w-full mx-auto flex flex-col lg:flex-row lg:items-start lg:p-12 lg:gap-16 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      
      <div className="w-full lg:w-[45%] lg:max-w-[450px] xl:max-w-[500px] lg:sticky lg:top-12 animate-stagger-1 relative z-10">
        <div className="relative aspect-square md:aspect-video lg:aspect-square bg-zinc-50 rounded-b-[2.5rem] lg:rounded-[2.5rem] overflow-hidden flex items-center justify-center border border-zinc-100 group shadow-lg hover-glow transition-all">
          <button onClick={() => navigate(-1)} className="absolute top-4 left-4 lg:hidden z-10 w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur-md rounded-full text-zinc-600 shadow-sm border border-zinc-200 hover:bg-zinc-900 hover:text-white transition-all active:scale-95 group/btn">
            <Icon name="arrow-left" className="text-xs group-hover/btn:-translate-x-1 transition-transform" />
          </button>
          
          <AnimatePresence initial={false} custom={direction}>
            <motion.img 
              key={activeImg}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 400, damping: 35 },
                opacity: { duration: 0.3 },
                scale: { duration: 0.3 },
                filter: { duration: 0.3 }
              }}
              src={images[activeImg]} 
              className="absolute w-full h-full object-contain p-6 md:p-12 lg:p-16 cursor-zoom-in group-hover:scale-105 transition-transform duration-700 mix-blend-multiply"
              onClick={() => setFullScreenImg(images[activeImg])}
              alt={product.name}
            />
          </AnimatePresence>
          
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 bg-white/70 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-lg z-10">
              {images.map((_, i) => (
                <button key={i} onClick={() => changeImage(i)} className={`h-1.5 rounded-full transition-all duration-500 ${i === activeImg ? 'w-6 bg-[#06331e]' : 'w-1.5 bg-zinc-300 hover:bg-zinc-400'}`}></button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-center flex-wrap gap-3 mt-6 px-6 lg:px-0">
          {images.map((img, i) => (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              key={i} 
              onClick={() => changeImage(i)}
              className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl border-2 p-1 bg-white transition-all overflow-hidden relative ${i === activeImg ? 'border-[#06331e] shadow-md pulse-ring-active' : 'border-zinc-100 opacity-60 hover:opacity-100 hover:border-emerald-200'}`}
            >
              <img src={img} className="w-full h-full object-contain rounded-xl mix-blend-multiply" alt="" />
            </motion.button>
          ))}
        </div>
      </div>

      <div className="px-6 py-10 lg:py-0 flex-1 w-full max-w-3xl mx-auto lg:mx-0 animate-stagger-2 relative z-10">
        <div className="mb-10 px-1">
           <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-[0.2em] mb-3 bg-emerald-50 inline-block px-3 py-1 rounded-full border border-emerald-100">{product.category}</p>
           <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-4 leading-tight text-zinc-900">{product.name}</h1>
           <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-6 gap-4">
              <div className="flex items-center space-x-3">
                 <div className="bg-gradient-to-r from-[#06331e] to-black text-white px-6 py-3 rounded-full inline-flex items-center shadow-lg shadow-emerald-900/20 shrink-0 hover-glow">
                    <span className="text-xs font-bold opacity-80 mr-1">৳</span>
                    <span className="text-xl lg:text-2xl font-black tracking-tight">{(product.isOffer && product.offerPrice ? product.offerPrice : product.price).toLocaleString()}</span>
                 </div>
                 {product.isOffer && product.offerPrice && (
                    <span className="text-zinc-400 font-bold line-through text-base md:text-lg lg:text-base xl:text-sm mt-0.5">৳{product.price.toLocaleString()}</span>
                 )}
              </div>
              <div className="flex w-fit items-center space-x-1.5 bg-zinc-50 border border-zinc-100 px-3 py-2 rounded-full shadow-sm shrink-0">
                 <Icon name="star" className="text-yellow-500 text-[10px]" />
                 <span className="text-xs font-bold text-zinc-800">{product.rating}</span>
                 <span className="text-[10px] font-bold text-zinc-400 capitalize">({product.numReviews || 0} revs)</span>
              </div>
           </div>
        </div>

        <div className="mb-12">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4 px-1">Product Description</h3>
            <p className="text-sm md:text-base text-zinc-600 leading-relaxed font-medium whitespace-pre-wrap px-1">
              {product.description || "High-quality premium accessory designed for ultimate performance and style."}
            </p>
        </div>

        {bundleItems.length > 0 && <div className="mb-12 border-t border-zinc-100 pt-8">
            <div className="flex justify-between items-center mb-6 px-1">
               <div>
                 <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Bundle Offer</h3>
                 <h2 className="text-lg font-black tracking-tight mt-1 text-zinc-900">Shop the Look</h2>
               </div>
               <button onClick={handleBundleAddToCart} className="bg-zinc-100 text-zinc-900 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-sm hover:bg-zinc-200 transition-colors active:scale-95">
                  Add Bundle
               </button>
            </div>
            
            <div className="bg-zinc-50 rounded-3xl p-6 border border-zinc-200 shadow-inner flex flex-col md:flex-row items-center gap-6">
                <div className="flex items-center w-full md:w-auto overflow-x-auto no-scrollbar pb-2">
                   <div className="w-20 h-20 bg-white rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-center p-2 shrink-0">
                      <img src={product.image} className="w-full h-full object-contain" alt="" />
                   </div>
                   {bundleItems.map(item => (
                     <React.Fragment key={item.id}>
                       <div className="text-zinc-300 mx-3"><Icon name="plus" /></div>
                       <div className="w-20 h-20 bg-white rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-center p-2 shrink-0">
                          <img src={item.image} className="w-full h-full object-contain" alt="" />
                       </div>
                     </React.Fragment>
                   ))}
                </div>
                
                <div className="md:ml-auto text-center md:text-right border-t md:border-t-0 md:border-l border-zinc-200 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
                   <p className="text-[10px] font-bold text-emerald-600 tracking-widest uppercase mb-1">Save 15%</p>
                   {(() => {
                      const basePrice = product.price + bundleItems.reduce((a, b) => a + b.price, 0);
                      const discountPrice = basePrice * 0.85;
                      return (
                       <>
                         <p className="text-xl font-black text-zinc-900 line-through opacity-30 text-xs mb-0.5">৳{basePrice.toLocaleString()}</p>
                         <p className="text-xl font-black text-zinc-900 tracking-tight">৳{discountPrice.toLocaleString()}</p>
                       </>
                      );
                   })()}
                </div>
            </div>
        </div>}

        <div className="mb-12">
           <div className="flex justify-between items-center mb-6 px-1">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Customer Reviews</h3>
              <button onClick={() => navigate(`/leave-review?productId=${product.id}`)} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 uppercase tracking-widest transition-all">Write a Review</button>
           </div>

           <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100 transition-all hover:bg-white hover:border-zinc-200">
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-4">
                         <img src={review.userPhoto || `https://ui-avatars.com/api/?name=${review.userName}&background=000&color=fff`} className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white shadow-sm" alt="" />
                         <div>
                            <p className="text-xs font-black tracking-tight text-zinc-900">{review.userName}</p>
                            <div className="flex text-[8px] text-yellow-400 mt-1">
                               {[...Array(5)].map((_, i) => <Icon key={i} name={i < review.rating ? 'star' : 'star-outline'} solid={i < review.rating} className="mr-0.5" />)}
                            </div>
                         </div>
                      </div>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase">{new Date(review.createdAt).toLocaleDateString()}</span>
                   </div>
                   <p className="text-xs md:text-sm text-zinc-600 font-medium leading-relaxed">"{review.comment}"</p>
                   {review.images && review.images.length > 0 && (
                      <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 mt-3">
                         {review.images.map((img, i) => (
                           <img 
                            key={i} src={img} 
                            className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover border-2 border-white shadow-sm cursor-zoom-in shrink-0 hover:scale-105 transition-transform" 
                            onClick={() => setFullScreenImg(img)}
                            alt="" 
                           />
                         ))}
                      </div>
                   )}
                </div>
              ))}
              {reviews.length === 0 && <div className="py-12 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-400">No reviews yet</div>}
           </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-zinc-100 z-30 flex items-center space-x-3 lg:static lg:bg-transparent lg:border-0 lg:p-0 lg:mt-8">
           <button 
             onClick={() => addToCart(false)} 
             className="flex-1 py-3.5 md:py-4 bg-white text-zinc-900 border border-zinc-200 rounded-2xl flex items-center justify-center space-x-2 text-[10px] md:text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-50 transition-all active:scale-95 shadow-sm whitespace-nowrap"
           >
              <Icon name="shopping-bag" className="text-[10px]" />
              <span className="hidden sm:inline">Add to Cart</span>
              <span className="sm:hidden">Add</span>
           </button>
           <button 
             onClick={() => addToCart(true)} 
             className="flex-[2] py-3.5 md:py-4 bg-[#06331e] text-white rounded-2xl flex items-center justify-center space-x-2 text-[10px] md:text-[9px] font-bold uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg shadow-emerald-900/20 whitespace-nowrap"
           >
              <span>Buy Now</span>
              <Icon name="bolt" className="text-yellow-400 text-[10px] ml-1" />
           </button>
           <button 
             onClick={toggleWishlist}
             className={`w-12 h-12 md:w-14 md:h-14 shrink-0 flex items-center justify-center rounded-2xl border transition-all active:scale-90 shadow-sm ${isWishlisted ? 'bg-red-50 text-red-500 border-red-100' : 'bg-white text-zinc-400 border-zinc-200 hover:border-zinc-300 hover:text-zinc-600'}`}
           >
             <Icon name="heart" solid={isWishlisted} className="text-[13px]" />
           </button>
           <button 
             onClick={() => {
                if (navigator.share) {
                   navigator.share({ title: product.name, url: window.location.href }).catch(() => {});
                } else {
                   navigator.clipboard.writeText(window.location.href);
                   notify("Link copied to clipboard!", "success");
                }
             }}
             className="w-12 h-12 md:w-14 md:h-14 shrink-0 flex items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-400 hover:border-zinc-300 hover:text-zinc-600 transition-all active:scale-90 shadow-sm"
           >
             <Icon name="share-alt" className="text-[13px]" />
           </button>
        </div>
      </div>

      <AnimatePresence>
        {fullScreenImg && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-[40px] z-[10000] flex items-center justify-center p-6 md:p-20"
            onClick={() => setFullScreenImg(null)}
          >
            <motion.button 
              whileHover={{ scale: 1.1 }}
              className="absolute top-10 right-10 text-white p-5 bg-white/10 rounded-full hover:bg-white/20 transition-all z-[10001]"
            >
              <Icon name="times" className="text-2xl" />
            </motion.button>
            <motion.img 
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              src={fullScreenImg} 
              className="max-w-full max-h-full object-contain rounded-3xl md:rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/10" 
              alt="Immersive product view" 
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetails;
