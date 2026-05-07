import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../supabase/client';

interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'user' | 'admin_owner' | 'admin_super';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  user_preferences?: any;
  subscriptions?: any;
}

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
    (set) => ({
      user: null,
      accessToken: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (accessToken) => set({ accessToken }),

      initAuth: async () => {
        set({ isLoading: true });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profile } = await supabase
              .from('users')
              .select('*, user_preferences(*), subscriptions(*)')
              .eq('id', session.user.id)
              .single();
            set({ user: profile, accessToken: session.access_token, isAuthenticated: true });
          }
        } catch (e) {
          console.error('initAuth error', e);
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
