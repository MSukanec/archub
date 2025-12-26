import { useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  CalendarCheck,
  CalendarX,
  Ban,
  Receipt
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useProjectContext } from '@/stores/projectContext';
import { Table } from '@/components/shared/trees/Table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGlobalModalStore } from '@/components/modal';
import { format, isPast, isToday, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseLocalDate } from '@/lib/date-utils';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/dashboard';
import {
  useClientPaymentSchedule,
  useDeleteClientPaymentSchedule,
  useClientCommitments,
  type ClientPaymentScheduleWithRelations,
} from '@/features/clients';
import { formatContactName } from '@/utils/contacts';
import { cn } from '@/lib/utils';

interface ClientScheduleViewProps {
  projectId?: string;
}

type ScheduleStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

const STATUS_CONFIG: Record<ScheduleStatus, { label: string; variant: 'pending' | 'success' | 'error' | 'neutral'; className: string; icon: typeof Clock }> = {
  pending: { label: 'Pendiente', variant: 'pending', className: '', icon: Clock },
  paid: { label: 'Pagada', variant: 'success', className: '', icon: CheckCircle2 },
  overdue: { label: 'Vencida', variant: 'error', className: '', icon: AlertCircle },
  cancelled: { label: 'Cancelada', variant: 'neutral', className: '', icon: Ban },
};

