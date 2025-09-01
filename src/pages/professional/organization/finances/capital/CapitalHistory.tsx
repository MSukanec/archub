import React from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Edit, Trash2 } from 'lucide-react'

import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'

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
  partner?: string
}

interface CapitalHistoryProps {
  movements: CapitalMovement[]
  searchValue: string
  aportesPropriosConcept: any
  retirosPropriosConcept: any
  aportesPropriosOld: any
  retirosPropriosOld: any
  allMovementPartners: any[]
  members: any[]
  onEdit: (movement: CapitalMovement) => void
  onDelete: (movement: CapitalMovement) => void
}

export function CapitalHistory({ 
  movements, 
  searchValue, 
  aportesPropriosConcept, 
  retirosPropriosConcept,
  aportesPropriosOld,
  retirosPropriosOld,
  allMovementPartners, 
  members, 
  onEdit, 
  onDelete 
}: CapitalHistoryProps) {
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

  // Detailed table columns
  const detailColumns = [
    {
      key: "movement_date",
      label: "Fecha",
      width: "20%",
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
      width: "20%",
      render: (item: CapitalMovement) => {
        // Use partner column from movements_view first, then fallback to member
        let displayName = item.partner

        if (!displayName) {
          return <div className="text-sm text-muted-foreground">Sin socio</div>
        }

        const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)

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
      key: "type",
      label: "Tipo",
      width: "20%",
      sortable: true,
      sortType: "string" as const,
      render: (item: CapitalMovement) => {
        // Check both new structure (subcategory_id) and old structure (category_id)
        const isAporte = item.subcategory_id === aportesPropriosConcept?.id || 
                         item.category_id === aportesPropriosOld?.id
        return (
          <Badge variant={isAporte ? "default" : "secondary"} className="text-sm">
            {item.type_name || 'Sin especificar'}
          </Badge>
        )
      }
    },
    {
      key: "wallet",
      label: "Billetera",
      width: "20%",
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
      width: "20%",
      sortable: true,
      sortType: "number" as const,
      render: (item: CapitalMovement) => {
        // Check both new structure (subcategory_id) and old structure (category_id)
        const isAporte = item.subcategory_id === aportesPropriosConcept?.id || 
                         item.category_id === aportesPropriosOld?.id
        const formattedAmount = new Intl.NumberFormat('es-AR').format(item.amount || 0)
        
        return (
          <div>
            <div className={`text-sm font-medium ${isAporte ? 'text-green-600' : 'text-red-600'}`}>
              {item.currency_symbol || '$'} {formattedAmount}
            </div>
            {item.exchange_rate && (
              <div className="text-xs text-muted-foreground">
                Cotiz: {Math.round(item.exchange_rate).toLocaleString()}
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: "actions",
      label: "Acciones",
      width: "20%",
      render: (item: CapitalMovement) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(item)}
            className=""
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(item)}
            className=" text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  return (
    <>
      {filteredMovements.length > 0 ? (
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
      )}
    </>
  )
}