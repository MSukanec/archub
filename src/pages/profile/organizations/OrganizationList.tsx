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

          {/* Plan */}
          <div className="col-span-1">
            {organization.plan ? (
              <Badge 
                variant="secondary" 
                className="text-xs text-white" 
                style={{
                  backgroundColor: organization.plan.name?.toLowerCase() === 'free' ? 'var(--plan-free-bg)' :
                                 organization.plan.name?.toLowerCase() === 'pro' ? 'var(--plan-pro-bg)' :
                                 organization.plan.name?.toLowerCase() === 'teams' ? 'var(--plan-teams-bg)' :
                                 'var(--plan-free-bg)'
                }}
              >
                <Crown className="w-3 h-3 mr-1" />
                {organization.plan.name}
              </Badge>
            ) : (
              <Badge 
                variant="secondary" 
                className="text-xs text-white" 
                style={{ backgroundColor: 'var(--plan-free-bg)' }}
              >
                <Crown className="w-3 h-3 mr-1" />
                Free
              </Badge>
            )}
          </div>

          {/* Miembros */}
          <div className="col-span-1 flex items-center gap-2">
            <span className="text-xs font-medium">({members.length})</span>
            <div className="flex -space-x-1">
              {members.slice(0, 3).map((member, index) => (
                <Avatar key={member.id} className="w-6 h-6 avatar-border" style={{border: '3px solid var(--card-border)'}}>
                  {member.avatar_url ? (
                    <img 
                      src={member.avatar_url} 
                      alt={member.full_name || member.email} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <AvatarFallback className="text-xs">
                      {(member.full_name || member.email || 'U').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
              ))}
              {members.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-[var(--muted)] flex items-center justify-center" style={{border: '3px solid var(--card-border)'}}>
                  <span className="text-xs font-medium text-[var(--muted-foreground)]">+{members.length - 3}</span>
                </div>
              )}
            </div>
          </div>

          {/* Estado */}
          <div className="col-span-1">
            <Badge variant={organization.is_active ? "default" : "secondary"} className="text-xs">
              {organization.is_active ? "Activa" : "Inactiva"}
            </Badge>
          </div>

          {/* Acciones */}
          <div className="col-span-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onSelect(organization.id)
              }}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function OrganizationList() {
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [filterByStatus, setFilterByStatus] = useState('all')
  const [sortBy, setSortBy] = useState('date_recent')
  const [, navigate] = useLocation()
  
  const { data: userData, isLoading } = useCurrentUser()
  const { openModal } = useGlobalModalStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { switchOrganization } = useProjectContext()
  const { updateSession } = useAuthStore()
  const { setSidebarContext } = useNavigationStore()

  // Set sidebar context to 'organizations' when page loads
  useEffect(() => {
    setSidebarContext('organizations')
  }, [])

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
  const currentActiveOrgId = userData?.preferences?.last_organization_id
  if (currentActiveOrgId) {
    filteredOrganizations = [
      ...filteredOrganizations.filter(org => org.id === currentActiveOrgId),
      ...filteredOrganizations.filter(org => org.id !== currentActiveOrgId)
    ]
  }

  // Mutación para seleccionar organización
  const selectOrganizationMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData?.session?.access_token
        
        if (!token) {
          throw new Error('No authentication token available')
        }

        const response = await fetch('/api/user/select-organization', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-user-id': userData?.preferences?.user_id,
          },
          body: JSON.stringify({ organization_id: organizationId }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al cambiar organización');
        }

        return await response.json();
      } catch (error) {
        console.error('Error switching organization:', error);
        throw error;
      }
    },
    onMutate: async (organizationId) => {
      // Cancelar queries para evitar conflictos
      await queryClient.cancelQueries({ queryKey: ['current-user'] })
      
      // Obtener snapshot para rollback
      const previousUserData = queryClient.getQueryData(['current-user'])
      
      // Actualización optimista inmediata
      if (previousUserData && userData?.organizations) {
        const selectedOrg = userData.organizations.find(org => org.id === organizationId)
        if (selectedOrg) {
          queryClient.setQueryData(['current-user'], (old: any) => ({
            ...old,
            organization: selectedOrg,
            preferences: {
              ...old.preferences,
              last_organization_id: organizationId
            }
          }))
        }
      }
      
      // Limpiar proyecto context
      const { setSelectedProject } = useProjectContext.getState()
      setSelectedProject(null)
      
      // Navegación inmediata
      navigate('/organization/dashboard')
      
      return { previousUserData }
    },
    onError: (err, organizationId, context) => {
      // Rollback en caso de error
      if (context?.previousUserData) {
        queryClient.setQueryData(['current-user'], context.previousUserData)
      }
      
      toast({
        title: "Error al cambiar organización",
        description: "No se pudo cambiar a la organización seleccionada",
        variant: "destructive"
      })
    },
    onSettled: () => {
      // Siempre refrescar datos
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
    }
  })

  const handleSelectOrganization = (organizationId: string) => {
    setSelectedOrganization(organizationId)
    
    // Solo cambiar si es diferente a la actual
    if (organizationId !== userData?.organization?.id) {
      selectOrganizationMutation.mutate(organizationId)
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

  // Seleccionar automáticamente la organización actual
  useEffect(() => {
    if (userData?.organization?.id) {
      setSelectedOrganization(userData.organization.id)
    }
  }, [userData?.organization?.id])

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
                <SelectItem value="date_recent">Más recientes</SelectItem>
                <SelectItem value="date_oldest">Más antiguas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Lista de organizaciones */}
      <div className="space-y-2">
        {/* Header de la tabla */}
        <div className="grid grid-cols-6 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground border-b">
          <div className="col-span-1">Fecha</div>
          <div className="col-span-1">Organización</div>
          <div className="col-span-1">Plan</div>
          <div className="col-span-1">Miembros</div>
          <div className="col-span-1">Estado</div>
          <div className="col-span-1"></div>
        </div>

        {/* Organizaciones */}
        {filteredOrganizations.map((organization) => (
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

      {/* Panel lateral con información de la organización seleccionada */}
      {selectedOrganization && (
        <div className="mt-8">
          <ActiveOrganizationMembersCard />
        </div>
      )}
    </div>
  )
}