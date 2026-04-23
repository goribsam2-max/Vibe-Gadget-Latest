import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNotify } from '../../components/Notifications';
import Icon from '../../components/Icon';

const ManageSEO: React.FC = () => {
    const navigate = useNavigate();
    const notify = useNotify();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [seoData, setSeoData] = useState({
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
        robots: 'index, follow',
        jsonLd: '',
        fbPixelId: '',
        fbConversionToken: '' // Optional for advanced CAPI
    });

    useEffect(() => {
        const fetchSEO = async () => {
            setLoading(true);
            try {
                const snap = await getDoc(doc(db, 'settings', 'seo'));
                if (snap.exists()) {
                    setSeoData({ ...seoData, ...snap.data() });
                }
            } catch (err) {
                console.error(err);
                notify("Failed to load SEO settings", "error");
            }
            setLoading(false);
        };
        fetchSEO();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'seo'), seoData);
            notify("SEO & Marketing settings saved successfully! Note: Refresh the app to see immediate changes in the meta tags.", "success");
        } catch (err) {
            console.error(err);
            notify("Failed to save settings", "error");
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <Icon name="spinner" className="fa-spin text-emerald-500 text-3xl" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-10 pb-32 min-h-screen bg-zinc-50/50">
            <div className="flex items-center space-x-6 mb-10">
                <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center bg-white border border-zinc-200 text-[#06331e] rounded-full shadow-sm hover:bg-[#06331e] hover:text-white transition-all active:scale-95">
                    <Icon name="arrow-left" className="text-xs" />
                </button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 mb-1">SEO & Ads</h1>
                    <p className="text-zinc-400 text-[10px] md:text-xs font-bold tracking-widest uppercase">Meta Tags, Indexing & Facebook Ads</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                {/* Facebook Ads Section */}
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-blue-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-[100px] z-0"></div>
                    <div className="relative z-10 flex items-center mb-6">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mr-4">
                            <Icon name="facebook" className="text-xl" />
                        </div>
                        <div>
                            <h2 className="font-black text-lg text-zinc-900">Facebook Pixel & Conversion Tracking</h2>
                            <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mt-0.5">Pay only for actual sales</p>
                        </div>
                    </div>
                    <div className="relative z-10 space-y-5">
                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-start space-x-3">
                            <Icon name="info-circle" className="text-blue-500 mt-0.5" />
                            <p className="text-xs text-blue-800 font-medium leading-relaxed">
                                By connecting your Meta Pixel here, the system will track actual <b>"Purchase"</b> events when a user successfully checks out. This allows you to run Conversion Campaigns where Facebook optimizes and charges you based on real orders, rather than just link clicks.
                            </p>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Meta Pixel ID (Required for tracking)</label>
                            <input 
                                type="text"
                                value={seoData.fbPixelId}
                                onChange={e => setSeoData({...seoData, fbPixelId: e.target.value})}
                                placeholder="e.g., 123456789012345"
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 text-sm font-bold text-zinc-800 focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Conversions API Token (Optional for accuracy)</label>
                            <input 
                                type="text"
                                value={seoData.fbConversionToken}
                                onChange={e => setSeoData({...seoData, fbConversionToken: e.target.value})}
                                placeholder="Paste your CAPI Token here"
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 text-sm font-bold text-zinc-800 focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* SEO Meta Tags */}
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-zinc-200 shadow-sm">
                    <div className="flex items-center mb-6">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mr-4">
                            <Icon name="search" className="text-xl" />
                        </div>
                        <div>
                            <h2 className="font-black text-lg text-zinc-900">Search Engine Tags</h2>
                            <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mt-0.5">Control how Google sees your site</p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Global Meta Title (Fallback)</label>
                            <input 
                                type="text"
                                value={seoData.metaTitle}
                                onChange={e => setSeoData({...seoData, metaTitle: e.target.value})}
                                placeholder="VibeGadget - Best Tech Store"
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 text-sm font-bold text-zinc-800 focus:border-emerald-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Meta Description</label>
                            <textarea 
                                rows={3}
                                value={seoData.metaDescription}
                                onChange={e => setSeoData({...seoData, metaDescription: e.target.value})}
                                placeholder="Shop the latest gadgets and accessories at the best prices..."
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-sm font-medium text-zinc-800 focus:border-emerald-500 transition-colors resize-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Keywords (Comma separated)</label>
                            <input 
                                type="text"
                                value={seoData.metaKeywords}
                                onChange={e => setSeoData({...seoData, metaKeywords: e.target.value})}
                                placeholder="gadgets, tech, mobile accessories, buy online"
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 text-sm font-bold text-zinc-800 focus:border-emerald-500 transition-colors"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Search Engine Visibility (Robots)</label>
                            <select
                                value={seoData.robots}
                                onChange={e => setSeoData({...seoData, robots: e.target.value})}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 text-sm font-bold text-zinc-800 focus:border-emerald-500 transition-colors cursor-pointer"
                            >
                                <option value="index, follow">Allow Google to index completely (Recommended)</option>
                                <option value="noindex, nofollow">Hide site from Google completely</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="px-8 py-4 bg-[#06331e] text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-[#06331e]/30 hover:bg-black transition-all disabled:opacity-50 flex items-center"
                    >
                        {saving ? <Icon name="spinner" className="fa-spin mr-2" /> : <Icon name="save" className="mr-2" />}
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ManageSEO;
