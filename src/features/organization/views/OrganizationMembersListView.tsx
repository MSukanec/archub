import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Users, 
  UserMinus,
  Clock, 
  MoreHorizontal,
  Lock,
  ArrowUpCircle,
  UserPlus,
  Trash2,
  Shield
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';

import MemberRow from "@/features/users/components/MemberRow";

import { useCurrentUser } from "@/hooks/use-current-user";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useOptimisticMutation } from "@/core/save-engine";
import { useGlobalModalStore } from "@/components/modal";
import { useMobile } from "@/hooks/use-mobile";
import { useLocation } from "wouter";
import { useMemberActionConfirmation } from "@/features/organization/hooks/useMemberActionConfirmation";

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
  if (role.includes('admin')) return 'default';
  if (role.includes('manager') || role.includes('editor')) return 'secondary';
  if (role.includes('viewer') || role.includes('guest')) return 'outline';
  return 'outline';
}

function getRoleBadgeClassName(roleName: string) {
  const role = roleName?.toLowerCase() || '';
  if (role.includes('admin')) return 'bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90';
  return '';
}

export function OrganizationMembersListView() {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const { showRevokeInvitationConfirmation, showRemoveMemberConfirmation } = useMemberActionConfirmation();
  const isMobile = useMobile();
  const [, navigate] = useLocation();

  const organizationId = userData?.organization?.id;

  const { data: membersRaw = [], isLoading: membersLoading } = useQuery({
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
          is_over_limit,
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
        .eq('is_active', true);
      
      if (error) {
        console.error('Error fetching members:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!organizationId,
  });

  const ownerId = (() => {
    const admins = membersRaw.filter((m: any) => {
      const role = ((Array.isArray(m.roles) ? m.roles[0] : m.roles)?.name || '').toLowerCase();
      return role.includes('admin');
    });
    if (admins.length === 0) return null;
    const sortedAdmins = [...admins].sort((a, b) => {
      const dateA = new Date(a.joined_at || 0).getTime();
      const dateB = new Date(b.joined_at || 0).getTime();
      return dateA - dateB;
    });
    return sortedAdmins[0]?.user_id || null;
  })();

  const members = [...membersRaw].sort((a, b) => {
    const aRole = ((Array.isArray(a.roles) ? a.roles[0] : a.roles)?.name || '').toLowerCase();
    const bRole = ((Array.isArray(b.roles) ? b.roles[0] : b.roles)?.name || '').toLowerCase();
    const aName = ((Array.isArray(a.users) ? a.users[0] : a.users)?.full_name || '').toLowerCase();
    const bName = ((Array.isArray(b.users) ? b.users[0] : b.users)?.full_name || '').toLowerCase();
    const aIsOwner = a.user_id === ownerId;
    const bIsOwner = b.user_id === ownerId;
    const aIsAdmin = aRole.includes('admin');
    const bIsAdmin = bRole.includes('admin');
    const aIsEditor = aRole.includes('editor');
    const bIsEditor = bRole.includes('editor');

    if (aIsOwner && !bIsOwner) return -1;
    if (!aIsOwner && bIsOwner) return 1;

    if (aIsAdmin && !bIsAdmin) return -1;
    if (!aIsAdmin && bIsAdmin) return 1;

    if (aIsAdmin && bIsAdmin) return aName.localeCompare(bName);

    if (aIsEditor && !bIsEditor) return -1;
    if (!aIsEditor && bIsEditor) return 1;

    if (aIsEditor && bIsEditor) return aName.localeCompare(bName);

    return aName.localeCompare(bName);
  });

  const suspendedMembersCount = members.filter((m: any) => m.is_over_limit === true).length;

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
        console.error('Error fetching invitations:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!organizationId,
  });

  const { data: formerMembersRaw = [] } = useQuery({
    queryKey: ['organization-former-members', organizationId],
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
          updated_at,
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
        .eq('is_active', false)
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching former members:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!organizationId,
  });

  const formerMembers = formerMembersRaw;

  const revokeInviteMutation = useOptimisticMutation({
    mutationFn: async (invitationId: string) => {
      if (!supabase) throw new Error('Supabase not initialized');
      const { error } = await supabase
        .from('organization_invitations')
        .delete()
        .eq('id', invitationId);
      if (error) throw error;
    },
    queryKey: ['organization-invitations', organizationId],
    optimisticUpdate: (oldData, invitationId) => {
      if (!oldData) return oldData;
      return oldData.filter((inv: any) => inv.id !== invitationId);
    },
    onSuccessMessage: 'Invitación revocada correctamente',
    onErrorMessage: 'No se pudo revocar la invitación',
  });

  const resendInviteMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      toast({
        title: 'Reenvío de invitación',
        description: 'Esta funcionalidad estará disponible pronto.',
      });
    },
  });

  const removeMemberMutation = useOptimisticMutation({
    mutationFn: async (memberId: string) => {
      if (!organizationId) throw new Error('Organization not found');
      const response = await fetch(`/api/organizations/${organizationId}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase?.auth.getSession())?.data.session?.access_token}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove member');
      }
      return response.json();
    },
    queryKey: ['organization-members-full', organizationId],
    optimisticUpdate: (oldData, memberId) => {
      if (!oldData) return oldData;
      return oldData.filter((m: any) => m.id !== memberId);
    },
    onSuccessMessage: 'Miembro eliminado correctamente',
    onErrorMessage: 'Error al eliminar el miembro',
    additionalQueryKeys: [['organization-members']],
  });

  const handleRemoveMember = (member: any) => {
    const memberUser = Array.isArray(member.users) ? member.users[0] : member.users;
    const memberRole = Array.isArray(member.roles) ? member.roles[0] : member.roles;
    
    showRemoveMemberConfirmation({
      memberName: memberUser?.full_name || member.user_data?.full_name || '',
      memberEmail: memberUser?.email || member.email || '',
      memberRole: memberRole?.name,
      billingInfo: {
        hasPaidForSeat: false,
      },
      onConfirm: () => removeMemberMutation.mutate(member.id),
      isLoading: removeMemberMutation.isPending,
    });
  };

  const handleRevokeInvitation = (invite: any) => {
    showRevokeInvitationConfirmation({
      memberName: invite.user_data?.full_name || '',
      memberEmail: invite.email,
      memberRole: invite.role_data?.name,
      billingInfo: {
        hasPaidForSeat: false,
      },
      onConfirm: () => revokeInviteMutation.mutate(invite.id),
      isLoading: revokeInviteMutation.isPending,
    });
  };

  if (membersLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {suspendedMembersCount > 0 && (
        <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/30">
          <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-800 dark:text-amber-200 font-medium">
            Miembros suspendidos
          </AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300 flex items-center justify-between">
            <span>
              {suspendedMembersCount} {suspendedMembersCount === 1 ? 'miembro está suspendido' : 'miembros están suspendidos'} por exceder los límites de tu plan actual.
            </span>
            <Button 
              size="sm" 
              variant="outline"
              className="ml-4 border-amber-500 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900"
              onClick={() => navigate('/organization/billing')}
              data-testid="button-upgrade-plan-members"
            >
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              Mejorar Plan
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Users className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Miembros</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Invita a tu equipo para trabajar juntos y colaborar fácilmente. Gestiona sus permisos para proyectos mejores.
          </p>
        </div>

        <div>
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
              {members.map((member) => {
                const isSuspended = member.is_over_limit === true;
                const isOwner = member.user_id === ownerId;
                return (
                  <Card key={member.id} className={`p-4 ${isSuspended ? 'opacity-60' : ''}`}>
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
                              {isSuspended && (
                                <Lock className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                              )}
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

                          {isSuspended && (
                            <Badge 
                              variant="outline"
                              className="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 text-[10px] px-1.5 py-0"
                            >
                              Suspendido
                            </Badge>
                          )}

                          <Badge 
                            variant={getRoleBadgeVariant((Array.isArray(member.roles) ? member.roles[0] : member.roles)?.name || '')}
                            className={getRoleBadgeClassName((Array.isArray(member.roles) ? member.roles[0] : member.roles)?.name || '')}
                          >
                            {(Array.isArray(member.roles) ? member.roles[0] : member.roles)?.name || 'Sin rol'}
                          </Badge>

                          {!isOwner && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="h-6 w-6"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem 
                                  onClick={() => openModal('member', { editingMember: member })}
                                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-transparent focus:bg-transparent text-foreground hover:text-[var(--accent)] transition-colors"
                                >
                                  <Shield className="h-4 w-4" />
                                  Editar Miembro
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleRemoveMember(member)}
                                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-transparent focus:bg-transparent text-foreground hover:text-red-600 dark:hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Eliminar miembro
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Clock className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Invitaciones Pendientes</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Personas que han sido invitadas pero aún no han aceptado unirse a tu organización.
          </p>
        </div>

        <div>
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
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleRevokeInvitation(invite)}
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

                      <div className="flex items-center gap-4">
                        <Badge variant="outline">
                          {(Array.isArray(invite.roles) ? invite.roles[0] : invite.roles)?.name || 'Sin rol'}
                        </Badge>

                        <div className="flex gap-2">
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => resendInviteMutation.mutate(invite.id)}
                          >
                            Reenviar
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleRevokeInvitation(invite)}
                          >
                            Revocar
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
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {formerMembers.length > 0 && (
        <>
          <hr className="border-t border-[var(--section-divider)] my-8" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <UserMinus className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-muted-foreground">Miembros Anteriores</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Personas que formaron parte de tu organización pero ya no están activas. Puedes volver a invitarlos si es necesario.
              </p>
            </div>

            <div>
              <div className="space-y-2">
                {formerMembers.map((member) => {
                  const userData = Array.isArray(member.users) ? member.users[0] : member.users;
                  const roleData = Array.isArray(member.roles) ? member.roles[0] : member.roles;
                  
                  return (
                    <Card key={member.id} className="p-4 opacity-70">
                      <CardContent className="p-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 grayscale">
                              <AvatarImage src={userData?.avatar_url} />
                              <AvatarFallback>
                                {getInitials(userData?.full_name || userData?.email || 'U')}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm text-muted-foreground">
                                  {userData?.full_name || 'Sin nombre'}
                                </h4>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {userData?.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-xs text-muted-foreground text-right">
                              <div className="text-[10px] uppercase tracking-wide">Fue miembro</div>
                              <div>
                                {member.joined_at && !isNaN(new Date(member.joined_at).getTime()) 
                                  ? format(new Date(member.joined_at), 'MMM yyyy', { locale: es })
                                  : '—'
                                }
                                {member.updated_at && ' - '}
                                {member.updated_at && !isNaN(new Date(member.updated_at).getTime()) 
                                  ? format(new Date(member.updated_at), 'MMM yyyy', { locale: es })
                                  : ''
                                }
                              </div>
                            </div>

                            <Badge variant="outline" className="text-muted-foreground">
                              {roleData?.name || 'Sin rol'}
                            </Badge>

                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openModal('member', { 
                                editingMember: null,
                                defaultEmail: userData?.email 
                              })}
                              data-testid={`button-reinvite-${member.id}`}
                            >
                              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                              Reinvitar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
