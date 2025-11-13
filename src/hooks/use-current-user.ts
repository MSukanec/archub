import { useQuery, QueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'

async function fetchCurrentUser(forceRefresh: boolean = false): Promise<UserData | null> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError || !sessionData?.session?.access_token) {
    return null
  }
  
  const token = sessionData.session.access_token
  const url = forceRefresh ? '/api/current-user?refresh=true' : '/api/current-user'

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    return null
  }

  const userData = await response.json()
  return userData as UserData || null
}

export async function refreshCurrentUserCache(queryClient: QueryClient): Promise<void> {
  try {
    const freshUserData = await fetchCurrentUser(true)
    if (freshUserData) {
      queryClient.setQueryData(['current-user'], freshUserData)
    } else {
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
    }
  } catch (error) {
    queryClient.invalidateQueries({ queryKey: ['current-user'] })
  }
}

export interface UserData {
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
    home_checklist: {
      create_project: boolean
      create_contact: boolean
      create_movement: boolean
    }
    home_banner_dismissed: boolean
    last_home_seen_at: string
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
  const { user: authUser, loading: authLoading, logout } = useAuthStore()

  return useQuery<UserData>({
    queryKey: ['current-user'],
    queryFn: async () => {
      if (!authUser) {
        // Return null instead of throwing when not authenticated
        return null as any;
      }
      

      // Get the session token to send to the server, wrapped in try-catch
      let token = null;
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          // Silently handle auth errors, return null
          return null as any;
        }
        
        token = sessionData?.session?.access_token
        
        if (!token || !sessionData?.session) {
          // Don't try to refresh during logout process
          if (authLoading) {
            return null as any;
          }
          
          // Try to refresh the session
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
          if (refreshError || !refreshData?.session?.access_token) {
            // No valid session, return null instead of throwing
            return null as any;
          }
          token = refreshData.session.access_token
        }
      } catch (error) {
        // Silently handle any auth errors
        return null as any;
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

      // Handle user not found (deleted from database)
      if (response.status === 404) {
        // Silently handle deleted user - no console log to avoid spam
        // Force logout since user no longer exists in database
        await logout()
        return null as any;
      }

      // Silently handle 400/401 auth errors
      if (response.status === 400 || response.status === 401) {
        return null as any;
      }

      if (!response.ok) {
        // Silently handle other errors
        return null as any;
      }

      const userData = await response.json()
      
      if (!userData) {
        // No user data returned, return null silently
        return null as any;
      }

      return userData as UserData
    },
    enabled: !!authUser && !authLoading,
    // Add small delay after login to let session stabilize
    refetchInterval: false,
    retry: (failureCount, error: any) => {
      // Never retry on 400/401 auth errors
      if (error?.message?.includes('400') || error?.message?.includes('401')) {
        return false;
      }
      // Don't retry on any auth-related errors
      if (authLoading || !authUser || 
          error?.message?.toLowerCase().includes('auth') || 
          error?.message?.toLowerCase().includes('session') ||
          error?.message?.includes('logging out') || 
          error?.message?.includes('invalidated')) {
        return false;
      }
      // No retries for any errors
      return false;
    },
    staleTime: forceRefresh ? 0 : 5 * 60 * 1000, // Cache for 5 minutes to reduce calls
  })
}