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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CustomPageLayout } from '@/components/ui-custom/CustomPageLayout'
import { CustomTable } from '@/components/ui-custom/CustomTable'
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
  const [filterByType, setFilterByType] = useState<string>('all')
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
    setFilterByType('all')
    setFilterByCategory('')
    setShowConversionsOnly(false)
  }

  const filteredAndSortedMovements = movements
    .filter(movement => {
      const matchesSearch = movement.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           movement.movement_data?.type?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           movement.movement_data?.category?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           movement.creator?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesType = filterByType === 'all' || movement.type_id === filterByType
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
            <SelectItem value="all">Todos los tipos</SelectItem>
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

  const tableColumns = [
    {
      key: 'created_at',
      label: 'Fecha',
      sortable: true,
      sortType: 'date' as const,
      render: (movement: Movement) => (
        <span className="text-xs">
          {format(new Date(movement.created_at), 'dd/MM/yyyy', { locale: es })}
        </span>
      )
    },
    {
      key: 'creator',
      label: 'Creador',
      sortable: true,
      sortType: 'string' as const,
      render: (movement: Movement) => (
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
      )
    },
    {
      key: 'type',
      label: 'Tipo',
      sortable: true,
      sortType: 'string' as const,
      render: (movement: Movement) => {
        const typeName = movement.movement_data?.type?.name || 'Sin tipo'
        const isIngreso = typeName.toLowerCase().includes('ingreso')
        const isEgreso = typeName.toLowerCase().includes('egreso')
        
        let badgeClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
        
        if (isIngreso) {
          badgeClasses += " bg-green-500"
        } else if (isEgreso) {
          badgeClasses += " bg-red-500"
        } else {
          badgeClasses += " bg-gray-400"
        }
        
        return (
          <span className={badgeClasses}>
            {typeName}
          </span>
        )
      }
    },
    {
      key: 'category',
      label: 'Categoría',
      sortable: true,
      sortType: 'string' as const,
      render: (movement: Movement) => (
        <span className="text-xs">
          {movement.movement_data?.category?.name || 'Sin categoría'}
        </span>
      )
    },
    {
      key: 'subcategory',
      label: 'Subcategoría',
      sortable: true,
      sortType: 'string' as const,
      render: (movement: Movement) => (
        <span className="text-xs text-muted-foreground">
          {movement.movement_data?.subcategory?.name || '-'}
        </span>
      )
    },
    {
      key: 'description',
      label: 'Descripción',
      sortable: true,
      sortType: 'string' as const,
      render: (movement: Movement) => (
        <span className="text-xs truncate">
          {movement.description || <span className="text-muted-foreground">Sin descripción</span>}
        </span>
      )
    },
    {
      key: 'currency',
      label: 'Moneda',
      sortable: true,
      sortType: 'string' as const,
      render: (movement: Movement) => (
        <span className="text-xs">
          {movement.movement_data?.currency?.code || movement.movement_data?.currency?.name || 'N/A'}
        </span>
      )
    },
    {
      key: 'wallet',
      label: 'Billetera',
      sortable: true,
      sortType: 'string' as const,
      render: (movement: Movement) => (
        <span className="text-xs">
          {movement.movement_data?.wallet?.name || 'N/A'}
        </span>
      )
    },
    {
      key: 'amount',
      label: 'Cantidad',
      sortable: true,
      sortType: 'number' as const,
      render: (movement: Movement) => (
        <span className="text-xs font-medium">
          {movement.movement_data?.currency?.symbol || '$'}{movement.amount.toLocaleString()}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      sortable: false,
      render: (movement: Movement) => (
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
      )
    }
  ]

  const emptyState = (
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
  )

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
        wide={true}
      >
        <CustomTable
          columns={tableColumns}
          data={filteredAndSortedMovements}
          isLoading={isLoading}
          emptyState={emptyState}
        />
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