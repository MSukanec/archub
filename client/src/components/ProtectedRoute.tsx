import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { AuthModal } from '@/components/auth/AuthModal'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, initialized } = useAuthStore()
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    if (initialized) {
      setShowAuthModal(!user)
    }
  }, [user, initialized])

  // Mostrar loading solo si no se ha inicializado
  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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
