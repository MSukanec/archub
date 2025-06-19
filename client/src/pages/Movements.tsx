import { useState } from 'react'
import { DollarSign, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomPageLayout } from '@/components/ui-custom/CustomPageLayout'
import { NewMovementModal } from '@/modals/NewMovementModal'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useMovements } from '@/hooks/use-movements'

type FilterType = 'all' | 'income' | 'expense' | 'transfer'

export default function Movements() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [showNewMovementModal, setShowNewMovementModal] = useState(false)
  const [editingMovement, setEditingMovement] = useState<any>(null)

  const { data: userData } = useCurrentUser()
  const organizationId = userData?.preferences?.last_organization_id
  const projectId = userData?.preferences?.last_project_id

  const { data: movements = [], isLoading, error } = useMovements(organizationId, projectId)

  const handleCloseModal = () => {
    setShowNewMovementModal(false)
    setEditingMovement(null)
  }

  if (isLoading) {
    return (
      <CustomPageLayout
        icon={DollarSign}
        title="Gestión de Movimientos"
        showSearch={false}
      >
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-muted-foreground">Cargando movimientos...</div>
        </div>
      </CustomPageLayout>
    )
  }

  if (error) {
    return (
      <CustomPageLayout
        icon={DollarSign}
        title="Gestión de Movimientos"
        showSearch={false}
      >
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-red-600">Error al cargar los movimientos</div>
        </div>
      </CustomPageLayout>
    )
  }

  return (
    <CustomPageLayout
      icon={DollarSign}
      title="Gestión de Movimientos"
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      filters={[
        { label: 'Todos', onClick: () => setFilterType('all') },
        { label: 'Ingresos', onClick: () => setFilterType('income') },
        { label: 'Gastos', onClick: () => setFilterType('expense') },
        { label: 'Transferencias', onClick: () => setFilterType('transfer') }
      ]}
      onClearFilters={() => {
        setSearchTerm('')
        setFilterType('all')
      }}
      actions={[
        <Button key="new" onClick={() => setShowNewMovementModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Movimiento
        </Button>
      ]}
    >
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No hay movimientos</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Comienza registrando tu primer movimiento financiero
        </p>
        <Button onClick={() => setShowNewMovementModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Movimiento
        </Button>
      </div>

      {/* New Movement Modal */}
      <NewMovementModal
        open={showNewMovementModal}
        onClose={handleCloseModal}
        editingMovement={editingMovement}
      />
    </CustomPageLayout>
  )
}