import { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
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
      
      // Solo actualizar si es diferente al estado actual
      if (shouldBeDark !== isDark) {
        setTheme(shouldBeDark)
      }
    }
  }, [data?.preferences?.theme])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main 
        className="ml-[40px] mt-10"
        style={{ 
          minHeight: 'calc(100vh - 40px)'
        }}
      >
        {children}
      </main>
    </div>
  )
}
