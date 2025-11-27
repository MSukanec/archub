import { useMemo, useEffect } from 'react'
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
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useContacts } from '@/features/contacts'
import { 
  useMaterialPurchase, 
  useCreateMaterialPurchase, 
  useUpdateMaterialPurchase,
  getMaterialPurchaseStatusBadgeConfig,
  DOCUMENT_TYPES,
} from '@/features/materials/hooks/use-material-purchases'

const materialPurchaseSchema = z.object({
  purchase_date: z.date({
    required_error: "Fecha es requerida",
  }),
  provider_id: z.string().optional().nullable(),
  invoice_number: z.string().optional().nullable(),
  document_type: z.enum(['invoice', 'receipt', 'ticket', 'other']),
  subtotal: z.number().min(0, 'Subtotal debe ser >= 0'),
  tax_amount: z.number().min(0, 'Impuesto debe ser >= 0').optional().nullable(),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  exchange_rate: z.number().min(0.0001, 'Tipo de cambio debe ser mayor a 0').optional().nullable(),
  status: z.enum(['pending', 'partially_paid', 'paid', 'cancelled']),
  notes: z.string().optional().nullable(),
})

type MaterialPurchaseFormData = z.infer<typeof materialPurchaseSchema>

function ViewPanel({
  existingPurchase,
  currencies,
}: {
  existingPurchase: any;
  currencies: any[];
}) {
  const statusInfo = getMaterialPurchaseStatusBadgeConfig(existingPurchase.status)
  const docType = DOCUMENT_TYPES[existingPurchase.document_type as keyof typeof DOCUMENT_TYPES]
  
  const currency = currencies?.find(c => c.currency?.id === existingPurchase.currency_id)?.currency
  const currencySymbol = currency?.symbol || '$'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <ShoppingCart className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold" data-testid="text-material-purchase-date">
              Compra del {existingPurchase.purchase_date 
                ? format(parseLocalDate(existingPurchase.purchase_date)!, 'dd/MM/yyyy', { locale: es }) 
                : '-'}
            </h3>
            <p className="text-sm text-muted-foreground" data-testid="text-material-purchase-doc-type">
              {docType?.label || 'Factura'} {existingPurchase.invoice_number ? `#${existingPurchase.invoice_number}` : ''}
            </p>
          </div>
        </div>
        <Badge variant={statusInfo.variant} className={statusInfo.className}>
          {statusInfo.label}
        </Badge>
      </div>

      {existingPurchase.provider && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Proveedor</h4>
          <span className="text-sm font-medium" data-testid="text-material-purchase-provider">
            {existingPurchase.provider.company_name || existingPurchase.provider.full_name || '-'}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Subtotal</h4>
          <span className="text-sm font-medium" data-testid="text-material-purchase-subtotal">
            {currencySymbol} {Number(existingPurchase.subtotal || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Impuestos</h4>
          <span className="text-sm font-medium" data-testid="text-material-purchase-tax">
            {currencySymbol} {Number(existingPurchase.tax_amount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Total</h4>
        <span className="text-lg font-bold" data-testid="text-material-purchase-total">
          {currencySymbol} {Number(existingPurchase.total_amount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {existingPurchase.exchange_rate && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Tipo de Cambio</h4>
          <span className="text-sm font-medium" data-testid="text-material-purchase-exchange-rate">
            {existingPurchase.exchange_rate}
          </span>
        </div>
      )}

      {existingPurchase.notes && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Notas</h4>
          <p className="text-sm bg-muted/30 p-3 rounded-md" data-testid="text-material-purchase-notes">
            {existingPurchase.notes}
          </p>
        </div>
      )}

      <div className="pt-4 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div data-testid="text-material-purchase-created-at">
            <span className="font-medium">Creado:</span> {format(new Date(existingPurchase.created_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
          </div>
          {existingPurchase.updated_at && existingPurchase.updated_at !== existingPurchase.created_at && (
            <div data-testid="text-material-purchase-updated-at">
              <span className="font-medium">Actualizado:</span> {format(new Date(existingPurchase.updated_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface MaterialPurchaseFormProps {
  modalData?: {
    projectId?: string;
    organizationId?: string;
    purchaseId?: string;
  };
  onClose: () => void;
  mode?: 'create' | 'edit' | 'view';
}

export function MaterialPurchaseForm({ modalData, onClose, mode = 'create' }: MaterialPurchaseFormProps) {
  const { projectId, organizationId, purchaseId } = modalData || {}
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()

  const { data: existingPurchase, isLoading: loadingPurchase } = useMaterialPurchase(
    projectId,
    purchaseId,
    organizationId
  )

  const { data: contacts = [], isLoading: contactsLoading } = useContacts(organizationId)
  const { data: currencies = [], isLoading: currenciesLoading } = useOrganizationCurrencies(organizationId || '')

  const providerOptions = useMemo(() => {
    if (!contacts) return []
    return contacts
      .map((contact: any) => ({
        value: contact.id,
        label: contact.company_name || contact.full_name || contact.first_name || 'Sin nombre'
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }))
  }, [contacts])

  const defaultCurrencyId = useMemo(() => {
    if (currencies.length === 0) return ''
    const primary = currencies.find((c: any) => c.is_primary)
    return primary?.currency?.id || currencies[0]?.currency?.id || ''
  }, [currencies])

  const form = useForm<MaterialPurchaseFormData>({
    resolver: zodResolver(materialPurchaseSchema),
    defaultValues: {
      purchase_date: new Date(),
      provider_id: null,
      invoice_number: '',
      document_type: 'invoice',
      subtotal: 0,
      tax_amount: 0,
      currency_id: defaultCurrencyId,
      exchange_rate: null,
      status: 'pending',
      notes: '',
    }
  })

  const isLoading = contactsLoading || currenciesLoading || ((mode === 'edit' || mode === 'view') && loadingPurchase)

  useEffect(() => {
    if (existingPurchase && (mode === 'edit' || mode === 'view')) {
      const purchaseDate = parseLocalDate(existingPurchase.purchase_date) || new Date()
      
      form.reset({
        purchase_date: purchaseDate,
        provider_id: existingPurchase.provider_id || null,
        invoice_number: existingPurchase.invoice_number || '',
        document_type: existingPurchase.document_type || 'invoice',
        subtotal: Number(existingPurchase.subtotal) || 0,
        tax_amount: Number(existingPurchase.tax_amount) || 0,
        currency_id: existingPurchase.currency_id || defaultCurrencyId,
        exchange_rate: existingPurchase.exchange_rate || null,
        status: existingPurchase.status || 'pending',
        notes: existingPurchase.notes || '',
      })
    }
  }, [existingPurchase, mode, form, defaultCurrencyId])

  useEffect(() => {
    if (mode === 'create' && defaultCurrencyId && !form.getValues('currency_id')) {
      form.setValue('currency_id', defaultCurrencyId)
    }
  }, [defaultCurrencyId, mode, form])

  const createPurchaseMutation = useCreateMaterialPurchase()
  const updatePurchaseMutation = useUpdateMaterialPurchase()

  const onSubmit = async (data: MaterialPurchaseFormData) => {
    try {
      const purchaseData = {
        provider_id: data.provider_id || null,
        invoice_number: data.invoice_number || null,
        document_type: data.document_type,
        purchase_date: formatDateForDB(data.purchase_date),
        subtotal: data.subtotal,
        tax_amount: data.tax_amount || 0,
        currency_id: data.currency_id,
        exchange_rate: data.exchange_rate || null,
        status: data.status,
        notes: data.notes || null,
      }

      if (mode === 'create') {
        if (!projectId || !organizationId) {
          throw new Error('Missing required parameters')
        }

        await createPurchaseMutation.mutateAsync({
          purchaseData,
          projectId,
          organizationId,
        })

        toast({
          title: 'Compra creada',
          description: 'La compra de materiales se ha registrado correctamente.',
        })
      } else if (mode === 'edit') {
        if (!projectId || !purchaseId || !organizationId) {
          throw new Error('Missing required parameters')
        }

        await updatePurchaseMutation.mutateAsync({
          projectId,
          purchaseId,
          updates: purchaseData,
          organizationId,
        })

        toast({
          title: 'Compra actualizada',
          description: 'La compra de materiales se ha actualizado correctamente.',
        })
      }

      onClose()
    } catch (error: any) {
      console.error('Error saving material purchase:', error)
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar la compra',
        variant: 'destructive',
      })
    }
  }

  const isMutating = createPurchaseMutation.isPending || updatePurchaseMutation.isPending

  const getTitle = () => {
    switch (mode) {
      case 'create':
        return 'Nueva Compra de Materiales'
      case 'edit':
        return 'Editar Compra'
      case 'view':
        return 'Detalle de Compra'
      default:
        return 'Compra de Materiales'
    }
  }

  const getDescription = () => {
    switch (mode) {
      case 'create':
        return 'Registra una nueva compra de materiales para el proyecto'
      case 'edit':
        return 'Modifica los datos de la compra de materiales'
      case 'view':
        return 'Información detallada de la compra'
      default:
        return ''
    }
  }

  return (
    <ModalLayout onClose={onClose}>
      <ModalHeader
        title={getTitle()}
        description={getDescription()}
        icon={ShoppingCart}
      />
      <ModalBody>
        {isLoading ? (
          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Cargando datos...</p>
            </div>
          </div>
        ) : mode === 'view' && existingPurchase ? (
          <ViewPanel existingPurchase={existingPurchase} currencies={currencies} />
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="purchase_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Fecha <span className="text-red-500">*</span>
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
                                data-testid="input-material-purchase-date"
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Estado <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger data-testid="select-material-purchase-status">
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="partially_paid">Pago Parcial</SelectItem>
                            <SelectItem value="paid">Pagado</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="provider_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proveedor</FormLabel>
                    <FormControl>
                      <ComboBox
                        value={field.value || ''}
                        onValueChange={(value) => field.onChange(value || null)}
                        options={providerOptions}
                        placeholder="Seleccionar proveedor (opcional)"
                        searchPlaceholder="Buscar proveedor..."
                        emptyMessage="No se encontraron proveedores"
                        disabled={contactsLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="document_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Tipo de Documento <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger data-testid="select-material-purchase-doc-type">
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="invoice">Factura</SelectItem>
                            <SelectItem value="receipt">Recibo</SelectItem>
                            <SelectItem value="ticket">Ticket</SelectItem>
                            <SelectItem value="other">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="invoice_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Documento</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: 0001-00000123"
                          {...field}
                          value={field.value || ''}
                          data-testid="input-material-purchase-invoice"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="subtotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Subtotal <span className="text-red-500">*</span>
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
                          data-testid="input-material-purchase-subtotal"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tax_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Impuestos</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-material-purchase-tax"
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
                      <FormLabel>
                        Moneda <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange} disabled={currenciesLoading}>
                          <SelectTrigger data-testid="select-material-purchase-currency">
                            <SelectValue placeholder="Seleccionar moneda" />
                          </SelectTrigger>
                          <SelectContent>
                            {currencies?.map((orgCurrency: any) => (
                              <SelectItem key={orgCurrency.currency?.id} value={orgCurrency.currency?.id}>
                                {orgCurrency.currency?.symbol} {orgCurrency.currency?.code}
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

              <FormField
                control={form.control}
                name="exchange_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Cambio (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.000001"
                        min="0"
                        placeholder="Ej: 1.00"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                        data-testid="input-material-purchase-exchange-rate"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas adicionales sobre la compra..."
                        className="resize-none"
                        rows={3}
                        {...field}
                        value={field.value || ''}
                        data-testid="input-material-purchase-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        )}
      </ModalBody>
      {mode !== 'view' && (
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={onClose}
          rightLabel={mode === 'edit' ? 'Guardar Cambios' : 'Crear Compra'}
          onRightClick={form.handleSubmit(onSubmit)}
          isSubmitting={isMutating}
          submitDisabled={isMutating || isLoading}
        />
      )}
      
      {mode === 'view' && (
        <ModalFooter
          leftLabel="Cerrar"
          onLeftClick={onClose}
        />
      )}
    </ModalLayout>
  )
}

export default MaterialPurchaseForm
