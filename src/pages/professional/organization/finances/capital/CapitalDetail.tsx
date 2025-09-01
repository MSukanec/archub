import React from 'react'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
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
}

export function CapitalDetail({ memberSummary, availableCurrencies }: CapitalDetailProps) {
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

  return (
    <Table
      data={memberSummary}
      columns={currencyColumns}
      defaultSort={{ key: 'member', direction: 'asc' }}
      getItemId={(item) => item.member_id || 'unknown'}
    />
  )
}