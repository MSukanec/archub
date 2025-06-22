import { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useSidebarStore } from '@/stores/sidebarStore'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { isDark, setTheme } = useThemeStore()
  const { data } = useCurrentUser()
  const { isSidebarMenuOpen } = useSidebarStore()
  
  // Check if sidebar should be docked from user preferences
  const isSidebarDocked = data?.preferences?.sidebar_docked ?? false

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

  // Calculate margin based on sidebar state
  const getMarginLeft = () => {
    const mainSidebarWidth = 40; // 10 * 4 = 40px (w-10)
    const submenuWidth = 192; // 48 * 4 = 192px (w-48)
    
    // Only add submenu width if it should be visible
    const shouldShowSubmenu = isSidebarDocked ? isSidebarMenuOpen : false;
    
    return shouldShowSubmenu ? mainSidebarWidth + submenuWidth : mainSidebarWidth;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main 
        className="transition-all duration-200"
        style={{ 
          marginLeft: `${getMarginLeft()}px`,
          minHeight: '100vh'
        }}
      >
        {children}
      </main>
    </div>
  )
}
