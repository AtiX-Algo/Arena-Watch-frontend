import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { signOut } from "firebase/auth";
import { auth } from '../lib/firebase';
import { LogOut, User } from 'lucide-react';

export default function Profile() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    logout();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <User className="w-16 h-16 mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-white mb-2">Not Signed In</h2>
        <p>Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-white mb-8">Your Profile</h1>
      
      <div className="bg-[#0d0d0f] border border-gray-800 rounded-2xl p-8 flex flex-col md:flex-row items-center md:items-start gap-8">
        <img 
          src={user.photoUrl} 
          alt={user.name} 
          className="w-32 h-32 rounded-full border-4 border-gray-800 shadow-xl"
        />
        
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div>
            <h2 className="text-2xl font-bold text-white">{user.name}</h2>
            <p className="text-gray-500">{user.email}</p>
          </div>
          
          <div className="inline-block bg-[#111] border border-gray-800 px-4 py-2 rounded-lg">
            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider block mb-1">Account Role</span>
            <span className={`text-sm font-black uppercase tracking-widest ${user.role === 'admin' ? 'text-accent-green' : 'text-blue-400'}`}>
              {user.role}
            </span>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg font-bold transition-colors border border-red-500/20"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}