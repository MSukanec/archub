import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Users, 
  UserCheck, 
  Clock, 
  MoreHorizontal
} from "lucide-react";

import { Layout } from "@/components/layout/desktop/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FeatureIntroduction } from "@/components/ui-custom/FeatureIntroduction";

import { useCurrentUser } from "@/hooks/use-current-user";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { NewMemberModal } from "@/modals/organization/NewMemberModal";

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

function getRoleBadgeVariant(roleName: string) {
  if (roleName?.toLowerCase().includes('admin')) return 'default';
  if (roleName?.toLowerCase().includes('manager')) return 'secondary';
  return 'outline';
}

export default function OrganizationMembers() {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const [showInviteModal, setShowInviteModal] = useState(false);

  const organizationId = userData?.organization?.id;

  // Fetch organization members
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['organization-members', organizationId],
    queryFn: async () => {
      if (!supabase || !organizationId) return [];
      
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          organization_id,
          role_id,
          joined_at,
          last_active_at,
          is_active,
          users (
            id,
            email,
            full_name,
            avatar_url
          ),
          roles (
            id,
            name,
            type
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('joined_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Mock guests data (empty for now)
  const guests: any[] = [];
  console.log('No guest accounts table found, using empty array');

  // Mock pending invites data (empty for now)
  const pendingInvites: any[] = [];
  console.log('No invites table found, using empty array');

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase
        .from('organization_members')
        .update({ is_active: false })
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Miembro eliminado",
        description: "El miembro ha sido eliminado de la organización.",
      });
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el miembro",
        variant: "destructive",
      });
    },
  });

  const resendInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      // Mock functionality
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({
        title: "Invitación reenviada",
        description: "La invitación ha sido reenviada exitosamente.",
      });
    },
  });

  const revokeInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      // Mock functionality
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({
        title: "Invitación revocada",
        description: "La invitación ha sido revocada exitosamente.",
      });
    },
  });

  const headerProps = {
    title: "Miembros",
    description: "Gestiona los miembros de tu organización",
    actions: [
      <Button 
        key="invite"
        onClick={() => setShowInviteModal(true)}
        className="bg-accent text-accent-foreground hover:bg-accent/90"
      >
        Invitar miembro
      </Button>
    ]
  };

  const breadcrumb = [
    { name: "Organización", href: "/organization/dashboard" },
    { name: "Miembros", href: "/organization/members" }
  ];

  return (
    <Layout headerProps={headerProps} breadcrumb={breadcrumb}>
      <div className="space-y-6">
        <FeatureIntroduction
          title="Gestión de Miembros"
          subtitle="(click para más información)"
          icon={<Users className="h-5 w-5 text-[var(--accent)]" />}
          features={[
            {
              icon: <Users className="h-4 w-4" />,
              title: "Invitación de miembros",
              description: "Invita a miembros de tu equipo que puedan acceder a todos los proyectos y herramientas de colaboración"
            },
            {
              icon: <UserCheck className="h-4 w-4" />,
              title: "Gestión de roles",
              description: "Gestiona roles y permisos individuales para cada miembro según sus responsabilidades"
            },
            {
              icon: <Clock className="h-4 w-4" />,
              title: "Control de acceso",
              description: "Controla el acceso a configuraciones de la organización y datos sensibles"
            },
            {
              icon: <MoreHorizontal className="h-4 w-4" />,
              title: "Supervisión de actividad",
              description: "Supervisa la actividad y el estado de conexión de cada miembro del equipo"
            }
          ]}
        />

        <div className="space-y-8">
          {/* Members Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Miembros</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Invita a tu equipo para trabajar juntos y colaborar fácilmente. Gestiona sus permisos para proyectos mejores.
            </p>
            
            <div className="space-y-2">
              {members.map((member) => (
                <Card key={member.id} className="p-4">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.users?.avatar_url} />
                          <AvatarFallback>
                            {getInitials(member.users?.full_name || member.users?.email || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">
                              {member.users?.full_name || 'Sin nombre'}
                            </h4>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {member.users?.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-xs text-muted-foreground text-right">
                          <div>{format(new Date(member.joined_at), 'MMM dd, yyyy', { locale: es })}</div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground text-right">
                          <div>{format(new Date(member.last_active_at || member.joined_at), 'MMM dd, yyyy', { locale: es })}</div>
                        </div>

                        <Badge variant={getRoleBadgeVariant(member.roles?.name || '')}>
                          {member.roles?.name || 'Sin rol'}
                        </Badge>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              Editar rol
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => removeMemberMutation.mutate(member.id)}
                            >
                              Eliminar miembro
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {members.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm">No hay miembros en esta organización.</p>
                  <p className="text-xs">Invita al primer miembro para comenzar.</p>
                </div>
              )}
            </div>
          </div>

          {/* Guest Accounts Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <UserCheck className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Invitados</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Las cuentas de invitados permiten a tus socios externos colaborar y comunicarse contigo aquí en Archub.
            </p>
            
            <div className="space-y-2">
              {guests.map((guest) => (
                <Card key={guest.id} className="p-4">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={guest.users?.avatar_url} />
                          <AvatarFallback>
                            {getInitials(guest.users?.full_name || guest.users?.email || 'G')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">
                              {guest.users?.full_name || 'Sin nombre'}
                            </h4>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {guest.users?.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-xs text-muted-foreground text-right">
                          <div>{format(new Date(guest.joined_at), 'MMM dd, yyyy', { locale: es })}</div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground text-right">
                          <div>{format(new Date(guest.last_active_at || guest.joined_at), 'MMM dd, yyyy', { locale: es })}</div>
                        </div>

                        <Badge variant="secondary">
                          {guest.roles?.name || 'Invitado'}
                        </Badge>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              Editar rol
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => removeMemberMutation.mutate(guest.id)}
                            >
                              Eliminar invitado
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {guests.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm">No hay invitados en esta organización.</p>
                  <p className="text-xs">Los invitados pueden colaborar en proyectos específicos.</p>
                </div>
              )}
            </div>
          </div>

          {/* Pending Invites Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Invitaciones Pendientes</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Las cuentas de invitados permiten a tus socios externos colaborar y comunicarse contigo aquí en Archub.
            </p>
            
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <Card key={invite.id} className="p-4">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {getInitials(invite.email || 'P')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">
                              {invite.email}
                            </h4>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Invitación enviada
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-xs text-muted-foreground text-right">
                          <div>{format(new Date(invite.created_at), 'MMM dd, yyyy', { locale: es })}</div>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => resendInviteMutation.mutate(invite.id)}
                          >
                            Reenviar invitación
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => revokeInviteMutation.mutate(invite.id)}
                          >
                            Revocar invitación
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {pendingInvites.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm">No hay invitaciones pendientes.</p>
                  <p className="text-xs">Las invitaciones aparecerán aquí una vez enviadas.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Member Invitation Modal */}
        <NewMemberModal 
          open={showInviteModal}
          onClose={() => setShowInviteModal(false)}
        />
      </div>
    </Layout>
  );
}