export function ClientScheduleView({ projectId }: ClientScheduleViewProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const { selectedProjectId } = useProjectContext();
  const { openModal } = useGlobalModalStore();
  const [filterStatus, setFilterStatus] = useState<'all' | ScheduleStatus>('all');
  
  const organizationId = userData?.organization?.id;
  const activeProjectId = projectId || selectedProjectId;

  const { data: scheduleData, isLoading } = useClientPaymentSchedule(
    activeProjectId || undefined, 
    organizationId
  );

  const { data: commitmentsData } = useClientCommitments(
    activeProjectId || undefined,
    organizationId
  );

  const deleteScheduleMutation = useDeleteClientPaymentSchedule();

  const scheduleItems = useMemo(() => {
    if (!scheduleData) return [];
    
    return scheduleData.map(item => {
      const client = item.commitment?.project_client;
      const contact = client?.contact;
      const clientName = contact ? formatContactName(contact) : 'Cliente desconocido';
      
      let effectiveStatus = item.status as ScheduleStatus;
      if (effectiveStatus === 'pending' && isPast(parseLocalDate(item.due_date)!) && !isToday(parseLocalDate(item.due_date)!)) {
        effectiveStatus = 'overdue';
      }
      
      return {
        ...item,
        clientName,
        effectiveStatus,
        contact,
      };
    });
  }, [scheduleData]);

  const filteredItems = useMemo(() => {
    if (filterStatus === 'all') return scheduleItems;
    return scheduleItems.filter(item => item.effectiveStatus === filterStatus);
  }, [scheduleItems, filterStatus]);

  const kpis = useMemo(() => {
    if (!scheduleItems.length) {
      return {
        totalPending: 0,
        totalPaid: 0,
        totalOverdue: 0,
        countPending: 0,
        countPaid: 0,
        countOverdue: 0,
        nextDueDate: null,
        nextDueAmount: 0,
        currency: null,
      };
    }

    let totalPending = 0;
    let totalPaid = 0;
    let totalOverdue = 0;
    let countPending = 0;
    let countPaid = 0;
    let countOverdue = 0;
    let nextDueDate: string | null = null;
    let nextDueAmount = 0;
    let currency = scheduleItems[0]?.currency || null;

    const now = new Date();

    for (const item of scheduleItems) {
      const amount = item.amount || 0;
      
      if (item.effectiveStatus === 'paid') {
        totalPaid += amount;
        countPaid++;
      } else if (item.effectiveStatus === 'overdue') {
        totalOverdue += amount;
        countOverdue++;
      } else if (item.effectiveStatus === 'pending') {
        totalPending += amount;
        countPending++;
        
        const dueDate = parseLocalDate(item.due_date)!;
        if (!nextDueDate || dueDate < parseLocalDate(nextDueDate)!) {
          nextDueDate = item.due_date;
          nextDueAmount = amount;
        }
      }
    }

    return {
      totalPending,
      totalPaid,
      totalOverdue,
      countPending,
      countPaid,
      countOverdue,
      nextDueDate,
      nextDueAmount,
      currency,
    };
  }, [scheduleItems]);

  const handleDelete = async (item: typeof scheduleItems[0]) => {
    if (!activeProjectId || !organizationId) {
      toast({
        title: 'No disponible',
        description: 'Para eliminar una cuota, selecciona un proyecto específico',
        variant: 'destructive',
      });
      return;
    }

    openModal('delete-confirmation', {
      mode: 'dangerous',
      title: 'Eliminar Cuota',
      description: 'Se eliminará esta cuota del cronograma. Esta acción no se puede deshacer.',
      itemName: `Cuota ${format(parseLocalDate(item.due_date)!, 'dd/MM/yyyy')}`,
      itemType: 'cuota de pago',
      onConfirm: async () => {
        try {
          await deleteScheduleMutation.mutateAsync({
            scheduleId: item.id,
            organizationId,
            projectId: activeProjectId!,
          });
          toast({
            title: 'Cuota eliminada',
            description: 'La cuota ha sido eliminada del cronograma',
          });
        } catch (error: any) {
          toast({
            title: 'Error al eliminar cuota',
            description: error.message,
            variant: 'destructive',
          });
        }
      },
    });
  };

  const handleEdit = (item: typeof scheduleItems[0]) => {
    openModal('client-schedule-item', {
      scheduleId: item.id,
      projectId: activeProjectId,
      organizationId,
      mode: 'edit',
    });
  };

  const handleView = (item: typeof scheduleItems[0]) => {
    openModal('client-schedule-item', {
      scheduleId: item.id,
      projectId: activeProjectId,
      organizationId,
      mode: 'view',
    });
  };

  const handleMarkAsPaid = (item: typeof scheduleItems[0]) => {
    openModal('client-payment', {
      projectId: activeProjectId,
      organizationId,
      scheduleId: item.id,
      commitmentId: item.commitment_id,
      clientId: item.commitment?.project_client?.id,
      prefillAmount: item.amount,
      prefillCurrencyId: item.currency_id,
    });
  };

  const handleAddScheduleItem = () => {
    openModal('client-schedule-item', {
      projectId: activeProjectId,
      organizationId,
      mode: 'create',
    });
  };

  const formatCurrency = (amount: number, currency: typeof kpis.currency) => {
    if (!currency) return amount.toLocaleString('es-AR');
    return `${currency.symbol} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No se pudo cargar la información de la organización</p>
      </div>
    );
  }

  if (!activeProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Calendar className="h-12 w-12 text-muted-foreground/50" />
        <p className="text-muted-foreground text-center">
          Seleccioná un proyecto para ver el cronograma de cuotas
        </p>
      </div>
    );
  }

  const columns = [
    {
      key: 'due_date',
      label: 'Fecha de Vencimiento',
      sortable: true,
      render: (item: typeof scheduleItems[0]) => {
        const dueDate = parseLocalDate(item.due_date)!;
        const isOverdue = item.effectiveStatus === 'overdue';
        const isDueToday = isToday(dueDate);
        const isDueSoon = !isOverdue && !isDueToday && dueDate <= addDays(new Date(), 7);
        
        return (
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-1.5 rounded-md",
              isOverdue && "bg-destructive/10",
              isDueToday && "bg-amber-500/10",
              isDueSoon && "bg-blue-500/10",
              !isOverdue && !isDueToday && !isDueSoon && "bg-muted"
            )}>
              <Calendar className={cn(
                "h-4 w-4",
                isOverdue && "text-destructive",
                isDueToday && "text-amber-500",
                isDueSoon && "text-blue-500",
                !isOverdue && !isDueToday && !isDueSoon && "text-muted-foreground"
              )} />
            </div>
            <div>
              <p className={cn(
                "font-medium",
                isOverdue && "text-destructive"
              )}>
                {format(dueDate, 'dd/MM/yyyy', { locale: es })}
              </p>
              <p className="text-xs text-muted-foreground">
                {isDueToday ? 'Vence hoy' : 
                 isOverdue ? `Venció hace ${Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24))} días` :
                 `Vence en ${Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} días`}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'client',
      label: 'Cliente',
      sortable: true,
      render: (item: typeof scheduleItems[0]) => {
        const contact = item.contact;
        const initials = contact 
          ? `${contact.first_name?.[0] || ''}${contact.last_name?.[0] || ''}`.toUpperCase()
          : '?';
        
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={contact?.image_path || undefined} />
              <AvatarFallback className="text-xs bg-muted">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{item.clientName}</span>
          </div>
        );
      },
    },
    {
      key: 'amount',
      label: 'Monto',
      sortable: true,
      render: (item: typeof scheduleItems[0]) => (
        <div className="font-medium">
          {formatCurrency(item.amount, item.currency)}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      render: (item: typeof scheduleItems[0]) => {
        const config = STATUS_CONFIG[item.effectiveStatus];
        const Icon = config.icon;
        
        return (
          <Badge variant={config.variant} className={config.className}>
            <Icon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        );
      },
    },
  ];

  const getRowActions = (item: typeof scheduleItems[0]) => {
    const actions = [];
    
    if (item.effectiveStatus !== 'paid' && item.effectiveStatus !== 'cancelled') {
      actions.push({
        icon: Receipt,
        label: 'Registrar Pago',
        onClick: () => handleMarkAsPaid(item),
      });
    }
    
    actions.push({
      icon: Edit,
      label: 'Editar',
      onClick: () => handleEdit(item),
    });
    
    actions.push({
      icon: Trash2,
      label: 'Eliminar',
      onClick: () => handleDelete(item),
      variant: 'destructive' as const,
    });
    
    return actions;
  };

  const hasCommitments = commitmentsData && commitmentsData.length > 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          className="cursor-pointer hover:border-amber-500/50 transition-colors"
          onClick={() => setFilterStatus(filterStatus === 'pending' ? 'all' : 'pending')}
          data-testid="stat-pending"
        >
          <StatCardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
            Pendientes
          </StatCardTitle>
          <StatCardValue className="text-amber-500">
            {formatCurrency(kpis.totalPending, kpis.currency)}
          </StatCardValue>
          <StatCardMeta>{kpis.countPending} cuotas por cobrar</StatCardMeta>
        </StatCard>

        <StatCard 
          className="cursor-pointer hover:border-destructive/50 transition-colors"
          onClick={() => setFilterStatus(filterStatus === 'overdue' ? 'all' : 'overdue')}
          data-testid="stat-overdue"
        >
          <StatCardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
            Vencidas
          </StatCardTitle>
          <StatCardValue className="text-destructive">
            {formatCurrency(kpis.totalOverdue, kpis.currency)}
          </StatCardValue>
          <StatCardMeta>{kpis.countOverdue} cuotas vencidas</StatCardMeta>
        </StatCard>

        <StatCard 
          className="cursor-pointer hover:border-green-500/50 transition-colors"
          onClick={() => setFilterStatus(filterStatus === 'paid' ? 'all' : 'paid')}
          data-testid="stat-paid"
        >
          <StatCardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Cobradas
          </StatCardTitle>
          <StatCardValue className="text-green-500">
            {formatCurrency(kpis.totalPaid, kpis.currency)}
          </StatCardValue>
          <StatCardMeta>{kpis.countPaid} cuotas cobradas</StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-next-due">
          <StatCardTitle>
            <CalendarCheck className="h-4 w-4 text-blue-500" />
            Próximo Vencimiento
          </StatCardTitle>
          <StatCardValue className="text-blue-500">
            {kpis.nextDueDate 
              ? format(new Date(kpis.nextDueDate), 'dd/MM/yyyy', { locale: es })
              : '-'
            }
          </StatCardValue>
          <StatCardMeta>
            {kpis.nextDueDate 
              ? formatCurrency(kpis.nextDueAmount, kpis.currency)
              : 'Sin cuotas pendientes'
            }
          </StatCardMeta>
        </StatCard>
      </div>

      {filterStatus !== 'all' && (
        <div className="flex items-center gap-2">
          <Badge variant="neutral" className="gap-1">
            Filtrando: {STATUS_CONFIG[filterStatus].label}
            <button 
              onClick={() => setFilterStatus('all')}
              className="ml-1 hover:text-destructive"
            >
              ×
            </button>
          </Badge>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : scheduleItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 border border-dashed rounded-lg">
          <Calendar className="h-12 w-12 text-muted-foreground/50" />
          <div className="text-center">
            <p className="text-lg font-medium text-foreground">
              No hay cuotas en el cronograma
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {hasCommitments 
                ? 'Los compromisos existentes no tienen cuotas generadas. Creá cuotas para empezar.'
                : 'Primero creá un compromiso de pago con cuotas para generar el cronograma.'
              }
            </p>
          </div>
          {hasCommitments && (
            <Button onClick={handleAddScheduleItem} data-testid="button-add-schedule">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Cuota
            </Button>
          )}
        </div>
      ) : (
        <Table
          data={filteredItems}
          columns={columns}
          rowActions={getRowActions}
          onRowClick={handleView}
          isLoading={isLoading}
          data-testid="table-schedule"
        />
      )}
    </div>
  );
}

export default ClientScheduleView;
