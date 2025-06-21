import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface Movement {
  id: string
  description: string
  amount: number
  created_at: string
  created_by: string
  organization_id: string
  project_id: string
  type_id: string
  category_id: string
  currency_id: string
  wallet_id: string
  movement_data?: {
    type?: {
      id: string
      name: string
    }
    category?: {
      id: string
      name: string
    }
    currency?: {
      id: string
      name: string
      code: string
    }
    wallet?: {
      id: string
      name: string
    }
  }
  creator?: {
    id: string
    full_name?: string
    email: string
    avatar_url?: string
  }
}

export function useMovements(organizationId: string | undefined, projectId: string | undefined) {
  return useQuery({
    queryKey: ['movements', organizationId, projectId],
    queryFn: async () => {
      if (!organizationId || !projectId) return []

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data, error } = await supabase
        .from('movements')
        .select(`
          id,
          description,
          amount,
          created_at,
          created_by,
          organization_id,
          project_id,
          type_id,
          category_id,
          subcategory_id,
          currency_id,
          wallet_id,
          file_url,
          related_contact_id,
          related_task_id,
          is_conversion,
          creator:organization_members!created_by (
            id,
            users (
              id,
              full_name,
              email,
              avatar_url
            )
          )
        `)
        .eq('organization_id', organizationId)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching movements:', error)
        throw error
      }

      // Get related data separately to avoid foreign key issues
      let userData: any[] = []
      let typeData: any[] = []
      let categoryData: any[] = []
      let subcategoryData: any[] = []
      let currencyData: any[] = []
      let walletData: any[] = []

      if (data && data.length > 0) {
        // Get user data through organization_members
        const memberIds = [...new Set(data.map(m => m.created_by).filter(Boolean))]
        if (memberIds.length > 0) {
          const { data: members } = await supabase
            .from('organization_members')
            .select(`
              id,
              users (
                id,
                full_name,
                email,
                avatar_url
              )
            `)
            .in('id', memberIds)
          userData = members?.map(member => ({
            id: member.id,
            ...member.users
          })) || []
        }

        // Get movement concepts
        const typeIds = [...new Set(data.map(m => m.type_id).filter(Boolean))]
        const categoryIds = [...new Set(data.map(m => m.category_id).filter(Boolean))]
        const subcategoryIds = [...new Set(data.map(m => m.subcategory_id).filter(Boolean))]
        
        if (typeIds.length > 0) {
          const { data: types } = await supabase
            .from('movement_concepts')
            .select('id, name')
            .in('id', typeIds)
          typeData = types || []
        }

        if (categoryIds.length > 0) {
          const { data: categories } = await supabase
            .from('movement_concepts')
            .select('id, name')
            .in('id', categoryIds)
          categoryData = categories || []
        }

        if (subcategoryIds.length > 0) {
          const { data: subcategories } = await supabase
            .from('movement_concepts')
            .select('id, name')
            .in('id', subcategoryIds)
          subcategoryData = subcategories || []
        }

        // Get currency and wallet data
        const currencyIds = [...new Set(data.map(m => m.currency_id).filter(Boolean))]
        const walletIds = [...new Set(data.map(m => m.wallet_id).filter(Boolean))]

        if (currencyIds.length > 0) {
          const { data: currencies } = await supabase
            .from('currencies')
            .select('id, name, code, symbol')
            .in('id', currencyIds)
          currencyData = currencies || []
        }

        if (walletIds.length > 0) {
          const { data: wallets } = await supabase
            .from('wallets')
            .select('id, name')
            .in('id', walletIds)
          walletData = wallets || []
        }
      }

      return data?.map(movement => ({
        ...movement,
        // Use the joined creator data or fallback to separate queries
        creator: movement.creator || userData.find(u => u.id === movement.created_by),
        movement_data: {
          type: typeData.find(t => t.id === movement.type_id),
          category: categoryData.find(c => c.id === movement.category_id),
          subcategory: subcategoryData.find(s => s.id === movement.subcategory_id),
          currency: currencyData.find(c => c.id === movement.currency_id),
          wallet: walletData.find(w => w.id === movement.wallet_id)
        }
      })) || []
    },
    enabled: !!organizationId && !!projectId
  })
}