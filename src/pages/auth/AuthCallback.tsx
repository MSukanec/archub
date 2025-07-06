import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Loader2 } from 'lucide-react'

export default function AuthCallback() {
  const [, setLocation] = useLocation()
  const { data: userData, isLoading, error } = useCurrentUser()

  useEffect(() => {
    if (isLoading) return

    if (error) {
      console.error('Error in auth callback:', error)
      setLocation('/login')
      return
    }

    if (userData) {
      console.log('Auth callback - user data:', userData)
      
      // Check if user needs to complete onboarding
      if (!userData.preferences.onboarding_completed) {
        console.log('Redirecting to onboarding...')
        setLocation('/select-mode')
      } else {
        console.log('Redirecting to dashboard...')
        setLocation('/organization/dashboard')
      }
    }
  }, [userData, isLoading, error, setLocation])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Finalizando autenticación...</p>
        </div>
      </div>
    )
  }

  return null
}