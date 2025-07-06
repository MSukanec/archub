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
    is_active: boolean
    is_system: boolean
    created_at: string
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

      try {
        const { data, error } = await supabase.rpc('archub_get_user')
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Supabase RPC Error:', error)
          throw error
        }
        
        if (!data) {
          console.log('New user detected, initializing user records...')
          
          // Create user record
          const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert({
              auth_id: authUser.id,
              email: authUser.email!,
              full_name: authUser.user_metadata?.full_name || authUser.email!.split('@')[0],
              avatar_url: authUser.user_metadata?.avatar_url || '',
              avatar_source: authUser.user_metadata?.avatar_url ? 'google' : '',
            })
            .select()
            .single()

          if (userError) {
            console.error('Error creating user record:', userError)
            throw userError
          }

          // Create user_data record
          await supabase
            .from('user_data')
            .insert({
              user_id: newUser.id,
              first_name: authUser.user_metadata?.given_name || '',
              last_name: authUser.user_metadata?.family_name || '',
            })

          // Create user_preferences record
          await supabase
            .from('user_preferences')
            .insert({
              user_id: newUser.id,
              theme: 'light',
              sidebar_docked: true,
              onboarding_completed: false,
            })

          console.log('User records initialized, fetching user data...')
          
          // Fetch the complete user data after initialization
          const { data: userData, error: fetchError } = await supabase.rpc('archub_get_user')
          
          if (fetchError) throw fetchError
          
          console.log('User data received:', userData)
          return userData as UserData
        }

        console.log('User data received:', data)
        return data as UserData
      } catch (error) {
        console.error('Error in useCurrentUser:', error)
        throw error
      }
    },
    enabled: !!authUser && !!supabase,
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}