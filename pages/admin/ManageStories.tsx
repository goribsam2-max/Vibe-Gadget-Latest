import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNotify } from '../../components/Notifications';
import { uploadToImgbb } from '../../services/imgbb';
import Icon from '../../components/Icon';
import { motion, AnimatePresence } from 'framer-motion';

const ManageStories: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [type, setType] = useState<'image' | 'video'>('image');
  const [category, setCategory] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'stories'), (snap) => {
      setStories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    try {
      const url = await uploadToImgbb(file);
      setPreviewUrl(url);
    } catch {
      notify("Failed to upload image", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!category || (type === 'image' && !previewUrl) || (type === 'video' && !videoUrl)) {
       return notify("Please fill required fields", "warning");
    }
    
    setLoading(true);
    try {
       await addDoc(collection(db, 'stories'), {
         type,
         category: category.trim(),
         mediaUrl: type === 'image' ? previewUrl : videoUrl,
         linkUrl: linkUrl.trim(),
         duration: type === 'image' ? 5 : 15,
         createdAt: new Date().toISOString()
       });
       notify("Story saved", "success");
       setShowModal(false);
       setCategory('');
       setPreviewUrl('');
       setVideoUrl('');
       setLinkUrl('');
    } catch (e) {
       notify("Failed to save story", "error");
    } finally {
       setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
     if (!window.confirm("Delete this story?")) return;
     try {
        await deleteDoc(doc(db, 'stories', id));
        notify("Story deleted", "success");
     } catch (e) {
        notify("Failed to delete", "error");
     }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 pb-48 min-h-screen bg-white font-inter">
      <div className="mb-12 flex items-center justify-between">
        <div className="flex items-center space-x-6">
           <button onClick={() => navigate('/admin')} className="p-3 bg-zinc-100 rounded-xl hover:bg-black hover:text-white transition-all">
             <Icon name="arrow-left" className="text-sm" />
           </button>
           <div>
             <h1 className="text-2xl font-black tracking-tight">Stories Setup</h1>
             <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Manage active flash stories</p>
           </div>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-[#06331e] text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-black transition-colors flex items-center space-x-2">
           <Icon name="plus" />
           <span>Add Story</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
         {stories.map(story => (
            <div key={story.id} className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 group">
               {story.type === 'video' ? (
                 <video src={story.mediaUrl} className="w-full h-full object-cover" muted loop />
               ) : (
                 <img src={story.mediaUrl} className="w-full h-full object-cover" alt="" />
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
               <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-md px-2 py-1 rounded-md text-[9px] font-bold text-white uppercase tracking-widest">
                  {story.category}
               </div>
               <button onClick={() => handleDelete(story.id)} className="absolute bottom-4 right-4 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 shadow-lg">
                  <Icon name="trash" />
               </button>
            </div>
         ))}
      </div>

      <AnimatePresence>
         {showModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-hidden">
                    <div className="flex justify-between items-center mb-8">
                       <h2 className="text-xl font-black">New Story</h2>
                       <button onClick={() => setShowModal(false)}><Icon name="times" className="text-xl text-zinc-400" /></button>
                    </div>
                    
                    <div className="space-y-6">
                       <div>
                          <label className="text-[10px] font-bold text-zinc-400 uppercase mb-2 block">Story Category (Text)</label>
                          <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Offers" className="w-full bg-zinc-50 p-4 rounded-xl text-sm outline-none border border-zinc-200" />
                       </div>
                       
                       <div className="flex bg-zinc-100 p-1 rounded-xl">
                          <button onClick={() => setType('image')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${type === 'image' ? 'bg-white shadow-sm' : 'text-zinc-400'}`}>Image</button>
                          <button onClick={() => setType('video')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${type === 'video' ? 'bg-white shadow-sm' : 'text-zinc-400'}`}>Video Link</button>
                       </div>

                       {type === 'image' ? (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="h-32 border-2 border-dashed border-zinc-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-50 transition-colors relative overflow-hidden"
                          >
                             {loading ? <Icon name="spinner" className="animate-spin text-zinc-400 text-2xl" /> : previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" alt="preview" /> : <div className="text-center"><Icon name="cloud-upload-alt" className="text-2xl text-zinc-400 mb-2"/><p className="text-xs font-bold text-zinc-500">Click to Upload</p></div>}
                             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                          </div>
                       ) : (
                          <div>
                             <label className="text-[10px] font-bold text-zinc-400 uppercase mb-2 block">Direct Video URL (.mp4)</label>
                             <input type="text" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://..." className="w-full bg-zinc-50 p-4 rounded-xl text-sm outline-none border border-zinc-200" />
                          </div>
                       )}

                       <div>
                          <label className="text-[10px] font-bold text-zinc-400 uppercase mb-2 block">Link URL (Optional)</label>
                          <input type="text" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." className="w-full bg-zinc-50 p-4 rounded-xl text-sm outline-none border border-zinc-200" />
                       </div>

                       <button onClick={handleSave} disabled={loading} className="w-full py-4 bg-[#06331e] text-white rounded-xl font-bold uppercase tracking-widest text-xs mt-4 disabled:opacity-50">
                          {loading ? 'Saving...' : 'Publish Story'}
                       </button>
                    </div>
                </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};
export default ManageStories;
