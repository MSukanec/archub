import { useEffect, useState, useRef } from 'react'
import { useLocation } from 'wouter'
import { useAuthStore } from '@/stores/authStore'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContextInit } from '@/hooks/use-project-context-init'
import { AuthModal } from '@/components/auth/AuthModal'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, initialized, initialize } = useAuthStore()
  const { data: userData, isLoading: userDataLoading } = useCurrentUser()
  const [location, navigate] = useLocation()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const lastNavigationRef = useRef<string | null>(null)
  
  // Inicializar contexto de proyecto cuando cambie la organización
  useProjectContextInit()

  useEffect(() => {
    // Forzar inicialización si no se ha hecho
    if (!initialized) {
      initialize()
    }
  }, [initialized, initialize])

  useEffect(() => {
    // Solo mostrar modal si ya se inicializó y no hay usuario
    if (initialized && !loading && !user) {
      setShowAuthModal(true)
    } else if (user) {
      setShowAuthModal(false)
    }
  }, [user, initialized, loading])

  // Check if user needs to complete onboarding
  useEffect(() => {
    if (user && userData && !userDataLoading) {
      const { completingOnboarding } = useAuthStore.getState();
      
      // Check localStorage bypass flag - this overrides all onboarding logic
      const onboardingBypass = localStorage.getItem('onboarding_bypass') === 'true';
      
      // If user has completed onboarding but bypass is set, respect it
      // If user has NOT completed onboarding and bypass is set, clear it (fresh user)
      if (onboardingBypass) {
        if (!userData.preferences?.onboarding_completed) {
          console.log('ProtectedRoute: Clearing bypass flag for user who has not completed onboarding');
          localStorage.removeItem('onboarding_bypass');
        } else {
          console.log('ProtectedRoute: Onboarding bypass active - skipping onboarding redirects');
          lastNavigationRef.current = null;
          return;
        }
      }
      
      // If completing onboarding, don't interfere
      if (completingOnboarding) {
        console.log('ProtectedRoute: Onboarding completion in progress - avoiding redirect');
        return;
      }
      
      const hasUserType = userData.preferences?.last_user_type;
      const onboardingCompleted = userData.preferences?.onboarding_completed;
      const hasPersonalData = userData.user_data?.first_name && userData.user_data?.last_name;
      
      // Only redirect if not already on the target route to prevent loops
      if (!onboardingCompleted && location !== '/onboarding') {
        if (lastNavigationRef.current !== '/onboarding') {
          lastNavigationRef.current = '/onboarding';
          navigate('/onboarding');
        }
      } else if (!hasPersonalData && location !== '/onboarding') {
        // Edge case: onboarding marked complete but missing basic data
        if (lastNavigationRef.current !== '/onboarding') {
          lastNavigationRef.current = '/onboarding';
          navigate('/onboarding');
        }
      } else {
        // Reset navigation tracking when we're in a valid state
        lastNavigationRef.current = null;
      }
    }
  }, [user, userData, userDataLoading, location, navigate])

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
    return <>{children}</>
  }

  // Si no hay usuario, mostrar modal de autenticación
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <AuthModal open={true} onOpenChange={setShowAuthModal} />
    </div>
  )
}
