import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseLocalDate, formatDateForDB } from '@/lib/date-utils';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Ban,
  DollarSign,
  FileText,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationCurrencies } from '@/hooks/use-currencies';
import { formatContactName } from '@/utils/contacts';
import { cn } from '@/lib/utils';
import { 
  useClientCommitments,
  useClientPaymentScheduleItem,
  useCreateClientPaymentSchedule,
  useUpdateClientPaymentSchedule,
} from '@/features/clients/hooks';
import type { ClientCommitmentWithRelations } from '@/features/clients/types';

const clientScheduleItemSchema = z.object({
  commitment_id: z.string().min(1, 'El compromiso es requerido'),
  due_date: z.string().min(1, 'La fecha de vencimiento es requerida'),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  currency_id: z.string().min(1, 'La moneda es requerida'),
  status: z.enum(['pending', 'paid', 'cancelled']).default('pending'),
  notes: z.string().nullable().optional(),
});

type ClientScheduleItemFormData = z.infer<typeof clientScheduleItemSchema>;

type ScheduleStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

const STATUS_CONFIG: Record<ScheduleStatus, { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: 'Pendiente', className: 'border-amber-500/50 text-amber-500 bg-amber-500/10', icon: Clock },
  paid: { label: 'Pagada', className: 'bg-green-500/10 text-green-500 border-green-500/30', icon: CheckCircle2 },
  overdue: { label: 'Vencida', className: 'bg-destructive/10 text-destructive border-destructive/30', icon: AlertCircle },
  cancelled: { label: 'Cancelada', className: 'text-muted-foreground bg-muted', icon: Ban },
};

