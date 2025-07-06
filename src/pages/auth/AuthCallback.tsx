import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { useAuthStore } from '@/stores/authStore'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Loader2 } from 'lucide-react'

export default function AuthCallback() {
  const [, setLocation] = useLocation()
  const { user: authUser, initialized } = useAuthStore()
  const { data: userData, isLoading, error } = useCurrentUser()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    console.log('AuthCallback - State:', {
      initialized,
      authUser: !!authUser,
      userDataLoading: isLoading,
      userData: !!userData,
      error: !!error,
      redirecting
    })

    if (!initialized || redirecting) return

    if (!authUser) {
      console.log('No auth user, redirecting to login')
      setLocation('/')
      return
    }

    if (isLoading) {
      console.log('User data still loading...')
      return
    }

    if (error) {
      console.error('Error in auth callback:', error)
      setLocation('/')
      return
    }

    if (userData) {
      console.log('Auth callback - user data received:', userData)
      setRedirecting(true)
      
      // Redirect directly to dashboard (onboarding disabled temporarily)
      console.log('Redirecting to dashboard...')
      setLocation('/organization/dashboard')
    }
  }, [initialized, authUser, userData, isLoading, error, setLocation, redirecting])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Finalizando autenticación...</p>
      </div>
    </div>
  )
}