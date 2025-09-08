import { create } from "zustand";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  completingOnboarding: boolean;
  authSubscription?: any;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setCompletingOnboarding: (completing: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,
  completingOnboarding: false,
  authSubscription: undefined,

  initialize: async () => {
    const state = get();
    if (state.initialized) {
      return;
    }


    set({ loading: true });

    if (!supabase) {
      set({ user: null, loading: false, initialized: true });
      return;
    }

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        set({ user: null, loading: false, initialized: true });
        return;
      }

      const user = data.session?.user ?? null;


      set({
        user,
        loading: false,
        initialized: true,
      });

      // Set up auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔧 AuthStore: Auth state changed:', event, !!session?.user);
        
        if (event === 'SIGNED_OUT' || !session?.user) {
          set({ user: null, loading: false });
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          set({ user: session.user, loading: false });
        }
      });
      
      // Store subscription for cleanup
      set({ authSubscription: subscription } as any);
    } catch (err) {
      set({ user: null, loading: false, initialized: true });
    }
  },

  signIn: async (email: string, password: string) => {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    set({ loading: true });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      set({ loading: false });
      throw error;
    }

    set({ user: data.user, loading: false });
  },

  signUp: async (email: string, password: string, fullName: string) => {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    set({ loading: true });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) {
      set({ loading: false });
      throw error;
    }

    // Don't set user immediately as email confirmation is required
    set({ loading: false });
  },

  signInWithGoogle: async () => {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    set({ loading: true });

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/organization/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('Google OAuth error:', error);
        set({ loading: false });
        throw error;
      }

      // The redirect will happen automatically
      console.log('Google OAuth initiated successfully');
    } catch (error) {
      console.error('Google sign-in error:', error);
      set({ loading: false });
      throw error;
    }
  },

  logout: async () => {
    if (!supabase) {
      console.error("Supabase client not initialized");
      return;
    }
    
    console.log('🔧 AuthStore: Fast logout with session clear');
    
    try {
      // Clear user state immediately - no waiting
      set({ user: null, loading: false, initialized: true });
      
      // Sign out from Supabase synchronously - no await to avoid delay
      supabase.auth.signOut({ scope: 'global' }).catch(() => {}); // Fire and forget
      
      // Clear essential storage synchronously  
      try {
        localStorage.removeItem('sb-wtatvsgeivymcppowrfy-auth-token');
        sessionStorage.clear();
      } catch (e) {}
      
      // IMMEDIATE redirect after quick cleanup
      window.location.replace('/');
      
    } catch (error) {
      console.error('🔧 AuthStore: Error during logout:', error);
      // Force redirect even on error
      set({ user: null, loading: false, initialized: true });
      window.location.replace('/');
    }
  },

  setCompletingOnboarding: (completing: boolean) => {
    set({ completingOnboarding: completing });
  },
}));
