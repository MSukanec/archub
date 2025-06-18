import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { AuthModal } from '@/components/auth/AuthModal'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, initialized } = useAuthStore()
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    // Solo mostrar modal de auth si ya se inicializó y no hay usuario
    if (initialized && !user) {
      setShowAuthModal(true)
    } else if (user) {
      setShowAuthModal(false)
    }
  }, [user, initialized])

  // Mostrar loading mientras se inicializa la autenticación
  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Mostrar modal de autenticación si no hay usuario
  if (!user) {
    return <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
  }

  return <>{children}</>
}
