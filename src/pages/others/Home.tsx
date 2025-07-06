import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { useAuthStore } from '@/stores/authStore'
import { useCurrentUser } from '@/hooks/use-current-user'
import { AuthModal } from '@/components/auth/AuthModal'
import { Button } from '@/components/ui/button'

export default function Home() {
  const { user, loading, initialized, logout } = useAuthStore()
  const { data: userData, isLoading: userDataLoading } = useCurrentUser()
  const [, navigate] = useLocation()

  useEffect(() => {
    if (initialized && !loading && user && userData && !userDataLoading) {
      // Usuario autenticado, ir directamente al dashboard (onboarding deshabilitado temporalmente)
      console.log('User authenticated, redirecting to dashboard')
      navigate('/organization/dashboard')
    }
  }, [initialized, loading, user, userData, userDataLoading, navigate])

  // Mostrar loading mientras se inicializa
  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    )
  }

  // Si no hay usuario, mostrar modal de autenticación
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AuthModal open={true} onOpenChange={() => {}} />
      </div>
    )
  }

  // Debug: Botón temporal para logout
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p>Usuario logueado: {user.email}</p>
          <Button onClick={logout} variant="destructive">
            Cerrar Sesión (Test)
          </Button>
          <Button onClick={() => (window as any).debugAuthFlow?.()} variant="outline">
            Debug Auth Flow
          </Button>
        </div>
      </div>
    )
  }

  // Mostrar loading mientras se cargan los datos del usuario
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
    </div>
  )
}