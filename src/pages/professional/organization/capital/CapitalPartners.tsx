import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { TrendingUp, Edit, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
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

export default function CapitalPartners() {
  const [searchValue, setSearchValue] = useState("")
  const [activeTab, setActiveTab] = useState("members")
  
  const { data: userData } = useCurrentUser()
  const { openModal } = useGlobalModalStore()

  const queryClient = useQueryClient()
  const { toast } = useToast()

  const organizationId = userData?.organization?.id

  // Fetch capital movements from database
  const { data: capitalMovements = [], isLoading: isLoadingMovements } = useQuery({
    queryKey: ['/api/capital-movements', organizationId],
    queryFn: async () => {
      if (!organizationId) return []
      
      const { data, error } = await supabase
        .from('capital_movements_view')
        .select('*')
        .eq('organization_id', organizationId)
        .order('movement_date', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!organizationId
  })

  // Fetch member summaries
  const { data: memberSummaries = [], isLoading: isLoadingSummaries } = useQuery({
    queryKey: ['/api/member-summaries', organizationId],
    queryFn: async () => {
      if (!organizationId) return []
      
      const { data, error } = await supabase.rpc('get_member_capital_summaries', { 
        org_id: organizationId 
      })

      if (error) throw error
      return data || []
    },
    enabled: !!organizationId
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('capital_movements')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/capital-movements'] })
      queryClient.invalidateQueries({ queryKey: ['/api/member-summaries'] })
      toast({
        title: "Movimiento eliminado",
        description: "El movimiento de capital ha sido eliminado correctamente."
      })
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el movimiento de capital."
      })
    }
  })

  const handleCreateMovement = () => {
    // TODO: Implement movement creation modal
    toast({
      title: "Funcionalidad en desarrollo",
      description: "La creación de movimientos de capital estará disponible próximamente."
    })
  }

  const handleEditMovement = (movement: CapitalMovement) => {
    // TODO: Implement movement editing modal
    toast({
      title: "Funcionalidad en desarrollo", 
      description: "La edición de movimientos de capital estará disponible próximamente."
    })
  }

  const handleDeleteMovement = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este movimiento de capital?')) {
      deleteMutation.mutate(id)
    }
  }

  // Filter movements based on search
  const filteredMovements = capitalMovements.filter(movement =>
    movement.description?.toLowerCase().includes(searchValue.toLowerCase()) ||
    movement.member?.user?.full_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
    movement.type_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
    movement.category_name?.toLowerCase().includes(searchValue.toLowerCase())
  )

  // Filter member summaries based on search
  const filteredMemberSummaries = memberSummaries.filter((summary: any) =>
    summary.member?.user?.full_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
    summary.member?.user?.email?.toLowerCase().includes(searchValue.toLowerCase())
  )

  // Movements table columns
  const movementColumns = [
    {
      key: 'movement_date',
      label: 'Fecha',
      render: (movement: CapitalMovement) => format(new Date(movement.movement_date), 'dd/MM/yyyy', { locale: es })
    },
    {
      key: 'member',
      label: 'Socio',
      render: (movement: CapitalMovement) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src="" />
            <AvatarFallback className="text-xs">
              {movement.member?.user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">
            {movement.member?.user?.full_name || 'Usuario sin nombre'}
          </span>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Tipo',
      render: (movement: CapitalMovement) => (
        <Badge variant={movement.type_name === 'Aporte' ? 'default' : 'destructive'}>
          {movement.type_name}
        </Badge>
      )
    },
    {
      key: 'category',
      label: 'Categoría',
      render: (movement: CapitalMovement) => movement.category_name || '-'
    },
    {
      key: 'amount',
      label: 'Monto',
      render: (movement: CapitalMovement) => (
        <span className={`font-medium ${movement.type_name === 'Aporte' ? 'text-green-600' : 'text-red-600'}`}>
          {movement.currency_symbol || '$'} {movement.amount?.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'description',
      label: 'Descripción',
      render: (movement: CapitalMovement) => (
        <span className="text-sm text-muted-foreground">
          {movement.description || '-'}
        </span>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (movement: CapitalMovement) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleEditMovement(movement)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleDeleteMovement(movement.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  // Member summaries table columns
  const memberColumns = [
    {
      key: 'member',
      label: 'Socio',
      render: (summary: MemberSummary) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" />
            <AvatarFallback>
              {summary.member?.user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">
              {summary.member?.user?.full_name || 'Usuario sin nombre'}
            </div>
            <div className="text-sm text-muted-foreground">
              {summary.member?.user?.email}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'aportes',
      label: 'Total Aportes',
      render: (summary: MemberSummary) => (
        <span className="text-green-600 font-medium">
          $ {summary.totalAportes?.toLocaleString('es-ES', { minimumFractionDigits: 2 }) || '0.00'}
        </span>
      )
    },
    {
      key: 'retiros',
      label: 'Total Retiros',
      render: (summary: MemberSummary) => (
        <span className="text-red-600 font-medium">
          $ {summary.totalRetiros?.toLocaleString('es-ES', { minimumFractionDigits: 2 }) || '0.00'}
        </span>
      )
    },
    {
      key: 'saldo',
      label: 'Saldo',
      render: (summary: MemberSummary) => (
        <span className={`font-bold ${summary.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          $ {summary.saldo?.toLocaleString('es-ES', { minimumFractionDigits: 2 }) || '0.00'}
        </span>
      )
    },
    {
      key: 'currencies',
      label: 'Monedas',
      render: (summary: MemberSummary) => (
        <div className="flex flex-wrap gap-1">
          {Object.entries(summary.currencies || {}).map(([currencyCode, data]) => (
            <Badge key={currencyCode} variant="outline" className="text-xs">
              {currencyCode}: {data.currency?.symbol || '$'} {data.amount?.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </Badge>
          ))}
        </div>
      )
    }
  ]

  const isLoading = isLoadingMovements || isLoadingSummaries

  if (!organizationId) {
    return (
      <EmptyState
        title="Sin organización"
        description="No hay una organización seleccionada para mostrar los movimientos de capital."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Movimientos de Capital</h2>
          <p className="text-muted-foreground">
            Gestiona los aportes y retiros de capital de los socios de la organización
          </p>
        </div>
        <Button onClick={handleCreateMovement}>
          <TrendingUp className="h-4 w-4 mr-2" />
          Nuevo Movimiento
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("members")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "members"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            }`}
          >
            Resumen por Socio
          </button>
          <button
            onClick={() => setActiveTab("movements")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "movements"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            }`}
          >
            Historial de Movimientos
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "members" ? (
        <Table
          data={filteredMemberSummaries}
          columns={memberColumns}
        />
      ) : (
        <Table
          data={filteredMovements}
          columns={movementColumns}
        />
      )}
    </div>
  )
}