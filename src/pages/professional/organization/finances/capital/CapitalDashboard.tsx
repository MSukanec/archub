import React from 'react'
import { Users } from 'lucide-react'

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

interface CapitalDashboardProps {
  memberSummary: MemberSummary[]
  isLoading: boolean
}

export default function CapitalDashboard({ memberSummary, isLoading }: CapitalDashboardProps) {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Cargando resumen de socios...</div>
      </div>
    )
  }

  if (memberSummary.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-8 w-8" />}
        title="No hay datos de socios disponibles"
        description="No se encontraron movimientos de capital para mostrar el resumen por socio."
      />
    )
  }

  return (
    <div className="space-y-4">
      <Table
        data={memberSummary}
        columns={memberSummaryColumns}
        defaultSort={{ key: 'member', direction: 'asc' }}
        getItemId={(item) => item.member_id || 'unknown'}
      />
    </div>
  )
}