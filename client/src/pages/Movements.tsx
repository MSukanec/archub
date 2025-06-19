import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { DollarSign, Plus, Edit, Trash2, MoreHorizontal } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { CustomPageLayout } from '@/components/ui-custom/CustomPageLayout'
import { NewMovementModal } from '@/modals/NewMovementModal'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useMovements } from '@/hooks/use-movements'
import { useToast } from '@/hooks/use-toast'
import { queryClient, apiRequest } from '@/lib/queryClient'

type FilterType = 'all' | 'income' | 'expense' | 'transfer'

interface Movement {
  id: string
  description: string
  amount: number
  created_at: string
  created_by: string
  organization_id: string
  project_id: string
  type_id: string
  category_id: string
  currency_id: string
  wallet_id: string
  file_url?: string
  related_contact_id?: string
  related_task_id?: string
  is_conversion: boolean
  creator?: {
    id: string
    full_name?: string
    email: string
    avatar_url?: string
  }
}

export default function Movements() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [showNewMovementModal, setShowNewMovementModal] = useState(false)
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null)
  const [deletingMovement, setDeletingMovement] = useState<Movement | null>(null)

  const { toast } = useToast()
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.preferences?.last_organization_id
  const projectId = userData?.preferences?.last_project_id

  const { data: movements = [], isLoading, error } = useMovements(organizationId, projectId)

  const deleteMovementMutation = useMutation({
    mutationFn: async (movementId: string) => {
      return await apiRequest(`/api/movements/${movementId}`, {
        method: 'DELETE'
      })
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Movimiento eliminado correctamente"
      })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      setDeletingMovement(null)
    },
    onError: (error: any) => {
      console.error('Error deleting movement:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el movimiento",
        variant: "destructive"
      })
    }
  })

  const handleCloseModal = () => {
    setShowNewMovementModal(false)
    setEditingMovement(null)
  }

  const handleEditMovement = (movement: Movement) => {
    setEditingMovement(movement)
    setShowNewMovementModal(true)
  }

  const handleDeleteMovement = (movement: Movement) => {
    setDeletingMovement(movement)
  }

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: es })
  }

  const formatCurrency = (amount: number, currencyCode?: string) => {
    return `${amount.toFixed(2)} ${currencyCode || ''}`
  }

  const getCreatorInfo = (movement: Movement) => {
    return movement.creator?.full_name || movement.creator?.email || 'Usuario desconocido'
  }

  const getCreatorInitials = (movement: Movement) => {
    const name = getCreatorInfo(movement)
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getAmountBadgeVariant = (amount: number) => {
    return amount >= 0 ? 'default' : 'destructive'
  }

  // Filter movements based on search and filter type
  const filteredMovements = movements.filter(movement => {
    const matchesSearch = movement.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || 
      (filterType === 'income' && movement.amount > 0) ||
      (filterType === 'expense' && movement.amount < 0) ||
      (filterType === 'transfer' && movement.is_conversion)
    
    return matchesSearch && matchesFilter
  })

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
      {filteredMovements.length === 0 ? (
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
      ) : (
        <div className="overflow-x-auto">
          {/* Column Headers */}
          <div className="grid grid-cols-9 gap-4 p-4 border-b border-[var(--card-border)] bg-[var(--card-bg)]">
            <div className="text-xs font-medium text-muted-foreground">Fecha</div>
            <div className="text-xs font-medium text-muted-foreground">Descripción</div>
            <div className="text-xs font-medium text-muted-foreground">Monto</div>
            <div className="text-xs font-medium text-muted-foreground">Tipo</div>
            <div className="text-xs font-medium text-muted-foreground">Categoría</div>
            <div className="text-xs font-medium text-muted-foreground">Moneda</div>
            <div className="text-xs font-medium text-muted-foreground">Billetera</div>
            <div className="text-xs font-medium text-muted-foreground">Creado por</div>
            <div className="text-xs font-medium text-muted-foreground">Acciones</div>
          </div>

          {/* Movement Cards */}
          <div className="space-y-2">
            {filteredMovements.map((movement) => (
              <div
                key={movement.id}
                className="grid grid-cols-9 gap-4 p-4 border border-[var(--card-border)] bg-[var(--card-bg)] hover:bg-[var(--card-hover-bg)] transition-colors"
              >
                <div className="text-xs">{formatDate(movement.created_at)}</div>
                <div>
                  <div className="font-medium text-sm truncate">{movement.description}</div>
                  {movement.file_url && (
                    <div className="text-xs text-blue-600 mt-1">📎 Archivo adjunto</div>
                  )}
                </div>
                <div>
                  <Badge variant={getAmountBadgeVariant(movement.amount)} className="text-xs">
                    {formatCurrency(movement.amount)}
                  </Badge>
                  {movement.is_conversion && (
                    <div className="text-xs text-orange-600 mt-1">Conversión</div>
                  )}
                </div>
                <div className="text-xs">{movement.type_id}</div>
                <div className="text-xs">{movement.category_id}</div>
                <div className="text-xs">{movement.currency_id}</div>
                <div className="text-xs">{movement.wallet_id}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={movement.creator?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {getCreatorInitials(movement)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs truncate">
                      {getCreatorInfo(movement)}
                    </span>
                  </div>
                </div>
                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleEditMovement(movement)}
                        className="text-blue-600"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteMovement(movement)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New/Edit Movement Modal */}
      <NewMovementModal
        open={showNewMovementModal}
        onClose={handleCloseModal}
        editingMovement={editingMovement}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingMovement} onOpenChange={() => setDeletingMovement(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar movimiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El movimiento "{deletingMovement?.description}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingMovement && deleteMovementMutation.mutate(deletingMovement.id)}
              disabled={deleteMovementMutation.isPending}
            >
              {deleteMovementMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CustomPageLayout>
  )
}