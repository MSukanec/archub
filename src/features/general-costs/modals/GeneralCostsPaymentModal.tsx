import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useOrganizationWallets } from '@/hooks/use-organization-wallets'
import { useModalPanelStore } from '@/components/modal/form/modalPanelStore'
import { useGeneralCosts } from '../hooks/use-general-costs'
import { useCreateGeneralCostPayment } from '../hooks/use-create-general-cost-payment'
import { useUpdateGeneralCostPayment } from '../hooks/use-update-general-cost-payment'
import { generalCostPaymentSchema, type GeneralCostPaymentFormData } from '../schemas'

interface GeneralCostsPaymentModalProps {
  modalData: {
    organizationId: string
    editingPayment?: any
  }
  onClose: () => void
}

export function GeneralCostsPaymentModal({ modalData, onClose }: GeneralCostsPaymentModalProps) {
  const { organizationId, editingPayment } = modalData
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()
  const { setPanel } = useModalPanelStore()

  const form = useForm<GeneralCostPaymentFormData>({
    resolver: zodResolver(generalCostPaymentSchema),
    defaultValues: {
      payment_date: new Date(),
      general_cost_id: '',
      currency_id: '',
      wallet_id: '',
      amount: 0,
      exchange_rate: undefined,
      notes: '',
      reference: '',
      status: 'confirmed',
    }
  })

  // Hooks para obtener datos
  const { data: currencies, isLoading: currenciesLoading } = useOrganizationCurrencies(organizationId)
  const { data: generalCosts, isLoading: generalCostsLoading } = useGeneralCosts(organizationId)
  const { data: wallets, isLoading: walletsLoading } = useOrganizationWallets(organizationId)
  
  // Loading state for all necessary data
  const isLoading = currenciesLoading || generalCostsLoading || walletsLoading

  // Inicializar panel en modo edit para nuevos pagos
  React.useEffect(() => {
    if (editingPayment) {
      setPanel('view')
    } else {
      setPanel('edit')
    }
  }, [editingPayment, setPanel])

  // Cargar datos del pago en edición
  React.useEffect(() => {
    if (editingPayment && currencies) {
      const paymentDate = editingPayment.payment_date ? new Date(editingPayment.payment_date) : new Date()
      
      form.reset({
        payment_date: paymentDate,
        general_cost_id: editingPayment.general_cost_id || '',
        currency_id: editingPayment.currency_id || '',
        wallet_id: editingPayment.wallet_id || '',
        amount: editingPayment.amount || 0,
        exchange_rate: editingPayment.exchange_rate || undefined,
        notes: editingPayment.notes || '',
        reference: editingPayment.reference || '',
        status: editingPayment.status || 'confirmed',
      })
    }
  }, [editingPayment, form, currencies])

  // Inicializar valores por defecto
  React.useEffect(() => {
    if (!editingPayment) {
      // Usar la primera moneda disponible por defecto
      if (currencies && currencies.length > 0) {
        const defaultCurrency = currencies.find(c => c.is_default)?.currency?.id
        if (defaultCurrency) {
          form.setValue('currency_id', defaultCurrency)
        } else {
          form.setValue('currency_id', currencies[0].currency?.id)
        }
      }
      
      // Usar la billetera por defecto
      if (wallets && wallets.length > 0) {
        const defaultWallet = wallets.find(w => w.is_default)
        if (defaultWallet && defaultWallet.wallets?.id) {
          form.setValue('wallet_id', defaultWallet.wallets.id)
        } else if (wallets[0].wallets?.id) {
          form.setValue('wallet_id', wallets[0].wallets.id)
        }
      }
    }
  }, [currencies, wallets, editingPayment, form])

  // Mutaciones
  const createPaymentMutation = useCreateGeneralCostPayment()
  const updatePaymentMutation = useUpdateGeneralCostPayment()

  const onSubmit = async (data: GeneralCostPaymentFormData) => {
    if (!userData?.organization?.id) {
      toast({
        title: 'Error',
        description: 'Organization ID not found',
        variant: 'destructive',
      })
      return
    }

    // Validar que la billetera existe
    if (!data.wallet_id) {
      toast({
        title: 'Error',
        description: 'Wallet ID is required',
        variant: 'destructive',
      })
      return
    }

    const selectedWallet = wallets?.find(w => w.wallets?.id === data.wallet_id)
    if (!selectedWallet) {
      toast({
        title: 'Error',
        description: `Wallet with ID ${data.wallet_id} not found`,
        variant: 'destructive',
      })
      return
    }

    // El wallet_id del formulario es el ID real de la billetera, pero general_costs_payments.wallet_id
    // referencia a organization_wallets.id, no a wallets.id
    const organizationWallet = wallets?.find(w => w.wallets?.id === data.wallet_id)
    if (!organizationWallet) {
      toast({
        title: 'Error',
        description: `Organization wallet not found for wallet ID: ${data.wallet_id}`,
        variant: 'destructive',
      })
      return
    }

    const paymentData = {
      organization_id: userData.organization.id,
      payment_date: data.payment_date.toISOString().split('T')[0],
      currency_id: data.currency_id,
      wallet_id: organizationWallet.id,
      amount: data.amount,
      notes: data.notes || null,
      exchange_rate: data.exchange_rate || 1,
      reference: data.reference || null,
      general_cost_id: data.general_cost_id || null,
      status: data.status || 'confirmed',
      created_by: userData?.memberships?.find(m => m.organization_id === userData?.organization?.id)?.id || null,
    }

    try {
      if (editingPayment) {
        await updatePaymentMutation.mutateAsync({
          id: editingPayment.id,
          organizationId: userData.organization.id,
          updates: paymentData,
        })
      } else {
        await createPaymentMutation.mutateAsync(paymentData)
      }
      onClose()
    } catch (error) {
      console.error('Error saving payment:', error)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  // Panel de vista (solo lectura)
  const viewPanel = editingPayment ? (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-foreground mb-2">Fecha de Pago</h4>
          <span className="text-sm">
            {editingPayment.payment_date ? format(new Date(editingPayment.payment_date), 'PPP', { locale: es }) : 'No especificada'}
          </span>
        </div>
        <div>
          <h4 className="font-medium text-foreground mb-2">Monto</h4>
          <span className="text-sm font-medium">
            {editingPayment.amount?.toLocaleString()}
          </span>
        </div>
      </div>
      <div>
        <h4 className="font-medium text-foreground mb-2">Notas</h4>
        <p className="text-sm text-muted-foreground">
          {editingPayment.notes || 'Sin notas'}
        </p>
      </div>
    </div>
  ) : null

  // Panel de edición
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
          {/* Row 1: payment_date | general_cost_id */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha *</FormLabel>
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
              name="general_cost_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gasto General (opcional)</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar gasto general" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sin asignar</SelectItem>
                        {generalCosts?.map((gc) => (
                          <SelectItem key={`general-cost-${gc.id}`} value={gc.id}>
                            {gc.name}
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

          {/* Row 2: currency_id | wallet_id */}
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
                            key={`currency-${orgCurrency.currency?.id}`} 
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
                            key={`wallet-${orgWallet.wallets?.id}`} 
                            value={orgWallet.wallets?.id || ''}
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

          {/* Row 3: amount | exchange_rate */}
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
              name="exchange_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cotización (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="Ej: 1000.00"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Row 4: reference */}
          <FormField
            control={form.control}
            name="reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Referencia (opcional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Número de recibo, factura, etc."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Row 5: notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas (opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Observaciones adicionales..."
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
      title={editingPayment ? "Editar Pago" : "Nuevo Pago"}
      description={editingPayment 
        ? 'Modifica los datos del pago de gasto general seleccionado'
        : 'Registra un nuevo pago de gasto general de la organización'}
      icon={DollarSign}
    />
  )

  const handleSubmitClick = () => {
    form.handleSubmit(onSubmit)()
  }

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={editingPayment ? "Actualizar" : "Guardar Pago"}
      onRightClick={handleSubmitClick}
      showLoadingSpinner={createPaymentMutation.isPending || updatePaymentMutation.isPending}
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
