import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Plus, Trash2, X, Upload, Search, Filter, Edit2 } from 'lucide-react';
import axios from 'axios';
import useAuthStore from '../store/authStore';

export default function Gallery() {
  const [cards, setCards] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Auth Store
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  
  // Unified Modal & Upload State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '', style: '', country: ''
  });

  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStyle, setFilterStyle] = useState('All');
  const [filterCountry, setFilterCountry] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');

  // Fetch Data
  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/gallery');
      setCards(res.data);
    } catch (err) {
      console.error('Failed to fetch gallery:', err);
    }
  };

  // === Dynamic Filtering & Sorting Logic ===
  const uniqueStyles = ['All', ...new Set(cards.map(c => c.style))];
  const uniqueCountries = ['All', ...new Set(cards.map(c => c.country))];

  const processedCards = useMemo(() => {
    let result = cards.filter(card => {
      const matchesSearch = card.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStyle = filterStyle === 'All' || card.style === filterStyle;
      const matchesCountry = filterCountry === 'All' || card.country === filterCountry;
      return matchesSearch && matchesStyle && matchesCountry;
    });

    switch (sortOrder) {
      case 'a-z':
        return result.sort((a, b) => a.title.localeCompare(b.title));
      case 'z-a':
        return result.sort((a, b) => b.title.localeCompare(a.title));
      case 'newest':
      default:
        return result.reverse();
    }
  }, [cards, searchTerm, filterStyle, filterCountry, sortOrder]);

  // === Admin Handlers ===
  const handleDelete = async (e, id) => {
    e.stopPropagation(); 
    if (window.confirm("Delete this card permanently?")) {
      try {
        await axios.delete(`http://localhost:5000/api/gallery/${id}`);
        setCards(cards.filter(c => c._id !== id));
      } catch (err) {
        console.error('Failed to delete:', err);
      }
    }
  };

  const handleToggleFeature = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await axios.patch(`http://localhost:5000/api/gallery/${id}/feature`);
      setCards(cards.map(c => c._id === id ? res.data : c));
    } catch (err) {
      console.error('Failed to toggle feature:', err);
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({ title: '', style: '', country: '' });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (e, card) => {
    e.stopPropagation();
    setIsEditMode(true);
    setEditingId(card._id);
    setFormData({ title: card.title, style: card.style, country: card.country });
    setImageFile(null); // Leave empty unless they want to replace the image
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!isEditMode && !imageFile) return alert("Please select an image file first.");

    setIsUploading(true);
    try {
      // 1. Determine Image URL (Upload new if file selected, otherwise keep existing)
      let finalImageUrl = isEditMode ? cards.find(c => c._id === editingId)?.imageUrl : '';

      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append('file', imageFile);
        uploadData.append('upload_preset', 'wc26_preset');

        const cloudinaryRes = await axios.post(
          'https://api.cloudinary.com/v1_1/dolclt5t4/image/upload',
          uploadData
        );
        finalImageUrl = cloudinaryRes.data.secure_url;
      }

      // 2. Save to MongoDB (POST for Add, PUT/PATCH for Edit)
      const payload = { ...formData, imageUrl: finalImageUrl };
      
      if (isEditMode) {
        const res = await axios.put(`http://localhost:5000/api/gallery/${editingId}`, payload);
        // Update UI for Edit
        setCards(cards.map(c => c._id === editingId ? res.data : c));
      } else {
        const res = await axios.post('http://localhost:5000/api/gallery', payload);
        // Update UI for Add
        setCards([res.data, ...cards]); 
      }
      
      // 3. Reset UI
      setIsModalOpen(false);
      setFormData({ title: '', style: '', country: '' });
      setImageFile(null);
      setIsEditMode(false);
      setEditingId(null);
    } catch (err) {
      console.error('Failed to save card:', err);
      alert('Operation failed. Check console.');
    } finally {
      setIsUploading(false);
    }
  };

  const preventDownload = (e) => e.preventDefault();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 min-h-screen bg-[#050505]">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b border-gray-800/50 pb-6">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-green to-cyan-400 tracking-tight flex items-center gap-3 drop-shadow-[0_0_15px_rgba(0,255,255,0.3)]">
            <Star className="text-cyan-400 w-8 h-8 drop-shadow-md" /> Official Gallery
          </h1>
          <p className="text-sm text-gray-400 mt-2 font-medium">Exclusive AI artwork — published by the WC26 Hub team.</p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-gradient-to-r from-accent-green to-emerald-500 text-black px-5 py-2.5 rounded-lg font-bold text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <Plus className="w-4 h-4" /> Add Card
          </button>
        )}
      </div>

      {/* Control Panel (Filters & Search) */}
      {cards.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4 mb-10 bg-[#0a0a0c] p-4 rounded-xl border border-gray-800/60 shadow-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search player name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111114] border border-gray-700/50 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all outline-none"
            />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0">
            <div className="flex items-center gap-2 bg-[#111114] border border-gray-700/50 rounded-lg px-3 py-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select value={filterStyle} onChange={(e) => setFilterStyle(e.target.value)} className="bg-transparent text-white text-sm outline-none cursor-pointer">
                {uniqueStyles.map(style => <option key={style} value={style} className="bg-[#111]">Style: {style}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-[#111114] border border-gray-700/50 rounded-lg px-3 py-2">
              <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)} className="bg-transparent text-white text-sm outline-none cursor-pointer">
                {uniqueCountries.map(country => <option key={country} value={country} className="bg-[#111]">Region: {country}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-[#111114] border border-gray-700/50 rounded-lg px-3 py-2">
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="bg-transparent text-white text-sm outline-none cursor-pointer">
                <option value="newest" className="bg-[#111]">Sort: Newest</option>
                <option value="a-z" className="bg-[#111]">Sort: A-Z</option>
                <option value="z-a" className="bg-[#111]">Sort: Z-A</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      {processedCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-gray-500 border border-dashed border-gray-800 rounded-2xl bg-[#09090b]">
          <Upload className="w-16 h-16 mb-4 text-gray-700 opacity-50" />
          <p className="text-lg font-medium">No cards found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {processedCards.map((card) => (
            <motion.div 
              key={card._id}
              whileHover={{ scale: 1.03, y: -5 }}
              onClick={() => setSelectedImage(card.imageUrl)}
              className="group cursor-pointer bg-black rounded-xl overflow-hidden flex flex-col relative border-2 border-gray-800/80 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(0,255,255,0.15)] transition-all duration-300"
            >
              {/* === The Shine Effect === */}
              <div className="absolute top-0 -left-[150%] w-[150%] h-full z-20 transform -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out pointer-events-none" />

              {/* Admin Controls Overlay */}
              {isAdmin && (
                <div className="absolute top-3 right-3 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => handleToggleFeature(e, card._id)} 
                    title={card.isFeatured ? "Unfeature" : "Feature on Home"}
                    className={`p-2 bg-black/80 rounded-lg backdrop-blur-md border border-gray-700 transition-colors ${card.isFeatured ? 'text-yellow-400 hover:text-white' : 'text-white hover:text-yellow-400'}`}
                  >
                    <Star className={`w-4 h-4 ${card.isFeatured ? 'fill-current' : ''}`} />
                  </button>
                  <button 
                    onClick={(e) => openEditModal(e, card)} 
                    className="p-2 bg-black/80 hover:bg-cyan-600 text-white rounded-lg backdrop-blur-md border border-gray-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => handleDelete(e, card._id)} 
                    className="p-2 bg-black/80 hover:bg-red-500 text-white rounded-lg backdrop-blur-md border border-gray-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Image Container */}
              <div className="relative w-full h-[400px] bg-[#0c0c0e] p-2 flex items-center justify-center" onContextMenu={preventDownload}>
                <img 
                  src={card.imageUrl} 
                  alt={card.title}
                  onDragStart={preventDownload}
                  className="max-w-full max-h-full object-contain drop-shadow-2xl select-none pointer-events-none z-10"
                />
              </div>

              {/* Futuristic Metadata Footer */}
              <div className="p-4 bg-gradient-to-t from-[#050505] to-[#111114] border-t border-gray-800/50 z-10">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-black text-white tracking-wider flex items-center gap-2 uppercase">
                      {card.title}
                      {card.isFeatured && <Star className="w-3.5 h-3.5 text-yellow-500 fill-current drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]" />}
                    </h3>
                    <p className="text-[11px] text-cyan-400/80 tracking-widest uppercase mt-0.5 font-bold">{card.style}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded border border-gray-700/50">
                      <span className="text-[9px] text-accent-green font-black uppercase">{card.country.substring(0, 2)}</span>
                      <span className="text-[9px] text-gray-400 font-bold tracking-wider">{card.country}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Unified Admin Modal (Add & Edit) */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <div className="bg-[#111] border border-gray-800 p-6 rounded-xl w-full max-w-md relative shadow-[0_0_40px_rgba(0,0,0,0.8)]">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-white mb-4">
                {isEditMode ? 'Edit Card Details' : 'Add New Card'}
              </h2>
              
              <form onSubmit={handleModalSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Title</label>
                  <input required type="text" className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-2 text-white mt-1 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 outline-none" 
                    value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Art Style</label>
                  <input required type="text" placeholder="e.g. Cyberpunk Neon" className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-2 text-white mt-1 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 outline-none" 
                    value={formData.style} onChange={e => setFormData({...formData, style: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Country</label>
                  <input required type="text" className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-2 text-white mt-1 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 outline-none" 
                    value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {isEditMode ? 'Replace Image (Optional)' : 'Upload Image'}
                  </label>
                  <input 
                    required={!isEditMode} 
                    type="file" 
                    accept="image/*" 
                    className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-2 text-white mt-1 file:mr-4 file:py-1.5 file:px-4 file:rounded file:border-0 file:text-xs file:bg-cyan-500/20 file:text-cyan-400 file:font-bold hover:file:bg-cyan-500/30 cursor-pointer" 
                    onChange={e => setImageFile(e.target.files[0])} 
                  />
                  {isEditMode && !imageFile && (
                    <p className="text-xs text-gray-500 mt-2">Leave blank to keep the current image.</p>
                  )}
                </div>
                
                <button type="submit" disabled={isUploading} className="w-full bg-gradient-to-r from-accent-green to-emerald-500 text-black font-bold py-2.5 rounded hover:scale-[1.02] transition-all disabled:opacity-50 mt-2">
                  {isUploading ? 'Processing...' : (isEditMode ? 'Save Changes' : 'Publish Card')}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)} onContextMenu={preventDownload}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 sm:p-8"
          >
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white bg-black/50 p-3 rounded-full border border-gray-700 z-50 transition-all hover:scale-110"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} 
              className="relative max-w-4xl w-full h-[85vh] rounded-2xl flex items-center justify-center"
            >
              <img 
                src={selectedImage} 
                alt="Enlarged gallery view" 
                onDragStart={preventDownload}
                className="max-w-full max-h-full object-contain drop-shadow-[0_0_50px_rgba(0,255,255,0.15)] select-none pointer-events-none"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}