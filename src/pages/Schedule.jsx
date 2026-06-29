import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, Clock, Tv, AlertCircle } from 'lucide-react';
import { useStore } from '../lib/store'; 
import { ISO_LOOKUP } from '../utils/countryCodes';

export default function SchedulePage() {
  const matchesArray = useStore((state) => state.matches);
  const [liveMatches, setLiveMatches] = useState([]);

  // Fetch from your live endpoint
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/matches');
        if (response.ok) {
          const data = await response.json();
          setLiveMatches(data);
        }
      } catch (error) {
        console.error("❌ Schedule Sync Error:", error);
      }
    };

    fetchSchedule();
    const interval = setInterval(fetchSchedule, 30000); // 30s updates
    return () => clearInterval(interval);
  }, []);

  const activeData = liveMatches.length > 0 ? liveMatches : matchesArray;

  // 🔥 DATA SEGREGATION ENGINE
  const sortedAndFilteredData = useMemo(() => {
    if (!activeData || activeData.length === 0) return { today: [], upcomingGrouped: {} };

    // Get exact timestamps for local midnight boundaries
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();

    const todayList = [];
    const upcomingList = [];

    activeData.forEach((m) => {
      const matchTime = new Date(m.date || m.utcDate).getTime();

      // Rule: Skip old matches entirely (anything played before today)
      if (matchTime < startOfToday) return;

      // Normalize match structure for safety across APIs (ESPN vs football-data)
      const home = m.competitors?.find(c => c.homeAway === 'home') || m.homeTeam || m.competitors?.[0] || {};
      const away = m.competitors?.find(c => c.homeAway === 'away') || m.awayTeam || m.competitors?.[1] || {};
      
      const normalizedMatch = {
        id: m.id,
        rawDate: m.date || m.utcDate,
        stage: m.groupNote || m.stage || "Knockout Round",
        status: m.status?.state === 'in' || m.status === 'LIVE' ? 'LIVE' : 'UPCOMING',
        timeStr: new Date(m.date || m.utcDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        homeTeam: home.displayName || home.name || "TBD",
        awayTeam: away.displayName || away.name || "TBD",
        homeFlag: ISO_LOOKUP[home.displayName || home.name],
        awayFlag: ISO_LOOKUP[away.displayName || away.name],
      };

      if (matchTime >= startOfToday && matchTime < startOfTomorrow) {
        todayList.push(normalizedMatch);
      } else {
        upcomingList.push(normalizedMatch);
      }
    });

    // Sort chronologically
    todayList.sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));
    upcomingList.sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));

    // Group upcoming matches by human-readable Date text
    const upcomingGrouped = upcomingList.reduce((groups, match) => {
      const dateLabel = new Date(match.rawDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
      if (!groups[dateLabel]) groups[dateLabel] = [];
      groups[dateLabel].push(match);
      return groups;
    }, {});

    return { today: todayList, upcomingGrouped };
  }, [activeData]);

  const { today, upcomingGrouped } = sortedAndFilteredData;

  // Sub-component to render match rows cleanly
  const MatchCard = ({ match }) => (
    <div className="bg-[#121214] border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:border-gray-700 transition duration-200 shadow-md">
      {/* Left Details */}
      <div className="flex flex-col gap-1 w-1/4">
        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{match.stage}</span>
        <div className="flex items-center gap-1.5 text-gray-400">
          <Clock className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-sm font-semibold">{match.timeStr}</span>
        </div>
      </div>

      {/* Center Row: Team Layout */}
      <div className="flex items-center justify-center gap-6 w-2/4">
        {/* Home */}
        <div className="flex items-center justify-end gap-3 w-1/2 text-right">
          <span className="font-bold text-sm text-gray-100 hidden sm:inline">{match.homeTeam}</span>
          <span className="font-bold text-sm text-gray-100 sm:hidden">{match.homeTeam.substring(0,3).toUpperCase()}</span>
          <div className="w-8 h-5 bg-[#222] rounded overflow-hidden flex-shrink-0 border border-gray-700">
            {match.homeFlag && <img src={`https://flagcdn.com/w40/${match.homeFlag.toLowerCase()}.png`} alt="" className="w-full h-full object-cover"/>}
          </div>
        </div>

        {/* VS Divider */}
        <div className="px-2.5 py-1 bg-[#1c1c1f] rounded-md text-[10px] font-black text-gray-500 border border-gray-800">
          VS
        </div>

        {/* Away */}
        <div className="flex items-center justify-start gap-3 w-1/2 text-left">
          <div className="w-8 h-5 bg-[#222] rounded overflow-hidden flex-shrink-0 border border-gray-700">
            {match.awayFlag && <img src={`https://flagcdn.com/w40/${match.awayFlag.toLowerCase()}.png`} alt="" className="w-full h-full object-cover"/>}
          </div>
          <span className="font-bold text-sm text-gray-100 hidden sm:inline">{match.awayTeam}</span>
          <span className="font-bold text-sm text-gray-100 sm:hidden">{match.awayTeam.substring(0,3).toUpperCase()}</span>
        </div>
      </div>

      {/* Right Details: Status Indicator */}
      <div className="flex items-center justify-end w-1/4">
        {match.status === 'LIVE' ? (
          <span className="flex items-center gap-1 px-2.5 py-1 bg-red-950/40 text-red-400 text-xs font-black rounded-full border border-red-800/60 animate-pulse">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> LIVE
          </span>
        ) : (
          <span className="flex items-center gap-1 px-2.5 py-1 bg-[#1a1a1e] text-gray-400 text-xs font-bold rounded-full border border-gray-800">
            <Tv className="w-3 h-3 text-gray-500" /> TV SLOT
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-white py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto flex flex-col gap-10">
        
        {/* Header Block */}
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            Match Schedule
          </h1>
          <p className="text-sm text-gray-400 mt-1">Live updates from the knockout phase.</p>
        </div>

        {/* ================= SECTION 1: TODAY'S MATCHES ================= */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <h2 className="text-lg font-black uppercase tracking-wider text-gray-200">Today's Matches</h2>
          </div>

          {today.length > 0 ? (
            <div className="flex flex-col gap-3">
              {today.map((match) => <MatchCard key={match.id} match={match} />)}
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-[#111] border border-gray-800 rounded-xl p-5 text-gray-400">
              <AlertCircle className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <span className="text-sm font-medium">No matches scheduled for today. Knockout rounds resume tomorrow.</span>
            </div>
          )}
        </div>

        {/* ================= SECTION 2: UPCOMING MATCHES ================= */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <h2 className="text-lg font-black uppercase tracking-wider text-gray-200">Upcoming Fixtures</h2>
          </div>

          {Object.keys(upcomingGrouped).length > 0 ? (
            <div className="flex flex-col gap-8">
              {Object.keys(upcomingGrouped).map((dateLabel) => (
                <div key={dateLabel} className="flex flex-col gap-3">
                  {/* Sticky style date separator label */}
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">
                    {dateLabel}
                  </h3>
                  <div className="flex flex-col gap-3">
                    {upcomingGrouped[dateLabel].map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              No further matches scheduled for the tournament.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}