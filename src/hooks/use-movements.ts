import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// NOTE: For activity logging integration, import logActivity from '@/utils/logActivity'
// and add logging calls in mutation onSuccess handlers as needed

interface Movement {
  id: string
  description: string
  amount: number
  exchange_rate?: number
  created_at: string
  movement_date: string
  created_by: string
  organization_id: string
  project_id: string
  type_id: string
  category_id: string
  subcategory_id?: string
  currency_id: string
  wallet_id: string
  member_id?: string
  contact_id?: string
  is_favorite?: boolean
  conversion_group_id?: string
  transfer_group_id?: string
  movement_data?: {
    type?: {
      id: string
      name: string
    }
    category?: {
      id: string
      name: string
    }
    subcategory?: {
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
      if (!organizationId) return []

      console.log('Fetching movements for organization:', organizationId, 'project:', projectId)
      console.log('Project filter active:', !!projectId)

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      // First, get basic movements data using the movements view with the new columns
      let query = supabase
        .from('movements_view')
        .select(`
          id,
          description,
          amount,
          exchange_rate,
          created_at,
          movement_date,
          created_by,
          organization_id,
          project_id,
          type_id,
          category_id,
          subcategory_id,
          currency_id,
          wallet_id,
          is_conversion,
          is_favorite,
          conversion_group_id,
          transfer_group_id,
          client,
          partner,
          subcontract
        `)
        .eq('organization_id', organizationId)
        .order('movement_date', { ascending: false })
        .order('created_at', { ascending: false });

      // If project is specified, filter by project
      // Only filter by project if projectId is explicitly provided and not null
      if (projectId && projectId !== 'null') {
        console.log('Filtering by project_id:', projectId);
        query = query.eq('project_id', projectId);
      } else {
        console.log('Not filtering by project - showing all movements for organization');
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching movements from movements_view:', error)
        console.error('❌ Error details:', error.message, error.details, error.hint)
        return []
      }

      if (!data || data.length === 0) {
        console.log('No movements found for organization:', organizationId)
        return []
      }

      console.log('Found movements:', data.length)
      if (data.length > 0) {
        console.log('Sample movement data:', {
          project_id: data[0]?.project_id,
          organization_id: data[0]?.organization_id,
          description: data[0]?.description
        })
        console.log('Expected organization_id:', organizationId)
        console.log('Expected project_id:', projectId)
      }

      // Get related data in parallel
      const [membersResult, typesResult, categoriesResult, subcategoriesResult, currenciesResult, walletsResult, partnersResult, subcontractsResult, clientsResult] = await Promise.all([
        // Get creators data
        supabase
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
          .in('id', Array.from(new Set(data.map(m => m.created_by).filter(Boolean)))),
        
        // Get movement types
        supabase
          .from('movement_concepts')
          .select('id, name')
          .in('id', Array.from(new Set(data.map(m => m.type_id).filter(Boolean)))),
        
        // Get movement categories
        supabase
          .from('movement_concepts')
          .select('id, name')
          .in('id', Array.from(new Set(data.map(m => m.category_id).filter(Boolean)))),
        
        // Get movement subcategories
        supabase
          .from('movement_concepts')
          .select('id, name')
          .in('id', Array.from(new Set(data.map(m => m.subcategory_id).filter(Boolean)))),
        
        // Get currencies
        supabase
          .from('currencies')
          .select('id, name, code, symbol')
          .in('id', Array.from(new Set(data.map(m => m.currency_id).filter(Boolean)))),
        
        // Get wallets through organization_wallets
        supabase
          .from('organization_wallets')
          .select(`
            id,
            wallets (
              id,
              name
            )
          `)
          .in('id', Array.from(new Set(data.map(m => m.wallet_id).filter(Boolean)))),
        
        // Get movement partners (simplified approach)
        supabase
          .from('movement_partner_contributions')
          .select('*')
          .in('movement_id', data.map(m => m.id)),
        
        // Get movement subcontracts
        supabase
          .from('movement_subcontracts')
          .select('*')
          .in('movement_id', data.map(m => m.id)),
        
        // Get movement clients
        supabase
          .from('movement_clients')
          .select('*')
          .in('movement_id', data.map(m => m.id))
      ]);

      // Create lookup maps
      const membersMap = new Map();
      membersResult.data?.forEach(member => {
        if (member.users) {
          membersMap.set(member.id, {
            id: member.users.id,
            full_name: member.users.full_name,
            email: member.users.email,
            avatar_url: member.users.avatar_url
          });
        }
      });

      const typesMap = new Map();
      typesResult.data?.forEach(type => {
        typesMap.set(type.id, type);
      });

      const categoriesMap = new Map();
      categoriesResult.data?.forEach(category => {
        categoriesMap.set(category.id, category);
      });

      const subcategoriesMap = new Map();
      subcategoriesResult.data?.forEach(subcategory => {
        subcategoriesMap.set(subcategory.id, subcategory);
      });

      const currenciesMap = new Map();
      currenciesResult.data?.forEach(currency => {
        currenciesMap.set(currency.id, currency);
      });

      const walletsMap = new Map();
      walletsResult.data?.forEach(orgWallet => {
        if (orgWallet.wallets) {
          walletsMap.set(orgWallet.id, {
            id: orgWallet.wallets.id,
            name: orgWallet.wallets.name
          });
        }
      });

      // Create simplified maps for basic tracking
      const partnersMap = new Map();
      partnersResult.data?.forEach(partnerMovement => {
        const movementId = partnerMovement.movement_id;
        if (!partnersMap.has(movementId)) {
          partnersMap.set(movementId, []);
        }
        partnersMap.get(movementId).push({
          partner_id: partnerMovement.partner_id,
          partner_name: 'Socio' // Simple fallback for now
        });
      });

      const subcontractsMap = new Map();
      subcontractsResult.data?.forEach(subcontractMovement => {
        const movementId = subcontractMovement.movement_id;
        if (!subcontractsMap.has(movementId)) {
          subcontractsMap.set(movementId, []);
        }
        subcontractsMap.get(movementId).push({
          subcontract_id: subcontractMovement.subcontract_id,
          contact_name: 'Subcontratista' // Simple fallback for now
        });
      });

      const clientsMap = new Map();
      clientsResult.data?.forEach(clientMovement => {
        const movementId = clientMovement.movement_id;
        if (!clientsMap.has(movementId)) {
          clientsMap.set(movementId, []);
        }
        clientsMap.get(movementId).push({
          project_client_id: clientMovement.project_client_id,
          client_name: 'Cliente' // Simple fallback for now
        });
      });

      // Transform the data with related information
      const transformedData = data.map((movement) => {
        const creator = membersMap.get(movement.created_by);
        const type = typesMap.get(movement.type_id);
        const category = categoriesMap.get(movement.category_id);
        const subcategory = subcategoriesMap.get(movement.subcategory_id);
        const currency = currenciesMap.get(movement.currency_id);
        const wallet = walletsMap.get(movement.wallet_id);

        return {
          ...movement,
          exchange_rate: movement.exchange_rate, // Ensure exchange_rate is preserved
          creator,
          partners: partnersMap.get(movement.id) || [],
          subcontracts: subcontractsMap.get(movement.id) || [],
          clients: clientsMap.get(movement.id) || [],
          movement_data: {
            type,
            category,
            subcategory,
            currency,
            wallet
          }
        }
      });

      console.log('Transformed movements:', transformedData.length);
      return transformedData as Movement[];
    },
    enabled: !!organizationId
  })
}

export function useToggleMovementFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ movementId, isFavorite }: { movementId: string, isFavorite: boolean }) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { error } = await supabase
        .from('movements')
        .update({ is_favorite: isFavorite })
        .eq('id', movementId)

      if (error) {
        throw error
      }

      return { movementId, isFavorite }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.invalidateQueries({ queryKey: ['installments'] })
    }
  })
}