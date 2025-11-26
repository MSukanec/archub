import React, { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DollarSign, FileText, CalendarIcon, Paperclip } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useOrganizationWallets, useOrganizationMembers } from '@/features/organization'
import { supabase } from '@/lib/supabase'
import { formatContactName } from '@/utils/contacts'
import { uploadFile, deleteFile } from '@/lib/storage'
import { UploadMultiFileField } from '@/components/ui-custom/fields/UploadMultiFileField'
import { useQueryClient } from '@tanstack/react-query'
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField'
import { 
  useProjectClients, 
  useClientPayment, 
  useCreateClientPayment, 
  useUpdateClientPayment 
} from '@/features/clients/hooks'
import { getClientPaymentStatusBadgeConfig } from '@/features/clients/utils/statusBadge'

const clientPaymentSchema = z.object({
  payment_date: z.date({
    required_error: "Fecha de pago es requerida",
  }),
  created_by: z.string().min(1, 'Creador es requerido'),
  client_id: z.string().min(1, 'Cliente es requerido'),
  wallet_id: z.string().min(1, 'Billetera es requerida'),
  amount: z.number().min(0.01, 'Monto debe ser mayor a 0'),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  exchange_rate: z.number().min(0.0001, 'Tipo de cambio debe ser mayor a 0').optional().nullable(),
  status: z.enum(['confirmed', 'pending', 'rejected', 'void']),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

type ClientPaymentFormData = z.infer<typeof clientPaymentSchema>

// Subcomponente: Formulario para create/edit
function FormPanel({
  form,
  onSubmit,
  projectClients,
  clientsLoading,
  currencies,
  currenciesLoading,
  wallets,
  walletsLoading,
  isLoading,
  filesToUpload,
  setFilesToUpload,
  existingFiles,
  onExistingFileDelete,
}: {
  form: ReturnType<typeof useForm<ClientPaymentFormData>>;
  onSubmit: (data: ClientPaymentFormData) => void;
  projectClients: any[];
  clientsLoading: boolean;
  currencies: any[];
  currenciesLoading: boolean;
  wallets: any[];
  walletsLoading: boolean;
  isLoading: boolean;
  filesToUpload: any[];
  setFilesToUpload: (files: any[]) => void;
  existingFiles: any[];
  onExistingFileDelete?: (fileId: string) => Promise<void>;
}) {
  const clientOptions = useMemo(() => {
    if (!projectClients) return []
    
    return projectClients
      .map(client => {
        const name = formatContactName(client.contact)
        const label = client.unit ? `${name} - ${client.unit}` : name
        return {
          value: client.id,
          label: label
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }))
  }, [projectClients])

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
        {/* Row 1: Fecha de Pago / Cliente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="payment_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Fecha de Pago <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="relative">
                        <Input
                          placeholder="Seleccionar fecha"
                          value={field.value ? format(field.value, 'dd/MM/yyyy', { locale: es }) : ''}
                          className="pr-10 cursor-pointer"
                          readOnly
                          data-testid="input-payment-date"
                        />
                        <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        locale={es}
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
            name="client_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Cliente <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <ComboBox
                    value={field.value}
                    onValueChange={field.onChange}
                    options={clientOptions}
                    placeholder="Seleccionar cliente"
                    searchPlaceholder="Buscar cliente..."
                    emptyMessage="No se encontraron clientes"
                    data-testid="combobox-payment-client"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 2: Billetera / Monto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="wallet_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Billetera <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange} disabled={walletsLoading}>
                    <SelectTrigger data-testid="select-payment-wallet">
                      <SelectValue placeholder="Seleccionar billetera" />
                    </SelectTrigger>
                    <SelectContent>
                      {wallets?.map((orgWallet) => (
                        <SelectItem 
                          key={orgWallet.id} 
                          value={orgWallet.id}
                        >
                          {orgWallet.wallets?.name || 'Sin nombre'}
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
                    data-testid="input-payment-amount"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 3: Moneda / Tipo de Cambio */}
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
                  <Select value={field.value} onValueChange={field.onChange} disabled={currenciesLoading}>
                    <SelectTrigger data-testid="select-payment-currency">
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
            name="exchange_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Cambio (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    placeholder="1.0000"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                    data-testid="input-payment-exchange-rate"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 4: Estado / Referencia */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Estado <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger data-testid="select-payment-status">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="rejected">Rechazado</SelectItem>
                      <SelectItem value="void">Anulado</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Referencia (opcional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: TRX-12345"
                    {...field}
                    data-testid="input-payment-reference"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 5: Notas */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Agregar notas adicionales sobre el pago..."
                  rows={2}
                  {...field}
                  data-testid="textarea-payment-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Row 6: Archivos Adjuntos */}
        <div>
          <UploadMultiFileField
            filesToUpload={filesToUpload}
            existingFiles={existingFiles}
            onFilesChange={setFilesToUpload}
            maxSize={10 * 1024 * 1024}
            acceptedTypes={{
              'image/*': ['.png', '.jpg', '.jpeg'],
              'application/pdf': ['.pdf'],
              'application/msword': ['.doc'],
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
              'application/vnd.ms-excel': ['.xls'],
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
            }}
            imageCompressionPreset="document"
            onExistingFileDelete={onExistingFileDelete}
            emptyStateTitle="Sin archivos adjuntos"
            emptyStateDescription="Arrastra archivos o haz clic para seleccionar"
            newFileBadgeText="Nuevo"
          />
        </div>
      </form>
    </Form>
  )
}

// Subcomponente: Vista de lectura
function ViewPanel({
  existingPayment,
  attachments,
}: {
  existingPayment: any;
  attachments: any[];
}) {
  return (
    <div className="space-y-6">
      {/* Información Principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Cliente</h4>
          <div className="flex flex-col">
            <span className="text-base font-semibold" data-testid="text-payment-client-name">
              {formatContactName(existingPayment.client?.contact) || '-'}
            </span>
            {existingPayment.client?.unit && (
              <span className="text-sm text-muted-foreground">Unidad: {existingPayment.client.unit}</span>
            )}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Monto</h4>
          <span className="text-base font-bold text-green-700 dark:text-green-400" data-testid="text-payment-amount">
            {existingPayment.currency?.symbol} {existingPayment.amount?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <div className="text-xs text-muted-foreground mt-1">
            {existingPayment.currency?.code} - Tipo de cambio: {existingPayment.exchange_rate?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </div>
        </div>
      </div>

      {/* Detalles del Pago */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Fecha de Pago</h4>
          <span className="text-sm font-medium" data-testid="text-payment-date">
            {existingPayment.payment_date ? format(new Date(existingPayment.payment_date), 'dd/MM/yyyy', { locale: es }) : '-'}
          </span>
        </div>
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Billetera</h4>
          <span className="text-sm font-medium" data-testid="text-payment-wallet">
            {existingPayment.wallet?.wallets?.name || '-'}
          </span>
        </div>
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Estado</h4>
          {(() => {
            const statusConfig = getClientPaymentStatusBadgeConfig(existingPayment.status);
            return (
              <Badge variant={statusConfig.variant} className={statusConfig.className} data-testid="badge-payment-status">
                {statusConfig.label}
              </Badge>
            );
          })()}
        </div>
      </div>

      {/* Referencias y Vinculaciones */}
      {(existingPayment.reference || existingPayment.commitment || existingPayment.schedule) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {existingPayment.reference && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Referencia</h4>
              <span className="text-sm" data-testid="text-payment-reference">{existingPayment.reference}</span>
            </div>
          )}
          {existingPayment.commitment && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Compromiso</h4>
              <span className="text-sm" data-testid="text-payment-commitment">
                {existingPayment.currency?.symbol} {existingPayment.commitment.amount?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
          {existingPayment.schedule && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Cuota</h4>
              <span className="text-sm" data-testid="text-payment-schedule">
                Vencimiento: {format(new Date(existingPayment.schedule.due_date), 'dd/MM/yyyy', { locale: es })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Notas */}
      {existingPayment.notes && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Notas</h4>
          <p className="text-sm bg-muted/30 p-3 rounded-md" data-testid="text-payment-notes">{existingPayment.notes}</p>
        </div>
      )}

      {/* Archivos Adjuntos */}
      {attachments.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Archivos Adjuntos</h4>
          <div className="space-y-2">
            {attachments.map((attachment: any) => (
              <a
                key={attachment.id}
                href={attachment.media_file?.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                data-testid={`link-payment-attachment-${attachment.id}`}
              >
                <FileText className="h-4 w-4" />
                {attachment.media_file?.file_name || 'Archivo adjunto'}
                {attachment.description && (
                  <span className="text-xs text-muted-foreground">({attachment.description})</span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Metadatos */}
      <div className="pt-4 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div data-testid="text-payment-created-at">
            <span className="font-medium">Creado:</span> {format(new Date(existingPayment.created_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
          </div>
          {existingPayment.updated_at && existingPayment.updated_at !== existingPayment.created_at && (
            <div data-testid="text-payment-updated-at">
              <span className="font-medium">Actualizado:</span> {format(new Date(existingPayment.updated_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ClientPaymentFormProps {
  modalData?: {
    projectId?: string;
    organizationId?: string;
    paymentId?: string;
  };
  onClose: () => void;
  mode?: 'create' | 'edit' | 'view';
}

export function ClientPaymentForm({ modalData, onClose, mode = 'create' }: ClientPaymentFormProps) {
  const { projectId, organizationId, paymentId } = modalData || {}
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()
  const [filesToUpload, setFilesToUpload] = useState<any[]>([])
  const [attachments, setAttachments] = useState<any[]>([])

  // Fetch existing payment data for edit/view mode
  const { data: existingPayment, isLoading: loadingPayment } = useClientPayment(
    paymentId,
    organizationId
  )

  // Hooks para obtener datos
  const { data: currencies, isLoading: currenciesLoading } = useOrganizationCurrencies(organizationId || '')
  const { data: projectClients, isLoading: clientsLoading } = useProjectClients(projectId, organizationId)
  const { data: wallets, isLoading: walletsLoading } = useOrganizationWallets(organizationId || '')
  const { data: members = [], isLoading: membersLoading } = useOrganizationMembers(organizationId || '')

  // Find current member
  const currentMember = useMemo(() => {
    return members.find(m => m.user_id === userData?.user?.id) || null
  }, [members, userData?.user?.id])

  const form = useForm<ClientPaymentFormData>({
    resolver: zodResolver(clientPaymentSchema),
    defaultValues: {
      payment_date: new Date(),
      created_by: '',
      client_id: '',
      wallet_id: '',
      amount: 0,
      currency_id: '',
      exchange_rate: undefined,
      status: 'confirmed',
      reference: '',
      notes: '',
    }
  })

  const isLoading = currenciesLoading || clientsLoading || walletsLoading || membersLoading || ((mode === 'edit' || mode === 'view') && loadingPayment)

  // Load existing payment data
  React.useEffect(() => {
    if (existingPayment && (mode === 'edit' || mode === 'view')) {
      const paymentDate = existingPayment.payment_date ? new Date(existingPayment.payment_date) : new Date()
      
      form.reset({
        payment_date: paymentDate,
        created_by: existingPayment.created_by || currentMember?.id || '',
        client_id: existingPayment.client_id || '',
        wallet_id: existingPayment.wallet_id || '',
        amount: existingPayment.amount || 0,
        currency_id: existingPayment.currency_id || '',
        exchange_rate: existingPayment.exchange_rate || undefined,
        status: existingPayment.status || 'confirmed',
        reference: existingPayment.reference || '',
        notes: existingPayment.notes || '',
      })
    }
  }, [existingPayment, mode, form, currentMember?.id])

  // Fetch attachments from media_links
  React.useEffect(() => {
    const fetchAttachments = async () => {
      if (!paymentId || !organizationId) return
      
      const { data, error } = await supabase
        .from('media_links')
        .select(`
          id,
          description,
          category,
          created_at,
          media_file:media_files (
            id,
            file_url,
            file_name,
            file_type,
            file_size
          )
        `)
        .eq('client_payment_id', paymentId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: true })
      
      if (!error && data) {
        setAttachments(data)
      }
    }
    
    if (mode === 'edit' || mode === 'view') {
      fetchAttachments()
    }
  }, [paymentId, organizationId, mode])
  
  // Build existing files array from media_links attachments
  const existingFiles = useMemo(() => {
    if (!attachments || attachments.length === 0) return []
    
    return attachments.map((attachment: any) => ({
      id: attachment.id,
      file_name: attachment.media_file?.file_name || 'Archivo adjunto',
      file_type: attachment.media_file?.file_type || 'document',
      file_size: attachment.media_file?.file_size || 0,
      file_url: attachment.media_file?.file_url || '',
      isExisting: true,
    }))
  }, [attachments])

  // Initialize default values for create mode
  React.useEffect(() => {
    if (mode === 'create' && !paymentId && currentMember?.id) {
      form.setValue('created_by', currentMember.id)
      
      if (currencies && currencies.length > 0) {
        const defaultCurrency = currencies.find(c => c.is_default)
        const currencyId = defaultCurrency?.currency?.id || currencies[0].currency?.id
        if (currencyId) {
          form.setValue('currency_id', currencyId)
        }
      }
      
      if (wallets && wallets.length > 0) {
        const defaultWallet = wallets.find(w => w.is_default)
        const walletId = defaultWallet?.id || wallets[0].id
        if (walletId) {
          form.setValue('wallet_id', walletId)
        }
      }
    }
  }, [currencies, wallets, mode, paymentId, currentMember?.id, form])

  // Mutations for create/update
  const createPaymentMutation = useCreateClientPayment()
  const updatePaymentMutation = useUpdateClientPayment()
  const queryClient = useQueryClient()

  // Handle deletion of existing files
  const handleExistingFileDelete = async (fileId: string) => {
    try {
      await deleteFile(fileId, false)
      queryClient.invalidateQueries({ queryKey: ['client-payment-media', paymentId] })
      toast({
        title: 'Archivo eliminado',
        description: 'El archivo ha sido eliminado correctamente',
      })
    } catch (error: any) {
      toast({
        title: 'Error al eliminar archivo',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const onSubmit = async (data: ClientPaymentFormData) => {
    try {
      let paymentResult;
      
      if (mode === 'edit' && paymentId) {
        paymentResult = await updatePaymentMutation.mutateAsync({
          paymentId,
          updates: {
            client_id: data.client_id,
            wallet_id: data.wallet_id,
            amount: data.amount,
            currency_id: data.currency_id,
            exchange_rate: data.exchange_rate || null,
            payment_date: format(data.payment_date, 'yyyy-MM-dd'),
            status: data.status,
            reference: data.reference || null,
            notes: data.notes || null,
          },
          organizationId: organizationId || '',
        })
      } else {
        paymentResult = await createPaymentMutation.mutateAsync({
          payment: {
            client_id: data.client_id,
            wallet_id: data.wallet_id,
            amount: data.amount,
            currency_id: data.currency_id,
            exchange_rate: data.exchange_rate || null,
            payment_date: format(data.payment_date, 'yyyy-MM-dd'),
            status: data.status,
            reference: data.reference || null,
            notes: data.notes || null,
            commitment_id: null,
            schedule_id: null,
          },
          projectId: projectId || '',
          organizationId: organizationId || '',
          createdBy: data.created_by,
        })
      }

      // Upload files if they exist
      const createdPaymentId = paymentResult?.id || paymentId
      
      if (filesToUpload.length > 0 && createdPaymentId) {
        if (!organizationId) {
          toast({
            variant: 'destructive',
            title: 'Error al subir archivos',
            description: 'No se encontró el ID de la organización.',
            duration: 8000,
          })
          return;
        }

        for (const fileInput of filesToUpload) {
          try {
            await uploadFile(fileInput.file, {
              entity: 'client_payment_attachment',
              organization_id: organizationId,
              project_id: projectId,
              created_by_member_id: currentMember?.id,
              link_to: {
                client_payment_id: createdPaymentId,
              },
              category: 'document',
              description: fileInput.description || fileInput.file.name,
            })
          } catch (uploadError: any) {
            console.error('Error uploading file:', uploadError)
            toast({
              variant: 'destructive',
              title: 'Error al subir archivo',
              description: uploadError.message || 'Error desconocido',
              duration: 8000,
            })
          }
        }
        queryClient.invalidateQueries({ queryKey: ['client-payment-media', createdPaymentId] })
        setFilesToUpload([])
      }
      
      toast({
        title: mode === 'edit' ? 'Pago actualizado' : 'Pago registrado',
        description: mode === 'edit'
          ? 'El pago ha sido actualizado correctamente'
          : 'El pago ha sido registrado correctamente',
      })
      handleClose()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Error al ${mode === 'edit' ? 'actualizar' : 'registrar'} el pago: ${error.message || 'Error desconocido'}`,
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
          title: 'Ver Pago',
          description: 'Consulta los detalles del pago seleccionado',
        };
      case 'edit':
        return {
          title: 'Editar Pago',
          description: 'Modifica los datos del pago seleccionado',
        };
      case 'create':
      default:
        return {
          title: 'Nuevo Pago de Cliente',
          description: 'Registra un nuevo pago de cliente al proyecto',
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
          existingPayment && (
            <ViewPanel
              existingPayment={existingPayment}
              attachments={attachments}
            />
          )
        ) : (
          <FormPanel
            form={form}
            onSubmit={onSubmit}
            projectClients={projectClients || []}
            clientsLoading={clientsLoading}
            currencies={currencies || []}
            currenciesLoading={currenciesLoading}
            wallets={wallets || []}
            walletsLoading={walletsLoading}
            isLoading={isLoading}
            filesToUpload={filesToUpload}
            setFilesToUpload={setFilesToUpload}
            existingFiles={existingFiles}
            onExistingFileDelete={handleExistingFileDelete}
          />
        )}
      </ModalBody>

      {mode !== 'view' && (
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={handleClose}
          rightLabel={mode === 'edit' ? 'Guardar Cambios' : 'Registrar Pago'}
          onRightClick={form.handleSubmit(onSubmit)}
          isSubmitting={createPaymentMutation.isPending || updatePaymentMutation.isPending || !currentMember || isLoading}
          submitDisabled={createPaymentMutation.isPending || updatePaymentMutation.isPending || !currentMember || isLoading}
        />
      )}
      
      {mode === 'view' && (
        <ModalFooter
          leftLabel="Cerrar"
          onLeftClick={handleClose}
          data-testid="footer-payment-view"
        />
      )}
    </ModalLayout>
  )
}

export default ClientPaymentForm
