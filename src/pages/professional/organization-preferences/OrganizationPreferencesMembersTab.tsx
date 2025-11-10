import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Users, 
  UserCheck, 
  Clock, 
  MoreHorizontal,
  Shield,
  Activity
} from "lucide-react";

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

import MemberRow from "@/components/ui/data-row/rows/MemberRow";

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

export function MembersTab() {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();

  const isMobile = useMobile();

  const organizationId = userData?.organization?.id;

  // Fetch organization members with complete data
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['organization-members-full', organizationId],
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
      
      if (error) {
        throw error;
      }
      
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Fetch pending invitations
  const { data: pendingInvites = [], isLoading: invitesLoading } = useQuery({
    queryKey: ['organization-invitations', organizationId],
    queryFn: async () => {
      if (!supabase || !organizationId) return [];
      
      const { data, error } = await supabase
        .from('organization_invitations')
        .select(`
          id,
          email,
          status,
          created_at,
          user_id,
          role_id,
          roles (
            id,
            name,
            type
          ),
          users (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) {
        return [];
      }
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Mock guests data (empty for now)
  const guests: any[] = [];

  // Revoke invitation mutation
  const revokeInviteMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase
        .from('organization_invitations')
        .delete()
        .eq('id', invitationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-invitations', organizationId] });
      toast({
        title: 'Invitación revocada',
        description: 'La invitación ha sido eliminada correctamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo revocar la invitación',
        variant: 'destructive',
      });
    },
  });

  // Resend invitation mutation (placeholder)
  const resendInviteMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      // TODO: Implement resend invitation logic (send email again)
      toast({
        title: 'Reenvío de invitación',
        description: 'Esta funcionalidad estará disponible pronto.',
      });
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ['organization-members-full'] });
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

  return (
    <div className="space-y-6">

      {/* Two Column Layout - Section descriptions left, content right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Section Description */}
        <div className="lg:col-span-4">
          <div className="flex items-center gap-2 mb-6">
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
                <MemberRow
                  key={member.id} 
                  member={{
                    ...member,
                    users: Array.isArray(member.users) ? member.users[0] : member.users,
                    roles: Array.isArray(member.roles) ? member.roles[0] : member.roles
                  }}
                  onClick={() => openModal('member', { editingMember: member })}
                  density="normal"
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
                          <AvatarImage src={(Array.isArray(member.users) ? member.users[0] : member.users)?.avatar_url} />
                          <AvatarFallback>
                            {getInitials((Array.isArray(member.users) ? member.users[0] : member.users)?.full_name || (Array.isArray(member.users) ? member.users[0] : member.users)?.email || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">
                              {(Array.isArray(member.users) ? member.users[0] : member.users)?.full_name || 'Sin nombre'}
                            </h4>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {(Array.isArray(member.users) ? member.users[0] : member.users)?.email}
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
                          variant={getRoleBadgeVariant((Array.isArray(member.roles) ? member.roles[0] : member.roles)?.name || '')}
                          className={getRoleBadgeClassName((Array.isArray(member.roles) ? member.roles[0] : member.roles)?.name || '')}
                        >
                          {(Array.isArray(member.roles) ? member.roles[0] : member.roles)?.name || 'Sin rol'}
                        </Badge>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="">
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
          <div className="flex items-center gap-2 mb-6">
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
                <MemberRow
                  key={guest.id} 
                  member={guest}
                  onClick={() => {}}
                  density="normal"
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
                            <Button variant="ghost" size="sm" className="">
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
          <div className="flex items-center gap-2 mb-6">
            <Clock className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Invitaciones Pendientes</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Las cuentas de invitados permiten a tus socios externos colaborar y comunicarse contigo aquí en Archub.
          </p>
        </div>

        {/* Right Column - Pending Invites Content */}
        <div className="lg:col-span-8">
          
          {isMobile ? (
            <div className="space-y-3">
              {pendingInvites.map((invite) => (
                <Card key={invite.id} className="p-4">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {getInitials(invite.email || 'I')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">
                              {invite.email}
                            </h4>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Invitado el {invite.created_at && !isNaN(new Date(invite.created_at).getTime()) 
                              ? format(new Date(invite.created_at), 'MMM dd, yyyy', { locale: es })
                              : 'Fecha no disponible'
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => resendInviteMutation.mutate(invite.id)}
                        >
                          Reenviar
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => revokeInviteMutation.mutate(invite.id)}
                        >
                          Revocar
                        </Button>
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
          ) : (
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <Card key={invite.id} className="p-4">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {getInitials(invite.email || 'I')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">
                              {invite.email}
                            </h4>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Invitado el {invite.created_at && !isNaN(new Date(invite.created_at).getTime()) 
                              ? format(new Date(invite.created_at), 'MMM dd, yyyy', { locale: es })
                              : 'Fecha no disponible'
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => resendInviteMutation.mutate(invite.id)}
                        >
                          Reenviar invitación
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => revokeInviteMutation.mutate(invite.id)}
                        >
                          Revocar invitación
                        </Button>
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
          )}
        </div>
      </div>
    </div>
  );
}