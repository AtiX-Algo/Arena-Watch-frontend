import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import useAuthStore from './store/authStore';
import { useStore } from './lib/store'; // 👈 Import your global store
import io from 'socket.io-client';   // 👈 Import socket client
import axios from 'axios';

// Layout & Pages
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Schedule from './pages/Schedule';
import Scores from './pages/Scores';
import Bracket from './pages/Bracket';
import Gallery from './pages/Gallery';
import Profile from './pages/Profile';
import PlayerPage from './pages/PlayerPage';
import FanCards from './pages/FanCards';
import DreamXI from './pages/DreamXI';
import Predict from './pages/Predict';

export default function App() {
  const { setUser, logout } = useAuthStore();
  const setMatches = useStore((state) => state.setMatches); // 👈 Action to save matches
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // ==========================================
  // 🔌 REAL-TIME SOCKET CONNECTION
  // ==========================================
  useEffect(() => {
    // Connect directly to your live Render backend
    const socket = io('https://arena-watch-backend-1.onrender.com', {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('🔌 Connected to Render Socket Server:', socket.id);
    });

    // Listen for live updates and update Zustand store instantly
    socket.on('matchUpdates', (updatedMatches) => {
      console.log('⚽ Received live scores:', updatedMatches);
      setMatches(updatedMatches);
    });

    // Clean up connection when app unmounts
    return () => {
      socket.disconnect();
    };
  }, [setMatches]);
  // ==========================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const res = await axios.post('https://arena-watch-backend-1.onrender.com/api/auth/sync', {
            firebaseUid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            photoUrl: firebaseUser.photoURL
          });
          setUser(res.data);
        } catch (err) {
          console.error("Auth sync error on load", err);
        }
      } else {
        logout();
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, logout]);

  if (isAuthLoading) {
    return <div className="min-h-screen bg-[#09090b] flex justify-center items-center text-accent-green font-bold">Loading WC26...</div>;
  }

  return (
    <Router>
      <div className="h-screen bg-[#09090b] flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 relative overflow-y-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/videoplayer" element={<PlayerPage />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/scores" element={<Scores />} />
            <Route path="/bracket" element={<Bracket />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/fancards" element={<FanCards />} />
            <Route path="/dreamxi" element={<DreamXI />} />
            <Route path="/predict" element={<Predict />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}