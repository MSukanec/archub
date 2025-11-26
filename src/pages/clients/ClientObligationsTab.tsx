import { useMemo } from 'react';
import { useToast } from '@/hooks/use-toast'
import { Users, Plus, DollarSign, CheckCircle2, AlertCircle, ListChecks } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'
import { Button } from '@/components/ui/button'
import { useGlobalModalStore } from '@/components/modal'
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui-custom/KPICard'
import CommitmentAccordion from '@/features/clients/components/CommitmentAccordion'
import {
  useClientDashboard,
  useClientCommitments,
  useClientPayments,
  useDeleteClientCommitment,
  mapToClientSummaries,
  type CurrencyFinancial,
} from '@/features/clients'

interface ClientListTabProps {
  projectId?: string;
}

export default function ClientObligationsTab({ projectId }: ClientListTabProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const { selectedProjectId } = useProjectContext();
  const { openModal } = useGlobalModalStore();
  
  const organizationId = userData?.organization?.id
  const activeProjectId = projectId || selectedProjectId

  const { data: dashboardData, isLoading } = useClientDashboard(activeProjectId || undefined, organizationId);
  const { data: commitmentsData } = useClientCommitments(activeProjectId || undefined, organizationId);
  const { data: paymentsData } = useClientPayments(activeProjectId || undefined, organizationId);

  // Transform dashboard data using mappers (no inline calculations)
  const projectClients = useMemo(() => {
    if (!dashboardData) return [];
    return mapToClientSummaries(dashboardData.clients, dashboardData.financialSummaries);
  }, [dashboardData]);

  // Determine the commitment currency (the most common currency in commitments)
  const commitmentCurrency = useMemo(() => {
    if (!commitmentsData || commitmentsData.length === 0) return null;
    
    // Count occurrences of each currency in commitments
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
    
    // Find the most common currency
    const entries = Array.from(currencyCount.values());
    if (entries.length === 0) return null;
    
    const mostCommon = entries.reduce((max, entry) => 
      entry.count > max.count ? entry : max
    );
    
    return mostCommon.currency;
  }, [commitmentsData]);

  const deleteCommitmentMutation = useDeleteClientCommitment();

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

  // Format currency for KPIs (integers only, no decimals)
  const formatCurrencyKPI = (amount: number) => {
    if (!commitmentCurrency) return null;
    
    const formattedInteger = Math.round(amount).toLocaleString('es-AR');
    
    return <span>{commitmentCurrency.symbol} {formattedInteger}</span>;
  };

  // Format currency breakdown by original currency
  const formatCurrencyBreakdown = (currencyData: Array<{ symbol: string; amount: number }>) => {
    if (!currencyData || currencyData.length === 0) return '-';
    
    return currencyData.map(({ symbol, amount }) => {
      const formattedAmount = amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `${symbol} ${formattedAmount}`;
    }).join(' + ');
  };

  // Calculate KPIs with currency conversion
  const kpis = useMemo(() => {
    if (!dashboardData || !commitmentCurrency) {
      return {
        totalCommittedAmount: 0,
        totalPaidAmount: 0,
        totalBalanceDue: 0,
        paidPercentage: 0,
        balancePercentage: 0,
        totalScheduleItems: 0,
        totalSchedulePaid: 0,
        schedulePercentage: 0,
        committedByOriginalCurrency: [] as Array<{ symbol: string; amount: number }>,
        paidByOriginalCurrency: [] as Array<{ symbol: string; amount: number }>,
        balanceByOriginalCurrency: [] as Array<{ symbol: string; amount: number }>,
      };
    }

    // Helper: Convert amount to commitment currency using exchange_rate
    const convertToCommitmentCurrency = (amount: number, currency: CurrencyFinancial['currency'], exchangeRate: number | null): number => {
      if (!currency) return 0;
      
      // If already in commitment currency, return as-is
      if (currency.id === commitmentCurrency.id) {
        return amount;
      }
      
      // If no exchange rate, cannot convert
      if (!exchangeRate || exchangeRate === 0) {
        return 0; // Skip
      }
      
      // Convert using exchange_rate (divide by cotización)
      return amount / exchangeRate;
    };

    let totalCommitted = 0;
    let totalScheduleItems = 0;
    let totalSchedulePaid = 0;

    const committedByCurrency = new Map<string, number>();
    const paidByCurrency = new Map<string, number>();

    // Process commitments to get exchange rates
    const exchangeRateMap = new Map<string, number>();
    commitmentsData?.forEach(commitment => {
      if (commitment.currency && commitment.exchange_rate) {
        exchangeRateMap.set(commitment.currency.id, commitment.exchange_rate);
      }
    });

    // Calculate COMMITTED amount from financial data (using commitment exchange_rate)
    projectClients.forEach(client => {
      client.financialByCurrency.forEach(financial => {
        if (!financial.currency) return;

        const exchangeRate = exchangeRateMap.get(financial.currency.id) || null;
        const currencySymbol = financial.currency.symbol;

        // Track committed by original currency
        committedByCurrency.set(currencySymbol, (committedByCurrency.get(currencySymbol) || 0) + financial.total_committed_amount);

        // Convert and sum committed
        totalCommitted += convertToCommitmentCurrency(financial.total_committed_amount, financial.currency, exchangeRate);
        
        totalScheduleItems += financial.total_schedule_items || 0;
        totalSchedulePaid += financial.schedule_paid || 0;
      });
    });

    // Calculate PAID amount from actual payments (using payment.exchange_rate) - SAME AS ClientPaymentsTab
    let totalPaid = 0;
    const allPayments = paymentsData || [];
    
    allPayments.forEach(payment => {
      if (!payment.currency || payment.status !== 'confirmed') return;

      const currencySymbol = payment.currency.symbol;
      
      // If payment is already in commitment currency, add as-is
      if (payment.currency.id === commitmentCurrency.id) {
        totalPaid += payment.amount;
        paidByCurrency.set(currencySymbol, (paidByCurrency.get(currencySymbol) || 0) + payment.amount);
      } else {
        // Convert using payment's exchange_rate (not commitment's!)
        if (payment.exchange_rate && payment.exchange_rate > 0) {
          totalPaid += payment.amount / payment.exchange_rate;
          paidByCurrency.set(currencySymbol, (paidByCurrency.get(currencySymbol) || 0) + payment.amount);
        }
      }
    });

    // Calculate SALDO (balance) = Committed - Paid
    const totalBalance = totalCommitted - totalPaid;

    // Balance by currency = Committed by currency - Paid by currency
    const balanceByCurrency = new Map<string, number>();
    committedByCurrency.forEach((committedAmount, symbol) => {
      const paidAmount = paidByCurrency.get(symbol) || 0;
      balanceByCurrency.set(symbol, committedAmount - paidAmount);
    });

    const paidPercentage = totalCommitted > 0 ? (totalPaid / totalCommitted) * 100 : 0;
    const balancePercentage = totalCommitted > 0 ? (totalBalance / totalCommitted) * 100 : 0;
    const schedulePercentage = totalScheduleItems > 0 ? (totalSchedulePaid / totalScheduleItems) * 100 : 0;

    return {
      totalCommittedAmount: totalCommitted,
      totalPaidAmount: totalPaid,
      totalBalanceDue: totalBalance,
      paidPercentage,
      balancePercentage,
      totalScheduleItems,
      totalSchedulePaid,
      schedulePercentage,
      committedByOriginalCurrency: Array.from(committedByCurrency.entries()).map(([symbol, amount]) => ({ symbol, amount })),
      paidByOriginalCurrency: Array.from(paidByCurrency.entries()).map(([symbol, amount]) => ({ symbol, amount })),
      balanceByOriginalCurrency: Array.from(balanceByCurrency.entries()).map(([symbol, amount]) => ({ symbol, amount })),
    };
  }, [projectClients, dashboardData, commitmentCurrency, commitmentsData, paymentsData]);

  return (
    <div className="space-y-6">
      {/* KPIs Grid - 4 columnas, 2 por fila en mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Compromiso Total */}
        <StatCard data-testid="stat-card-compromiso-total">
          <StatCardTitle showArrow={false}>
            <DollarSign className="w-4 h-4 inline mr-1" />
            Compromiso Total
          </StatCardTitle>
          <StatCardValue>
            {commitmentCurrency ? formatCurrencyKPI(kpis.totalCommittedAmount) : <span>-</span>}
          </StatCardValue>
          <StatCardMeta>
            {commitmentCurrency ? formatCurrencyBreakdown(kpis.committedByOriginalCurrency) : 'Sin compromisos registrados'}
          </StatCardMeta>
        </StatCard>

        {/* 2. Pagado */}
        <StatCard data-testid="stat-card-pagado">
          <StatCardTitle showArrow={false}>
            <CheckCircle2 className="w-4 h-4 inline mr-1" />
            Pagado
          </StatCardTitle>
          <StatCardValue>
            {commitmentCurrency ? formatCurrencyKPI(kpis.totalPaidAmount) : <span>-</span>}
          </StatCardValue>
          <StatCardMeta>
            {commitmentCurrency ? formatCurrencyBreakdown(kpis.paidByOriginalCurrency) : 'Sin compromisos registrados'}
          </StatCardMeta>
        </StatCard>

        {/* 3. Saldo */}
        <StatCard data-testid="stat-card-saldo">
          <StatCardTitle showArrow={false}>
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Saldo
          </StatCardTitle>
          <StatCardValue>
            {commitmentCurrency ? formatCurrencyKPI(kpis.totalBalanceDue) : <span>-</span>}
          </StatCardValue>
          <StatCardMeta>
            {commitmentCurrency ? formatCurrencyBreakdown(kpis.balanceByOriginalCurrency) : 'Sin compromisos registrados'}
          </StatCardMeta>
        </StatCard>

        {/* 4. Items de Pago */}
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
      ) : commitmentsData && commitmentsData.length > 0 ? (
        <CommitmentAccordion
          commitments={commitmentsData}
          payments={paymentsData || []}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <Users className="h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="font-semibold text-lg">No hay compromisos de pago</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Agrega compromisos de pago a tus clientes para ver la información aquí.
            </p>
          </div>
          <Button
            onClick={() => openModal('client-commitment', { projectId: activeProjectId, organizationId })}
            size="sm"
            data-testid="button-add-commitment-empty"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Compromiso
          </Button>
        </div>
      )}
    </div>
  )
}
