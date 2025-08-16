import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Building, Crown, Plus, Calendar, Shield, MoreHorizontal, Edit, Trash2, Users, Settings, Network, BarChart3 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { useNavigationStore } from '@/stores/navigationStore'
import { useLocation } from 'wouter'
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { ActiveOrganizationMembersCard } from '@/components/ui-custom/ActiveOrganizationMembersCard'
import { useProjectContext } from '@/stores/projectContext'
import { useAuthStore } from '@/stores/authStore'

// Componente para una sola tarjeta de organización
function OrganizationCard({ organization, isSelected, onSelect, onEdit, onDelete }: {
  organization: any,
  isSelected: boolean,
  onSelect: (id: string) => void,
  onEdit: (org: any) => void,
  onDelete: (org: any) => void
}) {
  const { data: members = [] } = useOrganizationMembers(organization.id)

  return (
    <Card 
      className={`w-full cursor-pointer transition-all hover:shadow-sm border ${
        isSelected ? 'border-[var(--accent)] bg-[var(--accent-bg)]' : ''
      }`}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(organization.id)
      }}
    >
      <CardContent className="p-4">
        <div className="grid grid-cols-6 gap-4 items-center">
          {/* Fecha */}
          <div className="col-span-1 text-xs text-muted-foreground">
            {format(new Date(organization.created_at), 'dd/MM/yyyy', { locale: es })}
          </div>

          {/* Organización */}
          <div className="col-span-1 flex items-center gap-2">
            <Avatar className="w-8 h-8 avatar-border">
              <AvatarFallback className="text-xs">
                {organization.name?.substring(0, 2)?.toUpperCase() || 'ORG'}
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

          {/* Miembros */}
          <div className="col-span-1 text-sm text-muted-foreground">
            {members.length} miembros
          </div>

          {/* Plan */}
          <div className="col-span-1">
            <Badge variant="outline" className="text-xs">
              {organization.plan?.name || 'Sin plan'}
            </Badge>
          </div>

          {/* Rol */}
          <div className="col-span-1">
            <Badge variant="secondary" className="text-xs">
              Administrador
            </Badge>
          </div>

          {/* Acciones */}
          <div className="col-span-1 flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  onEdit(organization)
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(organization)
                  }} 
                  className="text-destructive focus:text-destructive"
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
}

export function OrganizationList() {
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('created_at_desc')
  const [, navigate] = useLocation()
  
  const { data: userData, isLoading } = useCurrentUser()
  const { openModal } = useGlobalModalStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { switchOrganization } = useProjectContext()
  const { updateSession } = useAuthStore()

  // Obtener organizaciones del usuario
  const organizations = userData?.organizations || []

  // Filtrar y ordenar organizaciones
  const sortedOrganizations = [...organizations].sort((a, b) => {
    switch (sortBy) {
      case 'name_asc':
        return a.name.localeCompare(b.name)
      case 'name_desc':
        return b.name.localeCompare(a.name)
      case 'created_at_asc':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'created_at_desc':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      default:
        return 0
    }
  })

  // Seleccionar la organización actual del usuario
  useEffect(() => {
    if (userData?.organization?.id) {
      setSelectedOrganization(userData.organization.id)
    }
  }, [userData?.organization?.id])

  // Mutación para cambiar organización
  const switchOrganizationMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { error } = await supabase
        .from('user_organization_preferences')
        .update({ current_organization_id: organizationId })
        .eq('user_id', userData?.user?.id)
      
      if (error) throw error
      
      return organizationId
    },
    onSuccess: async (organizationId) => {
      // Actualizar el contexto
      await switchOrganization(organizationId)
      await updateSession()
      
      toast({
        title: "Organización cambiada",
        description: "Has cambiado a la nueva organización exitosamente"
      })
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      
      // Navegar al dashboard de la organización
      navigate('/organization/dashboard')
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo cambiar la organización",
        variant: "destructive"
      })
      console.error('Switch organization error:', error)
    }
  })

  const handleSelectOrganization = (organizationId: string) => {
    setSelectedOrganization(organizationId)
    
    // Solo cambiar si es diferente a la actual
    if (organizationId !== userData?.organization?.id) {
      switchOrganizationMutation.mutate(organizationId)
    }
  }

  const handleEditOrganization = (organization: any) => {
    openModal('organization', { 
      editingOrganization: organization,
      isEditing: true 
    })
  }

  const handleDeleteOrganization = (organization: any) => {
    // TODO: Implementar modal de confirmación para eliminar organización
    console.log('Delete organization:', organization)
  }

  if (isLoading) {
    return <div className="p-4">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      {/* Controles superiores */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="sort" className="text-sm font-medium">
              Ordenar por:
            </Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name_asc">Nombre A-Z</SelectItem>
                <SelectItem value="name_desc">Nombre Z-A</SelectItem>
                <SelectItem value="created_at_asc">Más antiguas</SelectItem>
                <SelectItem value="created_at_desc">Más recientes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={() => openModal('organization', { isEditing: false })}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Organización
        </Button>
      </div>

      {/* Lista de organizaciones */}
      <div className="space-y-2">
        {/* Header de la tabla */}
        <div className="grid grid-cols-6 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground border-b">
          <div className="col-span-1">Fecha</div>
          <div className="col-span-1">Organización</div>
          <div className="col-span-1">Miembros</div>
          <div className="col-span-1">Plan</div>
          <div className="col-span-1">Rol</div>
          <div className="col-span-1"></div>
        </div>

        {/* Organizaciones */}
        {sortedOrganizations.map((organization) => (
          <OrganizationCard
            key={organization.id}
            organization={organization}
            isSelected={selectedOrganization === organization.id}
            onSelect={handleSelectOrganization}
            onEdit={handleEditOrganization}
            onDelete={handleDeleteOrganization}
          />
        ))}
      </div>

      {/* Panel lateral si hay organización seleccionada */}
      {selectedOrganization && (
        <div className="mt-8">
          <ActiveOrganizationMembersCard />
        </div>
      )}
    </div>
  )
}