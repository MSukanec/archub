import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  initialized: false,

  signIn: async (email, password) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      console.log('Sign in successful:', data.user?.email);
      set({ user: data.user, session: data.session, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  signInWithGoogle: async () => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  },

  signOut: async () => {
    if (!supabase) return;
    
    try {
      console.log('Signing out...');
      await supabase.auth.signOut();
      set({ user: null, session: null });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  },

  initialize: async () => {
    if (!supabase) {
      console.log('Supabase not available, marking as initialized');
      set({ user: null, session: null, loading: false, initialized: true });
      return;
    }

    console.log('Initializing auth...');
    
    try {
      // Configurar listener primero
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);
        
        switch (event) {
          case 'SIGNED_IN':
            set({
              session,
              user: session?.user || null,
              loading: false,
              initialized: true
            });
            break;
          case 'SIGNED_OUT':
            set({
              session: null,
              user: null,
              loading: false,
              initialized: true
            });
            break;
          case 'TOKEN_REFRESHED':
            if (session) {
              set({
                session,
                user: session.user,
                loading: false,
                initialized: true
              });
            }
            break;
          case 'INITIAL_SESSION':
            set({
              session: session,
              user: session?.user || null,
              loading: false,
              initialized: true
            });
            break;
        }
      });

      // Obtener sesión actual
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session error:', error);
        set({ user: null, session: null, loading: false, initialized: true });
        return;
      }

      // Establecer sesión inicial
      console.log('Got session:', session ? 'user logged in' : 'no session');
      set({
        session: session,
        user: session?.user || null,
        loading: false,
        initialized: true
      });

    } catch (error) {
      console.error('Initialize error:', error);
      set({ user: null, session: null, loading: false, initialized: true });
    }
  },
}));
