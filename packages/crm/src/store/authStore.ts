import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User } from '../types/auth';
import { signIn, signOutUser, getCurrentUser } from '../services/firestore/authService';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      error: null,
      
      login: async (email: string, password: string) => {
        try {
          set({ error: null });
          const user = await signIn(email, password);
          set({ user, isAuthenticated: true });
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },
      
      logout: async () => {
        try {
          await signOutUser();
          set({ user: null, isAuthenticated: false, error: null });
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },
      
      checkAuth: async () => {
        try {
          const user = await getCurrentUser();
          if (!user) {
            set({ user: null, isAuthenticated: false });
            return false;
          }
          
          set({ user, isAuthenticated: true });
          return true;
        } catch (error) {
          set({ user: null, isAuthenticated: false });
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);