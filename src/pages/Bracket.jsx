import React, { useEffect, useState, useMemo } from 'react';
import { Trophy, Wifi, WifiOff, RadioTower } from 'lucide-react';
import { useStore } from '../lib/store'; // Fallback store
import { ISO_LOOKUP } from '../utils/countryCodes'; // Flag dictionary

// === DATA STRUCTURES ===

const leftBracket = {
  id: "SF1", label: "SEMIFINAL 1", seeds: ["W97", "W98"],
  children: [
    {
      id: "M97", label: "MATCH 97", seeds: ["W89", "W90"],
      children: [
        {
          id: "M89", label: "MATCH 89", seeds: ["W73", "W74"],
          children: [
            { id: "M73", label: "MATCH 73", seeds: ["2A", "2B"] },
            { id: "M74", label: "MATCH 74", seeds: ["1E", "3RD"] }
          ]
        },
        {
          id: "M90", label: "MATCH 90", seeds: ["W75", "W76"],
          children: [
            { id: "M75", label: "MATCH 75", seeds: ["1F", "2C"] },
            { id: "M76", label: "MATCH 76", seeds: ["1C", "2F"] }
          ]
        }
      ]
    },
    {
      id: "M98", label: "MATCH 98", seeds: ["W91", "W92"],
      children: [
        {
          id: "M91", label: "MATCH 91", seeds: ["W77", "W78"],
          children: [
            { id: "M77", label: "MATCH 77", seeds: ["1I", "3RD"] },
            { id: "M78", label: "MATCH 78", seeds: ["2E", "2I"] }
          ]
        },
        {
          id: "M92", label: "MATCH 92", seeds: ["W79", "W80"],
          children: [
            { id: "M79", label: "MATCH 79", seeds: ["1A", "3RD"] },
            { id: "M80", label: "MATCH 80", seeds: ["1L", "3RD"] }
          ]
        }
      ]
    }
  ]
};

const rightBracket = {
  id: "SF2", label: "SEMIFINAL 2", seeds: ["W99", "W100"],
  children: [
    {
      id: "M99", label: "MATCH 99", seeds: ["W93", "W94"],
      children: [
        {
          id: "M93", label: "MATCH 93", seeds: ["W81", "W82"],
          children: [
            { id: "M81", label: "MATCH 81", seeds: ["1D", "3RD"] },
            { id: "M82", label: "MATCH 82", seeds: ["1G", "3RD"] }
          ]
        },
        {
          id: "M94", label: "MATCH 94", seeds: ["W83", "W84"],
          children: [
            { id: "M83", label: "MATCH 83", seeds: ["2K", "2L"] },
            { id: "M84", label: "MATCH 84", seeds: ["1H", "2J"] }
          ]
        }
      ]
    },
    {
      id: "M100", label: "MATCH 100", seeds: ["W95", "W96"],
      children: [
        {
          id: "M95", label: "MATCH 95", seeds: ["W85", "W86"],
          children: [
            { id: "M85", label: "MATCH 85", seeds: ["1B", "3RD"] },
            { id: "M86", label: "MATCH 86", seeds: ["1J", "2H"] }
          ]
        },
        {
          id: "M96", label: "MATCH 96", seeds: ["W87", "W88"],
          children: [
            { id: "M87", label: "MATCH 87", seeds: ["1K", "3RD"] },
            { id: "M88", label: "MATCH 88", seeds: ["2D", "2G"] }
          ]
        }
      ]
    }
  ]
};

const leftGroups = [
  { id: 'A', color: 'border-green-500', flags: ['mx', 'za', 'kr', 'cz'] },
  { id: 'B', color: 'border-red-600', flags: ['ca', 'ba', 'qa', 'ch'] },
  { id: 'C', color: 'border-orange-500', flags: ['br', 'ma', 'ht', 'gb-eng'] },
  { id: 'D', color: 'border-blue-600', flags: ['us', 'py', 'au', 'tr'] },
  { id: 'E', color: 'border-purple-500', flags: ['de', 'ci', 'ec'] },
  { id: 'F', color: 'border-yellow-400', flags: ['nl', 'jp', 'se', 'tn'] },
];

const rightGroups = [
  { id: 'G', color: 'border-pink-500', flags: ['be', 'eg', 'ir', 'nz'] },
  { id: 'H', color: 'border-cyan-400', flags: ['es', 'cv', 'sa', 'uy'] },
  { id: 'I', color: 'border-fuchsia-600', flags: ['fr', 'sn', 'iq', 'no'] },
  { id: 'J', color: 'border-blue-400', flags: ['ar', 'dz', 'at', 'jo'] },
  { id: 'K', color: 'border-orange-600', flags: ['pt', 'co', 'uz'] },
  { id: 'L', color: 'border-sky-500', flags: ['gb-eng', 'hr', 'gh', 'pa'] },
];

