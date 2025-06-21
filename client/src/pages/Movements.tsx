import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { DollarSign, Plus, Edit, Trash2, MoreHorizontal, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CustomPageLayout } from '@/components/ui-custom/CustomPageLayout'
import { NewMovementModal } from '@/modals/NewMovementModal'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useMovements } from '@/hooks/use-movements'
import { useMovementConcepts } from '@/hooks/use-movement-concepts'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'

type SortBy = 'date' | 'amount' | 'type' | 'category'
type SortOrder = 'asc' | 'desc'

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
  movement_data?: {
    type?: {
      id: string
      name: string
    }
    category?: {
      id: string
      name: string
    }
    subcategory?: {
      id: string
      name: string
    }
    currency?: {
      id: string
      name: string
      code: string
      symbol?: string
    }
    wallet?: {
      id: string
      name: string
    }
  }
}

export default function Movements() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [filterByType, setFilterByType] = useState<string>('')
  const [filterByCategory, setFilterByCategory] = useState<string>('')
  const [showConversionsOnly, setShowConversionsOnly] = useState(false)
  const [showNewMovementModal, setShowNewMovementModal] = useState(false)
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null)
  const [deletingMovement, setDeletingMovement] = useState<Movement | null>(null)

  const { toast } = useToast()
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.preferences?.last_organization_id
  const projectId = userData?.preferences?.last_project_id
  
  const { data: movements = [], isLoading, refetch } = useMovements(organizationId, projectId)
  const { data: movementTypes = [] } = useMovementConcepts('types')

  const deleteMovementMutation = useMutation({
    mutationFn: async (movementId: string) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { error } = await supabase
        .from('movements')
        .delete()
        .eq('id', movementId)

      if (error) {
        throw new Error(`Error al eliminar movimiento: ${error.message}`)
      }
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Movimiento eliminado correctamente"
      })
      queryClient.invalidateQueries({ queryKey: ['movements', organizationId, projectId] })
      setDeletingMovement(null)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el movimiento",
        variant: "destructive"
      })
    }
  })

  const handleEdit = (movement: Movement) => {
    setEditingMovement(movement)
    setShowNewMovementModal(true)
  }

  const handleDelete = (movement: Movement) => {
    setDeletingMovement(movement)
  }

  const confirmDelete = () => {
    if (deletingMovement) {
      deleteMovementMutation.mutate(deletingMovement.id)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSortBy('date')
    setSortOrder('desc')
    setFilterByType('')
    setFilterByCategory('')
    setShowConversionsOnly(false)
  }

  const filteredAndSortedMovements = movements
    .filter(movement => {
      const matchesSearch = movement.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           movement.movement_data?.type?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           movement.movement_data?.category?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           movement.creator?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesType = !filterByType || movement.type_id === filterByType
      const matchesCategory = !filterByCategory || movement.category_id === filterByCategory
      const matchesConversion = !showConversionsOnly || movement.is_conversion
      
      return matchesSearch && matchesType && matchesCategory && matchesConversion
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'amount':
          comparison = a.amount - b.amount
          break
        case 'type':
          comparison = (a.movement_data?.type?.name || '').localeCompare(b.movement_data?.type?.name || '')
          break
        case 'category':
          comparison = (a.movement_data?.category?.name || '').localeCompare(b.movement_data?.category?.name || '')
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const customFilters = (
    <div className="space-y-4 w-[288px]">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Ordenar por</Label>
        <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Fecha</SelectItem>
            <SelectItem value="amount">Cantidad</SelectItem>
            <SelectItem value="type">Tipo</SelectItem>
            <SelectItem value="category">Categoría</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Orden</Label>
        <Select value={sortOrder} onValueChange={(value: SortOrder) => setSortOrder(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Descendente</SelectItem>
            <SelectItem value="asc">Ascendente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Filtrar por tipo</Label>
        <Select value={filterByType} onValueChange={setFilterByType}>
          <SelectTrigger>
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los tipos</SelectItem>
            {movementTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Solo conversiones</Label>
        <Switch
          checked={showConversionsOnly}
          onCheckedChange={setShowConversionsOnly}
        />
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <CustomPageLayout
        icon={DollarSign}
        title="Gestión de Movimientos"
        showSearch={true}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        actions={[
          <Button key="new" onClick={() => setShowNewMovementModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo movimiento
          </Button>
        ]}
        customFilters={customFilters}
        onClearFilters={clearFilters}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando movimientos...</div>
        </div>
      </CustomPageLayout>
    )
  }

  return (
    <>
      <CustomPageLayout
        icon={DollarSign}
        title="Gestión de Movimientos"
        showSearch={true}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        actions={[
          <Button key="new" onClick={() => setShowNewMovementModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo movimiento
          </Button>
        ]}
        customFilters={customFilters}
        onClearFilters={clearFilters}
      >
        {/* Column Headers */}
        <div className="grid grid-cols-10 gap-4 p-4 bg-muted/50 rounded-lg text-xs font-medium text-muted-foreground mb-4">
          <div>Fecha</div>
          <div>Creador</div>
          <div>Tipo</div>
          <div>Categoría</div>
          <div>Subcategoría</div>
          <div>Descripción</div>
          <div>Moneda</div>
          <div>Billetera</div>
          <div>Cantidad</div>
          <div>Acciones</div>
        </div>

        {/* Movement Cards */}
        <div className="space-y-3">
          {filteredAndSortedMovements.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-sm font-medium">No hay movimientos</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Comienza creando tu primer movimiento financiero.
              </p>
              <Button className="mt-4" onClick={() => setShowNewMovementModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo movimiento
              </Button>
            </div>
          ) : (
            filteredAndSortedMovements.map((movement) => (
              <div
                key={movement.id}
                className="grid grid-cols-10 gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* Fecha */}
                <div className="text-xs">
                  {format(new Date(movement.created_at), 'dd/MM/yyyy', { locale: es })}
                </div>

                {/* Creador */}
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={movement.creator?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {movement.creator?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 
                       movement.creator?.email?.slice(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs truncate">
                    {movement.creator?.full_name || movement.creator?.email || 'Usuario'}
                  </span>
                </div>

                {/* Tipo */}
                <div className="text-xs">
                  <Badge variant="secondary" className="text-xs">
                    {movement.movement_data?.type?.name || 'Sin tipo'}
                  </Badge>
                </div>

                {/* Categoría */}
                <div className="text-xs">
                  <Badge variant="outline" className="text-xs">
                    {movement.movement_data?.category?.name || 'Sin categoría'}
                  </Badge>
                </div>

                {/* Subcategoría */}
                <div className="text-xs">
                  {movement.movement_data?.subcategory?.name ? (
                    <Badge variant="outline" className="text-xs">
                      {movement.movement_data.subcategory.name}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>

                {/* Descripción */}
                <div className="text-xs truncate">
                  {movement.description || <span className="text-muted-foreground">Sin descripción</span>}
                </div>

                {/* Moneda */}
                <div className="text-xs">
                  <Badge variant="secondary" className="text-xs">
                    {movement.movement_data?.currency?.code || movement.movement_data?.currency?.name || 'N/A'}
                  </Badge>
                </div>

                {/* Billetera */}
                <div className="text-xs">
                  <Badge variant="outline" className="text-xs">
                    {movement.movement_data?.wallet?.name || 'N/A'}
                  </Badge>
                </div>

                {/* Cantidad */}
                <div className="text-xs font-medium">
                  {movement.movement_data?.currency?.symbol || '$'}{movement.amount.toLocaleString()}
                </div>

                {/* Acciones */}
                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(movement)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(movement)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </CustomPageLayout>

      {/* New/Edit Movement Modal */}
      <NewMovementModal
        open={showNewMovementModal}
        onClose={() => {
          setShowNewMovementModal(false)
          setEditingMovement(null)
        }}
        editingMovement={editingMovement}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingMovement} onOpenChange={() => setDeletingMovement(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el movimiento
              "{deletingMovement?.description || 'Sin descripción'}" por un valor de{' '}
              {deletingMovement?.movement_data?.currency?.symbol || '$'}
              {deletingMovement?.amount.toLocaleString()}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}