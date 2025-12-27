import React, { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { parseLocalDate, formatDateForDB } from '@/lib/date-utils'
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { DollarSign, CalendarIcon, Info, Building2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/features/users/hooks'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useOrganizationMembers } from '@/features/organization'
import { formatContactName } from '@/utils/contacts'
import { cn } from '@/lib/utils'
import { 
  useProjectClients, 
  useClientCommitment, 
  useCreateClientCommitment, 
  useUpdateClientCommitment 
} from '@/features/clients/hooks'

const clientCommitmentSchema = z.object({
  created_by: z.string().min(1, 'Creador es requerido'),
  client_id: z.string().min(1, 'Cliente es requerido'),
  unit_name: z.string().optional(),
  unit_description: z.string().optional(),
  amount: z.number().min(0.01, 'Monto debe ser mayor a 0'),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  exchange_rate: z.number().optional(),
  commitment_method: z.enum(['fixed', 'installments_fixed', 'installments_indexed', 'milestones', 'custom']),
  installments_count: z.number().optional(),
  installments_frequency: z.enum(['monthly', 'bimonthly', 'quarterly', 'yearly']).optional(),
  installments_start_date: z.string().optional(),
  installments_distribution: z.enum(['equal', 'custom']).optional(),
  index_type: z.enum(['cac', 'uvi', 'ipc', 'custom_index']).optional(),
  index_frequency: z.enum(['monthly', 'quarterly']).optional(),
}).superRefine((data, ctx) => {
  if (data.commitment_method === 'installments_fixed' || data.commitment_method === 'installments_indexed') {
    if (!data.installments_count || data.installments_count <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El número de cuotas es requerido y debe ser mayor a 0",
        path: ["installments_count"]
      });
    }
    if (!data.installments_frequency) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La frecuencia de cuotas es requerida",
        path: ["installments_frequency"]
      });
    }
    if (!data.installments_start_date || data.installments_start_date === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha de inicio de cuotas es requerida",
        path: ["installments_start_date"]
      });
    }
    if (!data.installments_distribution) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El tipo de distribución de cuotas es requerido",
        path: ["installments_distribution"]
      });
    }
  }
  if (data.commitment_method === 'installments_indexed') {
    if (!data.index_type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El tipo de índice es requerido",
        path: ["index_type"]
      });
    }
    if (!data.index_frequency) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La frecuencia de indexación es requerida",
        path: ["index_frequency"]
      });
    }
  }
})

type ClientCommitmentFormData = z.infer<typeof clientCommitmentSchema>

// ============= INLINE SUBCOMPONENTS =============

