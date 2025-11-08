import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Building, Crown, Plus, Calendar, Shield, MoreHorizontal, Edit, Trash2, Users, Settings, Network, BarChart3, Eye, Building2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNavigationStore } from '@/stores/navigationStore'
import { useLocation } from 'wouter'
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { OrganizationMemberAvatars } from '@/components/ui-custom/general/OrganizationMemberAvatars'
import { AdminOrganizationRow } from '@/components/ui/data-row/rows'
import { useMobile } from '@/hooks/use-mobile'

// Componente para una sola tarjeta de organización
function OrganizationCard({ organization, isSelected, onSelect, onView, onEdit, onDelete }: {
  organization: any,
  isSelected: boolean,
  onSelect: (id: string) => void,
  onView: (org: any) => void,
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
        {/* Organization info with avatar - EXACT COPY from InvitationModal */}
        <div className="flex items-start gap-3">
          <Avatar className="w-14 h-14 border-2 border-background">
            {organization.logo_url ? (
              <AvatarImage 
                src={organization.logo_url} 
                alt={organization.name} 
              />
            ) : (
              <AvatarFallback>
                <Building2 className="h-7 w-7 text-muted-foreground" />
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-lg font-semibold text-foreground">
                {organization.name}
              </p>
              {isSelected && (
                <Badge 
                  className="text-xs text-white" 
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  Activa
                </Badge>
              )}
            </div>
            
            {/* Plan and members info */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Plan */}
              <div>
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
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {members.length} {members.length === 1 ? 'miembro' : 'miembros'}
                </span>
                <div className="flex -space-x-1">
                  {members.slice(0, 3).map((member, index) => (
                    <Avatar key={member.id} className="w-6 h-6 avatar-border" style={{border: '2px solid var(--card)'}}>
                      {member.avatar_url ? (
                        <AvatarImage 
                          src={member.avatar_url} 
                          alt={member.full_name || member.email}
                        />
                      ) : (
                        <AvatarFallback className="text-xs">
                          {(member.full_name || member.email || 'U').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  ))}
                  {members.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-[var(--muted)] flex items-center justify-center text-xs font-medium text-[var(--muted-foreground)]" style={{border: '2px solid var(--card)'}}>
                      +{members.length - 3}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente principal de lista de organizaciones
export function OrganizationList() {
  const { data: userData } = useCurrentUser()
  const [, navigate] = useLocation()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { openModal } = useGlobalModalStore()
  const { setCurrentProject } = useNavigationStore()

  const organizations = userData?.organizations || []
  const currentOrganizationId = userData?.organization?.id
  
  // Sort organizations: active one first
  const sortedOrganizations = [...organizations].sort((a, b) => {
    if (a.id === currentOrganizationId) return -1
    if (b.id === currentOrganizationId) return 1
    return 0
  })

  // Mutation para cambiar organización activa
  const switchOrganization = useMutation({
    mutationFn: async (organizationId: string) => {
      console.log('🔄 Switching to organization:', organizationId)
      const { data, error } = await supabase
        .from('user_preferences')
        .update({ last_organization_id: organizationId })
        .eq('user_id', userData?.user?.id)
        .select()
      
      if (error) {
        console.error('❌ Error switching organization:', error)
        throw error
      }
      console.log('✅ Organization switch successful:', data)
      return data
    },
    onSuccess: () => {
      // Force refresh user data
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      queryClient.refetchQueries({ queryKey: ['current-user'] })
      setCurrentProject(null) // Reset project when switching org
      toast({
        title: "Organización cambiada",
        description: "La organización se ha cambiado exitosamente."
      })
      // Navigate to organization dashboard after switch
      navigate('/organization')
    },
    onError: (error: any) => {
      console.error('❌ Organization switch error:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar la organización.",
        variant: "destructive"
      })
    }
  })

  const handleSelect = (organizationId: string) => {
    // No hacer nada si ya está seleccionada la misma organización
    if (organizationId === currentOrganizationId) {
      console.log('🔄 Organization already selected:', organizationId)
      return
    }
    
    console.log('🔄 Selecting organization:', organizationId, 'Current:', currentOrganizationId)
    switchOrganization.mutate(organizationId)
  }

  const handleView = (organization: any) => {
    navigate(`/profile/organizations/${organization.id}`)
  }

  const handleEdit = (organization: any) => {
    openModal('organization', { organization })
  }

  const handleDelete = (organization: any) => {
    // Implement delete logic
    console.log('Delete organization:', organization)
  }



  const isMobile = useMobile()

  return (
    <div className="space-y-6">

      {/* Lista de organizaciones */}
      <div className={isMobile ? "space-y-2" : "space-y-2"}>
        {sortedOrganizations.map((organization) => (
          isMobile ? (
            <AdminOrganizationRow
              key={organization.id}
              organization={organization}
              onClick={() => handleSelect(organization.id)}
              selected={currentOrganizationId === organization.id}
              density="normal"
            />
          ) : (
            <OrganizationCard
              key={organization.id}
              organization={organization}
              isSelected={currentOrganizationId === organization.id}
              onSelect={handleSelect}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )
        ))}
        
        {organizations.length === 0 && (
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-4 text-lg font-semibold">No hay organizaciones</h3>
            <p className="text-muted-foreground">Crea tu primera organización para comenzar.</p>
            <Button className="mt-4" onClick={() => openModal('organization')}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Organización
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

interface ProfileOrganizationsProps {
  user: any;
}

export function ProfileOrganizations({ user }: ProfileOrganizationsProps) {
  return (
    <OrganizationList />
  );
}