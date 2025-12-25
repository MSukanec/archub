import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Building, Crown, Plus, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useNavigationStore } from '@/stores/navigationStore';
import { useLocation } from 'wouter';
import { useOrganizationMembers } from '@/features/organization';
import { AdminOrganizationRow } from '@/features/organization/components/admin/AdminOrganizationRow';
import { useGlobalModalStore } from '@/components/modal';
import { CompactAvatarGroup } from '@/components/shared/CompactAvatarGroup';
import { useMobile } from '@/hooks/use-mobile';
import { usersKeys } from '@/core/query-keys';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';

function OrganizationCard({ 
  organization, 
  isSelected, 
  onSelect 
}: {
  organization: any;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const { data: members = [] } = useOrganizationMembers(organization.id);

  return (
    <Card 
      className={`w-full cursor-pointer transition-all hover:shadow-sm border ${
        isSelected ? 'border-[var(--accent)] bg-[var(--accent-bg)]' : ''
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(organization.id);
      }}
      data-testid={`card-organization-${organization.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-14 h-14 border-2 border-background shrink-0">
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
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-foreground truncate">
                {organization.name}
              </p>
              {isSelected && (
                <Badge 
                  className="text-xs text-white shrink-0" 
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  Activa
                </Badge>
              )}
            </div>
          </div>

          <div className="shrink-0">
            {organization.plan ? (
              <Badge 
                variant={
                  organization.plan.name?.toLowerCase() === 'free' ? 'plan-free' :
                  organization.plan.name?.toLowerCase() === 'pro' ? 'plan-pro' :
                  organization.plan.name?.toLowerCase() === 'teams' ? 'plan-teams' :
                  'plan-free'
                }
                className="text-xs"
              >
                {organization.plan.name}
              </Badge>
            ) : (
              <Badge variant="plan-free" className="text-xs">
                Free
              </Badge>
            )}
          </div>

          <div className="shrink-0">
            <CompactAvatarGroup 
              members={members} 
              maxDisplay={4} 
              size="md" 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function UserOrganizationsView() {
  const { data: userData, isLoading } = useCurrentUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { openModal } = useGlobalModalStore();
  const { setCurrentProject } = useNavigationStore();
  const isMobile = useMobile();

  const organizations = userData?.organizations || [];
  const currentOrganizationId = userData?.organization?.id;
  
  const sortedOrganizations = [...organizations].sort((a, b) => {
    if (a.id === currentOrganizationId) return -1;
    if (b.id === currentOrganizationId) return 1;
    return 0;
  });

  const switchOrganization = useMutation({
    mutationFn: async (organizationId: string) => {
      const { data, error } = await supabase
        .from('user_preferences')
        .update({ last_organization_id: organizationId })
        .eq('user_id', userData?.user?.id)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.current() });
      queryClient.refetchQueries({ queryKey: usersKeys.current() });
      setCurrentProject(null);
      toast({
        title: "Organización cambiada",
        description: "La organización se ha cambiado exitosamente."
      });
      navigate('/organization');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar la organización.",
        variant: "destructive"
      });
    }
  });

  const handleSelect = (organizationId: string) => {
    if (organizationId === currentOrganizationId) return;
    switchOrganization.mutate(organizationId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!userData?.user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Usuario no encontrado</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            />
          )
        ))}
        
        {organizations.length === 0 && (
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-4 text-lg font-semibold">No hay organizaciones</h3>
            <p className="text-muted-foreground">Crea tu primera organización para comenzar.</p>
            <Button 
              className="mt-4" 
              onClick={() => openModal('organization')}
              data-testid="button-create-organization"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Organización
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
