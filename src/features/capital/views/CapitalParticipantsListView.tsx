import { useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Edit, Trash2, HandHeart, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Table } from '@/components/shared/table';
import type { Column } from '@/components/shared/table';
import { Button } from '@/components/ui/button';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/dashboard';
import { EmptyState } from '@/components/shared/EmptyState';
import { useGlobalModalStore } from '@/components/modal';
import { parseLocalDate } from '@/lib/date-utils';
import { useMobile } from '@/hooks/use-mobile';
import { usePartners, usePartnerContributions, usePartnerWithdrawals, CAPITAL_QUERY_KEYS } from '@/features/capital';
import { IdentityBadge } from '@/components/shared/IdentityBadge';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import type { Partner } from '@/features/capital/types';

type EnrichedPartner = Partner & { partnerName: string };

export function CapitalParticipantsListView() {
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
    const confirmedWithdrawals = withdrawals.filter(w => w.status === 'confirmed');
    
    const recentContributions = contributions.filter(contribution => {
      const contributionDate = parseLocalDate(contribution.contribution_date);
      return contributionDate && contributionDate >= oneMonthAgo && contributionDate <= now;
    });

    return {
      totalPartners: partners.length,
      totalContributions: confirmedContributions.length,
      totalWithdrawals: confirmedWithdrawals.length,
      recentContributions: recentContributions.length,
    };
  }, [partners, contributions, withdrawals]);

  const deletePartnerMutation = useMutation({
    mutationFn: async (partnerId: string) => {
      const { error } = await supabase
        .from('capital_participants')
        .update({ is_deleted: true })
        .eq('id', partnerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAPITAL_QUERY_KEYS.participants(organizationId!) });
      queryClient.invalidateQueries({ queryKey: ['capital-contributions', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['capital-withdrawals', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['unified-movements'] });
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

  const columns: Column<EnrichedPartner>[] = [
    {
      key: 'partnerName',
      label: 'Socio',
      type: 'medium-text' as const,
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
      type: 'long-text' as const,
      sortable: true,
      render: (partner: EnrichedPartner) => {
        return partner.contacts?.email || '-';
      },
    },
    {
      key: 'phone',
      label: 'Teléfono',
      type: 'medium-text' as const,
      sortable: true,
      render: (partner: EnrichedPartner) => {
        return partner.contacts?.phone || '-';
      },
    },
  ];

  if (!isLoading && enrichedPartners.length === 0) {
    return (
      <EmptyState
        icon={<HandHeart />}
        title="No hay participantes en esta organización"
        description="Agrega socios para gestionar las participaciones de tu organización."
        action={
          <Button onClick={handleAddPartner} data-testid="button-add-partner-empty">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Participante
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard data-testid="stat-card-total-partners">
          <StatCardTitle showArrow={false}>
            <Users className="h-4 w-4" />
            Socios
          </StatCardTitle>
          <StatCardValue>
            {metrics.totalPartners}
          </StatCardValue>
          <StatCardMeta>
            Socios activos
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-total-contributions">
          <StatCardTitle showArrow={false}>
            <TrendingUp className="h-4 w-4" />
            Aportes
          </StatCardTitle>
          <StatCardValue className="text-[var(--positive)]">
            {metrics.totalContributions}
          </StatCardValue>
          <StatCardMeta>
            Aportes confirmados
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-total-withdrawals">
          <StatCardTitle showArrow={false}>
            <TrendingDown className="h-4 w-4" />
            Retiros
          </StatCardTitle>
          <StatCardValue className="text-[var(--negative)]">
            {metrics.totalWithdrawals}
          </StatCardValue>
          <StatCardMeta>
            Retiros confirmados
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-recent-contributions">
          <StatCardTitle showArrow={false}>
            <Calendar className="h-4 w-4" />
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
            label: 'Editar Participante',
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
