import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Trophy, Target, PieChart as PieChartIcon, Lock, CheckCircle2, ChevronUp, ChevronDown, Award } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import useAuthStore from '../store/authStore';
import { useStore } from '../lib/store';
import { format, parseISO } from 'date-fns';

const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#a855f7', '#ec4899'];

export default function Predict() {
  const { user } = useAuthStore();
  const matches = useStore((state) => state.matches) || [];
  
  const [tournamentWinner, setTournamentWinner] = useState('');
  const [matchPredictions, setMatchPredictions] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);
  const [stats, setStats] = useState({ tournamentStats: [] });

  const upcomingMatches = useMemo(() => matches.filter(m => m.status?.state === 'pre'), [matches]);
  const lockedMatches = useMemo(() => matches.filter(m => m.status?.state !== 'pre').slice(0, 6), [matches]);

  // Fetch global metrics and individual user items on mount or authentication change
  useEffect(() => {
    fetchStatsAndLeaderboard();
    if (user?.firebaseUid) {
      fetchUserSavedPredictions(user.firebaseUid);
    }
  }, [user]);

  const fetchStatsAndLeaderboard = async () => {
    try {
      const statsRes = await axios.get('https://arena-watch-backend-1.onrender.com/api/predictions/stats');
      setStats({ tournamentStats: statsRes.data.tournamentStats || [] });
      
      const leaderRes = await axios.get('https://arena-watch-backend-1.onrender.com/api/predictions/leaderboard');
      setLeaderboard(leaderRes.data || []);
    } catch (err) {
      console.error("Failed to fetch real-time analytics or scores", err);
      setLeaderboard([]);
    }
  };

  // NEW: Pulls previously saved entries from database to survive page refreshes
  const fetchUserSavedPredictions = async (userId) => {
    try {
      const res = await axios.get(`https://arena-watch-backend-1.onrender.com/api/predictions/user/${userId}`);
      const savedList = res.data || [];
      
      const structuredMatches = {};
      savedList.forEach(item => {
        if (item.type === 'tournament') {
          setTournamentWinner(item.tournamentWinner || '');
        } else if (item.type === 'match_score') {
          structuredMatches[item.matchId] = {
            homeScore: item.homeScore,
            awayScore: item.awayScore,
            isSaved: true // Flag to show it's already in the database
          };
        }
      });
      setMatchPredictions(structuredMatches);
    } catch (err) {
      console.error("Failed to restore previous user selections:", err);
    }
  };

  const handleTournamentSubmit = async () => {
    if (!user) return alert("Sign in to submit your prediction!");
    if (!tournamentWinner.trim()) return alert("Please type a country name.");

    try {
      await axios.post('https://arena-watch-backend-1.onrender.com/api/predictions', {
        userId: user.firebaseUid,
        userName: user.name,
        type: 'tournament',
        tournamentWinner: tournamentWinner.trim()
      });
      alert(`Prediction saved! You chose ${tournamentWinner} to lift the World Cup.`);
      fetchStatsAndLeaderboard();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit tournament prediction.");
    }
  };

  const handleScoreChange = (matchId, side, value) => {
    const parsedValue = Math.max(0, parseInt(value) || 0);
    setMatchPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [side]: parsedValue
      }
    }));
  };

  const adjustScore = (matchId, side, increment) => {
    const currentScore = matchPredictions[matchId]?.[side] ?? 0;
    handleScoreChange(matchId, side, currentScore + increment);
  };

  const handleMatchSubmit = async (matchId) => {
    if (!user) return alert("Sign in to save matches!");
    const pred = matchPredictions[matchId];
    
    if (pred?.homeScore === undefined || pred?.awayScore === undefined) {
      return alert("Please assign goals to both teams before locking in your score.");
    }

    try {
      await axios.post('https://arena-watch-backend-1.onrender.com/api/predictions', {
        userId: user.firebaseUid,
        userName: user.name,
        type: 'match_score',
        matchId,
        homeScore: pred.homeScore,
        awayScore: pred.awayScore
      });
      
      // Update local state to show it is successfully saved
      setMatchPredictions(prev => ({
        ...prev,
        [matchId]: { ...prev[matchId], isSaved: true }
      }));

      alert("Exact score prediction safely submitted!");
      fetchStatsAndLeaderboard();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit score match pairing.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 min-h-screen space-y-12 bg-[#09090b]">
      
      {/* Page Title */}
      <div className="border-b border-gray-800 pb-6">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <Target className="text-emerald-500 w-8 h-8" /> Oracle Center
        </h1>
        <p className="text-sm text-gray-400 mt-2">Predict precise outcomes, accumulate rating points, and scale the tournament leaderboard.</p>
      </div>

      {/* Analytics and Global Leaderboard Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Champion Prediction */}
        <div className="bg-[#0d0d0f] border border-gray-800 p-6 rounded-2xl flex flex-col justify-between lg:col-span-1">
          <div>
            <h3 className="text-md font-black text-white mb-4 flex items-center gap-2 tracking-wide uppercase">
              <PieChartIcon className="text-emerald-500 w-4 h-4" /> 1. Champion Prediction
            </h3>
            <p className="text-xs text-gray-400 mb-4">Who will carry home the global trophy in 2026?</p>
            <div className="h-[180px] w-full flex items-center justify-center">
              {stats.tournamentStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.tournamentStats} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value" nameKey="name">
                      {stats.tournamentStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#222', borderRadius: '6px' }} itemStyle={{ color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-gray-500 text-center italic border border-dashed border-gray-800 w-full h-full flex items-center justify-center rounded-xl">Chart populates as entries accumulate.</div>
              )}
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <input 
              type="text" 
              placeholder="Enter Country (e.g. Argentina)" 
              value={tournamentWinner}
              onChange={(e) => setTournamentWinner(e.target.value)}
              className="flex-1 bg-[#141416] border border-gray-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500 text-xs font-semibold"
            />
            <button onClick={handleTournamentSubmit} className="bg-emerald-500 text-black px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-400 transition-colors flex-shrink-0">
              Lock Winner
            </button>
          </div>
        </div>

        {/* Leaderboard Panel */}
        <div className="bg-[#0d0d0f] border border-gray-800 p-6 rounded-2xl lg:col-span-2">
          <h3 className="text-md font-black text-white mb-4 flex items-center gap-2 tracking-wide uppercase">
            <Award className="text-emerald-500 w-4 h-4" /> Global Standings Leaderboard
          </h3>
          <div className="overflow-x-auto">
            {leaderboard.length > 0 ? (
              <table className="w-full text-left text-xs text-gray-400">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 uppercase font-black tracking-wider">
                    <th className="py-3 px-2 w-16">Rank</th>
                    <th className="py-3 px-2">Competitor</th>
                    <th className="py-3 px-2 text-center">Perfect Scores</th>
                    <th className="py-3 px-2 text-right">Total Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900 font-medium">
                  {leaderboard.map((row, i) => (
                    <tr key={i} className="hover:bg-[#111]/40 transition">
                      <td className="py-3 px-2 font-black text-white">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </td>
                      <td className="py-3 px-2 text-gray-200 font-bold">{row.userName}</td>
                      <td className="py-3 px-2 text-center text-emerald-400 font-black">{row.correctScores || 0}</td>
                      <td className="py-3 px-2 text-right font-black text-white">{row.points || 0} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-xs text-gray-500 text-center py-10 italic">No competitors have ranked on the scoreboard yet.</div>
            )}
          </div>
        </div>
      </section>

      {/* Match Score Predictions */}
      <section className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-black text-white flex items-center gap-2 tracking-wide uppercase">
            <Trophy className="w-5 h-5 text-emerald-500" /> 2. Daily Match Score Engine
          </h2>
          <p className="text-xs text-gray-400">Adjust the digits below to pin down exactly how many goals each squad will claim.</p>
        </div>

        {upcomingMatches.length === 0 && lockedMatches.length === 0 ? (
          <p className="text-gray-500 p-8 border border-dashed border-gray-800 rounded-xl text-center text-xs">No active match nodes ready for configuration.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {upcomingMatches.map(match => {
              const currentHomePred = matchPredictions[match.id]?.homeScore ?? 0;
              const currentAwayPred = matchPredictions[match.id]?.awayScore ?? 0;
              const isAlreadySaved = matchPredictions[match.id]?.isSaved ?? false;

              return (
                <div key={match.id} className="bg-[#0d0d0f] border border-emerald-500/20 p-5 rounded-xl flex flex-col justify-between relative shadow-lg">
                  <div className={`absolute top-0 right-0 text-[9px] font-black tracking-widest px-3 py-1 rounded-bl-lg uppercase ${isAlreadySaved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {isAlreadySaved ? 'SAVED' : 'PENDING'}
                  </div>
                  
                  <div className="text-[10px] text-gray-500 font-black tracking-wider mb-4 mt-1 uppercase">
                    {match.date ? format(parseISO(match.date), 'MMM dd • HH:mm') : 'Fixture Scheduled'}
                  </div>

                  <div className="flex items-center justify-between my-2 bg-[#121214] p-3 rounded-xl border border-gray-800/80">
                    {/* Home Team */}
                    <div className="flex flex-col items-center w-5/12 gap-1.5">
                      <span className="font-bold text-xs text-white text-center truncate w-full">{match.competitors?.[0]?.displayName || 'TBD'}</span>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => adjustScore(match.id, 'homeScore', -1)} className="p-1 bg-gray-800 hover:bg-gray-700 text-white rounded transition"><ChevronDown className="w-3 h-3" /></button>
                        <span className="text-md font-black text-white bg-[#19191c] px-3 py-0.5 rounded border border-gray-700">{currentHomePred}</span>
                        <button onClick={() => adjustScore(match.id, 'homeScore', 1)} className="p-1 bg-gray-800 hover:bg-gray-700 text-white rounded transition"><ChevronUp className="w-3 h-3" /></button>
                      </div>
                    </div>

                    <div className="text-xs font-black text-gray-600 px-1">—</div>

                    {/* Away Team */}
                    <div className="flex flex-col items-center w-5/12 gap-1.5">
                      <span className="font-bold text-xs text-white text-center truncate w-full">{match.competitors?.[1]?.displayName || 'TBD'}</span>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => adjustScore(match.id, 'awayScore', -1)} className="p-1 bg-gray-800 hover:bg-gray-700 text-white rounded transition"><ChevronDown className="w-3 h-3" /></button>
                        <span className="text-md font-black text-white bg-[#19191c] px-3 py-0.5 rounded border border-gray-700">{currentAwayPred}</span>
                        <button onClick={() => adjustScore(match.id, 'awayScore', 1)} className="p-1 bg-gray-800 hover:bg-gray-700 text-white rounded transition"><ChevronUp className="w-3 h-3" /></button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button 
                      onClick={() => handleMatchSubmit(match.id)} 
                      className={`w-full font-black py-2 text-xs rounded-xl transition-colors uppercase tracking-wider ${isAlreadySaved ? 'bg-emerald-500 text-black hover:bg-emerald-400' : 'bg-white text-black hover:bg-gray-200'}`}
                    >
                      {isAlreadySaved ? 'Update Prediction' : 'Submit Score'}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Locked Matches */}
            {lockedMatches.map(match => (
              <div key={match.id} className="bg-[#111]/80 border border-gray-800/60 p-5 rounded-xl opacity-60 flex flex-col justify-between relative pointer-events-none select-none">
                <div className="absolute top-0 right-0 bg-gray-800 text-gray-500 text-[9px] font-black tracking-widest px-3 py-1 rounded-bl-lg flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> LOCKED
                </div>
                
                <div className="text-[10px] text-gray-600 font-bold mb-4 mt-1 uppercase">
                   {match.status?.state === 'in' ? 'Match Live In-Progress' : 'Match Concluded'}
                </div>

                <div className="flex justify-between items-center bg-[#09090a] p-3 rounded-lg border border-gray-900">
                  <span className="font-bold text-xs text-gray-400 truncate w-4/12 text-center">{match.competitors?.[0]?.displayName}</span>
                  <span className="text-base font-black text-white w-4/12 text-center tracking-tight bg-[#141416] py-1 px-2 rounded border border-gray-800">
                    {match.competitors?.[0]?.score || 0} : {match.competitors?.[1]?.score || 0}
                  </span>
                  <span className="font-bold text-xs text-gray-400 truncate w-4/12 text-center">{match.competitors?.[1]?.displayName}</span>
                </div>

                <div className="bg-[#0d0d0f] border border-gray-800/80 rounded-xl p-2.5 mt-4 text-center flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gray-700" />
                  <span className="text-[10px] text-gray-500 font-black tracking-wider uppercase">Modification Window Shut</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}