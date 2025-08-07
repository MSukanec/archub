import { Layout } from '@/components/layout/desktop/Layout'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
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
                onEdit(organization)
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}



export default function OrganizationManagement() {
  const [searchValue, setSearchValue] = useState("")
  const [sortBy, setSortBy] = useState('date_recent')
  const [filterByStatus, setFilterByStatus] = useState('all')

  
  const { data: userData, isLoading } = useCurrentUser()
  const activeOrgId = userData?.preferences?.last_organization_id || userData?.organization?.id || ''
  const { data: activeOrgMembers = [] } = useOrganizationMembers(activeOrgId)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { setSidebarContext } = useNavigationStore()
  const [, navigate] = useLocation()
  const { openModal } = useGlobalModalStore()

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
      console.log('🔧 Starting organization switch to:', organizationId);
      try {
        // Usar el endpoint del servidor para cambiar organización
        const response = await fetch('/api/user/select-organization', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userData?.user.id, // Agregar user_id requerido
          },
          body: JSON.stringify({ organization_id: organizationId }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al cambiar organización');
        }

        const result = await response.json();
        console.log('🔧 Organization switch successful:', result);
        return result;
      } catch (error) {
        console.error('🔧 Error switching organization:', error);
        throw error;
      }
    },
    onSuccess: async (_, variables) => {
      console.log('🔧 Organization switch onSuccess started for org:', variables);
      
      // SOLUCIÓN DIRECTA: Forzar recarga completa de página para evitar problemas de cache
      // El RPC archub_get_user tiene su propia lógica y no está reflejando los cambios
      toast({
        title: "Organización seleccionada",
        description: "Cambiando a la nueva organización..."
      })
      
      console.log('🔧 Forcing complete page reload to ensure fresh data');
      // Usar window.location.replace para evitar que el usuario pueda volver atrás
      setTimeout(() => {
        window.location.replace('/organization/dashboard')
      }, 1000)
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo seleccionar la organización",
        variant: "destructive"
      })
    }
  })

  const deleteOrganizationMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      if (!supabase) {
        throw new Error('Supabase client not available')
      }
      
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', organizationId)

      if (error) {
        throw new Error('No se pudo eliminar la organización')
      }
    },
    onSuccess: () => {
      toast({
        title: "Organización eliminada",
        description: "La organización se ha eliminado correctamente"
      })
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la organización",
        variant: "destructive"
      })
    }
  })

  const handleSelectOrganization = (organizationId: string) => {
    selectOrganizationMutation.mutate(organizationId)
  }

  const handleEdit = (organization: any) => {
    openModal('profile-organization', {
      organization: organization
    })
  }

  const handleDeleteClick = (organization: any) => {
    openModal('delete-confirmation', {
      mode: 'dangerous',
      title: '¿Eliminar organización?',
      description: `Esta acción eliminará permanentemente la organización "${organization.name}". Esta acción no se puede deshacer.`,
      itemName: organization.name,
      destructiveActionText: 'Eliminar Organización',
      onConfirm: () => deleteOrganizationMutation.mutate(organization.id),
      isLoading: deleteOrganizationMutation.isPending
    })
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



  const headerProps = {
    title: "Gestión de Organizaciones",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    showFilters: true,
    customFilters,
    onClearFilters: clearFilters,
    actions: [
      <Button 
        key="new-organization"
        className="h-8 px-3 text-sm"
        onClick={() => openModal('organization', { open: true })}
      >
        <Plus className="w-4 h-4 mr-2" />
        Nueva Organización
      </Button>
    ]
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
      {/* ActionBar */}
      <ActionBarDesktop
        title="Gestión de Organizaciones"
        icon={<Building className="h-5 w-5" />}
        showProjectSelector={false}
        showSearch={false}
        showGrouping={false}
        features={[
          {
            icon: <Settings className="h-4 w-4" />,
            title: "Administración de Organizaciones",
            description: "Crea, edita y gestiona las organizaciones de las que formas parte, incluyendo configuración de roles y permisos."
          },
          {
            icon: <Users className="h-4 w-4" />,
            title: "Gestión de Miembros",
            description: "Administra los miembros de cada organización, invita nuevos colaboradores y gestiona sus roles y permisos."
          },
          {
            icon: <Crown className="h-4 w-4" />,
            title: "Planes y Suscripciones",
            description: "Visualiza y gestiona los planes de suscripción de tus organizaciones con diferentes niveles de funcionalidad."
          },
          {
            icon: <BarChart3 className="h-4 w-4" />,
            title: "Estadísticas y Análisis",
            description: "Accede a métricas detalladas sobre el uso y rendimiento de cada organización en la plataforma."
          }
        ]}
      />

      <div className="space-y-6">
        {/* Plan Card con color del plan actual */}
        {(() => {
          const activeOrg = userData?.organizations?.find(org => org.id === userData?.preferences?.last_organization_id) || userData?.organization;
          const planName = activeOrg?.plan?.name?.toLowerCase() || 'free';
          const planDisplayName = planName === 'free' ? 'gratuito' :
                                  planName === 'pro' ? 'Pro' :
                                  planName === 'teams' ? 'Teams' :
                                  'gratuito';
          
          return (
            <Card 
              className={`border-0 plan-card-${planName}`}
            >
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-sm text-white font-bold">
                      Tu aplicación está actualmente en el plan {planDisplayName}
                    </p>
                    <p className="text-xs text-white/80 break-words">
                      Los planes pagos ofrecen límites de uso más altos, ramas adicionales y mucho más. 
                      <span className="text-white underline cursor-pointer ml-1">Aprende más aquí.</span>
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
                    <Button variant="secondary" size="sm" className="w-full sm:w-auto text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white hover:text-white">
                      Actualizar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Card con información de la organización seleccionada */}
        {(() => {
          const activeOrg = userData?.organizations?.find(org => org.id === userData?.preferences?.last_organization_id) || userData?.organization;
          return activeOrg ? (
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 avatar-border">
                      <AvatarFallback className="text-lg font-semibold">
                        {activeOrg?.name?.substring(0, 2).toUpperCase() || 'ORG'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-semibold">{activeOrg.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        Creada el {format(new Date(activeOrg.created_at), 'dd/MM/yyyy', { locale: es })}
                      </p>
                      {/* Badge del plan */}
                      <div className="mt-2">
                        <Badge 
                          variant="secondary" 
                          className="text-xs text-white" 
                          style={{
                            backgroundColor: activeOrg.plan?.name?.toLowerCase() === 'free' ? 'var(--plan-free-bg)' :
                                           activeOrg.plan?.name?.toLowerCase() === 'pro' ? 'var(--plan-pro-bg)' :
                                           activeOrg.plan?.name?.toLowerCase() === 'teams' ? 'var(--plan-teams-bg)' :
                                           'var(--plan-free-bg)'
                          }}
                        >
                          <Crown className="w-3 h-3 mr-1" />
                          {activeOrg.plan?.name || 'Free'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {/* Avatares de miembros más grandes */}
                    <ActiveOrganizationMembersCard members={activeOrgMembers} />
                    <Badge variant="default" className="bg-[var(--accent)] text-white">
                      ACTIVA
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null;
        })()}

        {/* Headers de columnas */}
        <div className="grid grid-cols-6 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground border-b">
          <div className="col-span-1">Fecha</div>
          <div className="col-span-1">Organización</div>
          <div className="col-span-1">Plan</div>
          <div className="col-span-1">Miembros</div>
          <div className="col-span-1">Estado</div>
          <div className="col-span-1">Acciones</div>
        </div>

        {/* Lista de organizaciones */}
        <div className="space-y-2">
          {filteredOrganizations.map((organization) => {
            const isSelected = userData?.preferences?.last_organization_id === organization.id
            
            return (
              <OrganizationCard 
                key={organization.id}
                organization={organization}
                isSelected={isSelected}
                onSelect={handleSelectOrganization}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            )
          })}
        </div>

        {filteredOrganizations.length === 0 && (
          <Card>
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


      </div>
    </Layout>
  )
}