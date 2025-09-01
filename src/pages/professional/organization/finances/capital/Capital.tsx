import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TrendingUp } from 'lucide-react'

import { Layout } from '@/components/layout/desktop/Layout'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { useCurrentUser } from '@/hooks/use-current-user'
import { supabase } from '@/lib/supabase'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useToast } from '@/hooks/use-toast'

import { CapitalDashboard } from './CapitalDashboard'
import { CapitalDetail } from './CapitalDetail'
import { CapitalHistory } from './CapitalHistory'

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
}

export default function FinancesCapitalMovements() {
  const [searchValue, setSearchValue] = useState("")
  const [activeTab, setActiveTab] = useState("members")
  
  const { data: userData } = useCurrentUser()
  const { openModal } = useGlobalModalStore()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const organizationId = userData?.organization?.id

  // For now, simple empty data to make it work
  const movements = []
  const memberSummary = []
  const availableCurrencies = []
  const allMovementPartners = []
  const members = []
  const aportesPropriosConcept = null
  const retirosPropriosConcept = null
  const aportesPropriosOld = null
  const retirosPropriosOld = null
  const isLoading = false

  const handleAddAportePpropio = () => {
    openModal('movement', { 
      movementType: 'aportes_propios',
      editingMovement: null 
    })
  }

  const handleAddRetiroPpropio = () => {
    openModal('movement', { 
      movementType: 'retiros_propios',
      editingMovement: null 
    })
  }

  const handleEdit = (movement: CapitalMovement) => {
    // Check both new structure (subcategory_id) and old structure (category_id)
    const isAporte = movement.subcategory_id === aportesPropriosConcept?.id || 
                     movement.category_id === aportesPropriosOld?.id
    const movementType = isAporte ? 'aportes_propios' : 'retiros_propios'
    openModal('movement', { 
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
      queryClient.invalidateQueries({ queryKey: ['installments'] })
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
    openModal('delete-confirmation', {
      title: 'Eliminar Movimiento',
      message: `¿Estás seguro de que deseas eliminar este ${movement.category_name?.toLowerCase() || 'movimiento'}?`,
      onConfirm: () => deleteMutation.mutate(movement.id)
    })
  }

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
    icon: <TrendingUp className="h-5 w-5" />,
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
            <CapitalDashboard memberSummary={memberSummary} />
          )}

          {activeTab === "currencies" && memberSummary.length > 0 && (
            <CapitalDetail 
              memberSummary={memberSummary} 
              availableCurrencies={availableCurrencies} 
            />
          )}

          {activeTab === "details" && (
            <CapitalHistory
              movements={movements}
              searchValue={searchValue}
              aportesPropriosConcept={aportesPropriosConcept}
              retirosPropriosConcept={retirosPropriosConcept}
              aportesPropriosOld={aportesPropriosOld}
              retirosPropriosOld={retirosPropriosOld}
              allMovementPartners={allMovementPartners}
              members={members}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      )}
    </Layout>
  )
}