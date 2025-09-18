import { create } from "zustand";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";

// Helper function to ensure user data exists for new users
async function ensureUserDataExists(user: User) {
  if (!supabase) return;
  
  try {
    // Check if user_data exists
    const { data: userData, error: userDataError } = await supabase
      .from('user_data')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    // Create user_data if it doesn't exist
    if (userDataError?.code === 'PGRST116' || !userData) {
      const { error: insertUserDataError } = await supabase
        .from('user_data')
        .insert({
          user_id: user.id,
          first_name: '',
          last_name: '',
          country: '',
          birthdate: null
        });
      
      if (insertUserDataError) {
        console.error('Error creating user_data:', insertUserDataError);
      }
    }
    
    // Check if user_preferences exists
    const { data: preferencesData, error: preferencesError } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    // Create user_preferences if it doesn't exist
    if (preferencesError?.code === 'PGRST116' || !preferencesData) {
      const { error: insertPreferencesError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          theme: 'light',
          sidebar_docked: false,
          onboarding_completed: false,
          last_user_type: null
        });
      
      if (insertPreferencesError) {
        console.error('Error creating user_preferences:', insertPreferencesError);
      }
    }
  } catch (error) {
    console.error('Error ensuring user data exists:', error);
  }
}

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
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔧 AuthStore: Auth state changed:', event, !!session?.user);
        
        if (event === 'SIGNED_OUT' || !session?.user) {
          set({ user: null, loading: false });
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          set({ user: session.user, loading: false });
          
          // Ensure user data exists for new users
          if (event === 'SIGNED_IN' && session.user) {
            await ensureUserDataExists(session.user);
          }
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
          redirectTo: `${window.location.origin}/`,
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
      
      // Clear ALL Supabase tokens synchronously  
      try {
        // Get all localStorage keys first (safer iteration)
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sb-')) {
            keysToRemove.push(key);
          }
        }
        
        // Remove all Supabase keys
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Also clear specific known keys
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('supabase-auth-token');
        
        sessionStorage.clear();
        console.log('🔧 AuthStore: Cleared', keysToRemove.length, 'Supabase tokens');
      } catch (e) {
        console.error('🔧 AuthStore: Error clearing storage:', e);
      }
      
      // IMMEDIATE redirect after quick cleanup - use navigate for faster transition
      const currentPath = window.location.pathname;
      if (currentPath !== '/') {
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
        // Scroll to top of landing page
        setTimeout(() => window.scrollTo(0, 0), 0);
      }
      
    } catch (error) {
      console.error('🔧 AuthStore: Error during logout:', error);
      // Force redirect even on error
      set({ user: null, loading: false, initialized: true });
      const currentPath = window.location.pathname;
      if (currentPath !== '/') {
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
        // Scroll to top of landing page
        setTimeout(() => window.scrollTo(0, 0), 0);
      }
    }
  },

  setCompletingOnboarding: (completing: boolean) => {
    set({ completingOnboarding: completing });
  },
}));
