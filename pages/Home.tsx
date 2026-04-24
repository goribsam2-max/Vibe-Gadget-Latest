
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import ReactPlayer from 'react-player';
import { getReadableAddress } from '../services/location';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import Logo from '../components/Logo';
import Icon from '../components/Icon';
import WelcomePopup from '../components/WelcomePopup';
import MysteryBox from '../components/MysteryBox';

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [activeBanner, setActiveBanner] = useState(0);
  const [activeFeatured, setActiveFeatured] = useState(0);
  const [activeCategory, setActiveCategory] = useState('All');
  const [locationName, setLocationName] = useState('Locating...');
  const [quickViewImg, setQuickViewImg] = useState<string | null>(null);
  const [stories, setStories] = useState<any[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);

  const heroBanners = banners.filter(b => (!b.bannerType || b.bannerType === 'hero'));
  const popupBanners = banners.filter(b => b.bannerType === 'popup');
  const gifBanners = banners.filter(b => b.bannerType === 'gif');

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveBanner(prev => (prev + 1) % heroBanners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [heroBanners.length]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  useEffect(() => {
     try {
        const h = JSON.parse(localStorage.getItem('f_search_history') || '[]');
        setSearchHistory(h);
     } catch(e) {}
  }, []);

  const saveSearchHistory = (query: string) => {
     if (!query.trim()) return;
     try {
        let history = JSON.parse(localStorage.getItem('f_search_history') || '[]');
        history = [query.trim(), ...history.filter((h: string) => h !== query.trim())].slice(0, 5);
        localStorage.setItem('f_search_history', JSON.stringify(history));
        setSearchHistory(history);
     } catch(e) {}
  };
  const [timeLeft, setTimeLeft] = useState({ h: 2, m: 45, s: 30 });
  const [showProof, setShowProof] = useState(false);
  const [proofData, setProofData] = useState({ name: 'Someone', item: 'an item', location: 'Dhaka' });

  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  
  const bannerContainerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: bannerContainerRef,
    offset: ["start end", "end start"],
    layoutEffect: false
  });
  
  const parallaxY = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  const smoothY = useSpring(parallaxY, { stiffness: 80, damping: 20, restDelta: 0.001 });

  useEffect(() => {
    const qProds = query(collection(db, 'products'));
    const unsubscribeProds = onSnapshot(qProds, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (err) => {
      console.warn("Products fetch error:", err.message);
    });

    const qBanners = query(collection(db, 'banners'), orderBy('createdAt', 'desc'));
    const unsubscribeBanners = onSnapshot(qBanners, (snapshot) => {
      setBanners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.warn("Banners fetch error:", err.message);
    });

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'platform'), (snap) => {
      if (snap.exists()) setSettings(snap.data());
    });

    const unsubscribeStories = onSnapshot(collection(db, 'stories'), (snap) => {
      setStories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const address = await getReadableAddress(position.coords.latitude, position.coords.longitude);
        setLocationName(address);
      }, () => setLocationName('Dhaka, Bangladesh'));
    }
    return () => { unsubscribeProds(); unsubscribeBanners(); unsubscribeSettings(); unsubscribeStories(); };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (settings?.dealEndTime) {
         const diff = new Date(settings.dealEndTime).getTime() - new Date().getTime();
         if (diff > 0) {
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft({ h, m, s });
         } else {
            setTimeLeft({ h: 0, m: 0, s: 0 });
         }
      } else {
         setTimeLeft({ h: 0, m: 0, s: 0 });
      }
    }, 1000);
    
    // Setup timer based on initial load
    return () => clearInterval(timer);
  }, [settings?.dealEndTime]);

  // Separate useEffect for the Social Proof logic so we always have the freshest products list
  useEffect(() => {
    const proofTimer = setInterval(() => {
       if (localStorage.getItem('hide_mock_purchases') === 'true') return;

       const names = [
          'Karim', 'Ayesha', 'Mominul', 'Nafis', 'Tasnim', 'Rahim', 'Jamil', 'Sadia', 'Farid', 'Imran', 
          'Tarek', 'Hasan', 'Rakib', 'Mehedi', 'Sumaiya', 'Anis', 'Sabbir', 'Arif', 'Riyad', 'Sanjida', 'Rubel', 'Nazmul'
       ];
       const locations = [
          'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh', 'Comilla', 'Gazipur', 'Narayanganj', 'Bogra'
       ];
       
       let randomItemTitle = 'Premium Gadget';
       if (products.length > 0) {
          randomItemTitle = products[Math.floor(Math.random() * products.length)].name;
       } else {
          // Fallback just in case
          const fallbackItems = ['AirPods Pro', 'MacBook Air', 'iPhone 15', 'Apple Watch'];
          randomItemTitle = fallbackItems[Math.floor(Math.random() * fallbackItems.length)];
       }

       setProofData({
          name: names[Math.floor(Math.random() * names.length)],
          location: locations[Math.floor(Math.random() * locations.length)],
          item: randomItemTitle
       });
       setShowProof(true);
       setTimeout(() => setShowProof(false), 8000);
    }, 15000);

    return () => clearInterval(proofTimer);
  }, [products]);

  useEffect(() => {
    if (!settings?.featuredCategory) return;
    const featuredProds = products.filter(p => p.category.toLowerCase() === settings.featuredCategory.toLowerCase());
    if (featuredProds.length > 1) {
      const interval = setInterval(() => setActiveFeatured(prev => (prev + 1) % featuredProds.length), 4000);
      return () => clearInterval(interval);
    }
  }, [products, settings?.featuredCategory]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    const results = products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);
    setSearchResults(results);
  }, [searchQuery, products]);

  // Story progress logic
  useEffect(() => {
     let progressInterval: any;
     if (activeStoryIndex !== null) {
        setStoryProgress(0);
        const currentStory = stories[activeStoryIndex];
        // If it's a video, progress is handled by ReactPlayer's onProgress unless it fails.
        // For images, we use a 10 second duration.
        if (currentStory && currentStory.type !== 'video') {
            progressInterval = setInterval(() => {
               setStoryProgress(prev => {
                  if (prev >= 100) {
                     if (activeStoryIndex < stories.length - 1) {
                        setActiveStoryIndex(activeStoryIndex + 1);
                        return 0;
                     } else {
                        setActiveStoryIndex(null);
                        return 0;
                     }
                  }
                  return prev + (100 / 100); // 100 steps of 100ms = 10 seconds total
               });
            }, 100);
        }
     }
     return () => clearInterval(progressInterval);
  }, [activeStoryIndex, stories]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categories = [
    { name: 'Mobile', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=250&h=250&auto=format&fit=crop' },
    { name: 'Accessories', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=250&h=250&auto=format&fit=crop' },
    { name: 'Gadgets', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=250&h=250&auto=format&fit=crop' },
    { name: 'Chargers', image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=250&h=250&auto=format&fit=crop' }
  ];

  return (
    <div className="relative pt-8 pb-24 px-6 md:px-12 bg-white max-w-[1440px] mx-auto min-h-screen font-inter">
      <WelcomePopup banners={popupBanners} />
      <MysteryBox products={products} />
      {/* Aesthetic Background Blobs */}
      <div className="blob bg-emerald-300/30 w-64 h-64 rounded-full top-0 left-[-10%] z-0"></div>
      <div className="blob bg-emerald-200/20 w-96 h-96 rounded-full top-[20%] right-[-10%] animation-delay-2000 z-0"></div>
      <div className="blob bg-blue-200/20 w-80 h-80 rounded-full bottom-[10%] left-[10%] animation-delay-4000 z-0"></div>

      {/* Premium Announcement Bar */}
      <div className="absolute top-0 left-0 w-full bg-[#06331e] text-white py-1.5 overflow-hidden z-50 flex items-center shadow-md">
        <div className="animate-marquee whitespace-nowrap text-[9px] font-black tracking-[0.2em] uppercase">
          <span className="mx-8"><Icon name="bolt" className="text-emerald-400 mr-2"/> Free Shipping on orders over ৳5000</span>
          <span className="mx-8"><Icon name="star" className="text-yellow-400 mr-2"/> 100% Authentic Products</span>
          <span className="mx-8"><Icon name="shield-check" className="text-blue-400 mr-2"/> 12 Months Warranty Included</span>
          <span className="mx-8 text-emerald-400">Use Code: VIBE20 for 20% OFF</span>
        </div>
      </div>

      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex justify-between items-center mb-6 md:mb-8">
        <div className="md:hidden">
          <Logo scale={0.8} className="origin-left" />
        </div>
        <div className="hidden md:flex items-center space-x-2">
           <Icon name={new Date().getHours() < 18 ? "sun" : "moon"} className="text-emerald-500 text-xl animate-pulse" />
           <h2 className="text-xl font-black text-zinc-900 tracking-tight">
             {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}, Explorer
           </h2>
        </div>
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex flex-col text-right mr-4">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Delivering to</p>
            <button className="flex items-center justify-end font-bold text-xs hover:text-[#06331e] transition-colors whitespace-nowrap">
              <Icon name="map-marker" className="text-emerald-500 mr-2 text-[10px]" />
              {locationName}
            </button>
          </div>
          <button onClick={() => navigate('/notifications')} className="w-12 h-12 flex items-center justify-center bg-zinc-50 rounded-full relative border border-zinc-100 active:scale-95 transition-transform hover:bg-black hover:text-white shadow-sm group">
            <Icon name="bell" className="text-sm" />
            <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border border-white group-hover:border-black"></span>
          </button>
        </div>
      </motion.div>

      {/* Stories Section */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar mb-8 py-4 px-1 items-center animate-stagger-1 w-full text-center">
         {stories.length > 0 ? stories.map((story, idx) => (
            <div key={story.id} onClick={() => setActiveStoryIndex(idx)} className="flex flex-col items-center gap-2 cursor-pointer group shrink-0 w-[72px] md:w-[88px]">
               <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-white ring-2 ring-emerald-400 group-hover:ring-offset-2 transition-all flex items-center justify-center shadow-sm overflow-hidden bg-zinc-100`}>
                  {story.type === 'video' ? (
                     <video src={story.mediaUrl} className="w-full h-full object-cover" muted />
                  ) : (
                     <img src={story.mediaUrl} className="w-full h-full object-cover" alt="" />
                  )}
               </div>
               <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 group-hover:text-black w-full truncate">{story.category}</span>
            </div>
         )) : [
           { icon: 'fire', text: 'Trending', bg: 'bg-orange-100', color: 'text-orange-500' },
           { icon: 'star', text: 'New', bg: 'bg-emerald-100', color: 'text-emerald-500' },
           { icon: 'gift', text: 'Offers', bg: 'bg-blue-100', color: 'text-blue-500' },
           { icon: 'crown', text: 'Premium', bg: 'bg-purple-100', color: 'text-purple-500' },
           { icon: 'bolt', text: 'Flash', bg: 'bg-red-100', color: 'text-red-500' }
         ].map((story, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 cursor-pointer group shrink-0 w-[72px] md:w-[88px]">
               <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full ${story.bg} border-2 border-white ring-1 ring-zinc-200 group-hover:ring-emerald-400 group-hover:ring-2 group-hover:ring-offset-2 transition-all flex items-center justify-center shadow-sm`}>
                  <Icon name={story.icon} className={`text-xl md:text-2xl ${story.color} transition-transform`} />
               </div>
               <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 group-hover:text-black w-full truncate">{story.text}</span>
            </div>
         ))}
      </div>

      <motion.div 
        ref={bannerContainerRef}
        className={`relative mb-14 overflow-hidden rounded-[2.5rem] shadow-2xl z-10 border-4 border-white animate-stagger-2 hover-tilt ${heroBanners.length > 0 ? 'block' : 'hidden'}`}
      >
        <div className="absolute inset-0 bg-mesh-pattern opacity-30 mix-blend-overlay z-0 pointer-events-none"></div>
        <div className="flex transition-transform duration-1000 ease-[cubic-bezier(0.23, 1, 0.32, 1)]" style={{ transform: `translateX(-${activeBanner * 100}%)` }}>
          {heroBanners.map((banner, i) => (
            <div key={i} className="min-w-full bg-[#06331e] h-[160px] md:h-[200px] lg:h-[260px] relative overflow-hidden flex items-center">
               <motion.img 
                src={banner.imageUrl} 
                style={{ y: smoothY, scale: 1.2 }}
                className="absolute inset-0 w-full h-full object-cover origin-center opacity-60 mix-blend-overlay" 
                alt="" 
               />
               <div className="absolute inset-0 bg-gradient-to-r from-[#06331e]/50 via-[#06331e]/20 to-transparent"></div>
               <div className="relative z-10 p-6 md:p-14 max-w-lg">
                  <h2 className="text-lg md:text-xl lg:text-2xl font-black tracking-tight mb-2 uppercase leading-tight text-white line-clamp-2 w-full whitespace-normal">{banner.title}</h2>
                  <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest opacity-80 mb-4 md:mb-6 text-emerald-100 truncate w-full">{banner.description}</p>
                  <button onClick={() => banner.link && navigate(banner.link)} className="px-6 py-2.5 bg-white text-[#06331e] rounded-full font-bold text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-50 transition-colors whitespace-nowrap">
                    Shop Now
                  </button>
               </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-4 right-6 flex space-x-2 z-20">
           {heroBanners.map((_, i) => (
             <div key={i} onClick={() => setActiveBanner(i)} className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${i === activeBanner ? 'w-8 bg-emerald-400' : 'w-2 bg-white/30 hover:bg-white/50'}`}></div>
           ))}
        </div>
      </motion.div>

      {settings?.featuredCategory && products.filter(p => p.category.toLowerCase() === settings.featuredCategory.toLowerCase()).length > 0 && (
        <div className="mb-10 md:mb-14">
          <div className="relative w-full h-[160px] md:h-[200px] rounded-[2rem] overflow-hidden border border-zinc-100 shadow-sm bg-zinc-900 group">
            <div className="flex transition-transform duration-1000 ease-[cubic-bezier(0.23, 1, 0.32, 1)] h-full" style={{ transform: `translateX(-${activeFeatured * 100}%)` }}>
              {products.filter(p => p.category.toLowerCase() === settings.featuredCategory.toLowerCase()).map((product, i) => (
                <div key={product.id} className="min-w-full h-full relative grid grid-cols-2 md:grid-cols-5 items-center">
                   <div className="col-span-1 md:col-span-3 h-full relative bg-zinc-50 flex items-center justify-center p-6 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-zinc-200/50 to-zinc-50 mix-blend-multiply"></div>
                      <img src={product.image} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-[1.05] transition-transform duration-1000 relative z-10" alt={product.name} />
                   </div>
                   <div className="col-span-1 md:col-span-2 p-6 md:p-8 flex flex-col justify-center h-full bg-black text-white relative">
                      <div className="absolute top-0 right-0 p-3 md:p-4">
                        <span className="px-3 py-1 bg-white/10 text-white rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-md whitespace-nowrap">Featured</span>
                      </div>
                      <h4 className="text-sm md:text-xl font-black mb-1.5 md:mb-2 tracking-tight truncate w-full pr-8">{product.name}</h4>
                      <div className="flex items-center space-x-2 mb-4 md:mb-5 truncate w-full">
                         <p className="text-lg md:text-2xl font-black text-emerald-400">৳{product.isOffer && product.offerPrice ? product.offerPrice : product.price}</p>
                         {product.isOffer && <p className="text-[10px] md:text-xs text-zinc-500 font-bold line-through">৳{product.price}</p>}
                      </div>
                      <button onClick={() => navigate(`/product/${product.id}`)} className="px-5 md:px-6 py-2.5 md:py-3 bg-white text-black font-black uppercase tracking-[0.2em] text-[9px] md:text-[10px] rounded-full hover:bg-zinc-200 transition-colors self-start shadow-xl active:scale-95 flex items-center whitespace-nowrap">
                        Shop Now <Icon name="arrow-right" className="ml-2 md:ml-3 text-[9px]" />
                      </button>
                   </div>
                </div>
              ))}
            </div>
            <div className="absolute bottom-4 left-6 md:left-auto md:right-6 flex space-x-1.5 z-20">
              {products.filter(p => p.category.toLowerCase() === settings.featuredCategory.toLowerCase()).map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 shadow-sm ${i === activeFeatured ? 'w-6 bg-emerald-400' : 'w-1.5 bg-white/30'}`}></div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mb-10 md:mb-16">
        <h1 className="text-4xl md:text-4xl lg:text-3xl xl:text-2xl font-black tracking-tight text-zinc-900 leading-[1.1] mb-2 animate-fade-in">Find your perfect <br/><span className="text-gradient">vibe gadget.</span></h1>
        
        <div ref={searchRef} className="relative w-full max-w-md mt-8 z-50 hover-lift">
          <div className={`relative flex items-center bg-zinc-50 rounded-2xl border transition-all ${isSearchFocused ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white' : 'border-zinc-200'}`}>
            <Icon name="search" className="absolute left-5 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search for iPhones, AirPods, accessories..." 
              className="w-full bg-transparent py-4 pl-12 pr-12 outline-none text-sm font-semibold text-zinc-900 placeholder:text-zinc-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={(e) => {
                if(e.key === 'Enter') {
                   saveSearchHistory(searchQuery);
                   navigate('/search');
                }
              }}
            />
            <button className="absolute right-4 text-emerald-500 hover:text-emerald-700 transition-colors">
               <Icon name="microphone" />
            </button>
          </div>

          <AnimatePresence>
            {isSearchFocused && (searchQuery.trim() !== '' || searchHistory.length > 0) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden"
              >
                {searchQuery.trim() === '' && searchHistory.length > 0 ? (
                  <div className="p-2">
                     <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-3 py-2">Recent Searches</p>
                     {searchHistory.map((h, i) => (
                       <button 
                          key={i} 
                          onClick={() => {
                             setSearchQuery(h);
                             setIsSearchFocused(false);
                             saveSearchHistory(h);
                             navigate('/search');
                          }}
                          className="w-full flex items-center p-3 hover:bg-zinc-50 rounded-xl transition-colors text-left"
                       >
                          <Icon name="history" className="text-zinc-400 mr-3 text-xs" />
                          <span className="text-sm font-semibold text-zinc-700">{h}</span>
                       </button>
                     ))}
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map(product => (
                      <div 
                        key={product.id} 
                        onClick={() => navigate(`/product/${product.id}`)}
                        className="flex items-center space-x-4 px-5 py-3 hover:bg-zinc-50 cursor-pointer transition-colors"
                      >
                        <div className="w-12 h-12 bg-white rounded-lg border border-zinc-100 flex-shrink-0 p-1">
                          <img src={product.image} className="w-full h-full object-contain" alt={product.name} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs truncate text-zinc-900">{product.name}</h4>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">৳{product.price}</p>
                        </div>
                      </div>
                    ))}
                    <div className="px-3 pt-2 pb-1 border-t border-zinc-50">
                      <button onClick={() => navigate('/search')} className="w-full py-2 bg-zinc-50 hover:bg-[#06331e] hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest text-zinc-600 transition-colors">
                        View All Results
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm font-semibold text-zinc-500">
                    No products found for "{searchQuery}"
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Search Output above */}

      {products.filter(p => p.isOffer).length > 0 && (
        <div className="mb-12 animate-fade-in">
           <div className="bg-red-50/50 rounded-2xl p-4 md:p-5 border border-red-100 relative overflow-hidden glow-effect">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-400 rounded-full blur-[80px] opacity-10 animate-float"></div>
              <div className="relative z-10">
                 <div className="flex items-center space-x-3 mb-4">
                     <div className="w-6 h-6 bg-red-100 text-red-500 rounded-full flex items-center justify-center">
                        <Icon name="bolt" className="text-[10px] animate-pulse" />
                     </div>
                     <div className="flex-1 flex justify-between items-center pr-2">
                        <h2 className="text-sm font-black tracking-tight text-red-950 uppercase">Limited Deals</h2>
                        <div className="flex items-center space-x-1.5">
                           <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-inner">{String(timeLeft.h).padStart(2, '0')}</span>
                           <span className="text-red-900 font-bold">:</span>
                           <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-inner">{String(timeLeft.m).padStart(2, '0')}</span>
                           <span className="text-red-900 font-bold">:</span>
                           <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-inner">{String(timeLeft.s).padStart(2, '0')}</span>
                        </div>
                     </div>
                 </div>
                 
                 <div className="flex overflow-x-auto no-scrollbar gap-3 md:gap-4 pb-2">
                    {products.filter(p => p.isOffer).map(product => {
                       const originalPrice = product.price;
                       const offerPrice = product.offerPrice || product.price;
                       const discount = Math.round(((originalPrice - offerPrice) / originalPrice) * 100);
                       const productSlug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                       
                       return (
                         <div key={product.id} onClick={() => navigate(`/product/${productSlug}/${product.id}`)} className="flex-none w-[140px] md:w-[160px] bg-white rounded-2xl p-2.5 border border-red-100/50 shadow-sm hover:border-red-200 transition-colors cursor-pointer group hover:-translate-y-1">
                            <div className="relative aspect-square mb-3 bg-zinc-50 rounded-xl flex items-center justify-center overflow-hidden border border-zinc-100 group-hover:border-zinc-200 transition-colors">
                               <img 
                                 src={product.image} 
                                 loading="lazy"
                                 className="w-full h-full object-cover mix-blend-multiply group-hover:scale-110 transition-transform duration-700 ease-out" 
                                 alt={product.name}
                                 style={{ opacity: 0 }}
                                 onLoad={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transition = 'opacity 0.4s ease'; }}
                               />
                               {discount > 0 && (
                                  <div className="absolute top-2 left-2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm">
                                     -{discount}%
                                  </div>
                               )}
                            </div>
                            <div className="px-1">
                               <h3 className="font-bold text-[10px] md:text-xs text-zinc-900 group-hover:text-red-600 transition-colors truncate tracking-tight">{product.name}</h3>
                               <div className="flex items-center space-x-1.5 mt-1">
                                  <p className="text-red-600 text-[11px] md:text-sm font-black uppercase tracking-tight">৳{offerPrice}</p>
                                  {discount > 0 && <p className="text-[8px] md:text-[9px] font-bold text-zinc-400 line-through">৳{originalPrice}</p>}
                               </div>
                            </div>
                         </div>
                       );
                    })}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Added Feature Section */}
      <div className="flex overflow-x-auto no-scrollbar gap-3 mb-16 pb-2 px-2 mask-linear-fade">
         <div className="bg-zinc-50 rounded-full px-5 py-3 flex items-center shrink-0 border border-zinc-100 shadow-sm">
            <Icon name="truck-fast" className="text-emerald-600 mr-3 text-sm" />
            <span className="text-[11px] font-bold text-zinc-900 whitespace-nowrap">Fast Delivery Across BD</span>
         </div>
         <div className="bg-zinc-50 rounded-full px-5 py-3 flex items-center shrink-0 border border-zinc-100 shadow-sm">
            <Icon name="shield-check" className="text-emerald-600 mr-3 text-sm" />
            <span className="text-[11px] font-bold text-zinc-900 whitespace-nowrap">100% Secure Payments</span>
         </div>
         <div className="bg-zinc-50 rounded-full px-5 py-3 flex items-center shrink-0 border border-zinc-100 shadow-sm">
            <Icon name="crown" className="text-emerald-600 mr-3 text-sm" />
            <span className="text-[11px] font-bold text-zinc-900 whitespace-nowrap">Top Quality Original Gadgets</span>
         </div>
         <div className="bg-zinc-50 rounded-full px-5 py-3 flex items-center shrink-0 border border-zinc-100 shadow-sm">
            <Icon name="headset" className="text-emerald-600 mr-3 text-sm" />
            <span className="text-[11px] font-bold text-zinc-900 whitespace-nowrap">24/7 Always Here Support</span>
         </div>
      </div>

      {gifBanners.length > 0 && (
         <div className="mb-14 overflow-hidden rounded-3xl cursor-pointer hover-tilt" onClick={() => gifBanners[0].link && navigate(gifBanners[0].link)}>
            <img src={gifBanners[0].imageUrl} alt="banner" className="w-full h-auto object-cover border border-zinc-100 shadow-sm rounded-3xl" />
         </div>
      )}

      <div className="flex justify-start mb-16 overflow-x-auto no-scrollbar gap-6 md:gap-10 pb-4 px-2 animate-stagger-2">
        {categories.map(cat => (
          <motion.button whileHover={{ y: -5 }} key={cat.name} onClick={() => setActiveCategory(cat.name === activeCategory ? 'All' : cat.name)} className={`flex flex-col items-center shrink-0 group`}>
            <div className={`w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center mb-4 transition-all border-4 overflow-hidden ${activeCategory === cat.name ? 'border-[#06331e] shadow-2xl pulse-ring-active' : 'border-zinc-100 hover:border-emerald-200 shadow-sm hover-glow border-gradient'}`}>
              <img src={cat.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={cat.name} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${activeCategory === cat.name ? 'text-[#06331e]' : 'text-zinc-400 group-hover:text-emerald-500'}`}>{cat.name}</span>
          </motion.button>
        ))}
      </div>

      <div className="animate-stagger-3 relative z-10">
        <div className="flex justify-between items-end mb-10 px-2">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#06331e] mb-2 px-3 py-1 bg-emerald-50 rounded-full inline-block border border-emerald-100 shadow-sm backdrop-blur-md">Our Collection</h3>
            <h2 className="text-lg md:text-xl font-black tracking-tight text-shine mt-4">New Arrivals.</h2>
          </div>
          <button onClick={() => navigate('/all-products')} className="text-[10px] font-bold uppercase tracking-widest bg-zinc-900 text-white px-5 py-2.5 rounded-full hover:bg-emerald-500 transition-colors flex items-center shadow-lg active:scale-95 group hover-tilt">
            View All <Icon name="arrow-right" className="ml-2 text-[8px] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6 lg:gap-8">
          {products.filter(p => activeCategory === 'All' || p.category === activeCategory).map((product) => (
            <motion.div 
              layout
              key={product.id} 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, type: 'spring' }}
            >
              <div className="block group relative hover-tilt">
                <Link to={`/product/${product.id}`} className="block">
                  <div className="bg-zinc-50/30 rounded-[2rem] mb-4 overflow-hidden relative border border-zinc-100 shadow-sm transition-all duration-300 aspect-[4/5] flex items-center justify-center">
                    <img 
                      src={product.image} 
                      loading="lazy"
                      className="w-full h-full object-cover mix-blend-multiply" 
                      alt={product.name} 
                      style={{ opacity: 0 }}
                      onLoad={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transition = 'opacity 0.4s ease'; }}
                    />
                    <div className="absolute top-4 right-4 z-10">
                      <div className="bg-[#06331e] text-white px-3 py-1.5 rounded-full text-[9px] font-bold shadow-md tracking-wider">
                        ৳{product.price}
                      </div>
                    </div>
                  </div>
                </Link>
                
                <button 
                  onClick={(e) => { e.preventDefault(); setQuickViewImg(product.image); }}
                  className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-[#06331e] hover:text-white shadow-lg border border-zinc-100/50"
                >
                   <Icon name="expand-alt" className="text-xs" />
                </button>
                
                <div className="px-2 pb-1">
                  <Link to={`/product/${product.id}`}>
                    <h4 className="font-bold text-xs md:text-sm truncate mb-1 tracking-tight group-hover:text-emerald-700 transition-colors uppercase">{product.name}</h4>
                  </Link>
                  <div className="flex items-center text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                    <Icon name="star" className="text-emerald-500 mr-1.5 text-[10px]" />{product.rating} • {product.category}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {gifBanners.length > 1 && (
         <div className="mb-14 mt-12 overflow-hidden rounded-3xl cursor-pointer hover-tilt" onClick={() => gifBanners[1].link && navigate(gifBanners[1].link)}>
            <img src={gifBanners[1].imageUrl} alt="banner" className="w-full h-auto object-cover border border-zinc-100 shadow-sm rounded-3xl" />
         </div>
      )}

      <AnimatePresence>
        {quickViewImg && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#06331e]/50 backdrop-blur-xl z-[1000] flex items-center justify-center p-6"
            onClick={() => setQuickViewImg(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-xl aspect-square bg-white rounded-3xl shadow-2xl p-10 flex items-center justify-center border border-zinc-100"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setQuickViewImg(null)} className="absolute top-6 right-6 w-10 h-10 bg-zinc-50 rounded-full flex items-center justify-center hover:bg-[#06331e] hover:text-white transition-all">
                 <Icon name="times" className="text-xs" />
              </button>
              <img src={quickViewImg} className="max-w-full max-h-full object-contain" alt="Preview" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Social Proof Popup */}
      <AnimatePresence>
         {showProof && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="fixed bottom-24 left-6 z-[100] bg-white/95 backdrop-blur-xl border border-zinc-100 shadow-2xl rounded-2xl p-4 max-w-[280px]"
            >
               <button 
                  onClick={() => setShowProof(false)}
                  className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-zinc-100 rounded-full text-zinc-400 hover:text-black hover:bg-zinc-200 transition-all"
               >
                  <Icon name="times" className="text-[10px]" />
               </button>
               <div className="flex items-center space-x-4 mb-2 pr-4">
                  <div className="bg-emerald-100 text-emerald-600 w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-inner">
                     <Icon name="check" className="text-sm" />
                  </div>
                  <div>
                     <p className="text-[11px] text-zinc-500 font-medium leading-tight mb-1">
                        <span className="font-bold text-zinc-900">{proofData.name}</span> from <span className="font-bold text-zinc-900">{proofData.location}</span> just bought
                     </p>
                     <p className="text-xs font-black text-emerald-600 truncate tracking-tight">{proofData.item}</p>
                     <p className="text-[9px] text-zinc-400 mt-0.5 uppercase tracking-widest font-bold">Just now</p>
                  </div>
               </div>
               <div className="border-t border-zinc-100 pt-2 mt-1">
                  <label className="flex items-center space-x-2 cursor-pointer group">
                     <input 
                        type="checkbox" 
                        className="w-3 h-3 text-emerald-600 rounded focus:ring-emerald-500 border-zinc-300"
                        onChange={(e) => {
                           if (e.target.checked) {
                              localStorage.setItem('hide_mock_purchases', 'true');
                              setShowProof(false);
                           }
                        }}
                     />
                     <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest group-hover:text-zinc-600 transition-colors">Do not show again</span>
                  </label>
               </div>
            </motion.div>
         )}
      </AnimatePresence>
      
      {/* Brands Marquee (Social Proof) */}
      <div className="mb-2 md:mb-4 border-t border-b border-zinc-100 py-4 overflow-hidden flex relative bg-zinc-50/50">
         <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
         <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
         <div className="animate-marquee whitespace-nowrap flex items-center shrink-0 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            {['Apple', 'Samsung', 'Sony', 'DJI', 'Bose', 'Logitech', 'Anker', 'Xiaomi'].map((brand, idx) => (
               <span key={idx} className="text-xl md:text-3xl font-black uppercase tracking-widest text-[#06331e] px-8 md:px-16">{brand}</span>
            ))}
            {['Apple', 'Samsung', 'Sony', 'DJI', 'Bose', 'Logitech', 'Anker', 'Xiaomi'].map((brand, idx) => (
               <span key={idx + 10} className="text-xl md:text-3xl font-black uppercase tracking-widest text-[#06331e] px-8 md:px-16">{brand}</span>
            ))}
         </div>
      </div>

      {/* Floating Action Button */}
      <a href="https://wa.me/8801747708843" target="_blank" rel="noreferrer" className="fixed bottom-24 right-5 md:bottom-10 md:right-10 z-[80] w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(37,211,102,0.4)] hover:scale-110 active:scale-95 transition-transform group">
         <div className="absolute inset-0 bg-[#25D366] rounded-full animate-ping opacity-30"></div>
         <Icon name="whatsapp" className="fab fa-whatsapp text-2xl drop-shadow-md z-10" />
      </a>

      {/* Dynamic Fullscreen Story Viewer */}
      <AnimatePresence>
         {activeStoryIndex !== null && stories[activeStoryIndex] && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="fixed inset-0 z-[200] bg-black flex items-center justify-center"
            >
               <div className="relative w-full h-full max-w-sm mx-auto bg-zinc-900 overflow-hidden flex items-center justify-center">
                  {/* Progress Bars */}
                  <div className="absolute top-4 left-4 right-4 flex space-x-1 z-30">
                     {stories.map((s, i) => (
                        <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                           <div 
                              className="h-full bg-white" 
                              style={{ width: i === activeStoryIndex ? `${storyProgress}%` : i < activeStoryIndex ? '100%' : '0%' }}
                           />
                        </div>
                     ))}
                  </div>

                  {/* Header info */}
                  <div className="absolute top-8 left-4 right-4 flex justify-between items-center z-30">
                     <div className="flex items-center space-x-2 text-white">
                        <div className="w-8 h-8 rounded-full bg-white text-zinc-900 flex items-center justify-center font-bold text-xs"><Icon name="bolt" /></div>
                        <span className="font-bold text-xs shadow-md">{stories[activeStoryIndex].category}</span>
                     </div>
                     <button onClick={() => setActiveStoryIndex(null)} className="text-white hover:text-red-500"><Icon name="times" className="text-xl drop-shadow-md" /></button>
                  </div>

                  {/* Media */}
                  {stories[activeStoryIndex].type === 'video' ? (
                     <div className="w-full h-full flex items-center justify-center bg-black relative overflow-hidden group">
                         {/* Native App Overlay Hack to perfectly hide YouTube/Facebook/TikTok iframes */}
                         <div className="absolute inset-0 z-20 pointer-events-none shadow-[inset_0_0_80px_20px_rgba(0,0,0,1)] bg-black/5"></div>
                         
                         {/* Touch interaction overlay: Blocks clicks to external sites but allows tapping to pause/play (handled by custom logic if needed, or just intercepts) */}
                         <div className="absolute inset-0 z-10 opacity-0 cursor-pointer pointer-events-auto" onClick={(e) => {
                             e.stopPropagation();
                             // We don't pause story timer on video click to keep simple, just block the iframe redirects
                         }}></div>

                         {stories[activeStoryIndex].mediaUrl.toLowerCase().includes('.mp4') ? (
                             <video 
                                src={stories[activeStoryIndex].mediaUrl}
                                autoPlay
                                className="w-full h-full object-cover scale-[1.02]"
                                onTimeUpdate={(e) => setStoryProgress((e.currentTarget.currentTime / e.currentTarget.duration) * 100)}
                                onEnded={() => {
                                    if (activeStoryIndex < stories.length - 1) setActiveStoryIndex(activeStoryIndex + 1);
                                    else setActiveStoryIndex(null);
                                }}
                                playsInline
                             />
                         ) : (
                             <div className="w-full h-full transform scale-[1.35] md:scale-[1.15] origin-center">
                                 <ReactPlayer 
                                     url={stories[activeStoryIndex].mediaUrl} 
                                     playing={true} 
                                     controls={false}
                                     muted={false}
                                     width="100%" 
                                     height="100%" 
                                     style={{ pointerEvents: 'none', objectFit: 'cover' }}
                                     onProgress={(state: any) => {
                                         if (state.playedSeconds > 0 && state.loadedSeconds > 0) {
                                             setStoryProgress(state.played * 100);
                                         }
                                     }}
                                     onEnded={() => {
                                         if (activeStoryIndex < stories.length - 1) setActiveStoryIndex(activeStoryIndex + 1);
                                         else setActiveStoryIndex(null);
                                     }}
                                     config={{
                                         youtube: { playerVars: { showinfo: 0, controls: 0, rel: 0, modestbranding: 1, playsinline: 1, disablekb: 1, fs: 0 } as any },
                                         facebook: { appId: '29c39d8a7be8404a', attributes: { 'data-hide-controls': 'true', 'data-show-captions': 'false' } }
                                     }}
                                 />
                             </div>
                         )}
                     </div>
                  ) : (
                     <img src={stories[activeStoryIndex].mediaUrl} className="w-full h-full object-contain" alt="story" />
                  )}

                  {stories[activeStoryIndex].audioUrl && (
                    <audio 
                       src={`${stories[activeStoryIndex].audioUrl}#t=${stories[activeStoryIndex].audioStart || 0}`} 
                       autoPlay 
                       playsInline 
                       className="hidden" 
                    />
                  )}

                  {/* Click Areas */}
                  <div className="absolute inset-0 z-20 flex">
                     <div className="w-1/3 h-full cursor-pointer" onClick={() => {
                        if (activeStoryIndex > 0) { setActiveStoryIndex(activeStoryIndex - 1); setStoryProgress(0); }
                     }}></div>
                     <div className="w-2/3 h-full cursor-pointer" onClick={() => {
                        if (activeStoryIndex < stories.length - 1) { setActiveStoryIndex(activeStoryIndex + 1); setStoryProgress(0); }
                        else setActiveStoryIndex(null);
                     }}></div>
                  </div>
                  
                  {/* CTA */}
                  {stories[activeStoryIndex].linkUrl && (
                     <button onClick={() => { window.location.href = stories[activeStoryIndex].linkUrl; }} className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 bg-white text-black px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-transform flex items-center space-x-2">
                        <span>Learn More</span>
                        <Icon name="chevron-right" />
                     </button>
                  )}
               </div>
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
