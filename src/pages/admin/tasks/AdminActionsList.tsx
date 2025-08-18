import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui-custom/Table'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useTaskKinds, useDeleteTaskKind, type TaskKind } from '@/hooks/use-actions'

import { Edit, Trash2 } from 'lucide-react'
import { exportToExcel, createExportColumns } from '@/lib/export-utils'

const AdminActionsList = () => {
  const { openModal } = useGlobalModalStore()
  
  // Data from useTaskKinds hook
  const { data: taskKinds = [], isLoading } = useTaskKinds()
  const deleteTaskKindMutation = useDeleteTaskKind()

  const handleEdit = (taskKind: TaskKind) => {
    // Por ahora usamos un modal genérico, luego crearemos el modal específico para task kinds
    console.log('Editar acción:', taskKind)
  }

  const handleDelete = (taskKind: TaskKind) => {
    openModal('delete-confirmation', {
      title: 'Eliminar Acción',
      description: `Para confirmar la eliminación, escribe el nombre exacto de la acción.`,
      itemName: taskKind.name,
      itemType: 'acción',
      destructiveActionText: 'Eliminar Acción',
      onConfirm: () => deleteTaskKindMutation.mutate(taskKind.id),
      mode: 'dangerous'
    })
  }

  // Handle Excel export
  const handleExportToExcel = async () => {
    if (taskKinds.length === 0) return

    try {
      const exportColumns = createExportColumns(columns)
      await exportToExcel({
        data: taskKinds,
        columns: exportColumns,
        filename: 'acciones'
      })
    } catch (error) {
      console.error('Error exporting to Excel:', error)
    }
  }

  // Table columns configuration
  const columns = [
    {
      key: 'name',
      label: 'Nombre',
      render: (taskKind: TaskKind) => (
        <div className="font-medium">
          {taskKind.name}
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Descripción',
      render: (taskKind: TaskKind) => (
        <div className="text-sm text-muted-foreground">
          {taskKind.description || '-'}
        </div>
      ),
    },
    {
      key: 'code',
      label: 'Código',
      render: (taskKind: TaskKind) => (
        <div className="font-mono text-sm bg-muted px-2 py-1 rounded">
          {taskKind.code}
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'Activo',
      render: (taskKind: TaskKind) => (
        <div className="flex items-center">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            taskKind.is_active 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
          }`}>
            {taskKind.is_active ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (taskKind: TaskKind) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(taskKind)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(taskKind)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <Table
        data={taskKinds}
        columns={columns}
        isLoading={isLoading}
        emptyStateProps={{
          title: "No hay acciones registradas",
          description: "Comienza creando tu primera acción para el sistema.",
        }}
      />
    </div>
  )
}

export default AdminActionsList