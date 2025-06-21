import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { AuthModal } from '@/components/auth/AuthModal'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user } = useAuthStore()
  const [showAuthModal, setShowAuthModal] = useState(!user)

  useEffect(() => {
    setShowAuthModal(!user)
  }, [user])

  // Si hay usuario, mostrar contenido directamente
  if (user) {
    return <>{children}</>
  }

  // Si no hay usuario, mostrar modal de autenticación
  return <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
}
