import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Building2, Plus, Edit, Trash2, MoreHorizontal } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { CustomTable } from '@/components/ui-custom/CustomTable'
import { NewAdminOrganizationModal } from '@/modals/NewAdminOrganizationModal'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'

interface Organization {
  id: string
  name: string
  created_at: string
  is_active: boolean
  plan?: {
    name: string
  }
  creator?: {
    full_name?: string
    email: string
  }
}

export function AdminOrganizations() {
  const { toast } = useToast()
  const [showNewOrganizationModal, setShowNewOrganizationModal] = useState(false)
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null)
  const [deletingOrganization, setDeletingOrganization] = useState<Organization | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc")
  const [statusFilter, setStatusFilter] = useState("all")

  // Fetch organizations with joins
  const { data: organizations = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-organizations'],
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data, error } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          created_at,
          is_active,
          plan:plans ( name ),
          creator:users!created_by ( full_name, email )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching organizations:', error)
        throw error
      }

      return data || []
    }
  })

  // Delete organization mutation
  const deleteOrganizationMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      // First check if organization has projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .eq('organization_id', organizationId)
        .limit(1)

      if (projectsError) {
        throw new Error(`Error verificando proyectos: ${projectsError.message}`)
      }

      if (projects && projects.length > 0) {
        throw new Error('No se puede eliminar una organización que tiene proyectos asociados')
      }

      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', organizationId)

      if (error) {
        throw new Error(`Error al eliminar organización: ${error.message}`)
      }
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Organización eliminada correctamente"
      })
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] })
      setDeletingOrganization(null)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la organización",
        variant: "destructive"
      })
    }
  })

  const handleEdit = (organization: Organization) => {
    setEditingOrganization(organization)
    setShowNewOrganizationModal(true)
  }

  const handleDelete = (organization: Organization) => {
    setDeletingOrganization(organization)
  }

  const confirmDelete = () => {
    if (deletingOrganization) {
      deleteOrganizationMutation.mutate(deletingOrganization.id)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSortBy("name")
    setSortOrder("asc")
    setStatusFilter("all")
  }

  const customFilters = (
    <div className="space-y-4 w-[288px]">
      <div>
        <Label>Ordenar por</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nombre</SelectItem>
            <SelectItem value="created_at">Fecha de creación</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Orden</Label>
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascendente</SelectItem>
            <SelectItem value="desc">Descendente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Estado</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="inactive">Inactivo</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  // Filter organizations by search term
  const filteredOrganizations = organizations.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.creator?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.creator?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.plan?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const columns = [
    {
      key: 'name',
      label: 'Organización',
      sortable: true,
      sortType: 'string' as const,
      render: (organization: Organization) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{organization.name}</span>
        </div>
      )
    },
    {
      key: 'creator',
      label: 'Creado por',
      sortable: true,
      sortType: 'string' as const,
      render: (organization: Organization) => (
        <span className="text-xs">
          {organization.creator?.full_name || organization.creator?.email || 'N/A'}
        </span>
      )
    },
    {
      key: 'created_at',
      label: 'Fecha de creación',
      sortable: true,
      sortType: 'date' as const,
      render: (organization: Organization) => (
        <span className="text-xs">
          {format(new Date(organization.created_at), 'dd/MM/yyyy', { locale: es })}
        </span>
      )
    },
    {
      key: 'plan',
      label: 'Plan',
      sortable: true,
      sortType: 'string' as const,
      render: (organization: Organization) => (
        <Badge variant="outline" className="text-xs">
          {organization.plan?.name || 'Sin plan'}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      sortType: 'string' as const,
      render: (organization: Organization) => (
        <Badge 
          variant={organization.is_active ? "default" : "secondary"}
          className="text-xs"
        >
          {organization.is_active ? 'Activa' : 'Inactiva'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      sortable: false,
      render: (organization: Organization) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(organization)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDelete(organization)}
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
      <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-sm font-medium">No hay organizaciones</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Comienza creando una nueva organización.
      </p>
      <Button 
        onClick={() => setShowNewOrganizationModal(true)}
        className="mt-4"
      >
        <Plus className="mr-2 h-4 w-4" />
        Nueva organización
      </Button>
    </div>
  )

  return (
    <Layout headerProps={headerProps}>
    <>
      <CustomPageLayout
        icon={Building2}
        title="Gestión de Organizaciones"
        showSearch={true}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onClearFilters={clearFilters}
        customFilters={customFilters}
        actions={[
          <Button 
            key="new"
            onClick={() => {
              setEditingOrganization(null)
              setShowNewOrganizationModal(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva organización
          </Button>
        ]}
      >
        <CustomTable
          data={filteredOrganizations}
          columns={columns}
          isLoading={isLoading}
          emptyState={emptyState}
        />
      

      {/* Create/Edit Organization Modal */}
      {showNewOrganizationModal && (
        <NewAdminOrganizationModal
          open={showNewOrganizationModal}
          onClose={() => {
            setShowNewOrganizationModal(false)
            setEditingOrganization(null)
          }}
          editingOrganization={editingOrganization}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingOrganization} onOpenChange={() => setDeletingOrganization(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la organización "{deletingOrganization?.name}".
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