import React from 'react'
import { DollarSign } from 'lucide-react'

import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

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

interface CapitalDetailProps {
  memberSummary: MemberSummary[]
  availableCurrencies: string[]
  isLoading: boolean
}

export default function CapitalDetail({ memberSummary, availableCurrencies, isLoading }: CapitalDetailProps) {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Cargando detalle por moneda...</div>
      </div>
    )
  }

  if (memberSummary.length === 0) {
    return (
      <EmptyState
        icon={<DollarSign className="h-8 w-8" />}
        title="No hay datos por moneda disponibles"
        description="No se encontraron movimientos de capital para mostrar el detalle por moneda."
      />
    )
  }

  if (availableCurrencies.length === 0) {
    return (
      <EmptyState
        icon={<DollarSign className="h-8 w-8" />}
        title="No hay monedas registradas"
        description="No se encontraron movimientos con diferentes monedas para mostrar."
      />
    )
  }

  return (
    <div className="space-y-4">
      <Table
        data={memberSummary}
        columns={currencyColumns}
        defaultSort={{ key: 'member', direction: 'asc' }}
        getItemId={(item) => item.member_id || 'unknown'}
      />
    </div>
  )
}