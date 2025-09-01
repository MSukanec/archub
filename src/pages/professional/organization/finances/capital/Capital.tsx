import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TrendingUp } from 'lucide-react'

import { Layout } from '@/components/layout/desktop/Layout'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { useCurrentUser } from '@/hooks/use-current-user'
import { supabase } from '@/lib/supabase'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useToast } from '@/hooks/use-toast'

import CapitalDashboard from './CapitalDashboard'
import CapitalDetail from './CapitalDetail'
import CapitalHistory from './CapitalHistory'

interface CapitalMovement {
  id: string
  movement_date: string
  amount: number
  description: string
  member_id: string
  currency_id: string
  wallet_id: string
  project_id: string
  created_by: string
  category_id: string
  subcategory_id?: string
  type_id: string
  exchange_rate?: number
  member?: {
    id: string
    user?: {
      full_name: string
      email: string
    }
  }
  currency_name?: string
  currency_code?: string
  currency_symbol?: string
  wallet_name?: string
  category_name?: string
  subcategory_name?: string
  type_name?: string
}

interface MemberSummary {
  member_id: string
  member?: {
    id: string
    user_id: string
    user: {
      id: string
      full_name: string
      email: string
    }
  }
  currencies: { [key: string]: { amount: number; currency: any } }
  dollarizedTotal: number
  totalAportes: number
  totalRetiros: number
  saldo: number
}

