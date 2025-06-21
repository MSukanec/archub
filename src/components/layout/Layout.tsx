import { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { useCurrentUser } from '@/hooks/use-current-user'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { isDark, setTheme } = useThemeStore()
  const { data } = useCurrentUser()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  // Sincronizar tema desde la base de datos cuando se carga el usuario (solo una vez)
  useEffect(() => {
    if (data?.preferences?.theme) {
      const dbTheme = data.preferences.theme
      const shouldBeDark = dbTheme === 'dark'
      
      console.log('Loading theme from DB:', { dbTheme, shouldBeDark, currentIsDark: isDark })
      
      // Solo actualizar si es diferente al estado actual
      if (shouldBeDark !== isDark) {
        console.log('Updating theme to match DB')
        setTheme(shouldBeDark)
      }
    }
  }, [data?.preferences?.theme]) // Eliminé isDark y setTheme de las dependencias

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main 
        className="transition-all duration-200"
        style={{ 
          marginLeft: '232px', // 40px (main sidebar) + 192px (submenu when visible)
          minHeight: '100vh'
        }}
      >
        {children}
      </main>
    </div>
  )
}
