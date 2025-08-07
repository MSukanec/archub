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
    description: "Gestiona los miembros de tu organización"
  };

  const breadcrumb = [
    { name: "Organización", href: "/organization/dashboard" },
    { name: "Miembros", href: "/organization/members" }
  ];

  return (
    <Layout headerProps={headerProps}>
      <div>
        {/* Feature Introduction - Mobile only */}
          features={[
            {
              title: "Invitación de miembros",
              description: "Invita a miembros de tu equipo que puedan acceder a todos los proyectos y herramientas de colaboración"
            },
            {
              title: "Gestión de roles",
              description: "Gestiona roles y permisos individuales para cada miembro según sus responsabilidades"
            },
            {
              title: "Control de acceso",
              description: "Controla el acceso a configuraciones de la organización y datos sensibles"
            },
            {
              title: "Supervisión de actividad",
              description: "Supervisa la actividad y el estado de conexión de cada miembro del equipo"
            }
          ]}
        />

        {/* ActionBar Desktop */}
        <ActionBarDesktop
          showProjectSelector={false}
          customActions={[
            <CustomRestricted 
              key="invite-member"
              feature="max_members" 
              current={members.length}
            >
              <Button onClick={() => openModal('member')}>
                Invitar miembro
              </Button>
            </CustomRestricted>
          ]}
          features={[
            {
              title: "Invitación y gestión de equipo",
              description: "Invita a miembros de tu equipo con acceso completo a proyectos y herramientas de colaboración. Administra perfiles y datos de contacto."
            },
            {
              title: "Control de roles y permisos",
              description: "Asigna roles específicos (Admin, Editor, Viewer) con permisos diferenciados. Controla acceso a configuraciones sensibles de la organización."
            },
            {
              title: "Supervisión de actividad y estado",
              description: "Monitorea el estado de conexión, última actividad y participación de cada miembro del equipo en tiempo real."
            },
            {
              title: "Gestión de invitaciones y huéspedes",
              description: "Administra invitaciones pendientes, cuentas de huéspedes temporales y colaboradores externos con acceso limitado a proyectos específicos."
            }
          ]}
        />

        {/* Two Column Layout - Section descriptions left, content right */}
          {/* Left Column - Section Description */}
            </div>
              Invita a tu equipo para trabajar juntos y colaborar fácilmente. Gestiona sus permisos para proyectos mejores.
            </p>
          </div>

          {/* Right Column - Members Content */}
            
            {isMobile ? (
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
                  </div>
                )}
              </div>
            ) : (
                {members.map((member) => (
                            <AvatarImage src={member.users?.avatar_url} />
                            <AvatarFallback>
                              {getInitials(member.users?.full_name || member.users?.email || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          
                                {member.users?.full_name || 'Sin nombre'}
                              </h4>
                            </div>
                              {member.users?.email}
                            </p>
                          </div>
                        </div>

                            <div>
                              {member.joined_at && !isNaN(new Date(member.joined_at).getTime()) 
                                ? format(new Date(member.joined_at), 'MMM dd, yyyy', { locale: es })
                                : 'Fecha no disponible'
                              }
                            </div>
                          </div>

                          <Badge 
                            variant={getRoleBadgeVariant(member.roles?.name || '')}
                            className={getRoleBadgeClassName(member.roles?.name || '')}
                          >
                            {member.roles?.name || 'Sin rol'}
                          </Badge>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openModal('member', { editingMember: member })}>
                                Editar rol
                              </DropdownMenuItem>
                              <DropdownMenuItem 
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
                  </div>
                )}
              </div>
            )}
          </div>
        </div>


          {/* Left Column - Guests Section Description */}
            </div>
              Las cuentas de invitados permiten a tus socios externos colaborar y comunicarse contigo aquí en Archub.
            </p>
          </div>

          {/* Right Column - Guests Content */}
            
            {isMobile ? (
                {guests.map((guest) => (
                  <MemberCard 
                    key={guest.id} 
                    member={guest}
                  />
                ))}
                {guests.length === 0 && (
                  </div>
                )}
              </div>
            ) : (
                {guests.map((guest) => (
                            <AvatarImage src={guest.users?.avatar_url} />
                            <AvatarFallback>
                              {getInitials(guest.users?.full_name || guest.users?.email || 'G')}
                            </AvatarFallback>
                          </Avatar>
                          
                                {guest.users?.full_name || 'Sin nombre'}
                              </h4>
                            </div>
                              {guest.users?.email}
                            </p>
                          </div>
                        </div>

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
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                Editar rol
                              </DropdownMenuItem>
                              <DropdownMenuItem 
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
                  </div>
                )}
              </div>
            )}
          </div>
        </div>


          {/* Left Column - Pending Invites Section Description */}
            </div>
              Las cuentas de invitados permiten a tus socios externos colaborar y comunicarse contigo aquí en Archub.
            </p>
          </div>

          {/* Right Column - Pending Invites Content */}
            
              {pendingInvites.map((invite) => (
                          <AvatarFallback>
                            {getInitials(invite.email || 'P')}
                          </AvatarFallback>
                        </Avatar>
                        
                              {invite.email}
                            </h4>
                          </div>
                            Invitación enviada
                          </p>
                        </div>
                      </div>

                          <div>
                            {invite.created_at && !isNaN(new Date(invite.created_at).getTime()) 
                              ? format(new Date(invite.created_at), 'MMM dd, yyyy', { locale: es })
                              : 'Fecha no disponible'
                            }
                          </div>
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
                    </div>
                  </CardContent>
                </Card>
              ))}

              {pendingInvites.length === 0 && (
                </div>
              )}
            </div>
          </div>
        </div>
      </div>




    </Layout>
  );
}