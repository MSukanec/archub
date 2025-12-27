import { useState, useMemo, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShoppingCart, CalendarIcon, Plus, Trash2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/features/users/hooks'
import { useOrganizationMembers } from '@/features/organization'
import { useContacts } from '@/features/contacts'
import { useUnits } from '@/hooks/use-units'
import { 
  usePurchaseOrder, 
  useCreatePurchaseOrder, 
  useUpdatePurchaseOrder,
  getPurchaseOrderStatusBadgeConfig,
} from '@/features/materials/hooks/use-purchase-orders'

const purchaseOrderItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Descripción es requerida'),
  quantity: z.number().min(0.01, 'Cantidad debe ser mayor a 0'),
  unit_id: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

const purchaseOrderSchema = z.object({
  order_date: z.date({
    required_error: "Fecha es requerida",
  }),
  provider_id: z.string().optional().nullable(),
  status: z.enum(['draft', 'sent', 'quoted', 'approved', 'rejected', 'converted']),
  notes: z.string().optional().nullable(),
  items: z.array(purchaseOrderItemSchema).min(1, 'Debe agregar al menos un ítem'),
})

type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>

function ViewPanel({
  existingOrder,
}: {
  existingOrder: any;
}) {
  const statusInfo = getPurchaseOrderStatusBadgeConfig(existingOrder.status)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <ShoppingCart className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold" data-testid="text-purchase-order-date">
              Orden del {existingOrder.order_date 
                ? format(parseLocalDate(existingOrder.order_date)!, 'dd/MM/yyyy', { locale: es }) 
                : '-'}
            </h3>
            <p className="text-sm text-muted-foreground" data-testid="text-purchase-order-items-count">
              {existingOrder.items?.length || 0} {existingOrder.items?.length === 1 ? 'ítem' : 'ítems'}
            </p>
          </div>
        </div>
        <Badge variant={statusInfo.variant} className={statusInfo.className}>
          {statusInfo.label}
        </Badge>
      </div>

      {existingOrder.provider && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Proveedor</h4>
          <span className="text-sm font-medium" data-testid="text-purchase-order-provider">
            {existingOrder.provider.company_name || existingOrder.provider.full_name || '-'}
          </span>
        </div>
      )}

      {existingOrder.requester?.user && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Solicitante</h4>
          <span className="text-sm font-medium" data-testid="text-purchase-order-requester">
            {existingOrder.requester.user.full_name || '-'}
          </span>
        </div>
      )}

      {existingOrder.approver?.user && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Aprobador</h4>
          <span className="text-sm font-medium" data-testid="text-purchase-order-approver">
            {existingOrder.approver.user.full_name || '-'}
          </span>
        </div>
      )}

      {existingOrder.notes && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Notas</h4>
          <p className="text-sm bg-muted/30 p-3 rounded-md" data-testid="text-purchase-order-notes">
            {existingOrder.notes}
          </p>
        </div>
      )}

      <div>
        <h4 className="text-xs font-medium text-muted-foreground mb-2">Ítems</h4>
        <div className="space-y-2">
          {existingOrder.items?.map((item: any, index: number) => (
            <div 
              key={item.id} 
              className="flex items-center gap-4 p-3 bg-muted/30 rounded-md"
              data-testid={`item-purchase-order-${index}`}
            >
              <span className="flex-1 text-sm font-medium">{item.description}</span>
              <span className="text-sm text-muted-foreground">
                {item.quantity} {item.unit?.description || item.unit?.name || ''}
              </span>
              {item.notes && (
                <span className="text-xs text-muted-foreground italic">{item.notes}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div data-testid="text-purchase-order-created-at">
            <span className="font-medium">Creado:</span> {format(new Date(existingOrder.created_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
          </div>
          {existingOrder.updated_at && existingOrder.updated_at !== existingOrder.created_at && (
            <div data-testid="text-purchase-order-updated-at">
              <span className="font-medium">Actualizado:</span> {format(new Date(existingOrder.updated_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface PurchaseOrderFormProps {
  modalData?: {
    projectId?: string;
    organizationId?: string;
    orderId?: string;
  };
  onClose: () => void;
  mode?: 'create' | 'edit' | 'view';
}

export function PurchaseOrderForm({ modalData, onClose, mode = 'create' }: PurchaseOrderFormProps) {
  const { projectId, organizationId, orderId } = modalData || {}
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()

  const { data: existingOrder, isLoading: loadingOrder } = usePurchaseOrder(
    projectId,
    orderId,
    organizationId
  )

  const { data: members = [], isLoading: membersLoading } = useOrganizationMembers(organizationId || '')
  const { data: contacts = [], isLoading: contactsLoading } = useContacts(organizationId)
  const { data: units = [], isLoading: unitsLoading } = useUnits()

  const providers = useMemo(() => {
    if (!contacts) return []
    return contacts
  }, [contacts])

  const defaultUnitId = useMemo(() => {
    if (units.length === 0) return null
    const unitOption = units.find((u: any) => u.name?.toLowerCase() === 'unidad')
    return unitOption?.id || null
  }, [units])

  const currentMember = useMemo(() => {
    return members.find(m => m.user_id === userData?.user?.id) || null
  }, [members, userData?.user?.id])

  const form = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      order_date: new Date(),
      provider_id: null,
      status: 'draft',
      notes: '',
      items: [{ description: '', quantity: 1, unit_id: defaultUnitId, notes: '' }],
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  const isLoading = membersLoading || contactsLoading || unitsLoading || ((mode === 'edit' || mode === 'view') && loadingOrder)

  useEffect(() => {
    if (existingOrder && (mode === 'edit' || mode === 'view')) {
      const orderDate = parseLocalDate(existingOrder.order_date) || new Date()
      
      form.reset({
        order_date: orderDate,
        provider_id: existingOrder.provider_id || null,
        status: existingOrder.status || 'draft',
        notes: existingOrder.notes || '',
        items: existingOrder.items?.length 
          ? existingOrder.items.map((item: any) => ({
              id: item.id,
              description: item.description || '',
              quantity: item.quantity || 1,
              unit_id: item.unit_id || null,
              notes: item.notes || '',
            }))
          : [{ description: '', quantity: 1, unit_id: null, notes: '' }],
      })
    }
  }, [existingOrder, mode, form])

  const createOrderMutation = useCreatePurchaseOrder()
  const updateOrderMutation = useUpdatePurchaseOrder()

  const onSubmit = async (data: PurchaseOrderFormData) => {
    try {
      const orderData = {
        provider_id: data.provider_id || null,
        order_date: formatDateForDB(data.order_date),
        status: data.status,
        notes: data.notes || null,
      }

      const itemsData = data.items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit_id: item.unit_id || null,
        notes: item.notes || null,
      }))

      if (mode === 'edit' && orderId) {
        await updateOrderMutation.mutateAsync({
          projectId: projectId || '',
          orderId,
          updates: orderData,
          items: itemsData,
          organizationId: organizationId || '',
        })
        
        toast({
          title: 'Orden actualizada',
          description: 'La orden de compra ha sido actualizada correctamente',
        })
      } else {
        await createOrderMutation.mutateAsync({
          orderData,
          items: itemsData,
          projectId: projectId || '',
          organizationId: organizationId || '',
        })
        
        toast({
          title: 'Orden creada',
          description: 'La orden de compra ha sido creada correctamente',
        })
      }

      onClose()
    } catch (error: any) {
      console.error('Error saving purchase order:', error)
      toast({
        variant: 'destructive',
        title: mode === 'edit' ? 'Error al actualizar' : 'Error al crear',
        description: error.message || 'Ocurrió un error inesperado',
      })
    }
  }

  const modalTitle = mode === 'view' 
    ? 'Detalle de Orden de Compra' 
    : mode === 'edit' 
      ? 'Editar Orden de Compra' 
      : 'Nueva Orden de Compra'

  const isMutating = createOrderMutation.isPending || updateOrderMutation.isPending

  const getHeaderDescription = () => {
    switch (mode) {
      case 'view':
        return 'Visualiza los detalles de la orden de compra';
      case 'edit':
        return 'Modifica los datos de la orden de compra';
      case 'create':
      default:
        return 'Crea una nueva orden de compra para solicitar materiales a tus proveedores';
    }
  };

  return (
    <ModalLayout onClose={onClose}>
      <ModalHeader 
        title={modalTitle}
        description={getHeaderDescription()}
        icon={ShoppingCart}
      />
      <ModalBody>
        {mode === 'view' && existingOrder ? (
          <ViewPanel existingOrder={existingOrder} />
        ) : (
          <Form {...form}>
            <form id="purchase-order-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Cargando datos del formulario...</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="order_date"
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
                                    data-testid="input-purchase-order-date"
                                  />
                                  <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
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
                              <SelectTrigger data-testid="select-purchase-order-status">
                                <SelectValue placeholder="Seleccionar estado" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Borrador</SelectItem>
                                <SelectItem value="sent">Enviado</SelectItem>
                                <SelectItem value="quoted">Cotizado</SelectItem>
                                <SelectItem value="approved">Aprobado</SelectItem>
                                <SelectItem value="rejected">Rechazado</SelectItem>
                                <SelectItem value="converted">Convertido</SelectItem>
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
                          <Select 
                            value={field.value || ''} 
                            onValueChange={(value) => field.onChange(value || null)}
                          >
                            <SelectTrigger data-testid="select-purchase-order-provider">
                              <SelectValue placeholder="Seleccionar proveedor (opcional)" />
                            </SelectTrigger>
                            <SelectContent>
                              {providers.map((provider: any) => (
                                <SelectItem key={provider.id} value={provider.id}>
                                  {provider.company_name || provider.full_name || 'Sin nombre'}
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
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notas adicionales..."
                            className="resize-none"
                            {...field}
                            value={field.value || ''}
                            data-testid="input-purchase-order-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3">
                    <FormLabel>
                      Ítems <span className="text-red-500">*</span>
                    </FormLabel>

                    <div className="space-y-2">
                      {fields.map((field, index) => (
                        <div 
                          key={field.id}
                          className="grid grid-cols-1 md:grid-cols-4 gap-3"
                          data-testid={`item-row-${index}`}
                        >
                          <FormField
                            control={form.control}
                            name={`items.${index}.description`}
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormControl>
                                  <Input
                                    placeholder="Descripción del ítem"
                                    {...field}
                                    data-testid={`input-item-description-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem className="md:col-span-1">
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="Cantidad"
                                    {...field}
                                    value={field.value || ''}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    data-testid={`input-item-quantity-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex gap-2 items-start">
                            <FormField
                              control={form.control}
                              name={`items.${index}.unit_id`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Select 
                                      value={field.value || ''} 
                                      onValueChange={(value) => field.onChange(value || null)}
                                    >
                                      <SelectTrigger data-testid={`select-item-unit-${index}`}>
                                        <SelectValue placeholder="Unidad" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {units.map((unit: any) => (
                                          <SelectItem key={unit.id} value={unit.id}>
                                            {unit.abbreviation || unit.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                className="text-destructive hover:text-destructive/80 mt-2"
                                data-testid={`button-remove-item-${index}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => append({ description: '', quantity: 1, unit_id: defaultUnitId, notes: '' })}
                        className="w-full"
                        data-testid="button-add-item"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar ítem
                      </Button>
                    </div>

                    {form.formState.errors.items?.root && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.items.root.message}
                      </p>
                    )}
                  </div>
                </>
              )}
            </form>
          </Form>
        )}
      </ModalBody>
      {mode !== 'view' && (
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={onClose}
          rightLabel={mode === 'edit' ? 'Guardar Cambios' : 'Crear Orden'}
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

export default PurchaseOrderForm
