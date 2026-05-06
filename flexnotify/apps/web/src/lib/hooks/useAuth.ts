import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../supabase/client';
import type { User } from '../../../../packages/shared/src/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  initAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (accessToken) => set({ accessToken }),

      initAuth: async () => {
        set({ isLoading: true });
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*, user_preferences(*), subscriptions(*)')
            .eq('id', session.user.id)
            .single();
          set({ user: profile, accessToken: session.access_token, isAuthenticated: true });
        }
        set({ isLoading: false });

        supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            const { data: profile } = await supabase
              .from('users')
              .select('*, user_preferences(*), subscriptions(*)')
              .eq('id', session.user.id)
              .single();
            set({ user: profile, accessToken: session.access_token, isAuthenticated: true });
          } else {
            set({ user: null, accessToken: null, isAuthenticated: false });
          }
        });
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, accessToken: null, isAuthenticated: false });
        window.location.href = '/';
      },
    }),
    {
      name: 'flexnotify-auth',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
    }
  )
);
