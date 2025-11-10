import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

interface ThemeState {
  isDark: boolean
  toggleTheme: (userId?: string, preferencesId?: string) => Promise<void>
  setTheme: (isDark: boolean) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: false,
      toggleTheme: async (userId?: string, preferencesId?: string) => {
        const currentState = get()
        const newIsDark = !currentState.isDark
        
        
        // Actualizar estado y DOM de forma forzada
        set({ isDark: newIsDark })
        
        // Forzar actualización del DOM
        if (newIsDark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        
        // Sincronizar con base de datos si hay usuario
        if (supabase && userId && preferencesId) {
          try {
            const themeValue = newIsDark ? 'dark' : 'light'
            const { error } = await supabase
              .from('user_preferences')
              .update({ theme: themeValue })
              .eq('id', preferencesId)
            
            if (error) {
            } else {
            }
          } catch (error) {
          }
        }
      },
      setTheme: (isDark) => {
        document.documentElement.classList.toggle('dark', isDark)
        set({ isDark })
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.classList.toggle('dark', state.isDark)
        }
      },
    }
  )
)
