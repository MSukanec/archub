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
    if (!user) {
      setShowAuthModal(true)
    } else {
      setShowAuthModal(false)
    }
  }, [user])

  if (!user) {
    return <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
  }

  return <>{children}</>
}
