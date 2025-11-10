import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/use-current-user'

export function useSearchUsers(query: string) {
  const { data: userData } = useCurrentUser()

  return useQuery({
    queryKey: ['searchUsers', query, userData?.organization?.id],
    queryFn: async () => {
      if (!supabase || !userData?.organization?.id || !query || query.length < 3) {
        return []
      }

      // Determinar si la consulta parece un email completo
      const isEmailQuery = query.includes('@') && query.includes('.')
      let searchCondition = ''

      if (isEmailQuery) {
        // Para emails, buscar coincidencia exacta
        searchCondition = `email.eq.${query}`
      } else {
        // Para nombres, permitir búsqueda parcial
        searchCondition = `full_name.ilike.%${query}%`
      }

      // Search users by name or email, excluding current user
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          avatar_url,
          organization_members!inner(
            organization_id,
            organizations(
              id,
              name
            )
          )
        `)
        .or(searchCondition)
        .neq('id', userData.id)
        .limit(10)

      if (error) {
        throw error
      }

      return data || []
    },
    enabled: !!supabase && !!userData?.organization?.id && !!query && query.length >= 3,
  })
}