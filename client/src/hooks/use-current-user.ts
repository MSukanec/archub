import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

interface UserData {
  user: {
    id: string
    email: string
    first_name: string
    last_name: string
    full_name: string
    avatar_url: string
    created_at: string
    updated_at: string
    [key: string]: any
  }
  user_data: {
    id: string
    user_id: string
    country: string
    birthdate: string
    created_at: string
    updated_at: string
    [key: string]: any
  } | null
  preferences: {
    id: string
    user_id: string
    theme: string
    sidebar_docked: boolean
    last_organization_id: string
    [key: string]: any
  } | null
  organization: {
    id: string
    name: string
    created_at: string
    is_active: boolean
    is_system: boolean
    created_by: string
    updated_at: string
    [key: string]: any
  } | null
  organization_preferences: {
    id: string
    organization_id: string
    default_currency: string
    default_wallet: string
    pdf_template: string
    [key: string]: any
  } | null
  role: {
    id: string
    name: string
    permissions: string[]
    [key: string]: any
  } | null
  plan: {
    id: string
    name: string
    features: string[]
    max_users: number
    price: number
    [key: string]: any
  } | null
}

export function useCurrentUser() {
  const { user: authUser } = useAuthStore()

  return useQuery<UserData>({
    queryKey: ['current-user', authUser?.id],
    queryFn: async () => {
      if (!supabase || !authUser) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase.rpc('archub_get_user')
      
      if (error) {
        throw error
      }
      
      if (!data) {
        throw new Error('No user data returned')
      }

      return data as UserData
    },
    enabled: !!authUser && !!supabase,
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}