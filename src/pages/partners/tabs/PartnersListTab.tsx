import { useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Edit, Trash2, HandHeart, Calendar, TrendingUp } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Button } from '@/components/ui/button';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/dashboard';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { useGlobalModalStore } from '@/components/modal';
import { parseLocalDate } from '@/lib/date-utils';
import { useMobile } from '@/hooks/use-mobile';
import { usePartners, usePartnerContributions, usePartnerWithdrawals } from '@/features/partners';
import { IdentityBadge } from '@/components/shared/IdentityBadge';
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
  const { data: withdrawals = [] } = usePartnerWithdrawals(organizationId);

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

  const deletePartnerMutation = useMutation({
    mutationFn: async (partnerId: string) => {
      const { error } = await supabase
        .from('partners')
        .update({ is_deleted: true })
        .eq('id', partnerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      queryClient.invalidateQueries({ queryKey: ['partner-contributions'] });
      queryClient.invalidateQueries({ queryKey: ['partner-withdrawals'] });
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
    const associated = [
      ...contributions.filter(c => c.partner_id === partner.id),
      ...withdrawals.filter(w => w.partner_id === partner.id),
    ];
    
    const otherPartners = partners.filter(p => p.id !== partner.id);
    const canReplace = associated.length > 0 && otherPartners.length > 0;
    
    const consequences: string[] = [];
    if (associated.length > 0) {
      consequences.push(
        `${associated.length} transacción${associated.length === 1 ? '' : 'es'} relacionada${associated.length === 1 ? '' : 's'} será${associated.length === 1 ? 'á' : 'n'} afectada${associated.length === 1 ? '' : 's'}`
      );
    }
    
    const replacementOptions = otherPartners
      .map(p => ({
        label: p.contacts?.full_name || `${p.contacts?.first_name || ''} ${p.contacts?.last_name || ''}`.trim() || p.contacts?.email || 'Socio',
        value: p.id
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }));

    openModal('delete-confirmation', {
      mode: canReplace ? 'replace' : 'delete',
      title: 'Eliminar Socio',
      description: `¿Estás seguro de que quieres eliminar "${partner.partnerName}"?`,
      itemName: partner.partnerName,
      consequences: consequences.length > 0 ? consequences : undefined,
      replacementOptions: canReplace ? replacementOptions : undefined,
      currentId: partner.id,
      onDelete: () => {
        deletePartnerMutation.mutate(partner.id);
      },
      onReplace: (newId: string) => {
        // For now, just delete without replacing
        deletePartnerMutation.mutate(partner.id);
      }
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
        
        const displayName = contact?.full_name || 
                           `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim() ||
                           contact?.email ||
                           contact?.company_name;
        
        return (
          <IdentityBadge 
            name={displayName || '-'}
            linkedUser={contact?.linked_user}
            size="sm"
          />
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
