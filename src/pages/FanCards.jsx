import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, Upload, X, Trash2, Pencil } from 'lucide-react';
import useAuthStore from '../store/authStore';
import axios from 'axios';

export default function FanCards() {
  const { user } = useAuthStore();
  const [cards, setCards] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // State for uploading new items
  const [formData, setFormData] = useState({ title: '', aiPrompt: '', imageFile: null });
  // State for modifying existing items
  const [editingCard, setEditingCard] = useState({ _id: '', title: '', aiPrompt: '' });
  const [isUploading, setIsUploading] = useState(false);

  // Fetch data on load
  useEffect(() => {
    const fetchCards = async () => {
      try {
        const res = await axios.get('https://arena-watch-backend-1.onrender.com/api/fancards');
        setCards(res.data);
      } catch (err) {
        console.error("Error fetching fan cards", err);
      }
    };
    fetchCards();
  }, []);

  // === Handlers ===
  
  const handleLoveClick = async (cardId) => {
    if (!user) {
      alert("Please sign in to love fan cards!");
      return;
    }
    
    // Optimistic UI Update
    setCards(cards.map(card => {
      if (card._id === cardId) {
        const hasLiked = card.likes.includes(user.firebaseUid);
        return {
          ...card,
          likes: hasLiked 
            ? card.likes.filter(id => id !== user.firebaseUid) 
            : [...card.likes, user.firebaseUid]
        };
      }
      return card;
    }));

    try {
      await axios.patch(`https://arena-watch-backend-1.onrender.com/api/fancards/${cardId}/like`, { 
        userId: user.firebaseUid 
      });
    } catch (err) {
      console.error("Failed to update like", err);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!formData.imageFile) return alert("Please select an image.");
    
    setIsUploading(true);
    try {
      // 1. Upload to Cloudinary
      const uploadData = new FormData();
      uploadData.append('file', formData.imageFile);
      uploadData.append('upload_preset', 'wc26_preset'); 

      const cloudinaryRes = await axios.post(
        'https://api.cloudinary.com/v1_1/dolclt5t4/image/upload', 
        uploadData
      );
      
      // 2. Save to MongoDB via Backend (including optional aiPrompt)
      const payload = {
        title: formData.title,
        aiPrompt: formData.aiPrompt || '', 
        imageUrl: cloudinaryRes.data.secure_url,
        uploaderId: user.firebaseUid,
        uploaderName: user.name
      };
      
      const res = await axios.post('https://arena-watch-backend-1.onrender.com/api/fancards', payload);
      
      setCards([res.data, ...cards]);
      setIsUploadModalOpen(false);
      setFormData({ title: '', aiPrompt: '', imageFile: null });
    } catch (err) {
      console.error('Failed to upload fan card:', err);
      alert('Upload failed. Check console.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteClick = async (cardId) => {
    if (!window.confirm("Are you sure you want to delete this fan card?")) return;

    try {
      await axios.delete(`https://arena-watch-backend-1.onrender.com/api/fancards/${cardId}`);
      // Remove from UI state instantly
      setCards(cards.filter(card => card._id !== cardId));
    } catch (err) {
      console.error("Failed to delete fan card", err);
      alert("Error executing item deletion.");
    }
  };

  const openEditModal = (card) => {
    setEditingCard({
      _id: card._id,
      title: card.title,
      aiPrompt: card.aiPrompt || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.patch(`https://arena-watch-backend-1.onrender.com/api/fancards/${editingCard._id}`, {
        title: editingCard.title,
        aiPrompt: editingCard.aiPrompt
      });

      // Map across state to capture modified data strings
      setCards(cards.map(card => 
        card._id === editingCard._id 
          ? { ...card, title: editingCard.title, aiPrompt: editingCard.aiPrompt } 
          : card
      ));
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Failed to edit fan card properties", err);
      alert("Properties save routine failed.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 min-h-screen">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Sparkles className="text-emerald-500 w-8 h-8" /> Fan Showcase
          </h1>
          <p className="text-sm text-gray-500 mt-2">AI football identity cards uploaded by the community.</p>
        </div>
        
        <button 
          onClick={() => user ? setIsUploadModalOpen(true) : alert("Please sign in first.")}
          className="flex items-center gap-2 bg-emerald-500 text-black px-5 py-2.5 rounded-md font-bold text-sm hover:bg-emerald-400 transition-colors"
        >
          {!user ? "Sign in to upload" : <><Upload className="w-4 h-4" /> Upload Card</>}
        </button>
      </div>

      {/* Grid */}
      {cards.length === 0 ? (
        <div className="w-full bg-[#0d0d0f] border border-gray-800 rounded-xl p-16 flex items-center justify-center">
          <p className="text-gray-500 font-medium">No fan cards yet. Be the first!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cards.map((card) => {
            const hasLiked = user && card.likes.includes(user.firebaseUid);
            const isOwner = user && card.uploaderId === user.firebaseUid;
            
            return (
              <motion.div 
                key={card._id}
                whileHover={{ y: -5 }}
                className="bg-[#09090b] border border-gray-800 rounded-xl overflow-hidden flex flex-col hover:border-gray-700 transition-colors relative group"
              >
                {/* Owner Actions Context Bar Overlay */}
                {isOwner && (
                  <div className="absolute top-3 right-3 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md p-1.5 rounded-lg border border-gray-800">
                    <button 
                      onClick={() => openEditModal(card)}
                      className="p-1.5 bg-gray-900 rounded hover:bg-gray-800 text-gray-300 hover:text-emerald-400 transition-colors"
                      title="Edit Card Details"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(card._id)}
                      className="p-1.5 bg-gray-900 rounded hover:bg-red-950/40 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete Card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-900" onContextMenu={e => e.preventDefault()}>
                  <div className="absolute inset-0 z-10 pointer-events-none" />
                  <img 
                    src={card.imageUrl} 
                    alt={card.title}
                    onDragStart={e => e.preventDefault()}
                    className="w-full h-full object-cover select-none pointer-events-none"
                  />
                </div>

                <div className="p-4 flex flex-col flex-1 border-t border-gray-800 bg-[#09090b]">
                  <h3 className="font-bold text-white tracking-tight truncate text-sm">{card.title}</h3>
                  
                  {/* Dynamic Render Optional Prompt Container */}
                  {card.aiPrompt && (
                    <div className="mt-2 p-2 bg-[#121215] border border-gray-800/80 rounded-lg text-[11px] text-gray-400 font-medium italic flex items-start gap-1.5 line-clamp-2">
                      <Sparkles className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-relaxed">{card.aiPrompt}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-4 pt-1">
                    <span className="text-xs text-gray-500 font-medium truncate">by {card.uploaderName}</span>
                    
                    <button 
                      onClick={() => handleLoveClick(card._id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors border ${
                        hasLiked 
                          ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' 
                          : 'bg-[#111] text-gray-400 border-gray-800 hover:text-red-400 hover:border-red-900'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} />
                      <span className="text-xs font-bold">{card.likes ? card.likes.length : 0}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Upload Modal (Includes Optional Prompt Textarea) */}
      <AnimatePresence>
        {isUploadModalOpen && user && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          >
            <div className="bg-[#111] border border-gray-800 p-6 rounded-xl w-full max-w-md relative shadow-2xl">
              <button onClick={() => setIsUploadModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-white mb-4">Upload Fan Card</h2>
              
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Card Title</label>
                  <input required type="text" className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-2 text-sm text-white mt-1 outline-none focus:border-emerald-500" 
                    value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    AI Creation Prompt <span className="text-[10px] text-gray-600 font-normal lowercase">(optional)</span>
                  </label>
                  <textarea rows="3" placeholder="Describe the elements used to create this masterpiece..." className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-2 text-xs text-white mt-1 outline-none focus:border-emerald-500 resize-none font-medium leading-relaxed" 
                    value={formData.aiPrompt} onChange={e => setFormData({...formData, aiPrompt: e.target.value})} />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Upload Image Asset</label>
                  <input required type="file" accept="image/*" className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-2 text-xs text-white mt-1 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-emerald-500 file:text-black file:font-bold hover:file:bg-emerald-400 cursor-pointer" 
                    onChange={e => setFormData({...formData, imageFile: e.target.files[0]})} />
                </div>
                
                <button type="submit" disabled={isUploading} className="w-full bg-emerald-500 text-black font-black py-2.5 rounded hover:bg-emerald-400 transition-colors disabled:opacity-50 text-sm mt-2">
                  {isUploading ? 'Uploading to Mainframe...' : 'Submit to Showcase'}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal Context */}
      <AnimatePresence>
        {isEditModalOpen && user && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          >
            <div className="bg-[#111] border border-gray-800 p-6 rounded-xl w-full max-w-md relative shadow-2xl">
              <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-white mb-4">Edit Card Parameters</h2>
              
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Card Title</label>
                  <input required type="text" className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-2 text-sm text-white mt-1 outline-none focus:border-emerald-500" 
                    value={editingCard.title} onChange={e => setEditingCard({...editingCard, title: e.target.value})} />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">AI Creation Prompt</label>
                  <textarea rows="3" className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-2 text-xs text-white mt-1 outline-none focus:border-emerald-500 resize-none font-medium leading-relaxed" 
                    value={editingCard.aiPrompt} onChange={e => setEditingCard({...editingCard, aiPrompt: e.target.value})} />
                </div>
                
                <button type="submit" className="w-full bg-emerald-500 text-black font-black py-2.5 rounded hover:bg-emerald-400 transition-colors text-sm mt-2">
                  Commit Modifications
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}