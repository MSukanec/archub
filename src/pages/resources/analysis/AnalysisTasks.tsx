import { Table } from '@/components/ui-custom/Table'
import { useGeneratedTasks } from '@/hooks/use-generated-tasks'
import { TableIcon, Edit, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation'
import { useCurrentUser } from '@/hooks/use-current-user'

export default function AnalysisTasks() {
  const { data: tasks = [], isLoading: tasksLoading } = useGeneratedTasks()
  const { openModal } = useGlobalModalStore()
  const { showDeleteConfirmation } = useDeleteConfirmation()
  const { data: userData } = useCurrentUser()

  // Filter tasks (no search filtering since search is removed)
  const filteredTasks = tasks

  // Table columns configuration - similar to AdminGeneratedTasks
  const columns = [
    {
      key: 'code',
      label: 'Código',
      width: '5%',
      render: (task: any) => (
        <span className="text-xs font-mono text-muted-foreground">{task.code}</span>
      )
    },
    {
      key: 'category_name',
      label: 'Rubro',
      width: '10%',
      render: (task: any) => (
        <Badge variant="outline" className="text-xs">
          {task.category_name || 'Sin categoría'}
        </Badge>
      )
    },
    {
      key: 'name_rendered',
      label: 'Tarea',
      render: (task: any) => (
        <span className="text-sm">{task.name_rendered}</span>
      )
    },
    {
      key: 'unit_name',
      label: 'Unidad',
      width: '5%',
      render: (task: any) => (
        <Badge variant="secondary" className="text-xs">
          {task.unit_name || 'N/A'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '10%',
      render: (task: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openModal('parametric-task', { taskId: task.id })}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          {/* Solo mostrar botón eliminar si NO es del sistema y pertenece a la organización */}
          {!task.is_system && task.organization_id === userData?.organization?.id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                showDeleteConfirmation({
                  title: "Eliminar tarea",
                  description: `¿Estás seguro de que quieres eliminar "${task.name_rendered || 'esta tarea'}"?`,
                  itemName: task.name_rendered || 'esta tarea',
                  onConfirm: () => {
                    // TODO: Implementar eliminación de tarea
                    console.log('Eliminar tarea:', task.id)
                  }
                })
              }}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={<TableIcon className="h-16 w-16" />}
          title="No hay tareas para analizar"
          description="Las tareas parametrizadas aparecerán aquí para análisis de costos."
        />
      ) : (
        <Table
          data={filteredTasks}
          columns={columns}
          isLoading={tasksLoading}
        />
      )}
    </div>
  )
}