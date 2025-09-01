import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { History, Edit, Trash2 } from 'lucide-react'

import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'

interface CapitalHistoryProps {
  organizationId?: string
  projectId?: string
  searchValue?: string
}

export default function CapitalHistory({ organizationId, searchValue }: CapitalHistoryProps) {
  const { openModal } = useGlobalModalStore()
  
  // EXACT UUIDs que el usuario especificó
  const APORTES_PROPIOS_UUID = 'a0429ca8-f4b9-4b91-84a2-b6603452f7fb' // Aportes Propios 
  const RETIROS_PROPIOS_UUID = 'c04a82f8-6fd8-439d-81f7-325c63905a1b' // Retiros Propios

  // Fetch partner capital movements
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['partner-capital-history', organizationId],
    queryFn: async () => {
      if (!supabase || !organizationId) return []
      
      
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
      
      return data || []
    },
    enabled: !!organizationId && !!supabase
  })

  // Filter movements by search
  const filteredMovements = React.useMemo(() => {
    if (!searchValue) return movements
    
    return movements.filter(movement => 
      movement.description?.toLowerCase().includes(searchValue.toLowerCase()) ||
      movement.partner?.toLowerCase().includes(searchValue.toLowerCase()) ||
      movement.subcategory_name?.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [movements, searchValue])

  const handleEdit = (movement: any) => {
    openModal('movement', { editingMovement: movement })
  }

  const handleDelete = (movement: any) => {
    console.log('Delete movement:', movement.id)
  }

  // Movement history table columns
  const movementColumns = [
    {
      key: "movement_date",
      label: "Fecha",
      width: "12%",
      sortable: true,
      sortType: 'date' as const,
      render: (item: any) => (
        <div className="text-xs font-medium">
          {format(new Date(item.movement_date), 'dd/MM/yyyy', { locale: es })}
        </div>
      )
    },
    {
      key: "member",
      label: "Socio",
      width: "20%",
      render: (item: any) => {
        const partnerName = item.partner || 'Sin Socio'
        const initials = partnerName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)

        return (
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="text-xs font-medium">{partnerName}</div>
          </div>
        )
      }
    },
    {
      key: "subcategory_name",
      label: "Tipo",
      width: "15%",
      render: (item: any) => {
        const isAporte = item.subcategory_id === APORTES_PROPIOS_UUID
        return (
          <Badge variant={isAporte ? "default" : "secondary"} className="text-xs">
            {item.subcategory_name || (isAporte ? 'Aporte' : 'Retiro')}
          </Badge>
        )
      }
    },
    {
      key: "description",
      label: "Descripción",
      width: "25%",
      render: (item: any) => (
        <div className="text-xs">{item.description}</div>
      )
    },
    {
      key: "wallet_name",
      label: "Billetera",
      width: "10%",
      render: (item: any) => (
        <div className="text-xs text-muted-foreground">{item.wallet_name}</div>
      )
    },
    {
      key: "amount",
      label: "Monto",
      width: "12%",
      sortable: true,
      sortType: 'number' as const,
      render: (item: any) => {
        const isAporte = item.subcategory_id === APORTES_PROPIOS_UUID
        const symbol = item.currency_symbol || item.currency_code || '$'
        
        return (
          <div className={`text-xs font-medium ${isAporte ? 'text-green-600' : 'text-red-600'}`}>
            {symbol} {item.amount?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )
      }
    },
    {
      key: "actions",
      label: "",
      width: "6%",
      render: (item: any) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleEdit(item)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleDelete(item)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )
    }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Cargando historial de movimientos...</div>
      </div>
    )
  }

  if (filteredMovements.length === 0) {
    return (
      <EmptyState
        icon={<History />}
        title="Aún no hay movimientos de capital registrados"
        description="Esta sección muestra el detalle de todos los aportes y retiros de capital de los socios del proyecto."
      />
    )
  }

  return (
    <Table
      data={filteredMovements}
      columns={movementColumns}
      defaultSort={{ key: "movement_date", direction: "desc" }}
    />
  )
}