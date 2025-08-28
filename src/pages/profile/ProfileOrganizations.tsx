import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Building, Crown, Plus, Calendar, Shield, MoreHorizontal, Edit, Trash2, Users, Settings, Network, BarChart3, Eye } from 'lucide-react'
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
        <div className="grid grid-cols-4 gap-4 items-center">
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
            <Badge variant={organization.is_active ? "default" : "secondary"}>
              {organization.is_active ? "Activa" : "Inactiva"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente principal de lista de organizaciones
export function OrganizationList() {
  const { data: userData } = useCurrentUser()
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null)
  const [, navigate] = useLocation()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { openModal } = useGlobalModalStore()
  const { setCurrentProject } = useNavigationStore()

  const organizations = userData?.organizations || []

  // Mutation para cambiar organización activa
  const switchOrganization = useMutation({
    mutationFn: async (organizationId: string) => {
      const { data, error } = await supabase
        .from('user_preferences')
        .update({ last_organization_id: organizationId })
        .eq('user_id', userData?.user?.id)
        .select()
      
      if (error) throw error
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
      navigate('/organization')
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar la organización.",
        variant: "destructive"
      })
    }
  })

  const handleSelect = (organizationId: string) => {
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
        {organizations.map((organization) => (
          isMobile ? (
            <AdminOrganizationRow
              key={organization.id}
              organization={organization}
              onClick={() => handleSelect(organization.id)}
              selected={selectedOrganization === organization.id}
              density="normal"
            />
          ) : (
            <OrganizationCard
              key={organization.id}
              organization={organization}
              isSelected={selectedOrganization === organization.id}
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