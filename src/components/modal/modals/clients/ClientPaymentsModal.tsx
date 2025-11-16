import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import DatePickerField from '@/components/ui-custom/fields/DatePickerField'
import { DollarSign, Upload, X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useProjectClients } from '@/hooks/use-project-clients'
import { useOrganizationWallets } from '@/hooks/use-organization-wallets'
import { useModalPanelStore } from '@/components/modal/form/modalPanelStore'
import { apiRequest, queryClient } from '@/lib/queryClient'
import { supabase } from '@/lib/supabase'
import { formatContactName } from '@/utils/contacts'

const clientPaymentSchema = z.object({
  payment_date: z.date({
    required_error: "Fecha de pago es requerida",
  }),
  contact_id: z.string().min(1, 'Cliente es requerido'),
  client_id: z.string().optional(),
  wallet_id: z.string().min(1, 'Billetera es requerida'),
  amount: z.number().min(0.01, 'Monto debe ser mayor a 0'),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  exchange_rate: z.number().min(0.0001, 'Tipo de cambio debe ser mayor a 0').optional(),
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
    mode?: 'create' | 'edit'
  }
  onClose: () => void
}

export function ClientPaymentsModal({ modalData, onClose }: ClientPaymentsModalProps) {
  const { projectId, organizationId, paymentId, mode = 'create' } = modalData
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()
  const { setPanel } = useModalPanelStore()
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null)

  // Fetch existing payment data for edit mode
  const { data: existingPayment, isLoading: loadingPayment } = useQuery({
    queryKey: [`/api/projects/${projectId}/client-payments?organization_id=${organizationId}`],
    enabled: !!paymentId && mode === 'edit',
    select: (response: any) => {
      const payments = response?.data || []
      return payments.find((p: any) => p.id === paymentId)
    }
  })

  // Hooks para obtener datos
  const { data: currencies, isLoading: currenciesLoading } = useOrganizationCurrencies(organizationId)
  const { data: projectClients, isLoading: clientsLoading } = useProjectClients(projectId)
  const { data: wallets, isLoading: walletsLoading } = useOrganizationWallets(organizationId)

  // Get default exchange rate for selected currency
  const getCurrencyExchangeRate = (currencyId: string) => {
    // Default exchange rate is 1 (user can change it manually if needed)
    return 1
  }

  const form = useForm<ClientPaymentForm>({
    resolver: zodResolver(clientPaymentSchema),
    defaultValues: {
      payment_date: new Date(),
      contact_id: '',
      client_id: undefined,
      wallet_id: '',
      amount: 0,
      currency_id: '',
      exchange_rate: 1,
      status: 'confirmed',
      reference: '',
      notes: '',
      file_url: '',
    }
  })

  const isLoading = currenciesLoading || clientsLoading || walletsLoading || (mode === 'edit' && loadingPayment)

  // Set panel mode
  React.useEffect(() => {
    setPanel('edit')
  }, [setPanel])

  // Load existing payment data
  React.useEffect(() => {
    if (existingPayment && mode === 'edit') {
      const paymentDate = existingPayment.payment_date ? new Date(existingPayment.payment_date) : new Date()
      
      form.reset({
        payment_date: paymentDate,
        contact_id: existingPayment.contact_id || '',
        client_id: existingPayment.client_id || undefined,
        wallet_id: existingPayment.wallet_id || '',
        amount: existingPayment.amount || 0,
        currency_id: existingPayment.currency_id || '',
        exchange_rate: existingPayment.exchange_rate || 1,
        status: existingPayment.status || 'confirmed',
        reference: existingPayment.reference || '',
        notes: existingPayment.notes || '',
        file_url: existingPayment.file_url || '',
      })
      
      if (existingPayment.file_url) {
        setExistingFileUrl(existingPayment.file_url)
      }
    }
  }, [existingPayment, mode, form])

  // Initialize default values for create mode
  React.useEffect(() => {
    if (mode === 'create' && !paymentId) {
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
  }, [currencies, wallets, mode, paymentId, form])

  // Update exchange rate when currency changes
  const selectedCurrency = form.watch('currency_id')
  React.useEffect(() => {
    if (selectedCurrency && mode === 'create') {
      const exchangeRate = getCurrencyExchangeRate(selectedCurrency)
      form.setValue('exchange_rate', exchangeRate)
    }
  }, [selectedCurrency, mode, currencies, form])

  // Find client_id from contact_id
  const selectedContactId = form.watch('contact_id')
  React.useEffect(() => {
    if (selectedContactId && projectClients) {
      const projectClient = projectClients.find(pc => pc.contact?.id === selectedContactId)
      if (projectClient) {
        form.setValue('client_id', projectClient.id)
      }
    }
  }, [selectedContactId, projectClients, form])

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

  // Mutation for create/update
  const savePaymentMutation = useMutation({
    mutationFn: async (data: ClientPaymentForm) => {
      let fileUrl = data.file_url || null

      // Upload file if there's a new one
      if (uploadedFile) {
        setIsUploading(true)
        try {
          fileUrl = await handleFileUpload(uploadedFile)
        } catch (error: any) {
          throw new Error(error.message || 'Error al subir el archivo')
        } finally {
          setIsUploading(false)
        }
      }

      const paymentData = {
        project_id: projectId,
        organization_id: organizationId,
        contact_id: data.contact_id,
        client_id: data.client_id || null,
        wallet_id: data.wallet_id || null,
        amount: data.amount,
        currency_id: data.currency_id,
        exchange_rate: data.exchange_rate || 1,
        payment_date: format(data.payment_date, 'yyyy-MM-dd'),
        status: data.status,
        reference: data.reference || null,
        notes: data.notes || null,
        file_url: fileUrl,
        commitment_id: null,
        schedule_id: null,
      }

      if (mode === 'edit' && paymentId) {
        return await apiRequest('PATCH', `/api/projects/${projectId}/client-payments/${paymentId}?organization_id=${organizationId}`, paymentData)
      } else {
        return await apiRequest('POST', `/api/projects/${projectId}/client-payments?organization_id=${organizationId}`, paymentData)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/client-payments?organization_id=${organizationId}`] })
      toast({
        title: mode === 'edit' ? 'Pago actualizado' : 'Pago registrado',
        description: mode === 'edit'
          ? 'El pago ha sido actualizado correctamente'
          : 'El pago ha sido registrado correctamente',
      })
      onClose()
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Error al ${mode === 'edit' ? 'actualizar' : 'registrar'} el pago: ${error.message || 'Error desconocido'}`,
      })
    }
  })

  const onSubmit = async (data: ClientPaymentForm) => {
    await savePaymentMutation.mutateAsync(data)
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  // View panel (read-only)
  const viewPanel = mode === 'edit' && existingPayment ? (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-foreground mb-2">Cliente</h4>
          <span className="text-sm">
            {formatContactName(existingPayment.contact) || '-'}
          </span>
        </div>
        <div>
          <h4 className="font-medium text-foreground mb-2">Monto</h4>
          <span className="text-sm font-medium">
            {existingPayment.currency?.symbol} {existingPayment.amount?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          <h4 className="font-medium text-foreground mb-2">Fecha de Pago</h4>
          <span className="text-sm">
            {existingPayment.payment_date ? format(new Date(existingPayment.payment_date), 'dd/MM/yyyy') : '-'}
          </span>
        </div>
        <div>
          <h4 className="font-medium text-foreground mb-2">Estado</h4>
          <span className="text-sm capitalize">{existingPayment.status || '-'}</span>
        </div>
      </div>
      {existingPayment.notes && (
        <div>
          <h4 className="font-medium text-foreground mb-2">Notas</h4>
          <p className="text-sm text-muted-foreground">{existingPayment.notes}</p>
        </div>
      )}
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
                    <DatePickerField
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Seleccionar fecha"
                      disableFuture={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_id"
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
                          <SelectItem key={client.contact.id} value={client.contact.id}>
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
                      placeholder="1.0000"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
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
            {existingFileUrl && !uploadedFile && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm flex-1 truncate">{existingFileUrl.split('/').pop()}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setExistingFileUrl(null)
                    form.setValue('file_url', '')
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {uploadedFile && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm flex-1 truncate">{uploadedFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setUploadedFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {!existingFileUrl && !uploadedFile && (
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setUploadedFile(file)
                    }
                  }}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  className="flex-1"
                />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Formatos aceptados: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX
            </p>
          </div>
        </form>
      </Form>
    )
  }

  const headerContent = (
    <FormModalHeader
      title={mode === 'edit' ? "Editar Pago" : "Nuevo Pago de Cliente"}
      description={mode === 'edit'
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
      submitDisabled={savePaymentMutation.isPending}
      showLoadingSpinner={savePaymentMutation.isPending}
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