// Sección de Plan de Cuotas (inline)
function InstallmentsPlanSection({ form }: { form: any }) {
  return (
    <div className="space-y-4 pt-4 border-t border-border">
      <h3 className="text-sm font-semibold text-foreground">Plan de Cuotas</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="installments_count"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de cuotas *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  placeholder="Ej: 12"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  value={field.value || ''}
                  data-testid="input-installments-count"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="installments_frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frecuencia *</FormLabel>
              <FormControl>
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger data-testid="select-installments-frequency">
                    <SelectValue placeholder="Seleccionar frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="bimonthly">Bimestral</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="installments_start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de inicio *</FormLabel>
              <FormControl>
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <Input
                        placeholder="Seleccionar fecha"
                        value={field.value ? format(parseLocalDate(field.value) || new Date(), 'dd/MM/yyyy', { locale: es }) : ''}
                        className="pr-10 cursor-pointer"
                        readOnly
                        data-testid="input-installments-start-date"
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
          name="installments_distribution"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Distribución *</FormLabel>
              <FormControl>
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger data-testid="select-installments-distribution">
                    <SelectValue placeholder="Seleccionar distribución" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equal">Cuotas iguales</SelectItem>
                    <SelectItem value="custom">Montos personalizados</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}

// Sección de Indexación (inline)
function InstallmentsIndexingSection({ form }: { form: any }) {
  return (
    <div className="space-y-4 pt-4 border-t border-border">
      <h3 className="text-sm font-semibold text-foreground">Indexación</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="index_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Índice de actualización *</FormLabel>
              <FormControl>
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger data-testid="select-index-type">
                    <SelectValue placeholder="Seleccionar índice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cac">CAC (Costo de la Construcción)</SelectItem>
                    <SelectItem value="uvi">UVI (Unidad de Vivienda)</SelectItem>
                    <SelectItem value="ipc">IPC (Índice de Precios al Consumidor)</SelectItem>
                    <SelectItem value="custom_index">Índice personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="index_frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frecuencia de indexación *</FormLabel>
              <FormControl>
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger data-testid="select-index-frequency">
                    <SelectValue placeholder="Seleccionar frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}

// Aviso Informacional (inline)
function InformationalNotice({ message }: { message: string }) {
  return (
    <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  )
}

// Subcomponente: Formulario para create/edit
function FormPanel({
  form,
  onSubmit,
  projectClients,
  clientsLoading,
  currencies,
  currenciesLoading,
  isLoading,
}: {
  form: ReturnType<typeof useForm<ClientCommitmentFormData>>;
  onSubmit: (data: ClientCommitmentFormData) => void;
  projectClients: any[];
  clientsLoading: boolean;
  currencies: any[];
  currenciesLoading: boolean;
  isLoading: boolean;
}) {
  const commitmentMethod = form.watch('commitment_method')

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Cargando datos del formulario...</p>
        </div>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Row 1: Cliente */}
        <FormField
          control={form.control}
          name="client_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Cliente <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange} disabled={clientsLoading}>
                  <SelectTrigger data-testid="select-commitment-client">
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectClients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {formatContactName(client.contact)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Row 2: Unidad Funcional (opcional) */}
        <FormField
          control={form.control}
          name="unit_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unidad Funcional (Opcional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="Ej: Dpto 3B, Cochera 12, Local 5..."
                  data-testid="input-commitment-unit-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Row 3: Moneda / Monto Comprometido / Tipo de Cambio (3 columnas) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="currency_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Moneda <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange} disabled={currenciesLoading}>
                    <SelectTrigger data-testid="select-commitment-currency">
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
                  Monto Comprometido <span className="text-red-500">*</span>
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
                    data-testid="input-commitment-amount"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="exchange_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Cambio (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    placeholder="1.00"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    data-testid="input-commitment-exchange-rate"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 4: Método de Compromiso */}
        <FormField
          control={form.control}
          name="commitment_method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Método de Compromiso <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger data-testid="select-commitment-method">
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Monto fijo</SelectItem>
                    <SelectItem value="installments_fixed" disabled className="opacity-50">
                      Cuotas fijas <span className="ml-2 text-xs text-muted-foreground">(Próximamente)</span>
                    </SelectItem>
                    <SelectItem value="installments_indexed" disabled className="opacity-50">
                      Cuotas indexadas <span className="ml-2 text-xs text-muted-foreground">(Próximamente)</span>
                    </SelectItem>
                    <SelectItem value="milestones" disabled className="opacity-50">
                      Por hitos <span className="ml-2 text-xs text-muted-foreground">(Próximamente)</span>
                    </SelectItem>
                    <SelectItem value="custom" disabled className="opacity-50">
                      Personalizado <span className="ml-2 text-xs text-muted-foreground">(Próximamente)</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Row 5: Descripción de la unidad (opcional) - en su propia fila */}
        <FormField
          control={form.control}
          name="unit_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción de la Unidad (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ''}
                  placeholder="Detalles adicionales sobre la unidad funcional, características, ubicación, etc."
                  rows={3}
                  data-testid="textarea-commitment-unit-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Conditional sections based on commitment method */}
        {(commitmentMethod === 'installments_fixed' || commitmentMethod === 'installments_indexed') && (
          <InstallmentsPlanSection form={form} />
        )}

        {commitmentMethod === 'installments_indexed' && (
          <InstallmentsIndexingSection form={form} />
        )}

        {commitmentMethod === 'milestones' && (
          <InformationalNotice message="Las cuotas serán generadas automáticamente según los hitos del proyecto." />
        )}

        {commitmentMethod === 'custom' && (
          <InformationalNotice message="El plan de pagos será definido manualmente después de crear el compromiso." />
        )}
      </form>
    </Form>
  )
}

