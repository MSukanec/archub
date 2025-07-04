import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { useAuthStore } from '@/stores/authStore'
import { useCurrentUser } from '@/hooks/use-current-user'
import { AuthModal } from '@/components/auth/AuthModal'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, initialized, initialize } = useAuthStore()
  const { data: userData, isLoading: userDataLoading } = useCurrentUser()
  const [location, navigate] = useLocation()
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    // Forzar inicialización si no se ha hecho
    if (!initialized) {
      initialize()
    }
  }, [initialized, initialize])

  useEffect(() => {
    console.log('ProtectedRoute state:', { initialized, loading, user: !!user });
    
    // Solo mostrar modal si ya se inicializó y no hay usuario
    if (initialized && !loading && !user) {
      console.log('Showing auth modal');
      setShowAuthModal(true)
    } else if (user) {
      console.log('User found, hiding auth modal');
      setShowAuthModal(false)
    }
  }, [user, initialized, loading])

  // Check if user needs to select a mode (only after user data is loaded)
  useEffect(() => {
    if (user && userData && !userDataLoading && location !== '/select-mode') {
      const hasUserType = userData.preferences?.last_user_type;
      
      console.log('Checking user type:', { 
        hasUser: !!user, 
        hasUserData: !!userData, 
        userDataLoading, 
        hasUserType: !!hasUserType, 
        currentLocation: location 
      });
      
      if (!hasUserType) {
        console.log('User has no type selected, redirecting to select-mode');
        navigate('/select-mode');
      }
    }
  }, [user, userData, userDataLoading, location, navigate])

  // Debug adicional
  console.log('ProtectedRoute render:', { initialized, loading, user: !!user, showAuthModal })

  // Mostrar loading mientras se inicializa
  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    )
  }

  // Si está cargando después de inicializar, mostrar loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    )
  }

  // Si hay usuario, mostrar contenido
  if (user) {
    console.log('Rendering protected content for user:', user.email)
    return <>{children}</>
  }

  // Si no hay usuario, mostrar modal de autenticación
  console.log('No user found, showing auth modal')
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <AuthModal open={true} onOpenChange={setShowAuthModal} />
    </div>
  )
}
