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
  subcategory_id?: string
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
      return await apiRequest(`/api/movements/${movementId}`, 'DELETE', undefined)
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

  const filteredMovements = movements.filter(movement => {
    const matchesSearch = movement.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const filters = [
    { label: 'Todos los movimientos', onClick: () => setFilterType('all') },
    { label: 'Ingresos', onClick: () => setFilterType('income') },
    { label: 'Gastos', onClick: () => setFilterType('expense') },
    { label: 'Transferencias', onClick: () => setFilterType('transfer') }
  ]

  const actions = (
    <Button variant="default" onClick={() => setShowNewMovementModal(true)}>
      <Plus className="mr-2 h-4 w-4" />
      Nuevo movimiento
    </Button>
  )

  const handleClearFilters = () => {
    setSearchTerm('')
    setFilterType('all')
  }

  if (isLoading) {
    return (
      <CustomPageLayout
        icon={DollarSign}
        title="Gestión de Movimientos"
        actions={actions}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onClearFilters={handleClearFilters}
        showSearch={true}
      >
        <div className="p-8 text-center text-muted-foreground">
          Cargando movimientos...
        </div>
      </CustomPageLayout>
    )
  }

  if (error) {
    return (
      <CustomPageLayout
        icon={DollarSign}
        title="Gestión de Movimientos"
        actions={actions}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onClearFilters={handleClearFilters}
        showSearch={true}
      >
        <div className="p-8 text-center text-muted-foreground">
          Error al cargar los movimientos: {(error as Error).message}
        </div>
      </CustomPageLayout>
    )
  }

  return (
    <>
      <CustomPageLayout
        icon={DollarSign}
        title="Gestión de Movimientos"
        actions={actions}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onClearFilters={handleClearFilters}
        showSearch={true}
      >
        {filteredMovements.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {movements.length === 0 
              ? "No hay movimientos registrados. Crea tu primer movimiento financiero."
              : "No se encontraron movimientos que coincidan con tu búsqueda."
            }
          </div>
        ) : (
          <div className="space-y-0">
            {/* Column Headers */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-muted-foreground border-b border-[var(--card-border)]">
              <div className="col-span-1">Fecha</div>
              <div className="col-span-2">Descripción</div>
              <div className="col-span-1">Cantidad</div>
              <div className="col-span-1">Tipo</div>
              <div className="col-span-1">Categoría</div>
              <div className="col-span-1">Moneda</div>
              <div className="col-span-1">Billetera</div>
              <div className="col-span-2">Creador</div>
              <div className="col-span-1">Conversión</div>
              <div className="col-span-1">Acciones</div>
            </div>

            {/* Movement Rows */}
            {filteredMovements.map((movement) => (
              <div
                key={movement.id}
                className="grid grid-cols-12 gap-4 px-4 py-3 text-sm border-b border-[var(--card-border)] hover:bg-[var(--card-bg)] transition-colors"
              >
                <div className="col-span-1 text-muted-foreground">
                  {formatDate(movement.created_at)}
                </div>
                <div className="col-span-2 font-medium truncate">
                  {movement.description}
                </div>
                <div className="col-span-1 font-medium">
                  {formatCurrency(movement.amount)}
                </div>
                <div className="col-span-1">
                  <Badge variant="outline" className="text-xs">
                    Tipo
                  </Badge>
                </div>
                <div className="col-span-1">
                  <Badge variant="outline" className="text-xs">
                    Categoría
                  </Badge>
                </div>
                <div className="col-span-1">
                  <Badge variant="outline" className="text-xs">
                    EUR
                  </Badge>
                </div>
                <div className="col-span-1">
                  <Badge variant="outline" className="text-xs">
                    Principal
                  </Badge>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={movement.creator?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {movement.creator?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 
                       movement.creator?.email?.slice(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm">
                    {movement.creator?.full_name || movement.creator?.email || 'Usuario'}
                  </span>
                </div>
                <div className="col-span-1">
                  {movement.is_conversion && (
                    <Badge variant="secondary" className="text-xs">
                      Conversión
                    </Badge>
                  )}
                </div>
                <div className="col-span-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditMovement(movement)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteMovement(movement)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CustomPageLayout>

      <NewMovementModal
        open={showNewMovementModal}
        onClose={handleCloseModal}
        editingMovement={editingMovement}
      />

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
    </>
  )
}