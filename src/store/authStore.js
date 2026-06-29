import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null, // null means not logged in
  setUser: (userData) => set({ user: userData }),
  logout: () => set({ user: null })
}));

export default useAuthStore;