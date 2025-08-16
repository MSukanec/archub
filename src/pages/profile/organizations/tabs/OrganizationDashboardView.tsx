import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Building, Users, Calendar, Crown } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useOrganizationMembers } from '@/hooks/use-organization-members';

interface OrganizationDashboardViewProps {
  organization: any;
}

export function OrganizationDashboardView({ organization }: OrganizationDashboardViewProps) {
  const { data: members = [] } = useOrganizationMembers(organization.id);

  return (
    <div className="space-y-6">
      {/* Información general */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={organization.is_active ? "default" : "secondary"}>
              {organization.is_active ? "Activa" : "Inactiva"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Miembros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">
              miembros activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge 
              variant="secondary" 
              className="text-white" 
              style={{
                backgroundColor: organization.plan?.name?.toLowerCase() === 'free' ? 'var(--plan-free-bg)' :
                               organization.plan?.name?.toLowerCase() === 'pro' ? 'var(--plan-pro-bg)' :
                               organization.plan?.name?.toLowerCase() === 'teams' ? 'var(--plan-teams-bg)' :
                               'var(--plan-free-bg)'
              }}
            >
              {organization.plan?.name || 'Free'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Detalles de la organización */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nombre</label>
              <p className="text-sm">{organization.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Fecha de creación</label>
              <p className="text-sm">
                {format(new Date(organization.created_at), 'dd/MM/yyyy', { locale: es })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tipo</label>
              <p className="text-sm">
                {organization.is_system ? 'Organización del sistema' : 'Organización regular'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Miembros Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members.slice(0, 5).map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <Avatar className="w-8 h-8 avatar-border">
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
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.full_name || member.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      Sin rol
                    </p>
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-sm text-muted-foreground">No hay miembros</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}