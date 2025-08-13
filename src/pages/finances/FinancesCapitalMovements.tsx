import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { TrendingUp, Edit, Trash2 } from 'lucide-react'

import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui-custom/Table'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useCurrentUser } from '@/hooks/use-current-user'
import { supabase } from '@/lib/supabase'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'

import { useToast } from '@/hooks/use-toast'

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

  // Get movement concepts to identify Aportes Propios and Retiros Propios
  const { data: concepts = [] } = useQuery({
    queryKey: ['movement-concepts', organizationId],
    queryFn: async () => {
      if (!supabase || !organizationId) return []
      
      const { data, error } = await supabase
        .from('movement_concepts')
        .select('*')
        .eq('organization_id', organizationId)
        .or(`id.eq.a0429ca8-f4b9-4b91-84a2-b6603452f7fb,id.eq.c04a82f8-6fd8-439d-81f7-325c63905a1b`)
        
      if (error) throw error
      return data || []
    },
    enabled: !!organizationId && !!supabase
  })

  // Get Aportes Propios concept
  const aportesPropriosConcept = concepts.find(c => c.id === 'a0429ca8-f4b9-4b91-84a2-b6603452f7fb')
  
  // Get Retiros Propios concept  
  const retirosPropriosConcept = concepts.find(c => c.id === 'c04a82f8-6fd8-439d-81f7-325c63905a1b')

  // Get capital movements (aportes and retiros propios)
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['capital-movements', organizationId, projectId, aportesPropriosConcept?.id, retirosPropriosConcept?.id],
    queryFn: async () => {
      if (!supabase || !organizationId || !projectId || (!aportesPropriosConcept && !retirosPropriosConcept)) return []

      const categoryIds = [aportesPropriosConcept?.id, retirosPropriosConcept?.id].filter(Boolean)
      
      // Use the movement_view for simplified query with all joins
      const { data: movements, error } = await supabase
        .from('movement_view')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('project_id', projectId)
        .in('category_id', categoryIds)
        .order('movement_date', { ascending: false })

      if (error) {
        throw error
      }

      return movements || []
    },
    enabled: !!organizationId && !!projectId && !!(aportesPropriosConcept || retirosPropriosConcept)
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
          user:users!inner(
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

    // Create summary for ALL members (including those without movements)
    const summary = members.map(member => {
      // Calculate dollarized total from movements for this member
      let dollarizedTotal = 0
      let totalAportes = 0
      let totalRetiros = 0
      
      const memberMovements = movements.filter(movement => movement.member_id === member.id)
      
      memberMovements.forEach(movement => {
        const amount = movement.amount || 0
        const currencyCode = movement.currency_code || 'N/A'
        const isAporte = movement.category_id === aportesPropriosConcept?.id
        
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
        const isAporte = movement.category_id === aportesPropriosConcept?.id
        
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
      
      return {
        member_id: member.id,
        member,
        currencies,
        dollarizedTotal,
        totalAportes,
        totalRetiros,
        saldo
      }
    })

    return {
      memberSummary: summary,
      availableCurrencies: Array.from(currenciesSet)
    }
  }, [movements, members, aportesPropriosConcept, retirosPropriosConcept])

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
    openModal('NewMovementModal', { 
      movementType: 'aportes_propios',
      editingMovement: null 
    })
  }

  const handleAddRetiroPpropio = () => {
    openModal('NewMovementModal', { 
      movementType: 'retiros_propios',
      editingMovement: null 
    })
  }

  const handleEdit = (movement: CapitalMovement) => {
    const movementType = movement.category_id === aportesPropriosConcept?.id ? 'aportes_propios' : 'retiros_propios'
    openModal('NewMovementModal', { 
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
    openModal('ConfirmDeleteModal', {
      title: 'Eliminar Movimiento',
      message: `¿Estás seguro de que deseas eliminar este ${movement.category_name?.toLowerCase() || 'movimiento'}?`,
      onConfirm: () => deleteMutation.mutate(movement.id)
    })
  }

  // Member summary table columns
  const memberSummaryColumns = [
    {
      key: "member",
      label: "Socio",
      width: "25%",
      render: (item: MemberSummary) => {
        if (!item.member?.user) {
          return <div className="text-sm text-muted-foreground">Sin usuario</div>
        }

        const displayName = item.member.user.full_name || 'Sin nombre'
        const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)

        return (
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium">{displayName}</div>
              <div className="text-xs text-muted-foreground">{item.member.user.email}</div>
            </div>
          </div>
        )
      }
    },
    {
      key: "total_aportes",
      label: "Total Aportes",
      width: "18.75%",
      sortable: true,
      sortType: 'number' as const,
      render: (item: MemberSummary) => (
        <div className="text-sm font-medium text-green-600">
          ${item.totalAportes.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </div>
      )
    },
    {
      key: "total_retiros",
      label: "Total Retiros",
      width: "18.75%",
      sortable: true,
      sortType: 'number' as const,
      render: (item: MemberSummary) => (
        <div className="text-sm font-medium text-red-600">
          ${item.totalRetiros.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </div>
      )
    },
    {
      key: "saldo",
      label: "Saldo",
      width: "18.75%",
      sortable: true,
      sortType: 'number' as const,
      render: (item: MemberSummary) => {
        const isPositive = item.saldo >= 0
        return (
          <div className={`text-sm font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            ${item.saldo.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        )
      }
    },
    {
      key: "saldo_dolarizado",
      label: "Saldo Dolarizado",
      width: "18.75%",
      sortable: true,
      sortType: 'number' as const,
      render: (item: MemberSummary) => {
        const isPositive = item.dollarizedTotal >= 0
        return (
          <div className={`text-sm font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            US$ {item.dollarizedTotal.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        )
      }
    }
  ]

  // Create dynamic columns based on available currencies
  const currencyColumns = React.useMemo(() => {
    const baseColumns = [
      {
        key: "member",
        label: "Socio",
        width: "30%",
        render: (item: MemberSummary) => {
          if (!item.member?.user) {
            return <div className="text-sm text-muted-foreground">Sin usuario</div>
          }

          const displayName = item.member.user.full_name || 'Sin nombre'
          const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)

          return (
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium">{displayName}</div>
                <div className="text-xs text-muted-foreground">{item.member.user.email}</div>
              </div>
            </div>
          )
        }
      }
    ]

    // Add dynamic currency columns
    const currencyColumnsData = availableCurrencies.map(currencyCode => ({
      key: `currency_${currencyCode}`,
      label: currencyCode,
      width: `${Math.max(50 / availableCurrencies.length, 12)}%`,
      sortable: true,
      sortType: 'number' as const,
      render: (item: MemberSummary) => {
        const currencyData = item.currencies[currencyCode]
        if (!currencyData || currencyData.amount === 0) {
          return <div className="text-sm text-muted-foreground">-</div>
        }

        const isPositive = currencyData.amount >= 0
        const formattedAmount = new Intl.NumberFormat('es-AR').format(Math.abs(currencyData.amount))
        
        return (
          <div className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '' : '-'}{currencyData.currency?.symbol || currencyCode} {formattedAmount}
          </div>
        )
      }
    }))

    return [...baseColumns, ...currencyColumnsData]
  }, [availableCurrencies])

  // Detailed table columns
  const detailColumns = [
    {
      key: "movement_date",
      label: "Fecha",
      width: "14.3%",
      sortable: true,
      sortType: "date" as const,
      render: (item: CapitalMovement) => {
        const date = new Date(item.movement_date + 'T00:00:00')
        return (
          <div className="text-sm">
            {format(date, 'dd/MM/yyyy', { locale: es })}
          </div>
        )
      }
    },
    {
      key: "member",
      label: "Socio",
      width: "14.3%",
      render: (item: CapitalMovement) => {
        if (!item.member?.user?.full_name) {
          return <div className="text-sm text-muted-foreground">Sin socio</div>
        }

        const displayName = item.member.user.full_name
        const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)

        return (
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium">{displayName}</div>
            </div>
          </div>
        )
      }
    },
    {
      key: "category",
      label: "Tipo",
      width: "14.3%",
      sortable: true,
      sortType: "string" as const,
      render: (item: CapitalMovement) => {
        const isAporte = item.category_id === aportesPropriosConcept?.id
        return (
          <Badge variant={isAporte ? "default" : "secondary"} className="text-xs">
            {item.category_name || 'Sin especificar'}
          </Badge>
        )
      }
    },
    {
      key: "wallet",
      label: "Billetera",
      width: "14.3%",
      sortable: true,
      sortType: "string" as const,
      render: (item: CapitalMovement) => (
        <div className="text-sm">
          {item.wallet_name || 'Sin especificar'}
        </div>
      )
    },
    {
      key: "amount",
      label: "Monto",
      width: "14.3%",
      sortable: true,
      sortType: "number" as const,
      render: (item: CapitalMovement) => {
        const isAporte = item.category_id === aportesPropriosConcept?.id
        const formattedAmount = new Intl.NumberFormat('es-AR').format(item.amount || 0)
        
        return (
          <div className={`text-sm font-medium ${isAporte ? 'text-green-600' : 'text-red-600'}`}>
            {item.currency_symbol || '$'} {formattedAmount}
          </div>
        )
      }
    },
    {
      key: "exchange_rate",
      label: "Cotización",
      width: "14.3%",
      sortable: true,
      sortType: "number" as const,
      render: (item: CapitalMovement) => (
        <div className="text-sm">
          {item.exchange_rate ? item.exchange_rate.toFixed(4) : '-'}
        </div>
      )
    },
    {
      key: "actions",
      label: "Acciones",
      width: "14.4%",
      render: (item: CapitalMovement) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(item)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(item)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

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
          {activeTab === "members" && memberSummary.length > 0 && (
            <Table
              data={memberSummary}
              columns={memberSummaryColumns}
              defaultSort={{ key: 'member', direction: 'asc' }}
              getItemId={(item) => item.member_id || 'unknown'}
            />
          )}

          {activeTab === "currencies" && memberSummary.length > 0 && (
            <Table
              data={memberSummary}
              columns={currencyColumns}
              defaultSort={{ key: 'member', direction: 'asc' }}
              getItemId={(item) => item.member_id || 'unknown'}
            />
          )}

          {activeTab === "details" && (
            filteredMovements.length > 0 ? (
              <Table
                data={filteredMovements}
                columns={detailColumns}
                defaultSort={{ key: 'movement_date', direction: 'desc' }}
                getItemId={(item) => item.id || 'unknown'}
              />
            ) : (
              <EmptyState
                title="No se encontraron movimientos"
                description="No hay movimientos que coincidan con los filtros aplicados"
              />
            )
          )}
        </div>
      )}
    </Layout>
  )
}