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
          {/* Fecha */}
            {format(new Date(organization.created_at), 'dd/MM/yyyy', { locale: es })}
          </div>

          {/* Organización */}
                {organization.name?.substring(0, 2)?.toUpperCase() || 'ORG'}
              </AvatarFallback>
            </Avatar>
            <div>
                {organization.name}
                {isSelected && (
                    Activa
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Plan */}
            {organization.plan ? (
              <Badge 
                variant="secondary" 
                style={{
                  backgroundColor: organization.plan.name?.toLowerCase() === 'free' ? 'var(--plan-free-bg)' :
                                 organization.plan.name?.toLowerCase() === 'pro' ? 'var(--plan-pro-bg)' :
                                 organization.plan.name?.toLowerCase() === 'teams' ? 'var(--plan-teams-bg)' :
                                 'var(--plan-free-bg)'
                }}
              >
                {organization.plan.name}
              </Badge>
            ) : (
              <Badge 
                variant="secondary" 
                style={{ backgroundColor: 'var(--plan-free-bg)' }}
              >
                Free
              </Badge>
            )}
          </div>

          {/* Miembros */}
              {members.slice(0, 3).map((member, index) => (
                  {member.avatar_url ? (
                    <img 
                      src={member.avatar_url} 
                      alt={member.full_name || member.email} 
                    />
                  ) : (
                      {(member.full_name || member.email || 'U').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
              ))}
              {members.length > 3 && (
                </div>
              )}
            </div>
          </div>

          {/* Estado */}
              {organization.is_active ? "Activa" : "Inactiva"}
            </Badge>
          </div>

          {/* Acciones */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation()
                onEdit(organization)
              }}
            >
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
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      // Primero verificar si existe una fila de preferencias
      const { data: existingPrefs } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', userData?.user.id)
        .single()
      
      if (existingPrefs) {
        // Actualizar preferencias existentes - siempre limpiar proyecto al cambiar organización
        const { error } = await supabase
          .from('user_preferences')
          .update({ 
            last_organization_id: organizationId,
            last_project_id: null // Limpiar proyecto al cambiar organización
          })
          .eq('user_id', userData?.user.id)
        
        if (error) throw error
      } else {
        // Crear nuevas preferencias
        const { error } = await supabase
          .from('user_preferences')
          .insert({
            user_id: userData?.user.id,
            last_organization_id: organizationId,
            last_project_id: null, // Sin proyecto al cambiar organización
            theme: 'light',
            sidebar_docked: false,
            onboarding_completed: false
          })
        
        if (error) throw error
      }
    },
    onSuccess: () => {
      // Limpiar project context al cambiar organización
      const { setSelectedProject } = useProjectContext.getState()
      setSelectedProject(null)
      
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      setSidebarContext('organization')
      navigate('/organization/dashboard')
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
        onClick={() => openModal('organization', { open: true })}
      >
        Nueva Organización
      </Button>
    ]
  }

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
          Cargando organizaciones...
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps}>
      {/* ActionBar */}
      <ActionBarDesktop
        showProjectSelector={false}
        showSearch={false}
        showGrouping={false}
        features={[
          {
            title: "Administración de Organizaciones",
            description: "Crea, edita y gestiona las organizaciones de las que formas parte, incluyendo configuración de roles y permisos."
          },
          {
            title: "Gestión de Miembros",
            description: "Administra los miembros de cada organización, invita nuevos colaboradores y gestiona sus roles y permisos."
          },
          {
            title: "Planes y Suscripciones",
            description: "Visualiza y gestiona los planes de suscripción de tus organizaciones con diferentes niveles de funcionalidad."
          },
          {
            title: "Estadísticas y Análisis",
            description: "Accede a métricas detalladas sobre el uso y rendimiento de cada organización en la plataforma."
          }
        ]}
      />

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
                      Tu aplicación está actualmente en el plan {planDisplayName}
                    </p>
                      Los planes pagos ofrecen límites de uso más altos, ramas adicionales y mucho más. 
                    </p>
                  </div>
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
                        {activeOrg?.name?.substring(0, 2).toUpperCase() || 'ORG'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                        Creada el {format(new Date(activeOrg.created_at), 'dd/MM/yyyy', { locale: es })}
                      </p>
                      {/* Badge del plan */}
                        <Badge 
                          variant="secondary" 
                          style={{
                            backgroundColor: activeOrg.plan?.name?.toLowerCase() === 'free' ? 'var(--plan-free-bg)' :
                                           activeOrg.plan?.name?.toLowerCase() === 'pro' ? 'var(--plan-pro-bg)' :
                                           activeOrg.plan?.name?.toLowerCase() === 'teams' ? 'var(--plan-teams-bg)' :
                                           'var(--plan-free-bg)'
                          }}
                        >
                          {activeOrg.plan?.name || 'Free'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                    {/* Avatares de miembros más grandes */}
                    <ActiveOrganizationMembersCard members={activeOrgMembers} />
                      ACTIVA
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null;
        })()}

        {/* Headers de columnas */}
        </div>

        {/* Lista de organizaciones */}
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
                No se encontraron organizaciones
              </h3>
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