import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users, Plus, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useOrganizationMembers } from '@/hooks/use-organization-members';

interface OrganizationMembersViewProps {
  organization: any;
}

export function OrganizationMembersView({ organization }: OrganizationMembersViewProps) {
  const { data: members = [], isLoading } = useOrganizationMembers(organization.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando miembros...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Miembros de la Organización</h2>
          <p className="text-muted-foreground">
            {members.length} miembro{members.length !== 1 ? 's' : ''} en total
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Invitar Miembro
        </Button>
      </div>

      {/* Lista de miembros */}
      <div className="grid gap-4">
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 avatar-border">
                    {member.avatar_url ? (
                      <img 
                        src={member.avatar_url} 
                        alt={member.full_name || member.email} 
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <AvatarFallback>
                        {(member.full_name || member.email || 'U').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div className="space-y-1">
                    <h3 className="font-medium">
                      {member.full_name || 'Sin nombre'}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      {member.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      Unido el {member.joined_at ? format(new Date(member.joined_at), 'dd/MM/yyyy', { locale: es }) : 'Fecha desconocida'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    Sin rol
                  </Badge>
                  <Badge variant={member.is_active ? "default" : "secondary"}>
                    {member.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {members.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No hay miembros</h3>
              <p className="text-muted-foreground mb-4">
                Esta organización aún no tiene miembros.
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Invitar primer miembro
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}