import { create } from 'zustand'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: false,
  initialized: false,

  signIn: async (email: string, password: string) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      set({ 
        user: data.user, 
        session: data.session,
        loading: false 
      })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true })
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      })
      
      if (error) throw error
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  signOut: async () => {
    set({ loading: true })
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      set({ 
        user: null, 
        session: null,
        loading: false 
      })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      set({ 
        user: session?.user ?? null,
        session,
        initialized: true 
      })

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        set({ 
          user: session?.user ?? null,
          session,
          loading: false 
        })
      })
    } catch (error) {
      console.error('Error initializing auth:', error)
      set({ initialized: true })
    }
  },
}))
