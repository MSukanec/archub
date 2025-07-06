import { create } from "zustand";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    const state = get();
    if (state.initialized) {
      return;
    }


    set({ loading: true });

    if (!supabase) {
      console.error("Supabase client not initialized");
      set({ user: null, loading: false, initialized: true });
      return;
    }

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting session:", error.message);
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
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        // If user signed in via OAuth and doesn't have a user record, create it
        if (event === 'SIGNED_IN' && session?.user) {
          const { user } = session;
          
          // Check if user exists in our database
          try {
            const { data: existingUser } = await supabase
              .from('users')
              .select('id')
              .eq('auth_id', user.id)
              .single();
            
            // If user doesn't exist, create records
            if (!existingUser) {
              console.log('Creating database records for OAuth user:', user.email);
              
              try {
                const response = await fetch('/api/auth/register-user', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    auth_id: user.id,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || user.user_metadata?.name || ''
                  })
                });

                if (!response.ok) {
                  console.error('Failed to create user records for OAuth user');
                }
              } catch (error) {
                console.error('Error creating user records for OAuth user:', error);
              }
            }
          } catch (error) {
            console.error('Error checking user existence:', error);
          }
        }
        
        set({ user: session?.user ?? null, loading: false });
      });
    } catch (err) {
      console.error("Initialize error:", err);
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

    try {
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

      // If user was created successfully, create our database records
      if (data.user) {
        try {
          const response = await fetch('/api/auth/register-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              auth_id: data.user.id,
              email: data.user.email,
              full_name: fullName
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to create user records:', errorData);
            // Don't throw here as the auth user was created successfully
          }
        } catch (error) {
          console.error('Error creating user records:', error);
          // Don't throw here as the auth user was created successfully
        }
      }

      set({ loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
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
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
