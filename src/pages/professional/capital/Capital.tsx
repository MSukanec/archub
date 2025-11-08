import React, { useState, useMemo } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { TrendingUp, Plus } from 'lucide-react'

import { Layout } from '@/components/layout/desktop/Layout'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useMovements } from '@/hooks/use-movements'
import { supabase } from '@/lib/supabase'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useToast } from '@/hooks/use-toast'

import { CapitalDashboard } from './CapitalDashboard'
import { CapitalHistory } from './CapitalHistory'
import DashboardTab from './DashboardTab'

interface CapitalMovement {
  id: string
  movement_date: string
  amount: number
  description: string
  member_id?: string
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
  partner?: string
}

export default function FinancesCapitalMovements() {
  const [searchValue, setSearchValue] = useState("")
  const [activeTab, setActiveTab] = useState("dashboard")
  
  const { data: userData } = useCurrentUser()
  const { openModal } = useGlobalModalStore()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const organizationId = userData?.organization?.id

  // Get all movements for the organization
  const { data: allMovements = [], isLoading } = useMovements(organizationId, undefined)

  // Get movement concepts to identify capital movements
  const { data: concepts = [] } = useQuery({
    queryKey: ['movement-concepts', organizationId],
    queryFn: async () => {
      if (!supabase || !organizationId) return []
      
      const { data, error } = await supabase
        .from('movement_concepts')
        .select('*')
        .or(`organization_id.eq.${organizationId},organization_id.is.null`)
        
      if (error) throw error
      return data || []
    },
    enabled: !!organizationId && !!supabase
  })

  // Find concepts for partner contributions and withdrawals
  const aportesPropriosConcept = concepts.find(c => 
    c.id === 'a0429ca8-f4b9-4b91-84a2-b6603452f7fb'
  )
  
  const retirosPropriosConcept = concepts.find(c => 
    c.id === 'c04a82f8-6fd8-439d-81f7-325c63905a1b'
  )

  // Also find old concepts by name for backward compatibility
  const aportesPropriosOld = concepts.find(c => 
    c.name === 'Aportes Propios'
  )
  
  const retirosPropriosOld = concepts.find(c => 
    c.name === 'Retiros Propios'
  )

  // Filter movements to only include capital movements
  const movements = useMemo(() => {
    return allMovements.filter(movement => {
      // Check both new structure (subcategory_id) and old structure (category_id)
      const isAporte = movement.subcategory_id === aportesPropriosConcept?.id || 
                       movement.category_id === aportesPropriosOld?.id
      const isRetiro = movement.subcategory_id === retirosPropriosConcept?.id ||
                       movement.category_id === retirosPropriosOld?.id
      
      return isAporte || isRetiro
    })
  }, [allMovements, aportesPropriosConcept, retirosPropriosConcept, aportesPropriosOld, retirosPropriosOld])

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

  // Calculate member summary using partner column from movements_view
  const { memberSummary, availableCurrencies } = useMemo(() => {
    const currenciesSet = new Set<string>()
    
    // Track currencies from movements
    movements.forEach(movement => {
      if (movement.currency_code) {
        currenciesSet.add(movement.currency_code)
      }
    })

    const summaryMap = new Map()
    
    // Process movements and group by partner or member
    movements.forEach(movement => {
      let partnerId = null
      let partnerName = null
      let partnerEmail = ''

      // Use partner column from movements_view if available
      if (movement.partner) {
        partnerName = movement.partner
        partnerId = `partner_${movement.id}` // Create a unique ID for grouping
        partnerEmail = ''
      } else if (movement.member) {
        // Use member data if no partner
        partnerName = movement.member
        partnerId = movement.created_by || `member_${movement.id}`
        partnerEmail = ''
      } else {
        // Fallback to "Sin Nombre" if no partner or member info
        partnerName = 'Sin Nombre'
        partnerId = `unknown_${movement.id}`
        partnerEmail = ''
      }

      // Create a unique key for grouping (using partner name for now)
      const groupKey = partnerName

      let existing = summaryMap.get(groupKey) || {
        member_id: partnerId,
        member: {
          id: partnerId,
          user_id: partnerId,
          user: {
            id: partnerId,
            full_name: partnerName,
            email: partnerEmail
          }
        },
        currencies: {},
        dollarizedTotal: 0,
        totalAportes: 0,
        totalRetiros: 0,
        saldo: 0
      }

      const amount = movement.amount || 0
      const currencyCode = movement.currency_code || 'N/A'

      // Check if it's aporte or retiro
      const isAporte = movement.subcategory_id === aportesPropriosConcept?.id || 
                       movement.category_id === aportesPropriosOld?.id
      
      if (isAporte) {
        existing.totalAportes += amount
      } else {
        existing.totalRetiros += amount
      }

      if (currencyCode === 'USD') {
        existing.dollarizedTotal += isAporte ? amount : -amount
      } else if (currencyCode === 'ARS' && movement.exchange_rate) {
        const convertedAmount = amount / movement.exchange_rate
        existing.dollarizedTotal += isAporte ? convertedAmount : -convertedAmount
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
      existing.currencies[currencyCode].amount += isAporte ? amount : -amount

      existing.saldo = existing.totalAportes - existing.totalRetiros

      summaryMap.set(groupKey, existing)
    })

    // Convert to array and filter
    const summary = Array.from(summaryMap.values())

    return {
      memberSummary: summary.filter(s => Object.keys(s.currencies).length > 0),
      availableCurrencies: Array.from(currenciesSet).sort()
    }
  }, [movements, aportesPropriosConcept, retirosPropriosConcept, aportesPropriosOld, retirosPropriosOld])

  // For compatibility with existing components
  const allMovementPartners: any[] = []

  const handleNewMovement = () => {
    openModal('movement', {})
  }

  const handleEdit = (movement: CapitalMovement) => {
    // Check both new structure (subcategory_id) and old structure (category_id)
    const isAporte = movement.subcategory_id === aportesPropriosConcept?.id || 
                     movement.category_id === aportesPropriosOld?.id
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
      id: "dashboard",
      label: "Resumen Financiero",
      isActive: activeTab === "dashboard"
    },
    {
      id: "members",
      label: "Resumen por Socio",
      isActive: activeTab === "members"
    },
    {
      id: "details",
      label: "Detalle de Aportes/Retiros",
      isActive: activeTab === "details"
    }
  ]

  const headerProps = {
    title: "Capital",
    description: "Gestiona aportes y retiros de capital de los socios de tu organización.",
    icon: TrendingUp,
    organizationId,
    showMembers: true,
    tabs: headerTabs,
    onTabChange: setActiveTab,
    actions: movements.length > 0 ? [
      <Button
        key="new-movement"
        variant="default"
        size="sm"
        onClick={handleNewMovement}
        className="h-8 px-3 text-xs font-normal"
        data-testid="button-new-movement"
      >
        <Plus className="w-4 h-4 mr-1" />
        Nuevo Movimiento
      </Button>
    ] : []
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
        <div className="flex items-center justify-center min-h-[400px]">
          <EmptyState
            icon={<TrendingUp className="h-8 w-8" />}
            title="Aún no hay movimientos de capital registrados"
            description="Esta sección muestra los aportes y retiros de capital de los socios del proyecto."
            action={
              <Button
                onClick={handleNewMovement}
                data-testid="button-new-movement"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Movimiento
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === "dashboard" && (
            <DashboardTab />
          )}

          {activeTab === "members" && memberSummary.length > 0 && (
            <CapitalDashboard memberSummary={memberSummary} />
          )}


          {activeTab === "details" && (
            <CapitalHistory
              movements={movements as any}
              searchValue={searchValue}
              aportesPropriosConcept={aportesPropriosConcept}
              retirosPropriosConcept={retirosPropriosConcept}
              aportesPropriosOld={aportesPropriosOld}
              retirosPropriosOld={retirosPropriosOld}
              allMovementPartners={allMovementPartners}
              members={members}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      )}
    </Layout>
  )
}