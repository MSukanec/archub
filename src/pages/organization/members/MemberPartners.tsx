import { useState } from 'react';
import { HandHeart, MoreHorizontal } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { MemberCard } from '@/components/cards/MemberCard';

// Helper functions
function getInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

function isMobileDevice(): boolean {
  return window.innerWidth < 768;
}

function getRoleBadgeVariant(role: string): "default" | "secondary" | "destructive" | "outline" {
  if (role.includes('propietario') || role.includes('fundador')) return 'default';
  if (role.includes('socio')) return 'secondary';
  return 'outline';
}

function getRoleBadgeClassName(role: string): string {
  if (role.includes('propietario') || role.includes('fundador')) return 'bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90';
  return '';
}

interface MemberPartnersProps {
  organization: any;
}

export function MemberPartners({ organization }: MemberPartnersProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  
  const [isMobile] = useState(isMobileDevice());
  
  const organizationId = organization?.id;

  // Mock partners data (empty for now since we don't have a partners table yet)
  const partners: any[] = [];
  console.log('No partners table found, using empty array');

  const removeMemberMutation = useMutation({
    mutationFn: async (partnerId: string) => {
      // Mock functionality
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({
        title: "Socio eliminado",
        description: "El socio ha sido eliminado de la organización.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el socio",
        variant: "destructive",
      });
    },
  });

  const handleDeletePartner = (partner: any) => {
    openModal('delete-confirmation', {
      mode: 'dangerous',
      title: 'Eliminar socio',
      description: 'Esta acción eliminará permanentemente el socio de la organización. Perderá acceso a todos los proyectos y datos.',
      itemName: partner.user_data?.full_name || partner.email || 'Socio',
      destructiveActionText: 'Eliminar',
      onConfirm: () => removeMemberMutation.mutate(partner.id),
      isLoading: removeMemberMutation.isPending
    });
  };

  return (
    <div className="space-y-6">
      {/* Two Column Layout - Section descriptions left, content right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Section Description */}
        <div className="lg:col-span-4">
          <div className="flex items-center gap-2 mb-4">
            <HandHeart className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Socios</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Gestiona los socios de la organización y sus participaciones. Define permisos y roles para una administración efectiva.
          </p>
        </div>

        {/* Right Column - Partners Content */}
        <div className="lg:col-span-8">
          
          {isMobile ? (
            <div className="space-y-3">
              {partners.map((partner) => (
                <MemberCard 
                  key={partner.id} 
                  member={{
                    ...partner,
                    users: Array.isArray(partner.users) ? partner.users[0] : partner.users,
                    roles: Array.isArray(partner.roles) ? partner.roles[0] : partner.roles
                  }}
                />
              ))}
              {partners.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <HandHeart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm">No hay socios en esta organización.</p>
                  <p className="text-xs">Ingresa al primer socio para comenzar.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {partners.map((partner) => (
                <Card key={partner.id} className="p-4">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={(Array.isArray(partner.users) ? partner.users[0] : partner.users)?.avatar_url} />
                          <AvatarFallback>
                            {getInitials((Array.isArray(partner.users) ? partner.users[0] : partner.users)?.full_name || (Array.isArray(partner.users) ? partner.users[0] : partner.users)?.email || 'S')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">
                              {(Array.isArray(partner.users) ? partner.users[0] : partner.users)?.full_name || 'Sin nombre'}
                            </h4>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {(Array.isArray(partner.users) ? partner.users[0] : partner.users)?.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-xs text-muted-foreground text-right">
                          <div>
                            {partner.joined_at && !isNaN(new Date(partner.joined_at).getTime()) 
                              ? format(new Date(partner.joined_at), 'MMM dd, yyyy', { locale: es })
                              : 'Fecha no disponible'
                            }
                          </div>
                        </div>

                        <Badge 
                          variant={getRoleBadgeVariant((Array.isArray(partner.roles) ? partner.roles[0] : partner.roles)?.name || '')}
                          className={getRoleBadgeClassName((Array.isArray(partner.roles) ? partner.roles[0] : partner.roles)?.name || '')}
                        >
                          {(Array.isArray(partner.roles) ? partner.roles[0] : partner.roles)?.name || 'Sin rol'}
                        </Badge>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openModal('partner', { editingPartner: partner })}>
                              Editar socio
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeletePartner(partner)}
                            >
                              Eliminar socio
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {partners.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <HandHeart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm">No hay socios en esta organización.</p>
                  <p className="text-xs">Ingresa al primer socio para comenzar.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}