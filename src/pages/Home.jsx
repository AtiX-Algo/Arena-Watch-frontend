import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  PlayCircle, Calendar, Trophy, ArrowRight, ShieldCheck, 
  Star, Users, Flame, Newspaper, Eye, Heart, MessageSquare, Share2, Sparkles
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useStore } from '../lib/store';

export default function Home() {
  const navigate = useNavigate();
  
  // Real-time ESPN matches from Global Store
  const matches = useStore((state) => state.matches) || [];
  const liveMatch = matches.find(m => m.status?.state === 'in');
  const featuredMatch = liveMatch || matches[0] || null;

  // Real-time MongoDB State
  const [featuredGallery, setFeaturedGallery] = useState([]);
  const [trendingFanCards, setTrendingFanCards] = useState([]);
  const [topPredictors, setTopPredictors] = useState([]); // Awaiting Predictor API
  const [latestNews, setLatestNews] = useState([]); // Awaiting News API

  // Fetch real data on load
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [galleryRes, fanCardsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/gallery/featured'), // Fetches only cards marked 'isFeatured'
          axios.get('http://localhost:5000/api/fancards')
        ]);
        
        // Take up to 3 featured official cards
        setFeaturedGallery(galleryRes.data.slice(0, 3));
        
        // Sort fan cards by highest likes, take top 2 for "Trending"
        const sortedFans = fanCardsRes.data.sort((a, b) => b.likes.length - a.likes.length).slice(0, 2);
        setTrendingFanCards(sortedFans);

      } catch (err) {
        console.error("Error fetching home data:", err);
      }
    };
    
    fetchHomeData();
  }, []);

  // Structural Reveal Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div 
      className="space-y-16 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      
      {/* 1. HERO & 2. LIVE MATCH BANNER */}
      <motion.section variants={itemVariants} className="relative pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-green/10 border border-accent-green/30 text-accent-green text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></span>
              World Cup 2026 Command Center
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight tracking-tight">
              Watch. Predict.<br/>Create. <span className="text-accent-green">Share.</span>
            </h1>
            <p className="text-gray-400 text-base sm:text-lg max-w-xl leading-relaxed">
              The ultimate non-custodial destination for the FIFA World Cup 2026. Catch real-time active streams, run score metrics, and build your digital fan legacy.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => navigate('/videoplayer')} className="btn bg-accent-green text-black hover:bg-green-600 border-none px-8 rounded-xl font-bold tracking-wide">
                <PlayCircle className="w-5 h-5 mr-2" /> Live Streams
              </button>
              <button onClick={() => navigate('/schedule')} className="btn btn-outline border-gray-800 text-white hover:bg-gray-900 rounded-xl px-8 font-bold">
                <Calendar className="w-5 h-5 mr-2" /> Match Schedule
              </button>
            </div>
          </div>

          {/* Dynamic Live Display Box */}
          <div className="lg:col-span-5 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-green to-emerald-900 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
            <div className="relative bg-[#0d0d0f] border border-gray-800 p-6 rounded-2xl shadow-2xl">
              {featuredMatch ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wider ${featuredMatch.status?.state === 'in' ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-[#111] text-gray-400 border border-gray-800'}`}>
                      {featuredMatch.status?.state === 'in' ? `LIVE ${featuredMatch.status.displayClock}` : 'FEATURED MATCH'}
                    </span>
                    <span className="text-gray-500 text-xs truncate max-w-[200px]">{featuredMatch.venue || 'FIFA World Cup Venue'}</span>
                  </div>

                  <div className="flex justify-between items-center mb-6 px-2">
                    <div className="text-center w-1/3">
                      <img src={featuredMatch.competitors?.[0]?.logo || 'https://upload.wikimedia.org/wikipedia/commons/e/e0/FIFA_World_Cup_2026_logo.svg'} alt="" className="w-12 h-12 mx-auto mb-2 object-contain" />
                      <p className="font-bold text-white text-sm truncate">{featuredMatch.competitors?.[0]?.displayName || 'TBD'}</p>
                    </div>
                    <div className="text-center w-1/3 px-2">
                      <h2 className="text-3xl font-black text-white tracking-tight">
                        {featuredMatch.status?.state === 'pre' ? 'VS' : `${featuredMatch.competitors?.[0]?.score || 0} - ${featuredMatch.competitors?.[1]?.score || 0}`}
                      </h2>
                      <p className="text-accent-green text-[10px] uppercase font-bold tracking-wider mt-1 truncate">{featuredMatch.groupNote || 'Group Stage'}</p>
                    </div>
                    <div className="text-center w-1/3">
                      <img src={featuredMatch.competitors?.[1]?.logo || 'https://upload.wikimedia.org/wikipedia/commons/e/e0/FIFA_World_Cup_2026_logo.svg'} alt="" className="w-12 h-12 mx-auto mb-2 object-contain" />
                      <p className="font-bold text-white text-sm truncate">{featuredMatch.competitors?.[1]?.displayName || 'TBD'}</p>
                    </div>
                  </div>

                  <button onClick={() => navigate('/videoplayer')} className="w-full py-2 bg-accent-green/10 border border-accent-green/30 text-accent-green hover:bg-accent-green hover:text-black transition-all rounded-xl font-bold">
                    Join Match Lobby
                  </button>
                </>
              ) : (
                <div className="h-44 flex flex-col items-center justify-center text-gray-500 text-sm">
                  <ShieldCheck className="w-8 h-8 mb-2 opacity-50" />
                  Syncing Live Coordinates...
                </div>
              )}
            </div>
          </div>

        </div>
      </motion.section>

      {/* 3. TODAY'S MATCHES */}
      <motion.section variants={itemVariants} className="space-y-4">
        <div className="flex justify-between items-end border-b border-gray-800 pb-2">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent-green" /> Immediate Fixtures
          </h2>
          <button onClick={() => navigate('/schedule')} className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
            All Fixtures <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {matches.length === 0 ? (
             <p className="text-gray-600 col-span-3 text-center py-8 border border-dashed border-gray-800 rounded-xl">No active fixtures tracked.</p>
          ) : (
            matches.slice(0, 3).map(match => (
              <div key={match.id} className="bg-[#0d0d0f] border border-gray-800 p-4 rounded-xl flex flex-col justify-between hover:border-gray-700 transition-colors">
                <div className="flex justify-between items-center text-[11px] text-gray-500 font-medium uppercase tracking-wider mb-3">
                  <span className="truncate max-w-[150px]">{match.groupNote}</span>
                  <span className={match.status?.state === 'in' ? 'text-red-500 font-bold animate-pulse' : ''}>
                    {match.status?.state === 'in' ? `Live ${match.status.displayClock}` : match.date ? format(parseISO(match.date), 'MMM dd • HH:mm') : 'TBD'}
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2"><img src={match.competitors?.[0]?.logo} className="w-5 h-5 object-contain" onError={(e) => e.target.style.display='none'} /> <span className="text-sm font-semibold text-gray-200">{match.competitors?.[0]?.displayName}</span></div>
                    <span className="text-sm font-bold text-white">{match.status?.state !== 'pre' ? match.competitors?.[0]?.score : '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2"><img src={match.competitors?.[1]?.logo} className="w-5 h-5 object-contain" onError={(e) => e.target.style.display='none'} /> <span className="text-sm font-semibold text-gray-200">{match.competitors?.[1]?.displayName}</span></div>
                    <span className="text-sm font-bold text-white">{match.status?.state !== 'pre' ? match.competitors?.[1]?.score : '-'}</span>
                  </div>
                </div>
                <button onClick={() => navigate('/videoplayer')} className="w-full py-1.5 text-xs bg-[#111] hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-800 font-semibold transition-colors">
                  Watch Server Nodes
                </button>
              </div>
            ))
          )}
        </div>
      </motion.section>

      {/* 4. PREDICTION CENTER (Static Shell, API Pending) */}
      <motion.section variants={itemVariants} className="bg-gradient-to-r from-[#0d0d0f] to-[#0c1a12] border border-gray-800 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none hidden md:block">
          <ShieldCheck className="w-48 h-48 text-accent-green" />
        </div>
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-accent-green uppercase tracking-widest flex items-center gap-1"><Star className="w-3.5 h-3.5"/> Community Core</span>
            <h2 className="text-2xl font-bold text-white">🔮 Prediction Center</h2>
            <p className="text-gray-400 text-sm max-w-xl">
              Lock in full score breakdowns, first goalscorers, and Man of the Match honors. Secure your streak metrics and advance on the global leaderboards.
            </p>
          </div>
          <div className="flex gap-4 w-full lg:w-auto opacity-50 cursor-not-allowed">
             <div className="bg-black/40 border border-gray-800 p-3 rounded-xl text-center flex-1 min-w-[90px]">
              <p className="text-xl font-black text-white">--</p><p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-0.5">Accuracy</p>
            </div>
            <div className="bg-black/40 border border-gray-800 p-3 rounded-xl text-center flex-1 min-w-[90px]">
              <p className="text-xl font-black text-white">--</p><p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-0.5">Global Rank</p>
            </div>
            <button disabled className="btn btn-square bg-gray-800 text-gray-500 border-none px-6 w-auto rounded-xl font-bold text-xs uppercase tracking-wider">
              Coming Soon
            </button>
          </div>
        </div>
      </motion.section>

      {/* 5. OFFICIAL ARTWORK GALLERY */}
      <motion.section variants={itemVariants} className="space-y-4">
        <div className="flex justify-between items-end border-b border-gray-800 pb-2">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent-green" /> 🎴 Official Card Gallery
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Curated signature AI identity cards published directly from the admin vector space.</p>
          </div>
          <button onClick={() => navigate('/gallery')} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {featuredGallery.length === 0 ? (
            <p className="text-gray-600 col-span-3 text-center py-10 border border-dashed border-gray-800 rounded-xl">No featured artwork available.</p>
          ) : (
            featuredGallery.map(card => (
              <div key={card._id} onClick={() => navigate('/gallery')} className="bg-[#0d0d0f] border border-gray-800 rounded-xl overflow-hidden group hover:border-gray-700 transition-all shadow-md cursor-pointer">
                <div className="h-48 overflow-hidden relative">
                  <img src={card.imageUrl} alt={card.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500 filter brightness-90" />
                  <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-[10px] text-accent-green font-bold px-2 py-0.5 rounded border border-accent-green/20">
                    {card.style}
                  </span>
                </div>
                <div className="p-4 flex justify-between items-center bg-[#0d0d0f]">
                  <span className="font-bold text-sm text-white">{card.title}</span>
                  <div className="flex items-center gap-1.5 bg-[#111] px-2 py-1 rounded border border-gray-800">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">{card.country}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.section>

      {/* 6. TRENDING FAN CARDS & 7. DREAM TEAMS */}
      <motion.section variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Trending Fan Showcase */}
        <div className="space-y-4">
          <div className="flex justify-between items-end border-b border-gray-800 pb-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-accent-green" /> ⭐ Trending Fan Cards
            </h3>
            <button onClick={() => navigate('/fancards')} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
              Discover <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {trendingFanCards.length === 0 ? (
               <p className="text-gray-600 text-center py-6 border border-dashed border-gray-800 rounded-xl">No fan cards trending right now.</p>
            ) : (
              trendingFanCards.map(card => (
                <div key={card._id} className="bg-[#0d0d0f] border border-gray-800 p-4 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img src={card.imageUrl} className="w-12 h-12 rounded-lg object-cover border border-gray-700 shrink-0" alt="" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-gray-200 truncate">{card.uploaderName}</span>
                      </div>
                      <p className="text-xs text-gray-400 font-semibold truncate">{card.title}</p>
                      
                      {/* Optional Prompt Field Output */}
                      {card.aiPrompt && (
                        <p className="text-[10px] text-gray-500 italic mt-0.5 line-clamp-1 flex items-center gap-1 font-medium">
                          <Sparkles className="w-2.5 h-2.5 text-accent-green shrink-0" />
                          <span className="truncate">{card.aiPrompt}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0">
                    <span className="flex items-center gap-1 text-red-500"><Heart className="w-3.5 h-3.5 fill-current"/> {card.likes?.length || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dream Teams Vector */}
        <div className="space-y-4">
          <div className="border-b border-gray-800 pb-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-accent-green" /> ⚽ Dream Teams
            </h3>
          </div>
          <div className="bg-[#0d0d0f] border border-gray-800 p-6 rounded-xl flex flex-col justify-between h-[156px]">
            <div>
              <p className="text-sm font-semibold text-gray-300">Assemble Your Tactical World Cup Dream XI</p>
              <p className="text-xs text-gray-500 mt-1">Select your dynamic formation rules, deploy your starting line-up, and compete for community validation.</p>
            </div>
            <div className="flex justify-between items-center mt-2">
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full border border-gray-800 bg-gray-700 z-30"></div>
                <div className="w-7 h-7 rounded-full border border-gray-800 bg-gray-600 z-20"></div>
                <div className="w-7 h-7 rounded-full border border-gray-800 bg-gray-500 z-10"></div>
              </div>
              <button onClick={() => navigate('/dreamxi')} className="px-4 py-1.5 text-xs bg-accent-green hover:bg-green-600 border-none text-black font-bold rounded-md transition-colors">
                Construct Lineup
              </button>
            </div>
          </div>
        </div>

      </motion.section>

      {/* 8. TOP PREDICTORS & 9. LATEST TOURNAMENT NEWS (APIs Pending) */}
      <motion.section variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Leaderboards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="border-b border-gray-800 pb-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-accent-green" /> 🏆 Top Predictors
            </h3>
          </div>
          <div className="overflow-x-auto bg-[#0d0d0f] border border-gray-800 rounded-xl p-6 text-center text-gray-500 text-sm">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Leaderboards unlocking soon.</p>
          </div>
        </div>

        {/* Tournament News Feed */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border-b border-gray-800 pb-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-accent-green" /> 📰 Latest News
            </h3>
          </div>
          <div className="bg-[#0d0d0f] border border-gray-800 rounded-xl p-8 text-center text-gray-500 text-sm">
            <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>News API stream pending integration.</p>
          </div>
        </div>

      </motion.section>

    </motion.div>
  );
}