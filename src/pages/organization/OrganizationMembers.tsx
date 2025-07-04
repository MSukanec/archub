import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Users, Plus, MoreHorizontal, UserCheck, UserX, Clock, Mail } from "lucide-react";

import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

import { useCurrentUser } from "@/hooks/use-current-user";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { CustomRestricted } from "@/components/ui-custom/CustomRestricted";
import { NewMemberModal } from "@/modals/organization/NewMemberModal";

interface OrganizationMember {
  id: string;
  user_id: string;
  organization_id: string;
  role_id: string;
  is_active: boolean;
  joined_at: string;
  last_active_at: string;
  users: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string;
  } | null;
  roles: {
    id: string;
    name: string;
  } | null;
}

interface GuestAccount {
  id: string;
  email: string;
  organization_id: string;
  role_id: string;
  invited_at: string;
  invited_by: string;
  is_active: boolean;
  roles: {
    id: string;
    name: string;
  } | null;
  invited_by_user: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

interface PendingInvite {
  id: string;
  email: string;
  organization_id: string;
  role_id: string;
  invited_at: string;
  invited_by: string;
  status: string;
  roles: {
    id: string;
    name: string;
  } | null;
  invited_by_user: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

export default function OrganizationMembers() {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const organizationId = userData?.preferences?.last_organization_id;

  // Fetch organization members
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['organization-members', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          organization_id,
          role_id,
          is_active,
          joined_at,
          last_active_at,
          users (
            id,
            full_name,
            email,
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
      return data as OrganizationMember[];
    },
    enabled: !!organizationId
  });

  // Fetch guest accounts 
  const { data: guests = [], isLoading: loadingGuests } = useQuery({
    queryKey: ['organization-guests', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('organization_guests')
        .select(`
          id,
          email,
          organization_id,
          role_id,
          invited_at,
          invited_by,
          is_active,
          roles (
            id,
            name
          ),
          invited_by_user:users!organization_guests_invited_by_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      if (error) {
        console.log('No guest accounts table found, using empty array');
        return [];
      }
      return data as GuestAccount[];
    },
    enabled: !!organizationId
  });

  // Fetch pending invites
  const { data: pendingInvites = [], isLoading: loadingInvites } = useQuery({
    queryKey: ['organization-invites', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('organization_invites')
        .select(`
          id,
          email,
          organization_id,
          role_id,
          invited_at,
          invited_by,
          status,
          roles (
            id,
            name
          ),
          invited_by_user:users!organization_invites_invited_by_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'pending');

      if (error) {
        console.log('No invites table found, using empty array');
        return [];
      }
      return data as PendingInvite[];
    },
    enabled: !!organizationId
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
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
        description: "El miembro ha sido removido de la organización"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el miembro",
        variant: "destructive"
      });
    }
  });

  // Resend invite mutation
  const resendInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from('organization_invites')
        .update({ 
          invited_at: new Date().toISOString(),
          status: 'pending'
        })
        .eq('id', inviteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-invites'] });
      toast({
        title: "Invitación reenviada",
        description: "La invitación ha sido enviada nuevamente"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo reenviar la invitación",
        variant: "destructive"
      });
    }
  });

  // Revoke invite mutation
  const revokeInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from('organization_invites')
        .update({ status: 'revoked' })
        .eq('id', inviteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-invites'] });
      toast({
        title: "Invitación revocada",
        description: "La invitación ha sido cancelada"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo revocar la invitación",
        variant: "destructive"
      });
    }
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName?.toLowerCase()) {
      case 'administrator':
      case 'administrador':
        return 'default';
      case 'standard user':
      case 'usuario estándar':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const headerProps = {
    title: "Miembros",
    icon: Users,
    showSearch: true,
    searchPlaceholder: "Buscar miembros...",
    searchValue: "",
    onSearchChange: () => {},
    onSearchClear: () => {},
    actions: [
      <CustomRestricted key="invite-member" feature="max_members" current={members.length}>
        <Button 
          onClick={() => setShowInviteModal(true)}
          className="h-8"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Invitar miembro
        </Button>
      </CustomRestricted>
    ]
  };

  const isLoading = loadingMembers || loadingGuests || loadingInvites;

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">Cargando miembros...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps}>
      <div className="grid grid-cols-12 gap-8">
          {/* Left Sidebar - Section Navigation */}
          <div className="col-span-3">
            <div className="space-y-1">
              <div className="px-3 pt-2 pb-2">
                <h2 className="text-lg font-semibold">Miembros</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Invita a miembros de tu equipo a Archub para trabajar juntos de forma rápida y 
                  colaborar fácilmente. Gestiona sus permisos para estructurar mejor los proyectos.
                </p>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-1">
                <Button variant="ghost" className="w-full justify-start text-sm font-medium">
                  <Users className="mr-2 h-4 w-4" />
                  Miembros ({members.length})
                </Button>
                
                <Button variant="ghost" className="w-full justify-start text-sm text-muted-foreground">
                  <UserCheck className="mr-2 h-4 w-4" />
                  Invitados ({guests.length})
                </Button>
                
                <Button variant="ghost" className="w-full justify-start text-sm text-muted-foreground">
                  <Clock className="mr-2 h-4 w-4" />
                  Invitaciones Pendientes ({pendingInvites.length})
                </Button>
              </div>
            </div>
          </div>

          {/* Right Content - Members List */}
          <div className="col-span-9">
            <div className="space-y-6 pt-2">
              {/* Members Section */}
              <div>
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
              {guests.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-medium">Cuentas de invitado</h3>
                      <p className="text-sm text-muted-foreground">
                        Las cuentas de invitado permiten a socios externos colaborar y 
                        comunicarse contigo, directamente en Archub.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Mail className="mr-2 h-4 w-4" />
                        Descargar CSV
                      </Button>
                      <Button size="sm">
                        Invitar nuevo miembro
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {guests.map((guest) => (
                      <Card key={guest.id} className="p-4">
                        <CardContent className="p-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback>
                                  {getInitials(guest.email)}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{guest.email}</h4>
                                <p className="text-xs text-muted-foreground">
                                  Invitado por {guest.invited_by_user?.full_name}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-xs text-muted-foreground text-right">
                                <div>{format(new Date(guest.invited_at), 'MMM dd, yyyy', { locale: es })}</div>
                              </div>

                              <Badge variant={getRoleBadgeVariant(guest.roles?.name || '')}>
                                {guest.roles?.name || 'Sin rol'}
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
                                  <DropdownMenuItem className="text-red-600">
                                    Revocar acceso
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Invites Section */}
              {pendingInvites.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-medium">Invitaciones pendientes</h3>
                      <p className="text-sm text-muted-foreground">
                        Las cuentas de invitado permiten a socios externos colaborar y 
                        comunicarse contigo, directamente en Archub.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {pendingInvites.map((invite) => (
                      <Card key={invite.id} className="p-4">
                        <CardContent className="p-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback>
                                  {getInitials(invite.email)}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{invite.email}</h4>
                                <p className="text-xs text-muted-foreground">
                                  Invitado por {invite.invited_by_user?.full_name}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-xs text-muted-foreground text-right">
                                <div>{format(new Date(invite.invited_at), 'MMM dd, yyyy', { locale: es })}</div>
                              </div>

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
                                onClick={() => revokeInviteMutation.mutate(invite.id)}
                              >
                                Revocar invitación
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
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
    </Layout>
  );
}