// === COMPONENTS ===

const GroupCard = ({ id, color, flags }) => (
  <div className={`w-20 h-24 bg-[#111] border-[1.5px] ${color} rounded-lg flex flex-col items-center p-1 mb-2 shadow-lg relative z-10`}>
    <div className="grid grid-cols-2 gap-[2px] w-full mb-1">
      {flags.map((flag, idx) => (
        <div key={idx} className="h-6 flex items-center justify-center bg-[#222] border border-gray-700 rounded-sm">
          {flag && <img src={`https://flagcdn.com/w20/${flag}.png`} alt="flag" className="h-4 w-6 object-cover rounded-[1px]" />}
        </div>
      ))}
    </div>
    <span className="text-[10px] font-black text-white mt-auto pb-1 uppercase tracking-wider">Group {id}</span>
  </div>
);

const MatchSlot = ({ seed, teamData }) => {
  const isLive = teamData?.status === 'live';
  return (
    <div className={`flex w-[100px] h-6 bg-[#3a3a3a] border ${isLive ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-gray-600'} rounded-[3px] overflow-hidden mb-[3px] transition-colors duration-300`}>
      <div className="w-[30%] bg-white text-black text-[10px] font-bold flex items-center justify-center border-r border-gray-400">
        {seed}
      </div>
      <div className="w-[45%] flex items-center justify-center bg-[#222]">
        {teamData?.flag && (
          <img src={`https://flagcdn.com/w20/${teamData.flag.toLowerCase()}.png`} alt="flag" className="h-4 w-6 object-cover" />
        )}
      </div>
      {teamData?.score !== undefined && (
        <div className={`w-[25%] flex items-center justify-center text-[10px] font-black ${isLive ? 'text-red-400 bg-red-950/20' : 'text-gray-300 bg-[#181818]'}`}>
          {teamData.score}
        </div>
      )}
    </div>
  );
};

const ConnectorLeft = () => (
  <div className="w-6 relative">
    <div className="absolute top-[25%] bottom-[25%] left-0 w-1/2 border-r-[1.5px] border-t-[1.5px] border-b-[1.5px] border-gray-500 rounded-r-[3px]"></div>
    <div className="absolute top-1/2 right-0 w-1/2 border-t-[1.5px] border-gray-500"></div>
  </div>
);

const ConnectorRight = () => (
  <div className="w-6 relative">
    <div className="absolute top-[25%] bottom-[25%] right-0 w-1/2 border-l-[1.5px] border-t-[1.5px] border-b-[1.5px] border-gray-500 rounded-l-[3px]"></div>
    <div className="absolute top-1/2 left-0 w-1/2 border-t-[1.5px] border-gray-500"></div>
  </div>
);

const TreeNode = ({ node, isRight, liveData }) => {
  const matchInfo = liveData?.[node.id] || null;

  if (!node.children) {
    return (
      <div className="flex flex-col items-center justify-center py-2 px-1 relative z-10">
        <span className="text-[9px] text-gray-400 font-bold mb-[2px] tracking-widest">{node.label}</span>
        <MatchSlot seed={node.seeds[0]} teamData={matchInfo?.team1} />
        <MatchSlot seed={node.seeds[1]} teamData={matchInfo?.team2} />
      </div>
    );
  }

  return (
    <div className={`flex ${isRight ? 'flex-row-reverse' : 'flex-row'} h-full items-stretch`}>
      <div className="flex flex-col justify-around h-full">
        <TreeNode node={node.children[0]} isRight={isRight} liveData={liveData} />
        <TreeNode node={node.children[1]} isRight={isRight} liveData={liveData} />
      </div>

      {isRight ? <ConnectorRight /> : <ConnectorLeft />}

      <div className="flex flex-col justify-center px-1 relative z-10">
        <span className="text-[9px] text-gray-400 font-bold mb-[2px] tracking-widest text-center">{node.label}</span>
        <MatchSlot seed={node.seeds[0]} teamData={matchInfo?.team1} />
        <MatchSlot seed={node.seeds[1]} teamData={matchInfo?.team2} />
      </div>
    </div>
  );
};

