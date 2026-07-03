//src/store
import { create } from 'zustand';
import { io } from 'socket.io-client';

// === SHARED LIVE-MATCH STORE (Socket.io version) ===
// Backend pushes 'matchUpdates' via espnPoller -> io.emit().
// We keep two views of the data:
//  - rawMatches: the ESPN event list, unmodified, keyed by ESPN event id
//    (useful for Scores.jsx, standings, etc.)
//  - matches: keyed by YOUR bracket's node id (M73, SF1, etc.) — this is
//    what Bracket.jsx reads. It will stay empty until nodeId mapping
//    exists, see mapToNodeId() below.

const useLiveMatchStore = create((set) => ({
  rawMatches: {},
  matches: {},
  connectionStatus: 'connecting', // 'connecting' | 'live' | 'offline'
  lastUpdated: null,

  setMatches: (rawMatches, matches) =>
    set({ rawMatches, matches, connectionStatus: 'live', lastUpdated: new Date().toISOString() }),

  setConnectionStatus: (status) => set({ connectionStatus: status }),
}));

export default useLiveMatchStore;

const BACKEND_URL = import.meta.env?.VITE_API_BASE_URL || 'https://arena-watch-backend-1.onrender.com';

let socket = null;

// --- Mapping ESPN events to your bracket's node ids ---
//
// The World Cup group stage just finished (today, June 27). The Round of
// 32 draws aren't fixed by team name alone — they depend on final group
// standings (1st/2nd place + best third-placed teams), which is exactly
// what your bracket's seed codes like "2A" or "1E" represent.
//
// FIFA's official schedule actually numbers these the same way you did
// (Match 73, Match 74, etc. — see the schedule), so once Round of 32
// matchups are confirmed, you can map a pair of team names to a node id
// directly. For now this returns null for everything, which is why the
// bracket boxes are empty even with real ESPN data flowing in.
const MATCH_NUMBER_TO_NODE_ID = {
  // 73: 'M73', 74: 'M74', ... fill in once FIFA confirms Round of 32 teams
};

function mapToNodeId(espnEvent) {
  // TODO: once Round of 32 is set, match by team pair or by ESPN's
  // event.competitions[0].notes (often contains "Match 73" etc.)
  return null;
}

function normalize(rawEvents) {
  const rawMatches = {};
  const matches = {};

  rawEvents.forEach((event) => {
    rawMatches[event.id] = event;

    const nodeId = mapToNodeId(event);
    if (!nodeId) return; // bracket mapping not available yet — see above

    const [team1, team2] = event.competitors || [];
    const isLive = event.status?.state === 'in';

    matches[nodeId] = {
      team1: { flag: team1?.abbreviation, score: team1?.score, status: isLive ? 'live' : 'scheduled' },
      team2: { flag: team2?.abbreviation, score: team2?.score, status: isLive ? 'live' : 'scheduled' },
    };
  });

  return { rawMatches, matches };
}

export function startLiveConnection() {
  if (socket) return; // already connected

  socket = io(BACKEND_URL, {
    transports: ['websocket'],
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  socket.on('connect', () => {
    console.log('[live] socket connected');
    useLiveMatchStore.getState().setConnectionStatus('live');
  });

  socket.on('matchUpdates', (rawEvents) => {
    console.log(`[live] received ${rawEvents.length} event(s) from backend:`, rawEvents);
    const { rawMatches, matches } = normalize(rawEvents);
    console.log(`[live] mapped ${Object.keys(matches).length} event(s) into bracket nodes`);
    useLiveMatchStore.getState().setMatches(rawMatches, matches);
  });

  socket.on('disconnect', () => {
    console.log('[live] socket disconnected');
    useLiveMatchStore.getState().setConnectionStatus('offline');
  });

  socket.on('connect_error', (err) => {
    console.error('[live] socket connect error:', err.message);
    useLiveMatchStore.getState().setConnectionStatus('offline');
  });
}

export function stopLiveConnection() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}