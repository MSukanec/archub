import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Building, Crown, Plus, Calendar, Shield, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function OrganizationManagement() {
  const [searchValue, setSearchValue] = useState("")
  const [sortBy, setSortBy] = useState('date_recent')
  const [filterByStatus, setFilterByStatus] = useState('all')
  const [editingOrganization, setEditingOrganization] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [organizationToDelete, setOrganizationToDelete] = useState<any>(null)
  
  const { data: userData, isLoading } = useCurrentUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Filtrar y ordenar organizaciones
  let filteredOrganizations = userData?.organizations?.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchValue.toLowerCase())
    
    if (filterByStatus === "all") return matchesSearch
    if (filterByStatus === "active") return matchesSearch && org.is_active
    if (filterByStatus === "system") return matchesSearch && org.is_system
    if (filterByStatus === "regular") return matchesSearch && !org.is_system
    
    return matchesSearch
  }) || []

  // Aplicar ordenamiento
  filteredOrganizations = [...filteredOrganizations].sort((a, b) => {
    switch (sortBy) {
      case 'name_asc':
        return a.name.localeCompare(b.name)
      case 'name_desc':
        return b.name.localeCompare(a.name)
      case 'date_recent':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'date_oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      default:
        return 0
    }
  })

  // Poner la organización activa primero
  const activeOrgId = userData?.preferences?.last_organization_id
  if (activeOrgId) {
    filteredOrganizations = [
      ...filteredOrganizations.filter(org => org.id === activeOrgId),
      ...filteredOrganizations.filter(org => org.id !== activeOrgId)
    ]
  }

  // Mutación para seleccionar organización
  const selectOrganizationMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      const { error } = await supabase
        .from('user_preferences')
        .update({ last_organization_id: organizationId })
        .eq('user_id', userData?.user.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      toast({
        title: "Organización seleccionada",
        description: "La organización se ha seleccionado correctamente"
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo seleccionar la organización",
        variant: "destructive"
      })
    }
  })

  const handleSelectOrganization = (organizationId: string) => {
    selectOrganizationMutation.mutate(organizationId)
  }

  const handleEdit = (organization: any) => {
    setEditingOrganization(organization)
    // TODO: Abrir modal de edición
  }

  const handleDeleteClick = (organization: any) => {
    setOrganizationToDelete(organization)
    setDeleteDialogOpen(true)
  }

  const clearFilters = () => {
    setSearchValue("")
    setSortBy('date_recent')
    setFilterByStatus('all')
  }

  // Filtros personalizados
  const customFilters = (
    <div className="w-72 p-4 space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Ordenar por</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_recent">Fecha (Más reciente)</SelectItem>
            <SelectItem value="date_oldest">Fecha (Más antigua)</SelectItem>
            <SelectItem value="name_asc">Nombre (A-Z)</SelectItem>
            <SelectItem value="name_desc">Nombre (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Filtrar por estado</Label>
        <Select value={filterByStatus} onValueChange={setFilterByStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="active">Activas</SelectItem>
            <SelectItem value="system">Sistema</SelectItem>
            <SelectItem value="regular">Regulares</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const actions = (
    <Button className="h-8 px-3 text-sm">
      <Plus className="w-4 h-4 mr-2" />
      Nueva Organización
    </Button>
  )

  const headerProps = {
    title: "Gestión de Organizaciones",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    showFilters: true,
    customFilters,
    onClearFilters: clearFilters,
    actions
  }

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="p-8 text-center text-muted-foreground">
          Cargando organizaciones...
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps}>
      <div>
        {/* Headers de columnas */}
        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground border-b">
          <div className="col-span-2">Fecha</div>
          <div className="col-span-3">Organización</div>
          <div className="col-span-2">Plan</div>
          <div className="col-span-2">Estado</div>
          <div className="col-span-2">Tipo</div>
          <div className="col-span-1">Acciones</div>
        </div>

        {/* Lista de organizaciones */}
        <div className="space-y-1">
          {filteredOrganizations.map((organization) => {
            const isSelected = userData?.organization?.id === organization.id
            
            return (
              <Card 
                key={organization.id} 
                className={`w-full cursor-pointer transition-all hover:shadow-sm border ${
                  isSelected ? 'border-[var(--accent)] bg-[var(--accent-bg)]' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelectOrganization(organization.id)
                }}
              >
                <CardContent className="p-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Fecha */}
                    <div className="col-span-2 text-xs text-muted-foreground">
                      {format(new Date(organization.created_at), 'dd/MM/yyyy', { locale: es })}
                    </div>

                    {/* Organización */}
                    <div className="col-span-3 flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {organization.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {organization.name}
                          {isSelected && (
                            <Badge variant="secondary" className="text-xs">
                              Activa
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Plan */}
                    <div className="col-span-2 text-xs">
                      {organization.plan ? (
                        <div className="flex items-center gap-1">
                          <Crown className="w-3 h-3 text-yellow-500" />
                          <span>{organization.plan.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Sin plan</span>
                      )}
                    </div>

                    {/* Estado */}
                    <div className="col-span-2">
                      <Badge variant={organization.is_active ? "default" : "secondary"} className="text-xs">
                        {organization.is_active ? "Activa" : "Inactiva"}
                      </Badge>
                    </div>

                    {/* Tipo */}
                    <div className="col-span-2">
                      {organization.is_system ? (
                        <Badge variant="outline" className="text-xs">
                          <Shield className="w-3 h-3 mr-1" />
                          Sistema
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Regular</span>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="col-span-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(organization)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(organization)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredOrganizations.length === 0 && (
          <Card className="mt-4">
            <CardContent className="text-center py-8">
              <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No se encontraron organizaciones
              </h3>
              <p className="text-muted-foreground">
                {searchValue || filterByStatus !== "all" 
                  ? "Intenta ajustar los filtros de búsqueda" 
                  : "Aún no perteneces a ninguna organización"
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Diálogo de confirmación para eliminar */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar organización?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará permanentemente la organización "{organizationToDelete?.name}". 
                Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  // TODO: Implementar eliminación
                  setDeleteDialogOpen(false)
                  setOrganizationToDelete(null)
                }}
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  )
}