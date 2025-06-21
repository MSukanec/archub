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
    // Solo mostrar modal si ya se inicializó y no hay usuario
    if (initialized && !user) {
      setShowAuthModal(true)
    } else if (user) {
      setShowAuthModal(false)
    }
  }, [user, initialized])

  // Mostrar loading mientras se inicializa
  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Si hay usuario, mostrar contenido
  if (user) {
    return <>{children}</>
  }

  // Si no hay usuario, mostrar modal de autenticación
  return <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
}