// Subcomponente: Vista de lectura
function ViewPanel({
  existingCommitment,
}: {
  existingCommitment: any;
}) {
  const getCommitmentMethodLabel = (method: string) => {
    switch (method) {
      case 'fixed':
        return 'Monto fijo'
      case 'installments_fixed':
        return 'Cuotas fijas'
      case 'installments_indexed':
        return 'Cuotas indexadas'
      case 'milestones':
        return 'Por hitos'
      case 'custom':
        return 'Personalizado'
      default:
        return method
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Cliente</h4>
          <div className="flex flex-col">
            <span className="text-base font-semibold" data-testid="text-commitment-client-name">
              {formatContactName(existingCommitment.project_client?.contact) || '-'}
            </span>
            {existingCommitment.unit_name && (
              <span className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Building2 className="h-3.5 w-3.5" />
                {existingCommitment.unit_name}
              </span>
            )}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Monto Comprometido</h4>
          <span className="text-base font-bold text-blue-600 dark:text-blue-500" data-testid="text-commitment-amount">
            {existingCommitment.currency?.symbol} {existingCommitment.amount?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <div className="text-xs text-muted-foreground mt-1">
            {existingCommitment.currency?.code} - Tipo de cambio: {existingCommitment.exchange_rate?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Método de Compromiso</h4>
        <span className="text-base font-medium" data-testid="text-commitment-method">
          {getCommitmentMethodLabel(existingCommitment.commitment_method || 'fixed')}
        </span>
      </div>

      {existingCommitment.unit_description && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Descripción de la Unidad</h4>
          <p className="text-sm text-foreground" data-testid="text-commitment-unit-description">
            {existingCommitment.unit_description}
          </p>
        </div>
      )}

      <div className="pt-4 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div data-testid="text-commitment-created-at">
            <span className="font-medium">Creado:</span> {format(new Date(existingCommitment.created_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
          </div>
          {existingCommitment.updated_at && existingCommitment.updated_at !== existingCommitment.created_at && (
            <div data-testid="text-commitment-updated-at">
              <span className="font-medium">Actualizado:</span> {format(new Date(existingCommitment.updated_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ClientCommitmentFormProps {
  modalData?: {
    projectId?: string;
    organizationId?: string;
    commitmentId?: string;
  };
  onClose: () => void;
  mode?: 'create' | 'edit' | 'view';
}

export function ClientCommitmentForm({ modalData, onClose, mode = 'create' }: ClientCommitmentFormProps) {
  const { projectId, organizationId, commitmentId } = modalData || {}
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()

  // Fetch existing commitment data for edit/view mode
  const { data: existingCommitment, isLoading: loadingCommitment } = useClientCommitment(
    commitmentId,
    organizationId
  )

  // Hooks para obtener datos
  const { data: currencies, isLoading: currenciesLoading } = useOrganizationCurrencies(organizationId || '')
  const { data: projectClients, isLoading: clientsLoading } = useProjectClients(projectId, organizationId)
  const { data: members = [], isLoading: membersLoading } = useOrganizationMembers(organizationId || '')

  // Find current member
  const currentMember = useMemo(() => {
    return members.find(m => m.user_id === userData?.user?.id) || null
  }, [members, userData?.user?.id])

  const form = useForm<ClientCommitmentFormData>({
    resolver: zodResolver(clientCommitmentSchema),
    defaultValues: {
      created_by: '',
      client_id: '',
      unit_name: '',
      unit_description: '',
      amount: 0,
      currency_id: '',
      exchange_rate: undefined,
      commitment_method: 'fixed',
      installments_count: undefined,
      installments_frequency: undefined,
      installments_start_date: undefined,
      installments_distribution: undefined,
      index_type: undefined,
      index_frequency: undefined,
    }
  })

  const isLoading = currenciesLoading || clientsLoading || membersLoading || ((mode === 'edit' || mode === 'view') && loadingCommitment)

  // Load existing commitment data
  React.useEffect(() => {
    if (existingCommitment && (mode === 'edit' || mode === 'view')) {
      form.reset({
        created_by: existingCommitment.created_by || currentMember?.id || '',
        client_id: existingCommitment.client_id || '',
        unit_name: existingCommitment.unit_name || '',
        unit_description: existingCommitment.unit_description || '',
        amount: existingCommitment.amount || 0,
        currency_id: existingCommitment.currency_id || '',
        exchange_rate: existingCommitment.exchange_rate || undefined,
        commitment_method: existingCommitment.commitment_method || 'fixed',
        installments_count: existingCommitment.installments_count || undefined,
        installments_frequency: existingCommitment.installments_frequency || undefined,
        installments_start_date: existingCommitment.installments_start_date || undefined,
        installments_distribution: existingCommitment.installments_distribution || undefined,
        index_type: existingCommitment.index_type || undefined,
        index_frequency: existingCommitment.index_frequency || undefined,
      })
    }
  }, [existingCommitment, mode, form, currentMember?.id])

  // Initialize default values for create mode
  React.useEffect(() => {
    if (mode === 'create' && !commitmentId && currentMember?.id) {
      form.setValue('created_by', currentMember.id)
      
      if (currencies && currencies.length > 0) {
        const defaultCurrency = currencies.find(c => c.is_default)
        const currencyId = defaultCurrency?.currency?.id || currencies[0].currency?.id
        if (currencyId) {
          form.setValue('currency_id', currencyId)
        }
      }
    }
  }, [currencies, mode, commitmentId, currentMember?.id, form])

  // Mutations for create/update
  const createCommitmentMutation = useCreateClientCommitment()
  const updateCommitmentMutation = useUpdateClientCommitment()

  const onSubmit = async (data: ClientCommitmentFormData) => {
    try {
      if (mode === 'edit' && commitmentId) {
        await updateCommitmentMutation.mutateAsync({
          commitmentId,
          updates: {
            client_id: data.client_id,
            unit_name: data.unit_name || null,
            unit_description: data.unit_description || null,
            amount: data.amount,
            currency_id: data.currency_id,
            exchange_rate: data.exchange_rate || 1,
            commitment_method: data.commitment_method,
            installments_count: data.installments_count,
            installments_frequency: data.installments_frequency,
            installments_start_date: data.installments_start_date,
            installments_distribution: data.installments_distribution,
            index_type: data.index_type,
            index_frequency: data.index_frequency,
          },
          organizationId: organizationId || '',
        })
      } else {
        await createCommitmentMutation.mutateAsync({
          commitment: {
            client_id: data.client_id,
            unit_name: data.unit_name || null,
            unit_description: data.unit_description || null,
            amount: data.amount,
            currency_id: data.currency_id,
            exchange_rate: data.exchange_rate || 1,
            commitment_method: data.commitment_method,
            installments_count: data.installments_count,
            installments_frequency: data.installments_frequency,
            installments_start_date: data.installments_start_date,
            installments_distribution: data.installments_distribution,
            index_type: data.index_type,
            index_frequency: data.index_frequency,
          },
          projectId: projectId || '',
          organizationId: organizationId || '',
          createdBy: data.created_by,
        })
      }
      
      toast({
        title: mode === 'edit' ? 'Compromiso actualizado' : 'Compromiso creado',
        description: mode === 'edit'
          ? 'El compromiso ha sido actualizado correctamente'
          : 'El compromiso ha sido creado correctamente',
      })
      handleClose()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Error al ${mode === 'edit' ? 'actualizar' : 'crear'} el compromiso: ${error.message || 'Error desconocido'}`,
      })
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  const getHeader = () => {
    switch (mode) {
      case 'view':
        return {
          title: 'Compromiso de Pago',
          description: 'Visualiza la información del compromiso de pago',
        };
      case 'edit':
        return {
          title: 'Editar Compromiso de Pago',
          description: 'Modifica los detalles del compromiso de pago existente',
        };
      case 'create':
      default:
        return {
          title: 'Nuevo Compromiso de Pago',
          description: 'Define el compromiso financiero del cliente con el proyecto',
        };
    }
  };

  const header = getHeader();

  return (
    <ModalLayout onClose={handleClose} size="lg">
      <ModalHeader
        title={header.title}
        description={header.description}
        icon={DollarSign}
      />

      <ModalBody>
        {mode === 'view' ? (
          existingCommitment && <ViewPanel existingCommitment={existingCommitment} />
        ) : (
          <FormPanel
            form={form}
            onSubmit={onSubmit}
            projectClients={projectClients || []}
            clientsLoading={clientsLoading}
            currencies={currencies || []}
            currenciesLoading={currenciesLoading}
            isLoading={isLoading}
          />
        )}
      </ModalBody>

      {mode !== 'view' && (
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={handleClose}
          rightLabel={mode === 'edit' ? 'Guardar Cambios' : 'Crear Compromiso'}
          onRightClick={form.handleSubmit(onSubmit)}
          isSubmitting={createCommitmentMutation.isPending || updateCommitmentMutation.isPending}
          submitDisabled={!form.formState.isValid || createCommitmentMutation.isPending || updateCommitmentMutation.isPending || !currentMember?.id}
        />
      )}
      
      {mode === 'view' && (
        <ModalFooter
          leftLabel="Cerrar"
          onLeftClick={handleClose}
        />
      )}
    </ModalLayout>
  )
}
