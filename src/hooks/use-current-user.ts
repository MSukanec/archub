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

      // Usar consultas directas en lugar de RPC ya que archub_get_user no está disponible
      const [userResult, userDataResult, preferencesResult, organizationResult] = await Promise.all([
        supabase.from('users').select('*').eq('auth_id', authUser.id).single(),
        supabase.from('user_data').select('*').eq('user_id', authUser.id).maybeSingle(),
        supabase.from('user_preferences').select('*').eq('user_id', authUser.id).maybeSingle(),
        // Organización actual basada en last_organization_id
        supabase.from('user_preferences')
          .select('last_organization_id, organizations(*)')
          .eq('user_id', authUser.id)
          .maybeSingle()
      ])

      if (userResult.error) throw userResult.error
      if (userDataResult.error) throw userDataResult.error
      if (preferencesResult.error) throw preferencesResult.error

      const user = userResult.data
      const userData = userDataResult.data
      const preferences = preferencesResult.data
      
      // Si no hay preferencias, crear registro por defecto
      let finalPreferences = preferences
      if (!preferences && user) {
        const { data: newPreferences, error: createError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            theme: 'light',
            sidebar_docked: false,
            onboarding_completed: true
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating user preferences:', createError)
        } else {
          finalPreferences = newPreferences
        }
      }

      // Obtener organización actual si existe
      let organization = null
      if (finalPreferences?.last_organization_id) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', finalPreferences.last_organization_id)
          .single()
        organization = orgData
      }

      const result = {
        user,
        user_data: userData,
        preferences: finalPreferences,
        organization,
        organization_preferences: null // Por ahora null, se puede agregar después
      }

      console.log('User data received:', result)
      return result as UserData
    },
    enabled: !!authUser && !!supabase,
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}