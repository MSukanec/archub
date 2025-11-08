import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Trash2, HandHeart } from 'lucide-react';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { usePartners } from '@/hooks/use-partners';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

function getInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

export function PartnersTab() {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  
  const organizationId = userData?.organization?.id;

  // Query to get partners with their contact information
  const { data: partners = [], isLoading } = usePartners(organizationId);

  const removeMemberMutation = useMutation({
    mutationFn: async (partnerId: string) => {
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', partnerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
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
      itemName: `${partner.contacts?.first_name || ''} ${partner.contacts?.last_name || ''}`.trim() || partner.contacts?.email || 'Socio',
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
          <div className="flex items-center gap-2 mb-6">
            <HandHeart className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Socios</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Gestiona los socios de la organización y sus participaciones. Define permisos y roles para una administración efectiva.
          </p>
        </div>

        {/* Right Column - Partners Content */}
        <div className="lg:col-span-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Cargando socios...</div>
            </div>
          ) : partners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <HandHeart className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No hay socios en esta organización.
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ingresa al primer socio para comenzar.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {partners.map((partner) => {
                const contact = partner.contacts;
                const fullName = `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim();
                const displayName = contact?.company_name || fullName || contact?.email || 'Sin nombre';
                
                return (
                  <Card key={partner.id} className="p-4">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-background">
                            {(contact as any)?.avatar_url ? (
                              <AvatarImage 
                                src={(contact as any).avatar_url} 
                                alt={displayName} 
                              />
                            ) : (
                              <AvatarFallback className="bg-[var(--accent)]/10 text-[var(--accent)] font-medium">
                                {getInitials(displayName)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">
                              {displayName}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {contact?.email || 'Sin email'}
                            </p>
                          </div>
                        </div>

                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeletePartner(partner)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}