import { create } from "zustand";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  completingOnboarding: boolean;
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
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔧 AuthStore: Auth state changed:', event, !!session?.user);
        
        // Don't override logout state
        const currentState = get();
        if (event === 'SIGNED_OUT' || !session?.user) {
          set({ user: null, loading: false });
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Only set user if we're not in the middle of logout
          if (!currentState.loading || currentState.user) {
            set({ user: session.user, loading: false });
          }
        }
      });
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
    
    console.log('🔧 AuthStore: Starting logout process');
    
    // Set loading state and clear user immediately
    set({ loading: true, user: null });
    
    try {
      // Use sign out with scope 'local' to clear all sessions
      await supabase.auth.signOut({ scope: 'local' });
      console.log('🔧 AuthStore: Logout completed successfully');
      
      // Clear all React Query cache to prevent stale queries
      queryClient.clear();
      console.log('🔧 AuthStore: Cleared React Query cache');
      
      // Clear any stored session data
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      
    } catch (error) {
      console.error('🔧 AuthStore: Error during logout:', error);
    } finally {
      // Ensure state is properly cleared
      set({ user: null, loading: false, initialized: true });
      console.log('🔧 AuthStore: Logout process finished');
      
      // Force redirect to home page after logout
      window.location.href = '/';
    }
  },

  setCompletingOnboarding: (completing: boolean) => {
    set({ completingOnboarding: completing });
  },
}));
