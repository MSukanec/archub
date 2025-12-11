import { useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Edit, Trash2, HandHeart, Calendar, TrendingUp } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui-custom/KPICard';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { useGlobalModalStore } from '@/components/modal';
import { parseLocalDate } from '@/lib/date-utils';
import { useMobile } from '@/hooks/use-mobile';
import { usePartners, usePartnerContributions } from '@/features/partners';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import type { Partner } from '@/features/partners/types';

type EnrichedPartner = Partner & { partnerName: string };

export function PartnersListTab() {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const isMobile = useMobile();
  
  const organizationId = userData?.organization?.id;

  const { data: partners = [], isLoading } = usePartners(organizationId);
  const { data: contributions = [] } = usePartnerContributions(organizationId);

  const enrichedPartners = useMemo<EnrichedPartner[]>(() => {
    return partners.map(partner => ({
      ...partner,
      partnerName: partner.contacts?.full_name || 
                  `${partner.contacts?.first_name || ''} ${partner.contacts?.last_name || ''}`.trim() || 
                  partner.contacts?.email ||
                  partner.contacts?.company_name || '-'
    }));
  }, [partners]);

  const metrics = useMemo(() => {
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);

    const confirmedContributions = contributions.filter(c => c.status === 'confirmed');
    
    const recentContributions = contributions.filter(contribution => {
      const contributionDate = parseLocalDate(contribution.contribution_date);
      return contributionDate && contributionDate >= oneMonthAgo && contributionDate <= now;
    });

    return {
      totalPartners: partners.length,
      totalContributions: confirmedContributions.length,
      recentContributions: recentContributions.length,
    };
  }, [partners, contributions]);

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

  const handleDelete = (partner: EnrichedPartner) => {
    openModal('delete-confirmation', {
      mode: 'dangerous',
      title: 'Eliminar Socio',
      description: 'Se eliminará este socio de la organización. Esta acción no se puede deshacer.',
      itemName: partner.partnerName,
      itemType: 'socio',
      onConfirm: async () => {
        try {
          await removeMemberMutation.mutateAsync(partner.id);
        } catch (error: any) {
          toast({
            title: 'Error al eliminar socio',
            description: error.message,
            variant: 'destructive',
          });
        }
      },
    });
  };

  const handleEdit = (partner: EnrichedPartner) => {
    openModal('partner', {
      organizationId,
      partnerId: partner.id,
      mode: 'edit',
    });
  };

  const handleAddPartner = () => {
    openModal('partner', {
      organizationId,
    });
  };

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No se pudo cargar la información de la organización</p>
      </div>
    );
  }

  const columns = [
    {
      key: 'partnerName',
      label: 'Socio',
      sortable: true,
      render: (partner: EnrichedPartner) => {
        const contact = partner.contacts;
        const avatarUrl = contact?.image_bucket && contact?.image_path 
          ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${contact.image_bucket}/${contact.image_path}`
          : null;
        const displayName = contact?.full_name || 
                           `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim() ||
                           contact?.email ||
                           contact?.company_name;
        const initials = displayName 
          ? displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) 
          : '?';
        
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
              <AvatarFallback>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold">{displayName || '-'}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'email',
      label: 'Mail',
      sortable: true,
      render: (partner: EnrichedPartner) => {
        return partner.contacts?.email || '-';
      },
    },
    {
      key: 'phone',
      label: 'Teléfono',
      sortable: true,
      render: (partner: EnrichedPartner) => {
        return partner.contacts?.phone || '-';
      },
    },
  ];

  // Show only empty state when no partners
  if (!isLoading && enrichedPartners.length === 0) {
    return (
      <EmptyState
        icon={<HandHeart />}
        title="No hay socios en esta organización"
        description="Agrega socios para gestionar las participaciones de tu organización."
        action={
          <Button onClick={handleAddPartner} data-testid="button-add-partner-empty">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Socio
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard data-testid="stat-card-total-partners" className="col-span-2">
          <StatCardTitle showArrow={false}>
            <Users className="w-4 h-4 inline mr-1" />
            Total Socios
          </StatCardTitle>
          <StatCardValue>
            {metrics.totalPartners}
          </StatCardValue>
          <StatCardMeta>
            Socios en la organización
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-total-contributions">
          <StatCardTitle showArrow={false}>
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Aportes
          </StatCardTitle>
          <StatCardValue>
            {metrics.totalContributions}
          </StatCardValue>
          <StatCardMeta>
            Aportes confirmados
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-recent-contributions">
          <StatCardTitle showArrow={false}>
            <Calendar className="w-4 h-4 inline mr-1" />
            Recientes
          </StatCardTitle>
          <StatCardValue>
            {metrics.recentContributions}
          </StatCardValue>
          <StatCardMeta>
            Aportes del último mes
          </StatCardMeta>
        </StatCard>
      </div>

      <Table
        columns={columns}
        data={enrichedPartners}
        isLoading={isLoading}
        showDoubleHeader={false}
        defaultSort={{ key: 'partnerName', direction: 'asc' }}
        onRowClick={handleEdit}
        rowActions={(partner: EnrichedPartner) => [
          {
            label: 'Editar Socio',
            icon: Edit,
            onClick: () => handleEdit(partner),
          },
          {
            label: 'Eliminar',
            icon: Trash2,
            onClick: () => handleDelete(partner),
            variant: 'destructive',
          },
        ]}
      />
    </div>
  );
}
