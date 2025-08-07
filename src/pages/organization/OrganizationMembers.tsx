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





  const headerProps = {
    title: "Miembros",
    description: "Gestiona los miembros de tu organización",
    actionButton: {
      label: "Invitar miembro",
      icon: UserPlus,
      onClick: () => openModal('member')
    }
  };

  const breadcrumb = [
    { name: "Organización", href: "/organization/dashboard" },
    { name: "Miembros", href: "/organization/members" }
  ];

  return (
    <Layout headerProps={headerProps}>
      <div>




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
                            <AvatarImage src={member.users?.avatar_url} />
                            <AvatarFallback>
                              {getInitials((member.users as any)?.full_name || (member.users as any)?.email || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm">
                                {(member.users as any)?.full_name || 'Sin nombre'}
                              </h4>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {(member.users as any)?.email}
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
                            variant={getRoleBadgeVariant((member.roles as any)?.name || '')}
                            className={getRoleBadgeClassName((member.roles as any)?.name || '')}
                          >
                            {(member.roles as any)?.name || 'Sin rol'}
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

      </div>
    </Layout>
  );
}