import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DollarSign, FileText, CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useOrganizationWallets } from '@/hooks/use-organization-wallets'
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { useModalPanelStore } from '@/components/modal/form/modalPanelStore'
import { supabase } from '@/lib/supabase'
import { formatContactName } from '@/utils/contacts'
import { UploadSingleFileField } from '@/components/ui-custom/fields/UploadSingleFileField'
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
  file_url: z.string().optional(),
})

type ClientPaymentForm = z.infer<typeof clientPaymentSchema>

interface ClientPaymentsModalProps {
  modalData: {
    projectId: string
    organizationId: string
    paymentId?: string
    mode?: 'create' | 'edit' | 'view'
  }
  onClose: () => void
}

export function ClientPaymentsModal({ modalData, onClose }: ClientPaymentsModalProps) {
  const { projectId, organizationId, paymentId, mode = 'create' } = modalData
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()
  const { setPanel } = useModalPanelStore()
  const [filesToUpload, setFilesToUpload] = useState<any[]>([])

  // Fetch existing payment data for edit/view mode
  const { data: existingPayment, isLoading: loadingPayment } = useClientPayment(
    paymentId,
    organizationId
  )

  // Hooks para obtener datos
  const { data: currencies, isLoading: currenciesLoading } = useOrganizationCurrencies(organizationId)
  const { data: projectClients, isLoading: clientsLoading } = useProjectClients(projectId, organizationId)
  const { data: wallets, isLoading: walletsLoading } = useOrganizationWallets(organizationId)
  const { data: members = [], isLoading: membersLoading } = useOrganizationMembers(organizationId)

  // Find current member (same pattern as MovementModal)
  const currentMember = React.useMemo(() => {
    return members.find(m => m.user_id === userData?.user?.id) || null
  }, [members, userData?.user?.id])

  // Get default exchange rate for selected currency
  const getCurrencyExchangeRate = (currencyId: string) => {
    // No default exchange rate - user can set it manually if needed
    return undefined
  }

  const form = useForm<ClientPaymentForm>({
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
      file_url: '',
    }
  })

  const isLoading = currenciesLoading || clientsLoading || walletsLoading || membersLoading || ((mode === 'edit' || mode === 'view') && loadingPayment)

  // Set panel mode based on the mode prop
  React.useEffect(() => {
    if (mode === 'view') {
      setPanel('view')
    } else if (mode === 'edit') {
      setPanel('edit')
    } else {
      setPanel('edit')
    }
  }, [setPanel, mode])

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
        file_url: existingPayment.file_url || '',
      })
    }
  }, [existingPayment, mode, form, currentMember?.id])
  
  // Build existing files array from file_url
  const existingFiles = React.useMemo(() => {
    const fileUrl = form.watch('file_url')
    if (!fileUrl) return []
    
    return [{
      id: 'existing',
      file_name: fileUrl.split('/').pop() || 'Archivo adjunto',
      file_type: 'document',
      file_size: 0,
      file_url: fileUrl,
      isExisting: true,
    }]
  }, [form.watch('file_url')])

  // Initialize default values for create mode (including created_by)
  React.useEffect(() => {
    if (mode === 'create' && !paymentId && currentMember?.id) {
      // Set created_by
      form.setValue('created_by', currentMember.id)
      
      // Set default currency
      if (currencies && currencies.length > 0) {
        const defaultCurrency = currencies.find(c => c.is_default)
        const currencyId = defaultCurrency?.currency?.id || currencies[0].currency?.id
        if (currencyId) {
          form.setValue('currency_id', currencyId)
          form.setValue('exchange_rate', getCurrencyExchangeRate(currencyId))
        }
      }
      
      // Set default wallet
      if (wallets && wallets.length > 0) {
        const defaultWallet = wallets.find(w => w.is_default)
        const walletId = defaultWallet?.id || wallets[0].id
        if (walletId) {
          form.setValue('wallet_id', walletId)
        }
      }
    }
  }, [currencies, wallets, mode, paymentId, currentMember?.id, form])

  // Update exchange rate when currency changes
  const selectedCurrency = form.watch('currency_id')
  React.useEffect(() => {
    if (selectedCurrency && mode === 'create') {
      const exchangeRate = getCurrencyExchangeRate(selectedCurrency)
      form.setValue('exchange_rate', exchangeRate)
    }
  }, [selectedCurrency, mode, currencies, form])

  // File upload handler
  const handleFileUpload = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${organizationId}/${projectId}/${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('client-payments-attachments')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      throw new Error(`Error al subir archivo: ${uploadError.message}`)
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('client-payments-attachments')
      .getPublicUrl(fileName)
    
    return publicUrl
  }

  // Mutations for create/update
  const createPaymentMutation = useCreateClientPayment()
  const updatePaymentMutation = useUpdateClientPayment()

  const onSubmit = async (data: ClientPaymentForm) => {
    try {
      let fileUrl = data.file_url || null

      // Upload file if there's a new one
      if (filesToUpload.length > 0 && filesToUpload[0].file) {
        try {
          fileUrl = await handleFileUpload(filesToUpload[0].file)
        } catch (error: any) {
          throw new Error(error.message || 'Error al subir el archivo')
        }
      } else if (!data.file_url) {
        // Si no hay archivo existente ni nuevo, eliminar la URL
        fileUrl = null
      }

      if (mode === 'edit' && paymentId) {
        await updatePaymentMutation.mutateAsync({
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
            file_url: fileUrl || null,
          },
          organizationId,
        })
      } else {
        await createPaymentMutation.mutateAsync({
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
            file_url: fileUrl || null,
            commitment_id: null,
            schedule_id: null,
          },
          projectId,
          organizationId,
          createdBy: data.created_by,
        })
      }
      
      toast({
        title: mode === 'edit' || mode === 'view' ? 'Pago actualizado' : 'Pago registrado',
        description: mode === 'edit' || mode === 'view'
          ? 'El pago ha sido actualizado correctamente'
          : 'El pago ha sido registrado correctamente',
      })
      onClose()
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

  // View panel (read-only)
  const viewPanel = (mode === 'edit' || mode === 'view') && existingPayment ? (
    <div className="space-y-6">
      {/* Información Principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Cliente</h4>
          <div className="flex flex-col">
            <span className="text-base font-semibold">
              {formatContactName(existingPayment.client?.contact) || '-'}
            </span>
            {existingPayment.client?.unit && (
              <span className="text-sm text-muted-foreground">Unidad: {existingPayment.client.unit}</span>
            )}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Monto</h4>
          <span className="text-base font-bold text-green-700 dark:text-green-400">
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
          <span className="text-sm font-medium">
            {existingPayment.payment_date ? format(new Date(existingPayment.payment_date), 'dd/MM/yyyy', { locale: es }) : '-'}
          </span>
        </div>
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Billetera</h4>
          <span className="text-sm font-medium">
            {existingPayment.wallet?.wallets?.name || '-'}
          </span>
        </div>
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Estado</h4>
          {(() => {
            const statusConfig = getClientPaymentStatusBadgeConfig(existingPayment.status);
            return (
              <Badge variant={statusConfig.variant} className={statusConfig.className}>
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
              <span className="text-sm">{existingPayment.reference}</span>
            </div>
          )}
          {existingPayment.commitment && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Compromiso</h4>
              <span className="text-sm">
                {existingPayment.currency?.symbol} {existingPayment.commitment.amount?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
          {existingPayment.schedule && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Cuota</h4>
              <span className="text-sm">
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
          <p className="text-sm bg-muted/30 p-3 rounded-md">{existingPayment.notes}</p>
        </div>
      )}

      {/* Archivo Adjunto */}
      {existingPayment.file_url && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Archivo Adjunto</h4>
          <a
            href={existingPayment.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <FileText className="h-4 w-4" />
            Ver archivo adjunto
          </a>
        </div>
      )}

      {/* Metadatos */}
      <div className="pt-4 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <span className="font-medium">Creado:</span> {format(new Date(existingPayment.created_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
          </div>
          {existingPayment.updated_at && existingPayment.updated_at !== existingPayment.created_at && (
            <div>
              <span className="font-medium">Actualizado:</span> {format(new Date(existingPayment.updated_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null

  // Edit panel
  const editPanel = () => {
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
                  <FormLabel>Fecha de Pago *</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <div className="relative">
                          <Input
                            placeholder="Seleccionar fecha"
                            value={field.value ? format(field.value, 'dd/MM/yyyy', { locale: es }) : ''}
                            className="pr-10 cursor-pointer"
                            readOnly
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
                  <FormLabel>Cliente *</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectClients?.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {formatContactName(client.contact)}
                            {client.unit && ` - ${client.unit}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <FormLabel>Billetera *</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
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
                  <FormLabel>Monto *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                  <FormLabel>Moneda *</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
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
                      placeholder="Dejar vacío si no aplica"
                      value={field.value || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? undefined : parseFloat(value) || undefined);
                      }}
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
                  <FormLabel>Estado *</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
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
                      placeholder="Ej: Transferencia #12345"
                      {...field}
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
                    placeholder="Notas adicionales sobre el pago..."
                    {...field}
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Row 6: Adjuntar Archivo */}
          <div className="space-y-2">
            <FormLabel>Adjuntar Archivo (opcional)</FormLabel>
            <UploadSingleFileField
              existingFiles={existingFiles}
              filesToUpload={filesToUpload}
              onFilesChange={setFilesToUpload}
              maxSize={10 * 1024 * 1024}
              acceptedTypes={{
                'application/pdf': ['.pdf'],
                'image/*': ['.png', '.jpg', '.jpeg'],
                'application/msword': ['.doc'],
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                'application/vnd.ms-excel': ['.xls'],
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
              }}
              onExistingFileDelete={async (fileId) => {
                form.setValue('file_url', '')
              }}
              emptyStateTitle="Sin archivo adjunto"
              emptyStateDescription="Arrastra un archivo o haz clic para seleccionar"
              newFileBadgeText="Nuevo"
            />
          </div>
        </form>
      </Form>
    )
  }

  const headerContent = (
    <FormModalHeader
      title={mode === 'view' ? "Ver Pago" : mode === 'edit' ? "Editar Pago" : "Nuevo Pago de Cliente"}
      description={mode === 'view'
        ? 'Consulta los detalles del pago seleccionado'
        : mode === 'edit'
        ? 'Modifica los datos del pago seleccionado'
        : 'Registra un nuevo pago de cliente al proyecto'}
      icon={DollarSign}
    />
  )

  const handleSubmitClick = () => {
    form.handleSubmit(onSubmit)()
  }

  const footerContent = (
    <FormModalFooter
      cancelText="Cancelar"
      onLeftClick={handleClose}
      submitText={mode === 'edit' ? "Guardar Cambios" : "Registrar Pago"}
      onSubmit={handleSubmitClick}
      submitDisabled={createPaymentMutation.isPending || updatePaymentMutation.isPending || !currentMember || isLoading}
      showLoadingSpinner={createPaymentMutation.isPending || updatePaymentMutation.isPending || isLoading}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel()}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
    />
  )
}

export default ClientPaymentsModal
