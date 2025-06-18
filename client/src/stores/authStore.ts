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
    if (!supabase) throw new Error('Supabase not configured')
    
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
    if (!supabase) throw new Error('Supabase not configured')
    
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
    if (!supabase) throw new Error('Supabase not configured')
    
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
    console.log('Initializing auth...')
    
    // Set as initialized immediately to prevent infinite loading
    set({ initialized: true, loading: false })
    
    try {
      if (!supabase) {
        console.error('Supabase not configured properly')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      console.log('Got session:', session ? 'user logged in' : 'no user')
      
      set({ 
        user: session?.user ?? null,
        session,
        loading: false
      })

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event)
        set({ 
          user: session?.user ?? null,
          session,
          loading: false 
        })
      })
    } catch (error) {
      console.error('Error initializing auth:', error)
      set({ loading: false })
    }
  },
}))
