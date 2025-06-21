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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    set({ loading: true });

    if (!supabase) {
      console.error("Supabase client not initialized");
      set({ user: null, loading: false, initialized: true });
      return;
    }

    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Error getting session:", error.message);
      set({ user: null, loading: false, initialized: true });
      return;
    }

    set({
      user: data.session?.user ?? null,
      loading: false,
      initialized: true,
    });
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
