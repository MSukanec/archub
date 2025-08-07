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

function getRoleBadgeVariant(roleName: string) {
  const role = roleName?.toLowerCase() || '';
  if (role.includes('admin')) return 'default'; // Will be styled with --accent background
  if (role.includes('manager') || role.includes('editor')) return 'secondary';
  if (role.includes('viewer') || role.includes('guest')) return 'outline';
  return 'outline';
}

function getRoleBadgeClassName(roleName: string) {
  const role = roleName?.toLowerCase() || '';
  if (role.includes('admin')) return 'bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90';
  return '';
}

export default function OrganizationMembers() {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();

  const isMobile = useMobile();

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

  const handleDeleteMember = (member: any) => {
    openModal('delete-confirmation', {
      mode: 'dangerous',
      title: 'Eliminar miembro',
      description: 'Esta acción eliminará permanentemente el miembro de la organización. Perderá acceso a todos los proyectos y datos.',
      itemName: member.user_data?.full_name || member.email || 'Miembro',
      destructiveActionText: 'Eliminar',
      onConfirm: () => removeMemberMutation.mutate(member.id),
      isLoading: removeMemberMutation.isPending
    });
  };



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
    breadcrumb: [
      { name: "Organización", href: "/organization/dashboard" },
      { name: "Miembros", href: "/organization/members" }
    ],
    actions: [
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
    ]
  };



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



        {/* Two Column Layout - Section descriptions left, content right */}
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
                            <AvatarImage src={member.user_data?.avatar_url} />
                            <AvatarFallback>
                              {getInitials(member.user_data?.full_name || member.user_data?.email || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm">
                                {member.user_data?.full_name || 'Sin nombre'}
                              </h4>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {member.user_data?.email}
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
                            variant={getRoleBadgeVariant(member.role?.name || '')}
                            className={getRoleBadgeClassName(member.role?.name || '')}
                          >
                            {member.role?.name || 'Sin rol'}
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

        <hr className="border-t border-[var(--section-divider)] my-8" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Guests Section Description */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2 mb-4">
              <UserCheck className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Invitados</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Las cuentas de invitados permiten a tus socios externos colaborar y comunicarse contigo aquí en Archub.
            </p>
          </div>

          {/* Right Column - Guests Content */}
          <div className="lg:col-span-8">
            
            {isMobile ? (
              <div className="space-y-3">
                {guests.map((guest) => (
                  <MemberCard 
                    key={guest.id} 
                    member={guest}
                  />
                ))}
                {guests.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm">No hay invitados en esta organización.</p>
                    <p className="text-xs">Los invitados pueden colaborar en proyectos específicos.</p>
                  </div>
                )}
              </div>
            ) : (
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
                            <div>
                              {guest.joined_at && !isNaN(new Date(guest.joined_at).getTime()) 
                                ? format(new Date(guest.joined_at), 'MMM dd, yyyy', { locale: es })
                                : 'Fecha no disponible'
                              }
                            </div>
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
                                onClick={() => handleDeleteMember(guest)}
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
            )}
          </div>
        </div>

        <hr className="border-t border-[var(--section-divider)] my-8" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Pending Invites Section Description */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Invitaciones Pendientes</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Las cuentas de invitados permiten a tus socios externos colaborar y comunicarse contigo aquí en Archub.
            </p>
          </div>

          {/* Right Column - Pending Invites Content */}
          <div className="lg:col-span-8">
            
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
                          <div>
                            {invite.created_at && !isNaN(new Date(invite.created_at).getTime()) 
                              ? format(new Date(invite.created_at), 'MMM dd, yyyy', { locale: es })
                              : 'Fecha no disponible'
                            }
                          </div>
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
      </div>




    </Layout>
  );
}