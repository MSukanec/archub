import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'

import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase'

interface CapitalDashboardProps {
  organizationId?: string
  projectId?: string
  searchValue?: string
}

export default function CapitalDashboard({ organizationId, searchValue }: CapitalDashboardProps) {
  // Partner capital concept UUIDs
  const APORTES_SOCIOS_UUID = 'a0429ca8-f4b9-4b91-84a2-b6603452f7fb'
  const RETIROS_SOCIOS_UUID = 'c04a82f8-6fd8-439d-81f7-325c63905a1b'

  // First, let's see what subcategories exist with "aporte" or "retiro" in the name
  const { data: debugSubcategories } = useQuery({
    queryKey: ['debug-subcategories', organizationId],
    queryFn: async () => {
      if (!supabase || !organizationId) return []
      
      const { data, error } = await supabase
        .from('movements_view')
        .select('subcategory_id, subcategory_name, category_name')
        .eq('organization_id', organizationId)
        .not('subcategory_name', 'is', null)
        
      if (error) return []
      
      // Get unique subcategories that might be related to capital
      const unique = data?.filter((item, index, self) => 
        index === self.findIndex(t => t.subcategory_id === item.subcategory_id)
      ).filter(item => 
        item.subcategory_name?.toLowerCase().includes('aporte') ||
        item.subcategory_name?.toLowerCase().includes('retiro') ||
        item.subcategory_name?.toLowerCase().includes('socio') ||
        item.subcategory_name?.toLowerCase().includes('propio') ||
        item.category_name?.toLowerCase().includes('aporte') ||
        item.category_name?.toLowerCase().includes('retiro')
      ) || []
      
      console.log('🐛 DEBUG: Found capital-related subcategories:', unique)
      return unique
    },
    enabled: !!organizationId && !!supabase
  })

  // Fetch partner capital movements
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['partner-capital-movements', organizationId],
    queryFn: async () => {
      if (!supabase || !organizationId) return []
      
      console.log('🔍 CapitalDashboard: Searching for partner movements...')
      
      // Try both hardcoded UUIDs AND search by name patterns
      const { data: exactMatches, error: exactError } = await supabase
        .from('movements_view')
        .select('*')
        .eq('organization_id', organizationId)
        .in('subcategory_id', [APORTES_SOCIOS_UUID, RETIROS_SOCIOS_UUID])
        .order('movement_date', { ascending: false })
        
      const { data: nameMatches, error: nameError } = await supabase
        .from('movements_view')
        .select('*')
        .eq('organization_id', organizationId)
        .or(`subcategory_name.ilike.%aporte%propio%,subcategory_name.ilike.%retiro%propio%,subcategory_name.ilike.%aportes%propio%,subcategory_name.ilike.%retiros%propio%`)
        .order('movement_date', { ascending: false })
      
      console.log('🔍 Exact UUID matches:', exactMatches?.length || 0)
      console.log('🔍 Name pattern matches:', nameMatches?.length || 0)
      
      // Combine and deduplicate results
      const allMatches = [...(exactMatches || []), ...(nameMatches || [])]
      const uniqueMatches = allMatches.filter((movement, index, self) =>
        index === self.findIndex(m => m.id === movement.id)
      )
      
      const data = uniqueMatches
      const error = exactError || nameError

      if (error) {
        console.error('Error fetching partner movements:', error)
        return []
      }
      
      console.log('🔍 CapitalDashboard: Found movements:', data?.length || 0)
      return data || []
    },
    enabled: !!organizationId && !!supabase
  })

  // Process member summary data
  const memberSummary = React.useMemo(() => {
    if (!movements || movements.length === 0) return []

    const summaryMap = new Map()
    
    movements.forEach(movement => {
      const memberId = movement.member_id || 'sin-socio'
      
      if (!summaryMap.has(memberId)) {
        summaryMap.set(memberId, {
          member_id: memberId,
          member: movement.member || null,
          totalAportes: 0,
          totalRetiros: 0,
          dollarizedTotal: 0,
          currencies: {}
        })
      }
      
      const summary = summaryMap.get(memberId)
      const amount = movement.amount || 0
      const isAporte = movement.subcategory_id === APORTES_SOCIOS_UUID
      
      if (isAporte) {
        summary.totalAportes += amount
      } else {
        summary.totalRetiros += amount
      }
      
      // Add currency breakdown
      const currencyCode = movement.currency_code || 'N/A'
      if (!summary.currencies[currencyCode]) {
        summary.currencies[currencyCode] = {
          amount: 0,
          currency: {
            code: movement.currency_code,
            symbol: movement.currency_symbol,
            name: movement.currency_name
          }
        }
      }
      
      summary.currencies[currencyCode].amount += isAporte ? amount : -amount
      
      // Calculate dollarized total
      if (currencyCode === 'USD') {
        summary.dollarizedTotal += isAporte ? amount : -amount
      } else if (currencyCode === 'ARS' && movement.exchange_rate) {
        const convertedAmount = amount / movement.exchange_rate
        summary.dollarizedTotal += isAporte ? convertedAmount : -convertedAmount
      }
    })

    return Array.from(summaryMap.values()).map(summary => ({
      ...summary,
      saldo: summary.totalAportes - summary.totalRetiros
    }))
  }, [movements])

  // Filter by search
  const filteredSummary = React.useMemo(() => {
    if (!searchValue) return memberSummary
    
    return memberSummary.filter(summary => 
      summary.member?.user?.full_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      summary.member?.user?.email?.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [memberSummary, searchValue])

  // Member summary table columns
  const memberSummaryColumns = [
    {
      key: "member",
      label: "Socio",
      width: "25%",
      render: (item: any) => {
        if (!item.member?.user) {
          return <div className="text-sm text-muted-foreground">Sin usuario</div>
        }

        const displayName = item.member.user.full_name || 'Sin nombre'
        const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)

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
      render: (item: any) => (
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
      render: (item: any) => (
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
      render: (item: any) => (
        <div className={`text-sm font-medium ${item.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          ${item.saldo.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </div>
      )
    },
    {
      key: "dollarized_total",
      label: "Total USD",
      width: "18.75%",
      sortable: true,
      sortType: 'number' as const,
      render: (item: any) => (
        <div className={`text-sm font-medium ${item.dollarizedTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          ${item.dollarizedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      )
    }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Cargando resumen de socios...</div>
      </div>
    )
  }
  
  // Show debug info if no movements found
  if (movements.length === 0 && debugSubcategories && debugSubcategories.length > 0) {
    console.log('🐛 DEBUG: No movements found with hardcoded UUIDs, but found these capital subcategories:')
    debugSubcategories.forEach(sub => {
      console.log(`   - "${sub.subcategory_name}" (${sub.subcategory_id}) in category "${sub.category_name}"`)
    })
  }

  if (filteredSummary.length === 0) {
    return (
      <EmptyState
        icon={<Users />}
        title="Aún no hay movimientos de capital registrados"
        description="Esta sección muestra los aportes y retiros de capital de los socios del proyecto."
      />
    )
  }

  return (
    <Table
      data={filteredSummary}
      columns={memberSummaryColumns}
      defaultSortBy="dollarized_total"
      defaultSortDirection="desc"
    />
  )
}