import { create } from "zustand";
import { supabase } from "@/lib/supabase";

interface AppBootState {
  loading: boolean;
  signupCompleted: boolean | null;
  error: string | null;
  checkCount: number;
  checkSignupStatus: () => Promise<void>;
  reset: () => void;
}

const MAX_RETRIES = 10;
const RETRY_DELAY = 1000;

export const useAppBootStore = create<AppBootState>((set, get) => ({
  loading: true,
  signupCompleted: null,
  error: null,
  checkCount: 0,

  checkSignupStatus: async () => {
    if (!supabase) {
      set({ loading: false, signupCompleted: false, error: "Supabase not initialized" });
      return;
    }

    set({ loading: true, error: null });

    const checkWithRetry = async (): Promise<void> => {
      const state = get();
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          set({ loading: false, signupCompleted: null, error: null });
          return;
        }

        const { data, error } = await supabase
          .from('users')
          .select('signup_completed')
          .eq('auth_id', user.id)
          .maybeSingle();

        if (error) {
          if (state.checkCount < MAX_RETRIES) {
            set({ checkCount: state.checkCount + 1 });
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return checkWithRetry();
          }
          set({ loading: false, signupCompleted: false, error: error.message });
          return;
        }

        if (!data) {
          if (state.checkCount < MAX_RETRIES) {
            set({ checkCount: state.checkCount + 1 });
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return checkWithRetry();
          }
          set({ loading: false, signupCompleted: false, error: "User record not found after retries" });
          return;
        }

        if (data.signup_completed === true) {
          set({ loading: false, signupCompleted: true, error: null, checkCount: 0 });
          return;
        }

        if (state.checkCount < MAX_RETRIES) {
          set({ checkCount: state.checkCount + 1 });
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return checkWithRetry();
        }

        set({ loading: false, signupCompleted: false, error: "Signup not completed after retries" });
      } catch (err: any) {
        if (state.checkCount < MAX_RETRIES) {
          set({ checkCount: state.checkCount + 1 });
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return checkWithRetry();
        }
        set({ loading: false, signupCompleted: false, error: err.message || "Unknown error" });
      }
    };

    await checkWithRetry();
  },

  reset: () => {
    set({ loading: true, signupCompleted: null, error: null, checkCount: 0 });
  },
}));
