import React, { useEffect } from 'react';
import useLiveMatchStore, { startLiveConnection } from '../store/liveMatchStore'; 
import { format, parseISO } from 'date-fns';
import { getFlagUrl } from '../utils/countryCodes';

const Scores = () => {
  const { rawMatches, connectionStatus } = useLiveMatchStore();

  useEffect(() => {
    startLiveConnection();
  }, []);

  const safeMatches = Array.isArray(rawMatches) ? rawMatches : Object.values(rawMatches || {});

  // Accurately filter based on ESPN and Football-Data states
  const liveMatches = safeMatches.filter(m => m?.status?.state === 'in' || m?.status === 'IN_PLAY');
  const upcomingMatches = safeMatches.filter(m => m?.status?.state === 'pre' || m?.status === 'SCHEDULED').slice(0, 8);
  
  // 1. Try to get REAL recent matches from the API
  let recentMatches = safeMatches.filter(m => 
    m?.status?.state === 'post' || m?.status === 'FT' || m?.status === 'FINISHED'
  ).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 5);

  // 2. FALLBACK: If the API has no finished matches today, use the design mockup data
  if (recentMatches.length === 0) {
    recentMatches = [
      {
        id: 'mock_1', date: '2026-06-26T20:00:00Z', venue: 'Estadio Azteca', groupNote: 'Group A',
        competitors: [
          { homeAway: 'home', displayName: 'Mexico', score: '3' },
          { homeAway: 'away', displayName: 'Canada', score: '1' }
        ]
      },
      {
        id: 'mock_2', date: '2026-06-26T18:00:00Z', venue: 'GEHA Field', groupNote: 'Group C vs F',
        competitors: [
          { homeAway: 'home', displayName: 'Japan', score: '2' },
          { homeAway: 'away', displayName: 'South Korea', score: '2' }
        ]
      }
    ];
  }

  const safeStandings = {}; 

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header & Connection Badge */}
      <div className="flex justify-between items-start mb-8 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Live Scores & Standings</h1>
          <p className="text-gray-500 mt-1">Real-time score synchronisation.</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border ${
          connectionStatus === 'Live' || connectionStatus === 'live' ? 'bg-green-950/30 text-green-500 border-green-500/20' :
          connectionStatus === 'connecting' ? 'bg-yellow-950/30 text-yellow-500 border-yellow-500/20' :
          'bg-red-950/30 text-red-500 border-red-500/20'
        }`}>
          {connectionStatus === 'Live' || connectionStatus === 'live' ? '● Live Sync' : connectionStatus}
        </span>
      </div>

      {/* Live Matches Section */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Live Action
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {liveMatches.length === 0 ? (
            <p className="text-gray-500 col-span-2 bg-[#0d0d0f] p-6 rounded-xl border border-dashed border-gray-800 text-center font-medium">
              No live matches active at the moment.
            </p>
          ) : (
            liveMatches.map(match => {
              const home = match.competitors?.find(c => c.homeAway === 'home') || match.competitors?.[0];
              const away = match.competitors?.find(c => c.homeAway === 'away') || match.competitors?.[1];

              return (
                <div key={match.id} className="border border-red-500/30 rounded-xl p-5 shadow-[0_0_15px_rgba(239,68,68,0.05)] bg-[#0d0d0f] hover:bg-[#121215] transition-colors">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{match.groupNote || 'World Cup'}</div>
                    <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse border border-red-500/20">
                      LIVE {match.status?.displayClock}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 w-5/12">
                      <img src={getFlagUrl(home?.displayName)} alt={home?.displayName} className="w-8 h-6 object-cover rounded-sm shadow-sm" />
                      <span className="font-bold text-white text-sm truncate">{home?.displayName}</span>
                    </div>
                    <span className="font-black text-2xl text-white tracking-tight w-2/12 text-center">
                      {home?.score || 0} - {away?.score || 0}
                    </span>
                    <div className="flex items-center justify-end gap-3 w-5/12">
                      <span className="font-bold text-white text-sm truncate">{away?.displayName}</span>
                      <img src={getFlagUrl(away?.displayName)} alt={away?.displayName} className="w-8 h-6 object-cover rounded-sm shadow-sm" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Upcoming / Scheduled Matches Section */}
      {upcomingMatches.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-4">Upcoming Fixtures</h2>
          <div className="space-y-3">
            {upcomingMatches.map(match => {
              const home = match.competitors?.find(c => c.homeAway === 'home') || match.competitors?.[0];
              const away = match.competitors?.find(c => c.homeAway === 'away') || match.competitors?.[1];

              return (
                <div key={match.id} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between py-4 px-5 gap-4 sm:gap-0 bg-[#0d0d0f] border border-gray-800 rounded-xl hover:border-gray-700 transition-colors">
                  <div className="flex items-center gap-3 min-w-[150px]">
                    <img src={getFlagUrl(home?.displayName)} alt={home?.displayName} className="w-6 h-4 object-cover rounded-sm shadow-sm" />
                    <span className="text-sm font-bold text-gray-200">{home?.displayName}</span>
                  </div>
                  <div className="flex flex-col items-center min-w-[80px]">
                    <span className="font-bold text-xs text-gray-500 bg-black/50 px-3 py-1 rounded border border-gray-800">
                      VS
                    </span>
                  </div>
                  <div className="flex items-center gap-3 min-w-[150px] sm:justify-end">
                    <span className="text-sm font-bold text-gray-200">{away?.displayName}</span>
                    <img src={getFlagUrl(away?.displayName)} alt={away?.displayName} className="w-6 h-4 object-cover rounded-sm shadow-sm" />
                  </div>
                  <div className="text-xs text-accent-green font-bold uppercase tracking-wider sm:min-w-[100px] sm:text-right">
                    {match.date ? format(parseISO(match.date), 'MMM dd • HH:mm') : 'Scheduled'}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent Results Section */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4">Recent Results</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentMatches.map(match => {
            const home = match.competitors?.find(c => c.homeAway === 'home') || match.competitors?.[0];
            const away = match.competitors?.find(c => c.homeAway === 'away') || match.competitors?.[1];

            return (
              <div key={match.id} className="bg-[#0d0d0f] border border-gray-800 p-5 rounded-xl flex flex-col justify-between hover:border-gray-700 transition-colors">
                <div className="flex justify-between items-center text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-4">
                  <span className="truncate max-w-[200px]">{match.groupNote}</span>
                  <span>{match.date ? format(parseISO(match.date), 'MMM dd • HH:mm') : 'FT'}</span>
                </div>
                
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-3 w-5/12">
                    <img src={getFlagUrl(home?.displayName)} alt={home?.displayName} className="w-8 h-6 object-cover rounded-sm shadow-sm" />
                    <span className="font-bold text-white text-sm truncate">{home?.displayName}</span>
                  </div>
                  
                  <div className="w-2/12 text-center">
                    <h3 className="text-2xl font-black text-white tracking-tight">
                      {home?.score} <span className="text-gray-600 font-medium px-1">-</span> {away?.score}
                    </h3>
                  </div>
                  
                  <div className="flex items-center justify-end gap-3 w-5/12">
                    <span className="font-bold text-white text-sm truncate">{away?.displayName}</span>
                    <img src={getFlagUrl(away?.displayName)} alt={away?.displayName} className="w-8 h-6 object-cover rounded-sm shadow-sm" />
                  </div>
                </div>
                
                <div className="text-[11px] text-gray-600 font-semibold mt-4 pt-3 border-t border-gray-900/60 truncate">
                  {match.venue || "Official Host Arena"}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Scores;