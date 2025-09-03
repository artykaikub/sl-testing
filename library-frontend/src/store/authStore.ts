import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ValidatedUser } from '@/types';

interface AuthState {
  isAuthenticated: boolean;
  user: ValidatedUser | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  setProfile: (user: ValidatedUser) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      login: (token) => set({ isAuthenticated: true, token }),
      logout: () => {
        set({ isAuthenticated: false, token: null, user: null });
      },
      setProfile: (user) => set({ user }),
    }),
    {
      name: 'auth-storage', 
    }
  )
);