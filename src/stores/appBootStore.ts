import { create } from "zustand";
import { supabase } from "@/lib/supabase";

interface AppBootState {
  loading: boolean;
  signupCompleted: boolean | null;
  error: string | null;
  checkCount: number;
  isPolling: boolean;
  checkSignupStatus: () => Promise<void>;
  stopPolling: () => void;
  reset: () => void;
}

const POLL_INTERVAL = 1500;

export const useAppBootStore = create<AppBootState>((set, get) => ({
  loading: false,
  signupCompleted: true,
  error: null,
  checkCount: 0,
  isPolling: false,

  checkSignupStatus: async () => {
    if (!supabase) {
      set({ loading: false, signupCompleted: false, error: "Supabase not initialized" });
      return;
    }

    const state = get();
    if (state.isPolling) {
      return;
    }

    set({ loading: true, error: null, isPolling: true, checkCount: 0 });

    const poll = async (): Promise<void> => {
      const currentState = get();
      
      if (!currentState.isPolling) {
        return;
      }
      
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          set({ loading: false, signupCompleted: true, error: null, isPolling: false });
          return;
        }

        const { data, error } = await supabase
          .from('users')
          .select('signup_completed')
          .eq('auth_id', user.id)
          .maybeSingle();

        if (data?.signup_completed === true) {
          set({ loading: false, signupCompleted: true, error: null, checkCount: 0, isPolling: false });
          return;
        }

        if (error) {
          set({ loading: false, signupCompleted: false, checkCount: currentState.checkCount + 1, error: error.message });
        } else {
          set({ loading: false, signupCompleted: false, checkCount: currentState.checkCount + 1, error: null });
        }
        
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
        return poll();
      } catch (err: any) {
        set({ loading: false, signupCompleted: false, checkCount: currentState.checkCount + 1, error: err.message || "Unknown error" });
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
        return poll();
      }
    };

    await poll();
  },

  stopPolling: () => {
    set({ isPolling: false });
  },

  reset: () => {
    set({ loading: false, signupCompleted: true, error: null, checkCount: 0, isPolling: false });
  },
}));
