import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from '../../lib/firebase';
import useAuthStore from '../../store/authStore';
import axios from 'axios';
import { Trophy } from 'lucide-react';

export default function Navbar() {
  const { user, setUser, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const res = await axios.post('https://arena-watch-backend-1.onrender.com/api/auth/sync', {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        photoUrl: firebaseUser.photoURL
      });
      setUser(res.data);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Streams', path: '/videoplayer' }, 
    // { name: 'Live', path: '/live' },
    { name: 'Schedule', path: '/schedule' },
    { name: 'Scores', path: '/scores' },
    { name: 'Bracket', path: '/bracket' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Fan Cards', path: '/fancards' },
    { name: 'Dream XI', path: '/dreamxi' },  
    { name: 'Predict', path: '/predict' }
    
  ];

  return (
    <nav className="border-b border-gray-800 bg-[#09090b] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 cursor-pointer">
            <Trophy className="text-accent-green w-6 h-6" />
            <span className="text-white font-black text-xl tracking-tight">WC26 Hub</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-2">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  location.pathname === link.path 
                    ? 'bg-gray-800 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end cursor-pointer" onClick={() => navigate('/profile')}>
                  <span className="text-sm font-bold text-white hover:text-accent-green transition-colors">{user.name}</span>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${user.role === 'admin' ? 'text-accent-green' : 'text-gray-500'}`}>
                    {user.role}
                  </span>
                </div>
                <img 
                  onClick={() => navigate('/profile')}
                  src={user.photoUrl} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full border-2 border-gray-800 cursor-pointer hover:border-accent-green transition-colors" 
                />
              </div>
            ) : (
              <button onClick={handleLogin} className="bg-accent-green text-black px-5 py-2 rounded-md font-bold text-sm hover:bg-green-500">
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}