import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui-custom/Table'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useActions, useDeleteAction, type Action } from '@/hooks/use-actions'

import { Edit, Trash2, Search, X, Download } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { exportToExcel, createExportColumns } from '@/lib/export-utils'

const AdminActionsList = () => {
  const [searchValue, setSearchValue] = useState('')

  const { openModal } = useGlobalModalStore()
  
  // Data from useActions hook
  const { data: actions = [], isLoading } = useActions()
  const deleteActionMutation = useDeleteAction()

  // Filter actions based on search
  const filteredActions = actions.filter((action: Action) => {
    const matchesSearch = !searchValue || 
      action.name?.toLowerCase().includes(searchValue.toLowerCase())
    
    return matchesSearch
  })

  const handleEdit = (action: Action) => {
    // Por ahora usamos un modal genérico, luego crearemos el modal específico para actions
    console.log('Editar acción:', action)
  }

  const handleDelete = (action: Action) => {
    openModal('delete-confirmation', {
      title: 'Eliminar Acción',
      description: `Para confirmar la eliminación, escribe el nombre exacto de la acción.`,
      itemName: action.name,
      itemType: 'acción',
      destructiveActionText: 'Eliminar Acción',
      onConfirm: () => deleteActionMutation.mutate(action.id),
      mode: 'dangerous'
    })
  }

  const clearFilters = () => {
    setSearchValue('')
  }

  // Handle Excel export
  const handleExportToExcel = async () => {
    if (filteredActions.length === 0) return

    try {
      const exportColumns = createExportColumns(columns)
      await exportToExcel({
        data: filteredActions,
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
      render: (action: Action) => (
        <div className="font-medium">
          {action.name}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (action: Action) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(action)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(action)}
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
      {/* Search and filters bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar acciones..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
              onClick={clearFilters}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        {filteredActions.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportToExcel}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        )}
      </div>

      <Table
        data={filteredActions}
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