export default function FinancesCapitalMovements() {
  const [searchValue, setSearchValue] = useState("")
  const [activeTab, setActiveTab] = useState("members")
  
  const { data: userData } = useCurrentUser()
  const { openModal } = useGlobalModalStore()

  const queryClient = useQueryClient()
  const { toast } = useToast()

  const organizationId = userData?.organization?.id
  const projectId = userData?.preferences?.last_project_id

  // Get all movement concepts to find aportes and retiros propios
  const { data: concepts = [] } = useQuery({
    queryKey: ['movement-concepts', organizationId],
    queryFn: async () => {
      if (!supabase || !organizationId) return []
      
      const { data, error } = await supabase
        .from('movement_concepts')
        .select('*')
        .or(`organization_id.eq.${organizationId},organization_id.is.null`)
        
      if (error) throw error
      
      console.log('Available movement concepts:', data)
      return data || []
    },
    enabled: !!organizationId && !!supabase
  })

  // Partner capital concept UUIDs (hardcoded for reliability)
  const APORTES_SOCIOS_UUID = 'a0429ca8-f4b9-4b91-84a2-b6603452f7fb'
  const RETIROS_SOCIOS_UUID = 'c04a82f8-6fd8-439d-81f7-325c63905a1b'
  
  // Find concepts for partner contributions and withdrawals by IDs
  const aportesPropriosConcept = concepts.find(c => c.id === APORTES_SOCIOS_UUID)
  const retirosPropriosConcept = concepts.find(c => c.id === RETIROS_SOCIOS_UUID)

  // Also find old concepts by name for backward compatibility
  const aportesPropriosOld = concepts.find(c => 
    c.name === 'Aportes Propios'
  )
  
  const retirosPropriosOld = concepts.find(c => 
    c.name === 'Retiros Propios'
  )

  // Concepts found successfully

  // Debug: Test basic query first
  const { data: allMovements = [] } = useQuery({
    queryKey: ['debug-all-movements', organizationId],
    queryFn: async () => {
      if (!supabase || !organizationId) return []
      
      const { data, error } = await supabase
        .from('movements_view')
        .select('*')
        .eq('organization_id', organizationId)
        .limit(10)
        
      if (error) {
        console.error('Error fetching any movements:', error)
        return []
      }
      
      console.log('🐛 DEBUG: Found any movements:', data?.length || 0)
      if (data && data.length > 0) {
        console.log('🐛 DEBUG: Sample movement:', {
          id: data[0].id,
          description: data[0].description,
          subcategory_name: data[0].subcategory_name,
          category_name: data[0].category_name
        })
        console.log('🐛 DEBUG: All subcategory names:', [...new Set(data.map(m => m.subcategory_name).filter(Boolean))])
      }
      
      return data || []
    },
    enabled: !!organizationId && !!supabase
  })

  // Get capital movements (aportes and retiros de socios)
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['capital-movements', organizationId, allMovements.length],
    queryFn: async () => {
      if (!supabase || !organizationId) return []

      console.log('🔍 Starting capital movements search...')

      // Build subcategory IDs array for new structure
      const subcategoryIds = []
      if (aportesPropriosConcept?.id) subcategoryIds.push(aportesPropriosConcept.id)
      if (retirosPropriosConcept?.id) subcategoryIds.push(retirosPropriosConcept.id)
      
      // Build category names array for old structure  
      const categoryNames = []
      if (aportesPropriosOld?.name) categoryNames.push(aportesPropriosOld.name)
      if (retirosPropriosOld?.name) categoryNames.push(retirosPropriosOld.name)

      // Search ONLY for partner capital movements by specific UUIDs
      const partnerSubcategoryIds = [
        'c04a82f8-6fd8-439d-81f7-325c63905a1b', // Retiros de Socios
        'a0429ca8-f4b9-4b91-84a2-b6603452f7fb'  // Aportes de Socios  
      ]
      
      console.log('🔍 Searching for partner movements with specific UUIDs:', partnerSubcategoryIds)
      
      const { data: partnerMovements, error } = await supabase
        .from('movements_view')
        .select('*')
        .eq('organization_id', organizationId)
        .in('subcategory_id', partnerSubcategoryIds)
        .order('movement_date', { ascending: false })

      if (error) {
        console.error('Error fetching partner movements:', error)
        return []
      }
      
      console.log('🔍 Found partner movements by UUID:', partnerMovements?.length || 0)
      if (partnerMovements && partnerMovements.length > 0) {
        console.log('🔍 Sample partner movement:', {
          id: partnerMovements[0].id,
          description: partnerMovements[0].description,
          subcategory_name: partnerMovements[0].subcategory_name,
          subcategory_id: partnerMovements[0].subcategory_id,
          amount: partnerMovements[0].amount
        })
      }
      
      const capitalMovements = partnerMovements || []

      console.log('🔍 Total partner movements found:', capitalMovements.length)
      return capitalMovements
    },
    enabled: !!organizationId && !!supabase && allMovements.length >= 0
  })

  // Get all currencies for display
  const { data: allCurrencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      if (!supabase) return []
      
      const { data, error } = await supabase
        .from('currencies')
        .select('id, name, code, symbol')
        .order('code')

      if (error) throw error
      return data || []
    },
    enabled: !!supabase
  })

  // Get all movement partners to match partner data with movements
  const { data: allMovementPartners = [] } = useQuery({
    queryKey: ['all-movement-partners-for-capital', organizationId],
    queryFn: async () => {
      if (!supabase || !organizationId) return []

      // Get all movement partners for movements in this organization
      const movementIds = movements.map(m => m.id)
      if (movementIds.length === 0) return []

      const { data, error } = await supabase
        .from('movement_partners')
        .select(`
          id,
          movement_id,
          partner_id,
          partners:partners(
            id,
            contacts:contacts(
              id,
              first_name,
              last_name,
              company_name,
              email
            )
          )
        `)
        .in('movement_id', movementIds)

      if (error) {
        console.error('Error fetching movement partners:', error)
        throw error
      }

      return data || []
    },
    enabled: !!supabase && !!organizationId && movements.length > 0
  })

  // Get organization members
  const { data: members = [] } = useQuery({
    queryKey: ['organization-members', organizationId],
    queryFn: async () => {
      if (!supabase || !organizationId) return []
      
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          user:users(
            id,
            full_name,
            email
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)

      if (error) throw error
      return data || []
    },
    enabled: !!organizationId && !!supabase
  })

  // Calculate member summary
  const { memberSummary, availableCurrencies } = React.useMemo(() => {
    const currenciesSet = new Set<string>()
    
    // Track currencies from movements
    movements.forEach(movement => {
      if (movement.currency_code) {
        currenciesSet.add(movement.currency_code)
      }
    })

    const summaryMap = new Map()
    
    // First, process regular members (for retiros and old aportes)
    members.forEach(member => {
      let dollarizedTotal = 0
      let totalAportes = 0
      let totalRetiros = 0
      
      const memberMovements = movements.filter(movement => {
        // Exclude movements that use the partner system
        const usesPartnerSystem = (movement.subcategory_id === APORTES_SOCIOS_UUID || 
                                 movement.subcategory_id === RETIROS_SOCIOS_UUID) &&
                                 movement.member_id === null
        
        return movement.member_id === member.id && !usesPartnerSystem
      })
      
      memberMovements.forEach(movement => {
        const amount = movement.amount || 0
        const currencyCode = movement.currency_code || 'N/A'
        
        // Check for partner aportes by UUID
        const isAporte = movement.subcategory_id === APORTES_SOCIOS_UUID
        
        if (isAporte) {
          totalAportes += amount
        } else {
          totalRetiros += amount
        }

        if (currencyCode === 'USD') {
          dollarizedTotal += isAporte ? amount : -amount
        } else if (currencyCode === 'ARS' && movement.exchange_rate) {
          const convertedAmount = amount / movement.exchange_rate
          dollarizedTotal += isAporte ? convertedAmount : -convertedAmount
        }
      })
      
      // Group movements by currency
      const currencies: { [key: string]: { amount: number; currency: any } } = {}
      memberMovements.forEach(movement => {
        const currencyCode = movement.currency_code || 'N/A'
        
        // Check for partner aportes by UUID
        const isAporte = movement.subcategory_id === APORTES_SOCIOS_UUID
        
        if (!currencies[currencyCode]) {
          currencies[currencyCode] = {
            amount: 0,
            currency: {
              code: movement.currency_code,
              symbol: movement.currency_symbol,
              name: movement.currency_name
            }
          }
        }
        
        // Add for aportes, subtract for retiros
        currencies[currencyCode].amount += isAporte ? (movement.amount || 0) : -(movement.amount || 0)
      })
      
      const saldo = totalAportes - totalRetiros
      
      summaryMap.set(member.id, {
        member_id: member.id,
        member,
        currencies,
        dollarizedTotal,
        totalAportes,
        totalRetiros,
        saldo
      })
    })

    // Now process movement partners (for aportes that use partner system)
    allMovementPartners.forEach(partnerData => {
      const movement = movements.find(m => m.id === partnerData.movement_id)
      if (!movement || !partnerData.partners?.contacts) return

      // Only process if this is an aporte or retiro movement (by UUID)
      const isAporteMovement = movement.subcategory_id === APORTES_SOCIOS_UUID
      const isRetiroMovement = movement.subcategory_id === RETIROS_SOCIOS_UUID
      if (!isAporteMovement && !isRetiroMovement) return

      const contact = partnerData.partners.contacts

      if (!contact) return

      const partnerName = contact.company_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
      const partnerId = partnerData.partner_id

      // Create a fake member object for partners
      const partnerAsMember = {
        id: partnerId,
        user_id: partnerId,
        user: [{
          id: partnerId,
          full_name: partnerName,
          email: contact.email || ''
        }]
      }

      let existing = summaryMap.get(partnerId) || {
        member_id: partnerId,
        member: partnerAsMember,
        currencies: {},
        dollarizedTotal: 0,
        totalAportes: 0,
        totalRetiros: 0,
        saldo: 0
      }

      const amount = movement.amount || 0
      const currencyCode = movement.currency_code || 'N/A'

      // Check if it's aporte or retiro and update accordingly
      if (isAporteMovement) {
        existing.totalAportes += amount
      } else if (isRetiroMovement) {
        existing.totalRetiros += amount
      }

      if (currencyCode === 'USD') {
        existing.dollarizedTotal += isAporteMovement ? amount : -amount
      } else if (currencyCode === 'ARS' && movement.exchange_rate) {
        const convertedAmount = amount / movement.exchange_rate
        existing.dollarizedTotal += isAporteMovement ? convertedAmount : -convertedAmount
      }

      // Add to currencies
      if (!existing.currencies[currencyCode]) {
        existing.currencies[currencyCode] = {
          amount: 0,
          currency: {
            code: movement.currency_code,
            symbol: movement.currency_symbol,
            name: movement.currency_name
          }
        }
      }
      existing.currencies[currencyCode].amount += isAporteMovement ? amount : -amount

      existing.saldo = existing.totalAportes - existing.totalRetiros

      summaryMap.set(partnerId, existing)
    })

    // Convert to array and filter
    const summary = Array.from(summaryMap.values())

    return {
      memberSummary: summary.filter(s => Object.keys(s.currencies).length > 0),
      availableCurrencies: Array.from(currenciesSet).sort()
    }
  }, [movements, members, allMovementPartners])

  // Filter movements based on search
  const filteredMovements = movements.filter(movement => {
    if (!searchValue) return true
    
    const searchLower = searchValue.toLowerCase()
    const memberName = movement.member?.user?.full_name?.toLowerCase() || ''
    const description = movement.description?.toLowerCase() || ''
    const categoryName = movement.category_name?.toLowerCase() || ''
    
    return memberName.includes(searchLower) || 
           description.includes(searchLower) ||
           categoryName.includes(searchLower)
  })

  const handleAddAportePpropio = () => {
    openModal('movement', { 
      movementType: 'aportes_propios',
      editingMovement: null 
    })
  }

  const handleAddRetiroPpropio = () => {
    openModal('movement', { 
      movementType: 'retiros_propios',
      editingMovement: null 
    })
  }

  const handleEdit = (movement: CapitalMovement) => {
    // Check both new structure (subcategory_id) and old structure (category_id)
    const isAporte = movement.subcategory_id === APORTES_SOCIOS_UUID
    const movementType = isAporte ? 'aportes_propios' : 'retiros_propios'
    openModal('movement', { 
      movementType,
      editingMovement: movement 
    })
  }

  const deleteMutation = useMutation({
    mutationFn: async (movementId: string) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { error } = await supabase
        .from('movements')
        .delete()
        .eq('id', movementId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-movements'] })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.invalidateQueries({ queryKey: ['installments'] })
      toast({
        title: 'Movimiento eliminado',
        description: 'El movimiento de capital ha sido eliminado correctamente',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Error al eliminar el movimiento: ${error.message}`,
      })
    }
  })

  const handleDelete = (movement: CapitalMovement) => {
    openModal('delete-confirmation', {
      title: 'Eliminar Movimiento',
      message: `¿Estás seguro de que deseas eliminar este ${movement.category_name?.toLowerCase() || 'movimiento'}?`,
      onConfirm: () => deleteMutation.mutate(movement.id)
    })
  }

  // Create tabs for the header
  const headerTabs = [
    {
      id: "members",
      label: "Resumen por Socio",
      isActive: activeTab === "members"
    },
    {
      id: "currencies",
      label: "Detalle por Moneda", 
      isActive: activeTab === "currencies"
    },
    {
      id: "details",
      label: "Detalle de Aportes/Retiros",
      isActive: activeTab === "details"
    }
  ]

  const headerProps = {
    title: "Movimientos de Capital",
    tabs: headerTabs,
    onTabChange: setActiveTab,
    actionButton: {
      label: "Nuevo Aporte",
      onClick: handleAddAportePpropio,
      dropdown: [
        {
          label: "Aporte Propio",
          onClick: handleAddAportePpropio
        },
        {
          label: "Retiro Propio", 
          onClick: handleAddRetiroPpropio
        }
      ]
    }
  }

  if (isLoading) {
    return (
      <Layout headerProps={headerProps} wide={true}>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">Cargando movimientos de capital...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps} wide={true}>
      {/* Conditional Content - EmptyState or Tabs */}
      {movements.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="h-8 w-8" />}
          title="Aún no hay movimientos de capital registrados"
          description="Esta sección muestra los aportes y retiros de capital de los socios del proyecto."
        />
      ) : (
        <div className="space-y-4">
          {activeTab === "members" && (
            <CapitalDashboard 
              memberSummary={memberSummary}
              isLoading={isLoading}
            />
          )}

          {activeTab === "currencies" && (
            <CapitalDetail 
              memberSummary={memberSummary}
              availableCurrencies={availableCurrencies}
              isLoading={isLoading}
            />
          )}

          {activeTab === "details" && (
            <CapitalHistory 
              movements={movements}
              filteredMovements={filteredMovements}
              members={members}
              allMovementPartners={allMovementPartners}
              aportesPropriosConcept={aportesPropriosConcept}
              retirosPropriosConcept={retirosPropriosConcept}
              aportesPropriosOld={aportesPropriosOld}
              retirosPropriosOld={retirosPropriosOld}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isLoading={isLoading}
            />
          )}
        </div>
      )}
    </Layout>
  )
}