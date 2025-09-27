import { DollarSign, Plus, Edit, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useBudgets } from '@/hooks/use-budgets'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useDeleteBudget } from '@/hooks/use-budgets'
import { useToast } from '@/hooks/use-toast'
import { useProjectContext } from '@/stores/projectContext'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'

interface BudgetItemsProps {
  onAddTask?: () => void
}

export function BudgetItems({ 
  onAddTask
}: BudgetItemsProps) {
  const { data: userData } = useCurrentUser()
  const { selectedProjectId } = useProjectContext()
  const { data: budgets = [], isLoading } = useBudgets(selectedProjectId || undefined)
  const deletebudget = useDeleteBudget()
  const { toast } = useToast()
  const { openModal } = useGlobalModalStore()

  const handleEdit = (budget: any) => {
    console.log('🔥 Clicking edit button for budget:', budget)
    console.log('🔥 About to call openModal with:', 'budget', { budget, mode: 'edit' })
    openModal('budget', { budget, mode: 'edit' })
    console.log('🔥 openModal called, modal should be opening now')
  }

  const handleDelete = (budget: any) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este presupuesto?')) {
      deletebudget.mutate(budget.id, {
        onSuccess: () => {
          toast({
            title: "Presupuesto eliminado",
            description: "El presupuesto ha sido eliminado correctamente",
          })
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: "No se pudo eliminar el presupuesto",
            variant: "destructive",
          })
        }
      })
    }
  }

  // Formatear moneda
  const formatCurrency = (amount: number, symbol: string = '$') => {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Definir columnas de la tabla
  const columns = [
    {
      key: 'name',
      label: 'Nombre',
      width: '30%',
      render: (budget: any) => (
        <div>
          <div className="font-medium text-sm">{budget.name}</div>
          {budget.description && (
            <div className="text-xs text-muted-foreground mt-1">
              {budget.description}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      width: '15%',
      render: (budget: any) => {
        const getStatusBadge = (status: string) => {
          switch (status) {
            case 'draft':
              return <Badge variant="secondary">Borrador</Badge>
            case 'approved':
              return <Badge variant="default">Aprobado</Badge>
            case 'in_progress':
              return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">En progreso</Badge>
            case 'completed':
              return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completado</Badge>
            default:
              return <Badge variant="secondary">{status}</Badge>
          }
        }
        return getStatusBadge(budget.status)
      }
    },
    {
      key: 'version',
      label: 'Versión',
      width: '10%',
      render: (budget: any) => (
        <span className="text-sm">v{budget.version}</span>
      )
    },
    {
      key: 'currency',
      label: 'Moneda',
      width: '15%',
      render: (budget: any) => (
        <div className="text-sm">
          {budget.currency?.code || 'N/A'}
          {budget.exchange_rate && (
            <div className="text-xs text-muted-foreground">
              TC: {formatCurrency(budget.exchange_rate)}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Creado',
      width: '15%',
      sortable: true,
      sortType: 'date' as const,
      render: (budget: any) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(budget.created_at), 'dd/MM/yy', { locale: es })}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '15%',
      render: (budget: any) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(budget)}
            className="h-8 w-8 p-0"
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(budget)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  const emptyState = (
    <EmptyState
      icon={<DollarSign className="h-12 w-12 text-muted-foreground" />}
      title="Sin presupuestos"
      description="No hay presupuestos creados aún. Crea tu primer presupuesto para comenzar."
      action={
        onAddTask && (
          <Button onClick={onAddTask} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Presupuesto
          </Button>
        )
      }
    />
  )

  return (
    <Table
      columns={columns}
      data={budgets}
      isLoading={isLoading}
      emptyState={emptyState}
      defaultSort={{ key: 'created_at', direction: 'desc' }}
    />
  )
}