export default function KnockoutBracket() {
  const matchesArray = useStore((state) => state.matches);
  const [liveMatches, setLiveMatches] = useState([]);

  // 🔥 REAL-TIME UPDATE LOOP
  useEffect(() => {
    const fetchLiveBracketData = async () => {
      try {
        const response = await fetch('https://arena-watch-backend-1.onrender.com/api/matches');
        if (response.ok) {
          const data = await response.json();
          setLiveMatches(data);
        }
      } catch (error) {
        console.error("❌ Bracket Sync Error:", error);
      }
    };

    fetchLiveBracketData();
    const interval = setInterval(fetchLiveBracketData, 15000);
    return () => clearInterval(interval);
  }, []);

  const activeData = liveMatches.length > 0 ? liveMatches : matchesArray;

  // 🔥 DETERMINISTIC MAPPING: Maps data securely based on match index, ignoring text labels
  const mappedBracketData = useMemo(() => {
    const dict = {};
    if (!activeData || activeData.length === 0) return dict;

    // Sort all matches chronologically to guarantee correct match numbering (1 through 104)
    const sortedMatches = [...activeData].sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedMatches.forEach((m, index) => {
      const matchNumber = index + 1; // 1 to 104
      let nodeKey = null;

      // Group stage is Match 1 to 72. Knockouts begin at Match 73.
      if (matchNumber >= 73 && matchNumber <= 100) {
        nodeKey = `M${matchNumber}`;
      } else if (matchNumber === 101) {
        nodeKey = "SF1";
      } else if (matchNumber === 102) {
        nodeKey = "SF2";
      } else if (matchNumber === 103) {
        nodeKey = "3RD";
      } else if (matchNumber === 104) {
        nodeKey = "F";
      }

      // 🛑 SAFETY: Exit early if it's a standard Group Stage match
      if (!nodeKey) return;

      const home = m.competitors?.find(c => c.homeAway === 'home') || m.competitors?.[0] || {};
      const away = m.competitors?.find(c => c.homeAway === 'away') || m.competitors?.[1] || {};
      const isLive = m.status?.state === 'in';

      dict[nodeKey] = {
        team1: { 
          flag: home.displayName ? ISO_LOOKUP[home.displayName] : undefined, 
          score: home.score, 
          status: isLive ? 'live' : 'finished' 
        },
        team2: { 
          flag: away.displayName ? ISO_LOOKUP[away.displayName] : undefined, 
          score: away.score, 
          status: isLive ? 'live' : 'finished' 
        }
      };
    });

    return dict;
  }, [activeData]);

  return (
    <div className="min-h-screen bg-[#09090b] text-white py-12 relative flex items-center justify-center font-sans overflow-x-auto animate-fade-in custom-scrollbar">

      {/* Background Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-5 z-0">
        <h1 className="text-[30vw] font-black tracking-tighter">2026</h1>
      </div>

      <div className="flex items-center min-w-max px-4">

        {/* Left Flank: Groups */}
        <div className="flex flex-col justify-between h-[800px] mr-6">
          {leftGroups.map(group => <GroupCard key={group.id} {...group} />)}
        </div>

        {/* Left Bracket */}
        <div className="h-[800px] py-4">
          <TreeNode node={leftBracket} isRight={false} liveData={mappedBracketData} />
        </div>

        {/* Center: Trophy & Finals */}
        <div className="flex flex-col items-center justify-center mx-8 relative z-10 h-[800px] w-[180px]">

          <div className="flex flex-col items-center mb-12 w-full">
             <span className="text-xl font-bold tracking-[0.2em] mb-2 uppercase text-accent-green">Final</span>
             <MatchSlot seed="W101" teamData={mappedBracketData?.["F"]?.team1} />
             <MatchSlot seed="W102" teamData={mappedBracketData?.["F"]?.team2} />
          </div>

          <div className="my-8 drop-shadow-[0_0_30px_rgba(34,197,94,0.2)]">
            <Trophy className="w-32 h-40 text-accent-green" strokeWidth={1.5} />
          </div>

          <div className="flex flex-col items-center mt-12 w-full">
             <span className="text-xs font-bold tracking-[0.1em] text-gray-500 mb-2 uppercase">Third Place</span>
             <MatchSlot seed="L101" teamData={mappedBracketData?.["3RD"]?.team1} />
             <MatchSlot seed="L102" teamData={mappedBracketData?.["3RD"]?.team2} />
          </div>

        </div>

        {/* Right Bracket */}
        <div className="h-[800px] py-4">
          <TreeNode node={rightBracket} isRight={true} liveData={mappedBracketData} />
        </div>

        {/* Right Flank: Groups */}
        <div className="flex flex-col justify-between h-[800px] ml-6">
          {rightGroups.map(group => <GroupCard key={group.id} {...group} />)}
        </div>

      </div>
    </div>
  );
}