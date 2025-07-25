import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Users, 
  UserCheck, 
  Clock, 
  MoreHorizontal,
  UserPlus,
  Shield,
  Activity
} from "lucide-react";

import { Layout } from "@/components/layout/desktop/Layout";
import { ActionBarDesktop } from "@/components/layout/desktop/ActionBarDesktop";
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
import { CustomRestricted } from "@/components/ui-custom/CustomRestricted";

import { MemberCard } from "@/components/cards/MemberCard";

import { useCurrentUser } from "@/hooks/use-current-user";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useGlobalModalStore } from "@/components/modal/form/useGlobalModalStore";
import { useMobile } from "@/hooks/use-mobile";

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

function getRoleBadgeVariant(role: string) {
  if (role.includes('admin')) return 'default';
  if (role.includes('manager')) return 'secondary';
  return 'outline';
}

function getRoleBadgeClassName(role: string) {
  if (role.includes('admin')) return 'bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90';
  return '';
}

export default function OrganizationMembers() {
  const [activeTab, setActiveTab] = useState("miembros");
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();

  const isMobile = useMobile();

  const organizationId = userData?.preferences?.last_organization_id;

  // Query para obtener miembros
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['organization-members', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          *,
          users (
            id,
            email,
            full_name,
            avatar_url
          ),
          roles (
            id,
            name
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      if (error) throw error;
      
      console.log('🔍 Members data:', data);
      return data || [];
    },
    enabled: !!organizationId
  });

  // Query para obtener invitados (accounts que no son miembros)
  const { data: guests = [] } = useQuery({
    queryKey: ['organization-guests', organizationId],
    queryFn: async () => {
      // Implementar lógica para obtener invitados si existe
      return [];
    },
    enabled: !!organizationId
  });

  // Mutation para eliminar miembro
  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('organization_members')
        .update({ is_active: false })
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      toast({
        title: "Miembro eliminado",
        description: "El miembro ha sido removido de la organización.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar al miembro.",
        variant: "destructive",
      });
    }
  });

  const handleDeleteMember = async (member: any) => {
    if (confirm(`¿Estás seguro de que deseas eliminar a ${member.users?.full_name || member.users?.email}?`)) {
      await deleteMemberMutation.mutateAsync(member.id);
    }
  };

  const headerProps = {
    title: "Miembros de la Organización",
    subtitle: "Gestiona los miembros y permisos de tu organización",
    actions: []
  };

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps}>
      <div>
        {/* Feature Introduction - Mobile only */}
        <FeatureIntroduction
          title="Gestión de Miembros"
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

        {/* ActionBar Desktop */}
        <ActionBarDesktop
          title="Gestión de Miembros"
          icon={<Users className="h-5 w-5" />}
          tabs={[
            { id: "miembros", label: "Miembros", active: activeTab === "miembros", onClick: () => setActiveTab("miembros") },
            { id: "permisos", label: "Permisos", active: activeTab === "permisos", onClick: () => setActiveTab("permisos") }
          ]}
          customActions={[
            <CustomRestricted 
              key="invite-member"
              feature="max_members" 
              current={members.length}
            >
              <Button onClick={() => openModal('member')}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invitar miembro
              </Button>
            </CustomRestricted>
          ]}
          features={[
            {
              icon: <Users className="h-4 w-4" />,
              title: "Invitación y gestión de equipo",
              description: "Invita a miembros de tu equipo con acceso completo a proyectos y herramientas de colaboración. Administra perfiles y datos de contacto."
            },
            {
              icon: <Shield className="h-4 w-4" />,
              title: "Control de roles y permisos",
              description: "Asigna roles específicos (Admin, Editor, Viewer) con permisos diferenciados. Controla acceso a configuraciones sensibles de la organización."
            },
            {
              icon: <Activity className="h-4 w-4" />,
              title: "Supervisión de actividad y estado",
              description: "Monitorea el estado de conexión, última actividad y participación de cada miembro del equipo en tiempo real."
            },
            {
              icon: <UserCheck className="h-4 w-4" />,
              title: "Gestión de invitaciones y huéspedes",
              description: "Administra invitaciones pendientes, cuentas de huéspedes temporales y colaboradores externos con acceso limitado a proyectos específicos."
            }
          ]}
        />

        {/* Content based on active tab */}
        {activeTab === "miembros" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
            {/* Left Column - Section Description */}
            <div className="lg:col-span-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-[var(--accent)]" />
                <h2 className="text-lg font-semibold">Miembros</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Invita a tu equipo para trabajar juntos y colaborar fácilmente. Gestiona sus permisos para proyectos mejores.
              </p>
            </div>

            {/* Right Column - Members Content */}
            <div className="lg:col-span-8">
              {isMobile ? (
                <div className="space-y-3">
                  {members.map((member) => (
                    <MemberCard 
                      key={member.id} 
                      member={{
                        ...member,
                        users: Array.isArray(member.users) ? member.users[0] : member.users,
                        roles: Array.isArray(member.roles) ? member.roles[0] : member.roles
                      }}
                    />
                  ))}
                  {members.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p className="text-sm">No hay miembros en esta organización.</p>
                      <p className="text-xs">Invita al primer miembro para comenzar.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <Card key={member.id} className="p-4">
                      <CardContent className="p-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={Array.isArray(member.users) ? member.users[0]?.avatar_url : member.users?.avatar_url} />
                              <AvatarFallback>
                                {getInitials(
                                  (Array.isArray(member.users) ? member.users[0]?.full_name : member.users?.full_name) || 
                                  (Array.isArray(member.users) ? member.users[0]?.email : member.users?.email) || 
                                  'U'
                                )}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm">
                                  {(Array.isArray(member.users) ? member.users[0]?.full_name : member.users?.full_name) || 'Sin nombre'}
                                </h4>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {Array.isArray(member.users) ? member.users[0]?.email : member.users?.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-xs text-muted-foreground text-right">
                              <div>
                                {member.joined_at && !isNaN(new Date(member.joined_at).getTime()) 
                                  ? format(new Date(member.joined_at), 'MMM dd, yyyy', { locale: es })
                                  : 'Fecha no disponible'
                                }
                              </div>
                            </div>

                            <Badge 
                              variant={getRoleBadgeVariant((Array.isArray(member.roles) ? member.roles[0]?.name : member.roles?.name) || '')}
                              className={getRoleBadgeClassName((Array.isArray(member.roles) ? member.roles[0]?.name : member.roles?.name) || '')}
                            >
                              {(Array.isArray(member.roles) ? member.roles[0]?.name : member.roles?.name) || 'Sin rol'}
                            </Badge>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openModal('member', { editingMember: member })}>
                                  Editar rol
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDeleteMember(member)}
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
              )}
            </div>
          </div>
        )}

        {/* Permisos Tab Content */}
        {activeTab === "permisos" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
            {/* Left Column - Section Description */}
            <div className="lg:col-span-4">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-[var(--accent)]" />
                <h2 className="text-lg font-semibold">Permisos</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Configura y administra los permisos específicos para cada rol y funcionalidad de la organización.
              </p>
            </div>

            {/* Right Column - Permissions Content */}
            <div className="lg:col-span-8">
              <Card className="p-8">
                <CardContent className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <h3 className="text-lg font-medium mb-2">
                    Gestión de Permisos
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Esta funcionalidad estará disponible próximamente. Aquí podrás configurar permisos detallados para cada rol.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}