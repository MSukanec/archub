import { create } from "zustand";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
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
      supabase.auth.onAuthStateChange((event, session) => {
        set({ user: session?.user ?? null });
      });
    } catch (err) {
      console.error("Initialize error:", err);
      set({ user: null, loading: false, initialized: true });
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
