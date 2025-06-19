import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react'

import { CustomPageLayout } from '@/components/ui-custom/CustomPageLayout'
import { CustomPageHeader } from '@/components/ui-custom/CustomPageHeader'
import { CustomPageBody } from '@/components/ui-custom/CustomPageBody'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { queryClient } from '@/lib/queryClient'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useMovements } from '@/hooks/use-movements'
import { NewMovementModal } from '@/modals/NewMovementModal'

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
  movement_data?: {
    type?: {
      id: string
      name: string
    }
    category?: {
      id: string
      name: string
    }
    currency?: {
      id: string
      name: string
      code: string
    }
    wallet?: {
      id: string
      name: string
    }
  }
  creator?: {
    id: string
    full_name?: string
    email: string
    avatar_url?: string
  }
}

export default function Movements() {
  const { data: userData } = useCurrentUser()
  const { data: movements, isLoading, error } = useMovements(userData?.organization?.id, userData?.preferences?.last_project_id)
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [showNewMovementModal, setShowNewMovementModal] = useState(false)
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null)
  const [deletingMovement, setDeletingMovement] = useState<Movement | null>(null)

  // Delete movement mutation
  const deleteMovementMutation = useMutation({
    mutationFn: async (movementId: string) => {
      const response = await fetch(`/api/movements/${movementId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar el movimiento')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.refetchQueries({ queryKey: ['movements'] })
      
      toast({
        title: "Movimiento eliminado",
        description: "El movimiento se ha eliminado correctamente."
      })
      
      setDeletingMovement(null)
    },
    onError: (error: any) => {
      console.error('Error deleting movement:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo eliminar el movimiento"
      })
    }
  })

  const handleEditMovement = (movement: Movement) => {
    setEditingMovement(movement)
    setShowNewMovementModal(true)
  }

  const handleDeleteMovement = (movement: Movement) => {
    setDeletingMovement(movement)
  }

  const handleCloseModal = () => {
    setShowNewMovementModal(false)
    setEditingMovement(null)
  }

  const filteredMovements = movements?.filter((movement) => {
    const matchesSearch = movement.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.movement_data?.type?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.movement_data?.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterType === 'all') return matchesSearch
    // Add type filtering logic based on movement_data?.type?.name
    return matchesSearch
  }) || []

  const formatCurrency = (amount: number, currencyCode: string = 'USD') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currencyCode
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getCreatorInfo = (movement: Movement) => {
    if (movement.creator?.full_name) {
      return movement.creator.full_name
    }
    return movement.creator?.email || 'Usuario'
  }

  const getCreatorInitials = (movement: Movement) => {
    const name = getCreatorInfo(movement)
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getAmountBadgeVariant = (amount: number) => {
    return amount >= 0 ? 'default' : 'destructive'
  }

  if (isLoading) {
    return (
      <CustomPageLayout>
        <CustomPageHeader
          icon={DollarSign}
          title="Gestión de Movimientos"
          showSearch={false}
        />
        <CustomPageBody padding="md">
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-muted-foreground">Cargando movimientos...</div>
          </div>
        </CustomPageBody>
      </CustomPageLayout>
    )
  }

  if (error) {
    return (
      <CustomPageLayout>
        <CustomPageHeader
          icon={DollarSign}
          title="Gestión de Movimientos"
          showSearch={false}
        />
        <CustomPageBody padding="md">
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-red-600">Error al cargar los movimientos</div>
          </div>
        </CustomPageBody>
      </CustomPageLayout>
    )
  }

  return (
    <CustomPageLayout>
      <CustomPageHeader
        icon={DollarSign}
        title="Gestión de Movimientos"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={[
          { value: 'all', label: 'Todos' },
          { value: 'income', label: 'Ingresos' },
          { value: 'expense', label: 'Gastos' },
          { value: 'transfer', label: 'Transferencias' }
        ]}
        filterValue={filterType}
        onFilterChange={(value) => setFilterType(value as FilterType)}
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
      />

      <CustomPageBody padding="none">
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
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--card-border)]">
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Fecha</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Descripción</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Monto</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Categoría</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Moneda</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Billetera</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Creado por</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.map((movement) => (
                  <tr key={movement.id} className="border-b border-[var(--card-border)] hover:bg-[var(--card-bg)]">
                    <td className="p-4 text-xs">{formatDate(movement.created_at)}</td>
                    <td className="p-4">
                      <div className="font-medium text-sm">{movement.description}</div>
                    </td>
                    <td className="p-4">
                      <Badge variant={getAmountBadgeVariant(movement.amount)} className="text-xs">
                        {formatCurrency(movement.amount, movement.movement_data?.currency?.code)}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs">{movement.movement_data?.type?.name || '-'}</td>
                    <td className="p-4 text-xs">{movement.movement_data?.category?.name || '-'}</td>
                    <td className="p-4 text-xs">{movement.movement_data?.currency?.code || '-'}</td>
                    <td className="p-4 text-xs">{movement.movement_data?.wallet?.name || '-'}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={movement.creator?.avatar_url || ''} />
                          <AvatarFallback className="text-xs">
                            {getCreatorInitials(movement)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs">{getCreatorInfo(movement)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            ⋮
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleEditMovement(movement)}>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CustomPageBody>

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