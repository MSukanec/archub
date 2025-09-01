import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { DollarSign } from 'lucide-react'

import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase'

interface CapitalDetailProps {
  organizationId?: string
  projectId?: string
  searchValue?: string
}

export default function CapitalDetail({ organizationId, searchValue }: CapitalDetailProps) {
  // EXACT UUIDs que el usuario especificó
  const APORTES_PROPIOS_UUID = 'a0429ca8-f4b9-4b91-84a2-b6603452f7fb' // Aportes Propios 
  const RETIROS_PROPIOS_UUID = 'c04a82f8-6fd8-439d-81f7-325c63905a1b' // Retiros Propios

  // Fetch partner capital movements
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['partner-capital-detail', organizationId],
    queryFn: async () => {
      if (!supabase || !organizationId) return []
      
      console.log('🔍 CapitalDetail: Searching for partner movements...')
      
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
      
      console.log('🔍 CapitalDetail: Found movements:', data?.length || 0)
      return data || []
    },
    enabled: !!organizationId && !!supabase
  })

  // Get available currencies
  const availableCurrencies = React.useMemo(() => {
    const currencies = new Set()
    movements.forEach(movement => {
      if (movement.currency_code) {
        currencies.add(movement.currency_code)
      }
    })
    return Array.from(currencies) as string[]
  }, [movements])

  // Process member summary by currency
  const memberSummary = React.useMemo(() => {
    if (!movements || movements.length === 0) return []

    const summaryMap = new Map()
    
    movements.forEach(movement => {
      const memberId = movement.member_id || 'sin-socio'
      
      if (!summaryMap.has(memberId)) {
        summaryMap.set(memberId, {
          member_id: memberId,
          member: movement.member || null,
          currencies: {}
        })
      }
      
      const summary = summaryMap.get(memberId)
      const amount = movement.amount || 0
      const currencyCode = movement.currency_code || 'N/A'
      const isAporte = movement.subcategory_id === APORTES_SOCIOS_UUID
      
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
    })

    return Array.from(summaryMap.values())
  }, [movements])

  // Filter by search
  const filteredSummary = React.useMemo(() => {
    if (!searchValue) return memberSummary
    
    return memberSummary.filter(summary => 
      summary.member?.user?.full_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      summary.member?.user?.email?.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [memberSummary, searchValue])

  // Create dynamic columns based on available currencies
  const currencyColumns = React.useMemo(() => {
    const baseColumns = [
      {
        key: "member",
        label: "Socio",
        width: "30%",
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
      }
    ]

    // Add currency columns dynamically
    const currencyColumnsData = availableCurrencies.map(currency => ({
      key: `currency_${currency}`,
      label: currency,
      width: `${70 / availableCurrencies.length}%`,
      sortable: true,
      sortType: 'number' as const,
      render: (item: any) => {
        const currencyData = item.currencies[currency]
        if (!currencyData || currencyData.amount === 0) {
          return <div className="text-sm text-muted-foreground">-</div>
        }

        const amount = currencyData.amount
        const symbol = currencyData.currency?.symbol || currency

        return (
          <div className={`text-sm font-medium ${amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {symbol} {amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )
      }
    }))

    return [...baseColumns, ...currencyColumnsData]
  }, [availableCurrencies])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Cargando detalle por moneda...</div>
      </div>
    )
  }

  if (filteredSummary.length === 0) {
    return (
      <EmptyState
        icon={<DollarSign />}
        title="Aún no hay movimientos de capital registrados"
        description="Esta sección muestra los aportes y retiros de capital de los socios organizados por moneda."
      />
    )
  }

  return (
    <Table
      data={filteredSummary}
      columns={currencyColumns}
      defaultSortBy="member"
      defaultSortDirection="asc"
    />
  )
}