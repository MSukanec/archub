import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Users, Plus, MoreHorizontal, UserCheck, UserX, Clock, Mail } from "lucide-react";

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
import { NewMemberModal } from "@/modals/NewMemberModal";

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
  const { data: userData } = useCurrentUser();
  const { toast } = useToast();
  const [showInviteModal, setShowInviteModal] = useState(false);

  const organizationId = userData?.preferences?.last_organization_id;

  // Fetch organization members
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['organization-members', organizationId],
    queryFn: async () => {
      if (!supabase || !organizationId) return [];
      
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          *,
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
        .eq('is_active', true)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      return data as OrganizationMember[];
    },
    enabled: !!organizationId && !!supabase
  });

  // Fetch guest accounts
  const { data: guestAccounts = [], isLoading: guestsLoading } = useQuery({
    queryKey: ['guest-accounts', organizationId],
    queryFn: async () => {
      if (!supabase || !organizationId) return [];
      
      const { data, error } = await supabase
        .from('guest_accounts')
        .select(`
          *,
          roles (
            id,
            name
          ),
          invited_by_user:users!invited_by (
            id,
            full_name,
            email
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('invited_at', { ascending: false });

      if (error) throw error;
      return data as GuestAccount[];
    },
    enabled: !!organizationId && !!supabase
  });

  // Fetch pending invites
  const { data: pendingInvites = [], isLoading: invitesLoading } = useQuery({
    queryKey: ['pending-invites', organizationId],
    queryFn: async () => {
      if (!supabase || !organizationId) return [];
      
      const { data, error } = await supabase
        .from('organization_invites')
        .select(`
          *,
          roles (
            id,
            name
          ),
          invited_by_user:users!invited_by (
            id,
            full_name,
            email
          )
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .order('invited_at', { ascending: false });

      if (error) throw error;
      return data as PendingInvite[];
    },
    enabled: !!organizationId && !!supabase
  });

  const isLoading = membersLoading || guestsLoading || invitesLoading;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="w-full">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const allMembersCount = members.length + guestAccounts.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold">Miembros</h1>
          </div>
          <Badge variant="secondary" className="text-sm">
            {allMembersCount} {allMembersCount === 1 ? 'miembro' : 'miembros'}
          </Badge>
        </div>
        
        <CustomRestricted feature="max_members">
          <Button onClick={() => setShowInviteModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Invitar Miembro
          </Button>
        </CustomRestricted>
      </div>

      {/* Active Members Section */}
      {members.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-green-600" />
            <h2 className="text-lg font-medium">Miembros Activos</h2>
            <Badge variant="outline">{members.length}</Badge>
          </div>
          
          <div className="grid gap-3">
            {members.map((member) => (
              <Card key={member.id} className="w-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        {member.users?.avatar_url && (
                          <AvatarImage src={member.users.avatar_url} />
                        )}
                        <AvatarFallback>
                          {member.users?.full_name?.substring(0, 2).toUpperCase() || 
                           member.users?.email?.substring(0, 2).toUpperCase() || 'XX'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {member.users?.full_name || member.users?.email || 'Usuario sin nombre'}
                          </p>
                          {member.roles?.name === 'owner' && (
                            <Badge variant="default" className="text-xs bg-yellow-100 text-yellow-800">
                              <Users className="w-3 h-3 mr-1" />
                              Propietario
                            </Badge>
                          )}
                          {member.roles?.name === 'admin' && (
                            <Badge variant="secondary" className="text-xs">
                              Admin
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {member.users?.email || 'Sin email'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Desde {format(new Date(member.joined_at), 'dd/MM/yyyy', { locale: es })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          Ver perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Cambiar rol
                        </DropdownMenuItem>
                        <Separator />
                        <DropdownMenuItem className="text-red-600">
                          Remover miembro
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Guest Accounts Section */}
      {guestAccounts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <UserX className="w-4 h-4 text-blue-600" />
            <h2 className="text-lg font-medium">Cuentas Invitadas</h2>
            <Badge variant="outline">{guestAccounts.length}</Badge>
          </div>
          
          <div className="grid gap-3">
            {guestAccounts.map((guest) => (
              <Card key={guest.id} className="w-full border-blue-200 bg-blue-50/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {guest.email.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{guest.email}</p>
                          <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                            Invitado
                          </Badge>
                          {guest.roles && (
                            <Badge variant="secondary" className="text-xs">
                              {guest.roles.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Invitado el {format(new Date(guest.invited_at), 'dd/MM/yyyy', { locale: es })}
                          </span>
                          {guest.invited_by_user && (
                            <span>
                              por {guest.invited_by_user.full_name || guest.invited_by_user.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          Reenviar invitación
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Cambiar rol
                        </DropdownMenuItem>
                        <Separator />
                        <DropdownMenuItem className="text-red-600">
                          Revocar acceso
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pending Invites Section */}
      {pendingInvites.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-600" />
            <h2 className="text-lg font-medium">Invitaciones Pendientes</h2>
            <Badge variant="outline">{pendingInvites.length}</Badge>
          </div>
          
          <div className="grid gap-3">
            {pendingInvites.map((invite) => (
              <Card key={invite.id} className="w-full border-orange-200 bg-orange-50/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-orange-100 text-orange-700">
                          {invite.email.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{invite.email}</p>
                          <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                            Pendiente
                          </Badge>
                          {invite.roles && (
                            <Badge variant="secondary" className="text-xs">
                              {invite.roles.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Invitado el {format(new Date(invite.invited_at), 'dd/MM/yyyy', { locale: es })}
                          </span>
                          {invite.invited_by_user && (
                            <span>
                              por {invite.invited_by_user.full_name || invite.invited_by_user.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          Reenviar invitación
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Cambiar rol
                        </DropdownMenuItem>
                        <Separator />
                        <DropdownMenuItem className="text-red-600">
                          Cancelar invitación
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {allMembersCount === 0 && pendingInvites.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay miembros aún</h3>
          <p className="text-muted-foreground mb-4">
            Invita a tu equipo para comenzar a colaborar en proyectos.
          </p>
          <CustomRestricted feature="max_members">
            <Button onClick={() => setShowInviteModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Invitar Primer Miembro
            </Button>
          </CustomRestricted>
        </div>
      )}

      {/* Member Invitation Modal */}
      <NewMemberModal 
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  );
}