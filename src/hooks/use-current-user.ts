import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

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

export function useCurrentUser() {
  const { user: authUser } = useAuthStore()

  return useQuery<UserData>({
    queryKey: ['current-user'],
    queryFn: async () => {
      if (!supabase || !authUser) {
        throw new Error('User not authenticated')
      }

      // First get the main user data from RPC
      const { data: mainData, error: rpcError } = await supabase.rpc('archub_get_user')
      
      if (rpcError) {
        throw rpcError
      }
      
      if (!mainData) {
        throw new Error('No user data returned')
      }

      // Then get the discovery fields directly from user_data table
      const { data: discoveryData, error: discoveryError } = await supabase
        .from('user_data')
        .select('discovered_by, discovered_by_other_text, main_use, main_use_other, user_role, user_role_other, team_size')
        .eq('user_id', mainData.user.id)
        .single()

      if (discoveryError && discoveryError.code !== 'PGRST116') { // PGRST116 = no rows found
      }

      // Merge the discovery data into the main user_data object
      const userData = {
        ...mainData,
        user_data: {
          ...mainData.user_data,
          ...(discoveryData || {})
        }
      }

      return userData as UserData
    },
    enabled: !!authUser && !!supabase,
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}