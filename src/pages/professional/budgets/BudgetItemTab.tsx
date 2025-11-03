import { DollarSign, Plus, Edit, Trash2, Eye } from 'lucide-react'
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
import { useLocation } from 'wouter'

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
  const [, navigate] = useLocation()

  const handleEdit = (budget: any) => {
    openModal('budget', { budget, mode: 'edit' })
  }

  const handleView = (budget: any) => {
    navigate(`/professional/budgets/view/${budget.id}`)
  }

  const handleDelete = (budget: any) => {
    openModal('delete-confirmation', {
      mode: 'dangerous',
      title: "Eliminar Presupuesto",
      description: "Esta acción eliminará permanentemente este presupuesto y todos sus datos asociados. Esta acción no se puede deshacer.",
      itemName: budget.name,
      itemType: "presupuesto",
      destructiveActionText: "Eliminar",
      onConfirm: () => {
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
    })
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
      width: '25%',
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
      key: 'version',
      label: 'Versión',
      width: '7%',
      render: (budget: any) => (
        <span className="text-sm">v{budget.version}</span>
      )
    },
    {
      key: 'currency',
      label: 'Moneda',
      width: '7%',
      render: (budget: any) => (
        <div className="text-sm font-medium">
          {budget.currency?.code || 'N/A'}
        </div>
      )
    },
    {
      key: 'total',
      label: 'Total',
      width: '15%',
      render: (budget: any) => (
        <div className="text-sm">
          <div className="font-medium text-green-700">
            {budget.currency?.symbol || '$'} {formatCurrency(budget.total || 0)}
          </div>
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
      width: '8%',
      sortable: true,
      sortType: 'date' as const,
      render: (budget: any) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(budget.created_at), 'dd/MM/yy', { locale: es })}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      width: '8%',
      render: (budget: any) => {
        const getStatusBadge = (status: string) => {
          switch (status) {
            case 'draft':
              return <Badge className="bg-gray-500 text-white hover:bg-gray-600">Borrador</Badge>
            case 'approved':
              return <Badge className="bg-green-600 text-white hover:bg-green-700">Aprobado</Badge>
            case 'in_progress':
              return <Badge className="bg-blue-600 text-white hover:bg-blue-700">En progreso</Badge>
            case 'completed':
              return <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">Completado</Badge>
            default:
              return <Badge className="bg-gray-500 text-white hover:bg-gray-600">{status}</Badge>
          }
        }
        return getStatusBadge(budget.status)
      }
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

  if (budgets.length === 0 && !isLoading) {
    return (
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
  }

  return (
    <Table
      columns={columns}
      data={budgets}
      rowActions={(budget) => [
        {
          icon: Eye,
          label: 'Ver Presupuesto',
          onClick: () => handleView(budget)
        },
        {
          icon: Edit,
          label: 'Edición Rápida',
          onClick: () => handleEdit(budget)
        },
        {
          icon: Trash2,
          label: 'Eliminar',
          onClick: () => handleDelete(budget),
          variant: 'destructive' as const
        }
      ]}
      isLoading={isLoading}
      defaultSort={{ key: 'created_at', direction: 'desc' }}
    />
  )
}