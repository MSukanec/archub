import React from 'react'
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
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useProjectClients } from '@/hooks/use-project-clients'
import { useOrganizationWallets } from '@/hooks/use-organization-wallets'
import { useModalPanelStore } from '@/components/modal/form/modalPanelStore'
import { apiRequest, queryClient } from '@/lib/queryClient'

const clientPaymentSchema = z.object({
  payment_date: z.date({
    required_error: "Fecha de pago es requerida",
  }),
  contact_id: z.string().min(1, 'Cliente es requerido'),
  client_id: z.string().optional(),
  amount: z.number().min(0.01, 'Monto debe ser mayor a 0'),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  exchange_rate: z.number().min(0.0001, 'Tipo de cambio debe ser mayor a 0'),
  wallet_id: z.string().optional(),
  notes: z.string().optional(),
  reference: z.string().optional(),
  status: z.enum(['confirmed', 'pending', 'rejected', 'void']),
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
    const currency = currencies?.find(c => c.currency?.id === currencyId)
    return currency?.exchange_rate || 1
  }

  const form = useForm<ClientPaymentForm>({
    resolver: zodResolver(clientPaymentSchema),
    defaultValues: {
      payment_date: new Date(),
      contact_id: '',
      client_id: undefined,
      amount: 0,
      currency_id: '',
      exchange_rate: 1,
      wallet_id: undefined,
      notes: '',
      reference: '',
      status: 'confirmed',
    }
  })

  const isLoading = currenciesLoading || clientsLoading || walletsLoading || (mode === 'edit' && loadingPayment)

  // Set panel mode
  React.useEffect(() => {
    if (mode === 'edit' && existingPayment) {
      setPanel('view')
    } else {
      setPanel('edit')
    }
  }, [mode, existingPayment, setPanel])

  // Load existing payment data
  React.useEffect(() => {
    if (existingPayment && mode === 'edit') {
      const paymentDate = existingPayment.payment_date ? new Date(existingPayment.payment_date) : new Date()
      
      form.reset({
        payment_date: paymentDate,
        contact_id: existingPayment.contact_id || '',
        client_id: existingPayment.client_id || undefined,
        amount: existingPayment.amount || 0,
        currency_id: existingPayment.currency_id || '',
        exchange_rate: existingPayment.exchange_rate || 1,
        wallet_id: existingPayment.wallet_id || undefined,
        notes: existingPayment.notes || '',
        reference: existingPayment.reference || '',
        status: existingPayment.status || 'confirmed',
      })
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

  // Mutation for create/update
  const savePaymentMutation = useMutation({
    mutationFn: async (data: ClientPaymentForm) => {
      const paymentData = {
        project_id: projectId,
        organization_id: organizationId,
        contact_id: data.contact_id,
        client_id: data.client_id || null,
        amount: data.amount,
        currency_id: data.currency_id,
        exchange_rate: data.exchange_rate,
        payment_date: format(data.payment_date, 'yyyy-MM-dd'),
        wallet_id: data.wallet_id || null,
        notes: data.notes || null,
        reference: data.reference || null,
        status: data.status,
        commitment_id: null, // TODO: Add support for linking to commitments
        schedule_id: null, // TODO: Add support for linking to schedules
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
            {existingPayment.contact?.company_name || existingPayment.contact?.full_name || '-'}
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
          {/* Row 1: Fecha de Pago - Cliente */}
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
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="Seleccionar fecha"
                              value={field.value ? format(field.value, 'dd/MM/yyyy', { locale: es }) : ''}
                              className="pl-10"
                              readOnly
                            />
                            <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          </div>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date('1900-01-01')
                          }
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
                            {client.contact.company_name || client.contact.full_name}
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

          {/* Row 2: Monto - Moneda */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {/* Row 3: Tipo de Cambio - Billetera */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="exchange_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Cambio *</FormLabel>
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

            <FormField
              control={form.control}
              name="wallet_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Billetera (opcional)</FormLabel>
                  <FormControl>
                    <Select value={field.value || 'none'} onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar billetera" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin billetera</SelectItem>
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
          </div>

          {/* Row 4: Referencia - Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
