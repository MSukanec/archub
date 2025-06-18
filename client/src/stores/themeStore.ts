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
        
        // Actualizar UI inmediatamente
        document.documentElement.classList.toggle('dark', newIsDark)
        set({ isDark: newIsDark })
        
        // Sincronizar con base de datos si hay usuario
        if (supabase && userId && preferencesId) {
          try {
            const themeValue = newIsDark ? 'dark' : 'light'
            const { error } = await supabase
              .from('user_preferences')
              .update({ theme: themeValue })
              .eq('id', preferencesId)
            
            if (error) {
              console.error('Error updating theme in database:', error)
            } else {
              console.log('Theme updated in database:', themeValue)
            }
          } catch (error) {
            console.error('Failed to sync theme with database:', error)
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
