import { useCurrentUser } from '@/hooks/use-current-user'
import { useSubcontracts } from '@/hooks/use-subcontracts'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { CreditCard, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SubcontractPaymentsChart } from '@/components/charts/SubcontractPaymentsChart'
import { Table } from '@/components/ui-custom/Table'

export function SubcontractPayments() {
  const { data: userData } = useCurrentUser()
  const { data: subcontracts = [], isLoading: loadingSubcontracts } = useSubcontracts(userData?.preferences?.last_project_id || null)
  // Por ahora simulamos datos de pagos hasta tener el hook real
  const payments: any[] = []
  const loadingPayments = false
  const { openModal } = useGlobalModalStore()

  const isLoading = loadingSubcontracts || loadingPayments

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!payments || payments.length === 0) {
    return (
      <EmptyState
        icon={<CreditCard className="w-12 h-12 text-muted-foreground" />}
        title="No hay pagos registrados"
        description="Aún no has registrado ningún pago de subcontrato. Haz clic en 'Nuevo Pago' para comenzar."
        action={
          <Button 
            onClick={() => console.log('TODO: Implementar modal de nuevo pago')}
            className="mt-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Pago
          </Button>
        }
      />
    )
  }

  const paymentsColumns = [
    {
      key: 'subcontract_name',
      label: 'Subcontrato',
      width: '16.66%',
      render: (payment: any) => (
        <div>
          <p className="font-medium text-sm">{payment.subcontract_name || 'Sin nombre'}</p>
          <p className="text-xs text-muted-foreground">{payment.subcontractor_name || 'Sin subcontratista'}</p>
        </div>
      )
    },
    {
      key: 'payment_date',
      label: 'Fecha',
      width: '16.66%',
      render: (payment: any) => (
        <span className="text-sm">
          {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('es-AR') : '—'}
        </span>
      )
    },
    {
      key: 'amount',
      label: 'Monto',
      width: '16.66%',
      render: (payment: any) => (
        <span className="font-medium text-sm">
          {new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: payment.currency || 'ARS'
          }).format(payment.amount || 0)}
        </span>
      )
    },
    {
      key: 'payment_method',
      label: 'Método',
      width: '16.66%',
      render: (payment: any) => (
        <Badge variant="outline" className="text-xs">
          {payment.payment_method || 'Sin especificar'}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      width: '16.66%',
      render: (payment: any) => (
        <Badge 
          variant={payment.status === 'paid' ? 'default' : payment.status === 'pending' ? 'secondary' : 'destructive'}
          className="text-xs"
        >
          {payment.status === 'paid' ? 'Pagado' : payment.status === 'pending' ? 'Pendiente' : 'Cancelado'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '16.66%',
      render: (payment: any) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log('TODO: Implementar modal de editar pago', payment.id)}
          >
            Editar
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Chart Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Resumen de Pagos</CardTitle>
            <Button 
              onClick={() => console.log('TODO: Implementar modal de nuevo pago')}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Pago
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <SubcontractPaymentsChart data={payments} />
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Pagos</CardTitle>
          <div className="text-sm text-muted-foreground">
            {payments.length} pago{payments.length !== 1 ? 's' : ''} registrado{payments.length !== 1 ? 's' : ''}
          </div>
        </CardHeader>
        <CardContent>
          <Table
            data={payments}
            columns={paymentsColumns}
          />
        </CardContent>
      </Card>
    </div>
  )
}