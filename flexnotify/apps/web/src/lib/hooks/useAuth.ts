import { create } from 'zustand';
import { supabase } from '../supabase/client';

interface AuthState {
  user: any;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,

  initAuth: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Simple query — no joins that can fail
        const { data: profile } = await supabase
          .from('users')
          .select('id, email, full_name, role, phone, avatar_url')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          // Get subscription separately
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          // Get preferences separately
          const { data: prefs } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          set({
            user: { ...profile, subscriptions: sub, user_preferences: prefs },
            accessToken: session.access_token,
            isAuthenticated: true,
          });
        }
      }
    } catch (e) {
      console.error('initAuth error', e);
    }
    set({ isLoading: false });

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('id, email, full_name, role, phone, avatar_url')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          const { data: sub } = await supabase
            .from('subscriptions').select('*').eq('user_id', session.user.id).single();
          const { data: prefs } = await supabase
            .from('user_preferences').select('*').eq('user_id', session.user.id).single();

          set({
            user: { ...profile, subscriptions: sub, user_preferences: prefs },
            accessToken: session.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
        }
      } else {
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
      }
    });
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, accessToken: null, isAuthenticated: false });
    window.location.href = '/';
  },
}));
