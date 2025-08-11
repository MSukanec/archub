import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'

interface UserData {
  user: {
    id: string
    auth_id: string
    email: string
    full_name: string
    avatar_url: string
    avatar_source: string
    created_at: string
    [key: string]: any
  }
  user_data: {
    first_name: string
    last_name: string
    country: string
    birthdate: string
    [key: string]: any
  } | null
  preferences: {
    theme: string
    sidebar_docked: boolean
    last_organization_id: string
    last_project_id: string
    last_budget_id: string
    onboarding_completed: boolean
    [key: string]: any
  } | null
  organization: {
    id: string
    name: string
    logo_url: string
    is_active: boolean
    is_system: boolean
    created_at: string
    plan: {
      id: string
      name: string
      features: Record<string, any>
      price: number
      [key: string]: any
    } | null
    [key: string]: any
  } | null
  organization_preferences: {
    default_currency_id: string
    default_wallet_id: string
    pdf_template: string
    [key: string]: any
  } | null
  plan: {
    id: string
    name: string
    features: Record<string, any>
    price: number
    [key: string]: any
  } | null
  role: {
    id: string
    name: string
    permissions: {
      id: string
      key: string
      description: string
      category: string
    }[]
    [key: string]: any
  } | null
  organizations: {
    id: string
    name: string
    is_active: boolean
    is_system: boolean
    plan: {
      id: string
      name: string
      features: Record<string, any>
      price: number
      [key: string]: any
    } | null
    [key: string]: any
  }[] | null
  memberships: {
    organization_id: string
    organization_name: string
    is_active: boolean
    joined_at: string
    last_active_at: string
    role: {
      id: string
      name: string
    }
    [key: string]: any
  }[] | null
}

export function useCurrentUser(forceRefresh?: boolean) {
  const { user: authUser } = useAuthStore()

  return useQuery<UserData>({
    queryKey: ['current-user'],
    queryFn: async () => {
      if (!authUser) {
        throw new Error('User not authenticated')
      }

      // Get the session token to send to the server
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        throw new Error(`Session error: ${sessionError.message}`)
      }
      
      let token = sessionData?.session?.access_token
      
      if (!token || !sessionData?.session) {
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError || !refreshData?.session?.access_token) {
          throw new Error('No valid authentication token available')
        }
        token = refreshData.session.access_token
      }

      // Add refresh parameter if forced refresh is requested
      const url = forceRefresh ? '/api/current-user?refresh=true' : '/api/current-user'

      // Use the server endpoint instead of Supabase directly
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const userData = await response.json()
      
      if (!userData) {
        throw new Error('No user data returned')
      }

      return userData as UserData
    },
    enabled: !!authUser,
    retry: 3,
    staleTime: forceRefresh ? 0 : 5 * 60 * 1000, // No cache when force refresh
  })
}