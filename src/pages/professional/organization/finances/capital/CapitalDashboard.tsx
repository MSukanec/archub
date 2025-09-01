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
  // EXACT UUIDs que el usuario especificó
  const APORTES_PROPIOS_UUID = 'a0429ca8-f4b9-4b91-84a2-b6603452f7fb' // Aportes Propios 
  const RETIROS_PROPIOS_UUID = 'c04a82f8-6fd8-439d-81f7-325c63905a1b' // Retiros Propios


  // Fetch partner capital movements
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['partner-capital-movements', organizationId],
    queryFn: async () => {
      if (!supabase || !organizationId) return []
      
      console.log('🔍 CapitalDashboard: Searching for partner movements...')
      
      // SOLO buscar los 2 UUIDs exactos especificados por el usuario
      const { data, error } = await supabase
        .from('movements_view')
        .select('*')
        .eq('organization_id', organizationId)
        .in('subcategory_id', [APORTES_PROPIOS_UUID, RETIROS_PROPIOS_UUID])
        .order('movement_date', { ascending: false })

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
      const partnerId = movement.partner?.id || 'sin-socio'
      const partnerName = movement.partner?.company_name || movement.partner?.first_name || movement.partner?.email || 'Sin Socio'
      
      if (!summaryMap.has(partnerId)) {
        summaryMap.set(partnerId, {
          partner_id: partnerId,
          partner: movement.partner || null,
          partnerName: partnerName,
          totalAportes: 0,
          totalRetiros: 0,
          dollarizedTotal: 0,
          currencies: {}
        })
      }
      
      const summary = summaryMap.get(partnerId)
      const amount = movement.amount || 0
      const isAporte = movement.subcategory_id === APORTES_PROPIOS_UUID
      
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
      summary.partnerName?.toLowerCase().includes(searchValue.toLowerCase()) ||
      summary.partner?.email?.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [memberSummary, searchValue])

  // Member summary table columns
  const memberSummaryColumns = [
    {
      key: "member",
      label: "Socio",
      width: "25%",
      render: (item: any) => {
        const displayName = item.partnerName || 'Sin Socio'
        const email = item.partner?.email || ''
        const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)

        return (
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium">{displayName}</div>
              {email && <div className="text-xs text-muted-foreground">{email}</div>}
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
      defaultSort={{ key: "dollarized_total", direction: "desc" }}
    />
  )
}