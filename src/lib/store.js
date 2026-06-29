import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({
      channels: [],
      activeChannel: null,
      isSidebarOpen: true,
      matches: [],
      currentView: 'home',
      
      // Add this action
      setCurrentView: (view) => set({ currentView: view }),
      
      setChannels: (channels) => set({ channels }),
      setActiveChannel: (channel) => set({ activeChannel: channel }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setMatches: (matches) => set({ matches }),
    }),
    {
      name: 'football-dashboard-storage',
    }
  )
);