function FormPanel({
  form,
  onSubmit,
  commitments,
  commitmentsLoading,
  currencies,
  currenciesLoading,
  isLoading,
  mode,
}: {
  form: ReturnType<typeof useForm<ClientScheduleItemFormData>>;
  onSubmit: (data: ClientScheduleItemFormData) => void;
  commitments: ClientCommitmentWithRelations[];
  commitmentsLoading: boolean;
  currencies: any[];
  currenciesLoading: boolean;
  isLoading: boolean;
  mode: 'create' | 'edit';
}) {
  const selectedCommitmentId = form.watch('commitment_id');

  const selectedCommitment = useMemo(() => {
    return commitments?.find(c => c.id === selectedCommitmentId);
  }, [commitments, selectedCommitmentId]);

  useEffect(() => {
    if (selectedCommitment && mode === 'create') {
      form.setValue('currency_id', selectedCommitment.currency_id);
    }
  }, [selectedCommitment, form, mode]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="commitment_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Compromiso <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Select 
                  value={field.value} 
                  onValueChange={field.onChange} 
                  disabled={commitmentsLoading || mode === 'edit'}
                >
                  <SelectTrigger data-testid="select-schedule-commitment">
                    <SelectValue placeholder="Seleccionar compromiso" />
                  </SelectTrigger>
                  <SelectContent>
                    {commitments?.map((commitment) => (
                      <SelectItem key={commitment.id} value={commitment.id}>
                        <div className="flex items-center gap-2">
                          <span>{formatContactName(commitment.project_client?.contact)}</span>
                          {commitment.unit_name && (
                            <span className="text-muted-foreground text-xs">
                              ({commitment.unit_name})
                            </span>
                          )}
                          <span className="text-muted-foreground">
                            - {commitment.currency?.symbol} {commitment.amount?.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Fecha de Vencimiento <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="relative">
                        <Input
                          placeholder="Seleccionar fecha"
                          value={field.value ? format(parseLocalDate(field.value) || new Date(), 'dd/MM/yyyy', { locale: es }) : ''}
                          className="pr-10 cursor-pointer"
                          readOnly
                          data-testid="input-schedule-due-date"
                        />
                        <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? parseLocalDate(field.value) ?? undefined : undefined}
                        onSelect={(date: Date | undefined) => field.onChange(date ? formatDateForDB(date) : undefined)}
                        locale={es}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger data-testid="select-schedule-status">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="paid">Pagada</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="currency_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Moneda <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Select 
                    value={field.value} 
                    onValueChange={field.onChange} 
                    disabled={currenciesLoading}
                  >
                    <SelectTrigger data-testid="select-schedule-currency">
                      <SelectValue placeholder="Seleccionar moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies?.map((orgCurrency) => (
                        <SelectItem 
                          key={orgCurrency.currency?.id} 
                          value={orgCurrency.currency?.id || ''}
                        >
                          {orgCurrency.currency?.name} ({orgCurrency.currency?.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Monto <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    data-testid="input-schedule-amount"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ''}
                  placeholder="Notas adicionales sobre esta cuota..."
                  rows={3}
                  data-testid="textarea-schedule-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

function ViewPanel({
  scheduleItem,
}: {
  scheduleItem: any;
}) {
  const isPastDue = scheduleItem.status === 'pending' && parseLocalDate(scheduleItem.due_date)! < new Date();
  const effectiveStatus: ScheduleStatus = isPastDue ? 'overdue' : (scheduleItem.status as ScheduleStatus);
  const statusConfig = STATUS_CONFIG[effectiveStatus];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Estado</h4>
          <Badge variant="neutral" className={cn("gap-1", statusConfig.className)}>
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>
        <div className="text-right">
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Monto</h4>
          <span className="text-xl font-bold text-foreground" data-testid="text-schedule-amount">
            {scheduleItem.currency?.symbol} {scheduleItem.amount?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <User className="h-3 w-3" />
            Cliente
          </h4>
          <span className="text-base font-medium" data-testid="text-schedule-client">
            {formatContactName(scheduleItem.commitment?.project_client?.contact) || '-'}
          </span>
          {scheduleItem.commitment?.unit_name && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {scheduleItem.commitment.unit_name}
            </p>
          )}
        </div>
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <CalendarIcon className="h-3 w-3" />
            Fecha de Vencimiento
          </h4>
          <span 
            className={cn(
              "text-base font-medium",
              isPastDue && "text-destructive"
            )} 
            data-testid="text-schedule-due-date"
          >
            {format(parseLocalDate(scheduleItem.due_date)!, "dd 'de' MMMM, yyyy", { locale: es })}
          </span>
          {isPastDue && (
            <p className="text-sm text-destructive mt-0.5">
              Vencida hace {Math.floor((Date.now() - parseLocalDate(scheduleItem.due_date)!.getTime()) / (1000 * 60 * 60 * 24))} días
            </p>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <DollarSign className="h-3 w-3" />
          Compromiso Total
        </h4>
        <span className="text-base" data-testid="text-schedule-commitment-amount">
          {scheduleItem.commitment?.currency?.symbol} {scheduleItem.commitment?.amount?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {scheduleItem.notes && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <FileText className="h-3 w-3" />
            Notas
          </h4>
          <p className="text-sm text-foreground" data-testid="text-schedule-notes">
            {scheduleItem.notes}
          </p>
        </div>
      )}

      {scheduleItem.paid_at && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Fecha de Pago</h4>
          <span className="text-base text-green-600" data-testid="text-schedule-paid-at">
            {format(new Date(scheduleItem.paid_at), "dd 'de' MMMM, yyyy", { locale: es })}
          </span>
        </div>
      )}

      <div className="pt-4 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div data-testid="text-schedule-created-at">
            <span className="font-medium">Creada:</span> {format(new Date(scheduleItem.created_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
          </div>
          {scheduleItem.updated_at && scheduleItem.updated_at !== scheduleItem.created_at && (
            <div data-testid="text-schedule-updated-at">
              <span className="font-medium">Actualizada:</span> {format(new Date(scheduleItem.updated_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ClientScheduleItemFormProps {
  modalData?: {
    scheduleId?: string;
    projectId?: string;
    organizationId?: string;
    commitmentId?: string;
  };
  onClose: () => void;
  mode?: 'create' | 'edit' | 'view';
}

export function ClientScheduleItemForm({
  modalData,
  onClose,
  mode = 'create',
}: ClientScheduleItemFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const projectId = modalData?.projectId;
  const organizationId = modalData?.organizationId;
  const scheduleId = modalData?.scheduleId;
  const preselectedCommitmentId = modalData?.commitmentId;

  const { data: currencies, isLoading: currenciesLoading } = useOrganizationCurrencies(organizationId);
  const { data: commitments, isLoading: commitmentsLoading } = useClientCommitments(projectId, organizationId);
  const { data: existingItem, isLoading: itemLoading } = useClientPaymentScheduleItem(
    mode !== 'create' ? scheduleId : undefined,
    organizationId
  );
  const createMutation = useCreateClientPaymentSchedule();
  const updateMutation = useUpdateClientPaymentSchedule();

  const { data: userData } = useCurrentUser();
  
  const defaultCurrencyId = useMemo(() => {
    if (existingItem?.currency_id) return existingItem.currency_id;
    // Use organization's default currency
    if (userData?.preferences?.default_currency) {
      return userData.preferences.default_currency;
    }
    if (currencies?.[0]?.currency?.id) return currencies[0].currency.id;
    return '';
  }, [existingItem, userData?.preferences?.default_currency, currencies]);

  const form = useForm<ClientScheduleItemFormData>({
    resolver: zodResolver(clientScheduleItemSchema),
    defaultValues: {
      commitment_id: preselectedCommitmentId || '',
      due_date: '',
      amount: 0,
      currency_id: defaultCurrencyId,
      status: 'pending',
      notes: '',
    },
  });

  useEffect(() => {
    if (existingItem && mode !== 'create') {
      form.reset({
        commitment_id: existingItem.commitment_id || '',
        due_date: existingItem.due_date || '',
        amount: existingItem.amount || 0,
        currency_id: existingItem.currency_id || '',
        status: (existingItem.status as 'pending' | 'paid' | 'cancelled') || 'pending',
        notes: existingItem.notes || '',
      });
    }
  }, [existingItem, form, mode]);

  useEffect(() => {
    if (preselectedCommitmentId && mode === 'create' && commitments?.length) {
      form.setValue('commitment_id', preselectedCommitmentId);
      // Set currency to organization's default, not the commitment's currency
      if (userData?.preferences?.default_currency) {
        form.setValue('currency_id', userData.preferences.default_currency);
      }
    }
  }, [preselectedCommitmentId, mode, commitments, userData?.preferences?.default_currency, form]);

  const onSubmit = async (data: ClientScheduleItemFormData) => {
    if (!organizationId || !projectId) {
      toast({
        title: 'Error',
        description: 'Faltan datos de organización o proyecto',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        await createMutation.mutateAsync({
          schedule: {
            commitment_id: data.commitment_id,
            due_date: data.due_date,
            amount: data.amount,
            currency_id: data.currency_id,
            status: data.status,
            notes: data.notes || null,
            paid_at: null,
            payment_method: null,
          },
          organizationId,
          projectId,
        });
        toast({
          title: 'Cuota creada',
          description: 'La cuota ha sido agregada al cronograma',
        });
      } else if (mode === 'edit' && scheduleId) {
        await updateMutation.mutateAsync({
          scheduleId,
          updates: {
            commitment_id: data.commitment_id,
            due_date: data.due_date,
            amount: data.amount,
            currency_id: data.currency_id,
            status: data.status,
            notes: data.notes || null,
          },
          organizationId,
          projectId,
        });
        toast({
          title: 'Cuota actualizada',
          description: 'Los cambios han sido guardados',
        });
      }
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Ocurrió un error al guardar',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getHeader = () => {
    switch (mode) {
      case 'view':
        return { 
          title: 'Detalle de Cuota', 
          description: 'Información detallada de la cuota programada' 
        };
      case 'edit':
        return { 
          title: 'Editar Cuota', 
          description: 'Modifica los detalles de la cuota' 
        };
      case 'create':
      default:
        return { 
          title: 'Nueva Cuota', 
          description: 'Agrega una nueva cuota al cronograma de pagos' 
        };
    }
  };

  const header = getHeader();
  const isLoading = currenciesLoading || commitmentsLoading || (mode !== 'create' && itemLoading);

  return (
    <ModalLayout onClose={onClose} size="md">
      <ModalHeader 
        title={header.title}
        description={header.description}
        icon={CalendarIcon}
      />
      
      <ModalBody>
        {mode === 'view' && existingItem ? (
          <ViewPanel scheduleItem={existingItem} />
        ) : (
          <FormPanel 
            form={form} 
            onSubmit={onSubmit}
            commitments={commitments || []}
            commitmentsLoading={commitmentsLoading}
            currencies={currencies || []}
            currenciesLoading={currenciesLoading}
            isLoading={isLoading}
            mode={mode as 'create' | 'edit'}
          />
        )}
      </ModalBody>

      {mode !== 'view' && (
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={onClose}
          rightLabel={mode === 'create' ? 'Crear Cuota' : 'Guardar Cambios'}
          onRightClick={form.handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
        />
      )}
    </ModalLayout>
  );
}

export default ClientScheduleItemForm;
