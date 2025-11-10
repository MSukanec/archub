import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { Button } from '@/components/ui/button'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import InstallmentDetailCard from '@/components/ui/cards/InstallmentDetailCard'
import { Receipt, Plus, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface IndirectPaymentsProps {
  projectId: string
  organizationId: string
}

export function IndirectPayments({ projectId, organizationId }: IndirectPaymentsProps) {
  const { openModal } = useGlobalModalStore()
  
  // Fetch indirect cost payments data
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['indirect-payment-details', organizationId, projectId],
    queryFn: async () => {
      if (!supabase) return []
      
      // Por ahora, devolvemos un array vacío ya que la estructura de pagos de indirectos
      // no está completamente definida. Esto se puede adaptar cuando se tenga más información
      // sobre cómo se relacionan los pagos con los costos indirectos
      return []

      /* 
      Estructura esperada una vez que se implemente:
      
      const { data: paymentsData, error } = await supabase
        .from('movement_indirects') // Tabla de relación entre movimientos y costos indirectos
        .select(`
          id,
          amount,
          movement!inner(
            id,
            movement_date,
            amount,
            exchange_rate,
            currency!inner(id, name, code, symbol),
            organization_wallets!inner(
              wallets!inner(id, name)
            )
          ),
          indirect_costs!inner(
            id,
            name,
            description,
            category
          )
        `)
        .eq('movement.organization_id', organizationId)
        .eq('movement.project_id', projectId)
        .order('movement(movement_date)', { ascending: false })

      if (error) {
        throw error
      }

      // Transform payments data to match expected format
      const movements = (paymentsData || []).map((payment: any) => ({
        id: payment.movement?.id,
        movement_date: payment.movement?.movement_date,
        amount: payment.amount || payment.movement?.amount,
        description: `${payment.indirect_costs?.name || 'Sin nombre'} - ${payment.indirect_costs?.category || 'Sin categoría'}`,
        currency_id: payment.movement?.currency?.id,
        wallet_id: payment.movement?.organization_wallets?.[0]?.wallets?.id,
        project_id: projectId,
        created_by: payment.movement?.id, // Temporal
        exchange_rate: payment.movement?.exchange_rate,
        created_at: payment.movement?.movement_date,
        
        // Add related data directly from the query
        currency: {
          id: payment.movement?.currency?.id,
          name: payment.movement?.currency?.name,
          code: payment.movement?.currency?.code,
          symbol: payment.movement?.currency?.symbol || '$'
        },
        wallet: {
          id: payment.movement?.organization_wallets?.[0]?.wallets?.id,
          name: payment.movement?.organization_wallets?.[0]?.wallets?.name || 'Sin billetera'
        },
        creator: {
          id: payment.movement?.id, // Temporal
          full_name: 'Usuario', // Temporal
          email: ''
        },
        indirect_cost: {
          id: payment.indirect_costs?.id,
          name: payment.indirect_costs?.name,
          description: payment.indirect_costs?.description,
          category: payment.indirect_costs?.category
        }
      }))

      return movements
      */
    },
    enabled: !!organizationId && !!projectId && !!supabase
  })

  // Detailed table columns (Fecha, Costo Indirecto, Categoría, Billetera, Monto, Cotización)
  const detailColumns = [
    {
      key: "movement_date",
      label: "Fecha",
      width: "15%",
      sortable: true,
      sortType: "date" as const,
      render: (item: any) => {
        const date = new Date(item.movement_date + 'T00:00:00')
        return (
          <div className="text-sm">
            <div className="font-medium">
              {format(date, 'dd/MM/yyyy', { locale: es })}
            </div>
            <div className="text-xs text-muted-foreground">
              {format(date, 'EEEE', { locale: es })}
            </div>
          </div>
        )
      }
    },
    {
      key: "indirect_name",
      label: "Costo Indirecto",
      width: "25%",
      sortable: true,
      render: (item: any) => (
        <div className="text-sm">
          <div className="font-medium truncate">
            {item.indirect_cost?.name || 'Sin nombre'}
          </div>
          {item.indirect_cost?.description && (
            <div className="text-xs text-muted-foreground">
              {item.indirect_cost.description}
            </div>
          )}
        </div>
      )
    },
    {
      key: "category",
      label: "Categoría",
      width: "20%",
      sortable: true,
      render: (item: any) => (
        <div className="text-sm font-medium">
          {item.indirect_cost?.category || 'Sin categoría'}
        </div>
      )
    },
    {
      key: "wallet",
      label: "Billetera",
      width: "15%",
      render: (item: any) => (
        <div className="flex items-center gap-2 text-sm">
          <Wallet className="w-4 h-4 text-muted-foreground" />
          <span className="truncate">{item.wallet?.name}</span>
        </div>
      )
    },
    {
      key: "amount",
      label: "Monto",
      width: "15%",
      sortable: true,
      sortType: "number" as const,
      render: (item: any) => (
        <div className="text-right">
          <div className="font-medium text-sm">
            {item.currency?.symbol || '$'} {item.amount?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-xs text-muted-foreground">
            {item.currency?.code || 'ARS'}
          </div>
        </div>
      )
    },
    {
      key: "exchange_rate",
      label: "Cotización",
      width: "10%",
      sortable: true,
      sortType: "number" as const,
      render: (item: any) => (
        <div className="text-right text-sm text-muted-foreground">
          {item.exchange_rate ? item.exchange_rate.toFixed(2) : '1.00'}
        </div>
      )
    }
  ]

  // Summary calculations
  const totalByCurrency = payments.reduce((acc, payment) => {
    const currencyCode = (payment as any)?.currency?.code || 'ARS'
    const amount = (payment as any)?.amount || 0
    
    if (!acc[currencyCode]) {
      acc[currencyCode] = {
        total: 0,
        count: 0,
        symbol: (payment as any)?.currency?.symbol || '$'
      }
    }
    
    acc[currencyCode].total += amount
    acc[currencyCode].count += 1
    
    return acc
  }, {} as Record<string, { total: number; count: number; symbol: string }>)

  if (!isLoading && payments.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={<Receipt className="w-12 h-12 text-muted-foreground" />}
          title="Sin pagos de costos indirectos registrados"
          description="Aún no hay pagos registrados para costos indirectos en este proyecto. Los pagos aparecerán aquí una vez que se registren movimientos financieros asociados a costos indirectos."
          action={
            <Button 
              onClick={() => openModal('movement')}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Registrar Pago
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {Object.keys(totalByCurrency).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(totalByCurrency).map(([currencyCode, data]) => (
            <div key={currencyCode} className="bg-card rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total {currencyCode}</p>
                  <p className="text-2xl font-bold">
                    {data.symbol} {data.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {data.count} pago{data.count !== 1 ? 's' : ''} registrado{data.count !== 1 ? 's' : ''}
                  </p>
                </div>
                <Receipt className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-card rounded-lg border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Pagos de Costos Indirectos</h3>
              <p className="text-sm text-muted-foreground">
                Detalle de todos los pagos realizados a costos indirectos del proyecto
              </p>
            </div>
            <Button 
              onClick={() => openModal('movement')}
              size="sm"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Pago
            </Button>
          </div>
        </div>
        
        <Table
          columns={detailColumns}
          data={payments}
          isLoading={isLoading}
          className="border-0"
        />
      </div>
    </div>
  )
}