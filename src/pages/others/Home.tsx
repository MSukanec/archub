import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { useAuthStore } from '@/stores/authStore'
import { useCurrentUser } from '@/hooks/use-current-user'
import { AuthModal } from '@/components/auth/AuthModal'

export default function Home() {
  const { user, loading, initialized } = useAuthStore()
  const { data: userData, isLoading: userDataLoading } = useCurrentUser()
  const [, navigate] = useLocation()

  useEffect(() => {
    if (initialized && !loading && user && userData && !userDataLoading) {
      // Usuario autenticado, verificar onboarding
      const onboardingCompleted = userData.preferences?.onboarding_completed
      const hasUserData = userData.user_data && userData.user_data.first_name && userData.user_data.last_name

      if (!hasUserData && !onboardingCompleted) {
        // Necesita onboarding
        navigate('/select-mode')
      } else {
        // Ir al dashboard
        navigate('/organization/dashboard')
      }
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

  // Mostrar loading mientras se cargan los datos del usuario
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
    </div>
  )
}