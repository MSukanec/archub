import { useMemo } from 'react';
import { calculateMonetaryKPI, calculateCountKPI, formatBreakdown } from '@/lib/kpis'
import { format as formatMoney, formatKPI } from '@/lib/money'
import { useToast } from '@/hooks/use-toast'
import { Plus, DollarSign, CheckCircle2, AlertCircle, ListChecks, FileText } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'
import { Button } from '@/components/ui/button'
import { useGlobalModalStore } from '@/components/modal'
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/dashboard'
import { EmptyState } from '@/components/shared/EmptyState'
import CommitmentAccordion from '@/features/clients/components/CommitmentAccordion'
import {
  useClientDashboard,
  useClientCommitments,
  useClientPayments,
  useDeleteClientCommitment,
  mapToClientSummaries,
  type CurrencyFinancial,
} from '@/features/clients'

interface ClientObligationsViewProps {
  projectId?: string;
}

export function ClientObligationsView({ projectId }: ClientObligationsViewProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const { selectedProjectId } = useProjectContext();
  const { openModal } = useGlobalModalStore();
  
  const organizationId = userData?.organization?.id
  const activeProjectId = projectId || selectedProjectId

  const { data: dashboardData, isLoading } = useClientDashboard(activeProjectId || undefined, organizationId);
  const { data: commitmentsData } = useClientCommitments(activeProjectId || undefined, organizationId);
  const { data: paymentsData } = useClientPayments(activeProjectId || undefined, organizationId);

  const projectClients = useMemo(() => {
    if (!dashboardData) return [];
    return mapToClientSummaries(dashboardData.clients, dashboardData.financialSummaries);
  }, [dashboardData]);

  const commitmentCurrency = useMemo(() => {
    if (!commitmentsData || commitmentsData.length === 0) return null;
    
    const currencyCount = new Map<string, { count: number; currency: NonNullable<typeof commitmentsData[0]['currency']> }>();
    
    commitmentsData.forEach(commitment => {
      if (!commitment.currency) return;
      
      const currencyId = commitment.currency.id;
      const existing = currencyCount.get(currencyId);
      
      if (existing) {
        existing.count += 1;
      } else {
        currencyCount.set(currencyId, {
          count: 1,
          currency: commitment.currency,
        });
      }
    });
    
    const entries = Array.from(currencyCount.values());
    if (entries.length === 0) return null;
    
    const mostCommon = entries.reduce((max, entry) => 
      entry.count > max.count ? entry : max
    );
    
    return mostCommon.currency;
  }, [commitmentsData]);

  const deleteCommitmentMutation = useDeleteClientCommitment();

  const handleEditCommitment = (commitment: NonNullable<typeof commitmentsData>[0]) => {
    openModal('client-commitment', {
      projectId: activeProjectId,
      organizationId,
      commitmentId: commitment.id,
      mode: 'edit',
    });
  };

  const handleDeleteCommitment = async (commitmentId: string, clientName: string) => {
    if (!activeProjectId || !organizationId) {
      toast({
        title: 'No disponible',
        description: 'Para eliminar un compromiso, selecciona un proyecto específico',
        variant: 'destructive',
      });
      return;
    }

    openModal('delete-confirmation', {
      mode: 'dangerous',
      title: 'Eliminar Compromiso',
      description: 'Se eliminará este compromiso de pago. Esta acción no se puede deshacer.',
      itemName: clientName,
      itemType: 'compromiso de pago',
      onConfirm: async () => {
        try {
          await deleteCommitmentMutation.mutateAsync({
            commitmentId,
            organizationId,
            projectId: activeProjectId!,
          });

          toast({
            title: 'Compromiso eliminado',
            description: 'El compromiso ha sido eliminado correctamente',
          });
        } catch (error: any) {
          toast({
            title: 'Error',
            description: error.message || 'No se pudo eliminar el compromiso',
            variant: 'destructive',
          });
        }
      },
    });
  };

  const handleAddClient = () => {
    openModal('project-client', {
      projectId: activeProjectId,
    });
  };

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No se pudo cargar la información de la organización</p>
      </div>
    )
  }

  const formatCurrencyKPI = (amount: number) => {
    if (!commitmentCurrency) return null;
    
    const formattedInteger = Math.round(amount).toLocaleString('es-AR');
    
    return <span>{commitmentCurrency.symbol} {formattedInteger}</span>;
  };

  const formatCurrencyBreakdown = (currencyData: Array<{ symbol: string; amount: number }>) => {
    if (!currencyData || currencyData.length === 0) return '-';
    
    return currencyData.map(({ symbol, amount }) => {
      const formattedAmount = amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `${symbol} ${formattedAmount}`;
    }).join(' + ');
  };

  const kpis = useMemo(() => {
    if (!commitmentCurrency) {
      return {
        totalCommittedKPI: { value: 0, formatted: '0', breakdown: [] },
        totalPaidKPI: { value: 0, formatted: '0', breakdown: [] },
        totalBalanceKPI: { value: 0, formatted: '0', breakdown: [] },
        totalScheduleItems: 0,
        totalSchedulePaid: 0,
        schedulePercentage: 0,
        totalCommittedAmount: 0,
        totalPaidAmount: 0,
        totalBalanceDue: 0,
      };
    }

    const committedItems = projectClients.flatMap(client => 
      client.financialByCurrency.map(financial => ({
        amount: financial.total_committed_amount,
        currency_id: financial.currency?.id || '',
        currency: financial.currency,
        exchange_rate: null
      }))
    );
    
    const paidPayments = (paymentsData || []).filter(p => p.status === 'confirmed');
    const paidItems = paidPayments.map(payment => ({
      amount: payment.amount,
      currency_id: payment.currency_id,
      currency: payment.currency,
      exchange_rate: payment.exchange_rate
    }));

    const totalCommittedKPI = calculateMonetaryKPI({
      items: committedItems,
      baseCurrencyId: commitmentCurrency?.code || commitmentCurrency?.id,
      symbol: commitmentCurrency?.symbol
    });

    const totalPaidKPI = calculateMonetaryKPI({
      items: paidItems,
      baseCurrencyId: commitmentCurrency?.code || commitmentCurrency?.id,
      symbol: commitmentCurrency?.symbol
    });

    const totalBalance = totalCommittedKPI.value - totalPaidKPI.value;
    const totalBalanceKPI = {
      ...totalCommittedKPI,
      value: totalBalance,
      formatted: formatKPI(totalBalance)
    };

    const totalScheduleItems = projectClients.reduce((sum, client) => sum + (client.financialByCurrency.reduce((s, f) => s + (f.total_schedule_items || 0), 0)), 0);
    const totalSchedulePaid = projectClients.reduce((sum, client) => sum + (client.financialByCurrency.reduce((s, f) => s + (f.schedule_paid || 0), 0)), 0);
    const schedulePercentage = totalScheduleItems > 0 ? (totalSchedulePaid / totalScheduleItems) * 100 : 0;

    return {
      totalCommittedKPI,
      totalPaidKPI,
      totalBalanceKPI,
      totalScheduleItems,
      totalSchedulePaid,
      schedulePercentage,
      totalCommittedAmount: totalCommittedKPI.value,
      totalPaidAmount: totalPaidKPI.value,
      totalBalanceDue: totalBalance,
    };
  }, [projectClients, paymentsData, commitmentCurrency]);

  const handleAddCommitment = () => {
    openModal('client-commitment', { projectId: activeProjectId, organizationId });
  };

  if (!isLoading && (!commitmentsData || commitmentsData.length === 0)) {
    return (
      <EmptyState
        icon={<FileText />}
        title="No hay compromisos de pago"
        description="Agrega compromisos de pago a tus clientes para gestionar sus obligaciones y ver métricas financieras aquí."
        action={
          <Button
            onClick={handleAddCommitment}
            data-testid="button-add-commitment-empty"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Compromiso
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard data-testid="stat-card-compromiso-total">
          <StatCardTitle showArrow={false}>
            <DollarSign className="w-4 h-4 inline mr-1" />
            Compromiso Total
          </StatCardTitle>
          <StatCardValue>
            {kpis.totalCommittedKPI?.formatted || '0'}
          </StatCardValue>
          <StatCardMeta>
            {kpis.totalCommittedKPI?.breakdown && kpis.totalCommittedKPI.breakdown.length > 1
              ? formatBreakdown(kpis.totalCommittedKPI)
              : 'Sin compromisos registrados'
            }
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-pagado">
          <StatCardTitle showArrow={false}>
            <CheckCircle2 className="w-4 h-4 inline mr-1" />
            Pagado
          </StatCardTitle>
          <StatCardValue>
            {kpis.totalPaidKPI?.formatted || '0'}
          </StatCardValue>
          <StatCardMeta>
            {kpis.totalPaidKPI?.breakdown && kpis.totalPaidKPI.breakdown.length > 1
              ? formatBreakdown(kpis.totalPaidKPI)
              : commitmentCurrency?.code || '-'
            }
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-saldo">
          <StatCardTitle showArrow={false}>
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Saldo
          </StatCardTitle>
          <StatCardValue>
            {kpis.totalBalanceKPI?.formatted || '0'}
          </StatCardValue>
          <StatCardMeta>
            {kpis.totalBalanceKPI?.breakdown && kpis.totalBalanceKPI.breakdown.length > 1
              ? formatBreakdown(kpis.totalBalanceKPI)
              : commitmentCurrency?.code || '-'
            }
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-items-pago">
          <StatCardTitle showArrow={false}>
            <ListChecks className="w-4 h-4 inline mr-1" />
            Items de Pago
          </StatCardTitle>
          <StatCardValue>
            {kpis.totalSchedulePaid}/{kpis.totalScheduleItems}
          </StatCardValue>
          <StatCardMeta>{kpis.schedulePercentage.toFixed(1)}% completado</StatCardMeta>
        </StatCard>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Cargando compromisos...</div>
        </div>
      ) : (
        <CommitmentAccordion
          commitments={commitmentsData || []}
          payments={paymentsData || []}
          onEdit={handleEditCommitment}
          onDelete={(commitment) => {
            const clientName = commitment.project_client?.contact?.full_name ||
              `${commitment.project_client?.contact?.first_name || ''} ${commitment.project_client?.contact?.last_name || ''}`.trim() ||
              commitment.project_client?.contact?.company_name ||
              'Cliente';
            handleDeleteCommitment(commitment.id, clientName);
          }}
        />
      )}
    </div>
  )
}

export default ClientObligationsView;
