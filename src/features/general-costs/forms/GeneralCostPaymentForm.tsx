import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { DollarSign, CalendarIcon, Paperclip } from 'lucide-react'

import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useOrganizationWallets, useOrganizationMembers } from '@/features/organization'
import { useGeneralCosts } from '../hooks/use-general-costs'
import { useGeneralCostPayment } from '../hooks/use-general-cost-payment'
import { useCreateGeneralCostPayment } from '../hooks/use-create-general-cost-payment'
import { useUpdateGeneralCostPayment } from '../hooks/use-update-general-cost-payment'
import { generalCostPaymentSchema, type GeneralCostPaymentFormData } from '../schemas'
import { UploadMultiFileField } from '@/components/ui-custom/fields/UploadMultiFileField'
import { uploadFile, deleteFile } from '@/lib/storage'
import { useQueryClient } from '@tanstack/react-query'
import { useGeneralCostPaymentMedia } from '../hooks/use-general-cost-payment-media'

interface GeneralCostPaymentFormProps {
  modalData?: {
    organizationId: string
    paymentId?: string
    mode?: 'create' | 'edit' | 'view'
  }
  onClose: () => void
}

// Subcomponente: Formulario para CREATE/EDIT
function FormPanel({
  mode,
  form,
  onSubmit,
  isLoading,
  generalCosts,
  currencies,
  wallets,
  existingFiles,
  filesToUpload,
  setFilesToUpload,
  handleExistingFileDelete,
}: {
  mode: 'create' | 'edit' | 'view'
  form: ReturnType<typeof useForm<GeneralCostPaymentFormData>>
  onSubmit: (data: GeneralCostPaymentFormData) => void
  isLoading: boolean
  generalCosts: any[]
  currencies: any[]
  wallets: any[]
  existingFiles: any[]
  filesToUpload: any[]
  setFilesToUpload: (files: any[]) => void
  handleExistingFileDelete: (fileId: string) => Promise<void>
}) {
  // Move state out of render function (CRITICAL: Fix React Hooks warning)
  const [openDatePicker, setOpenDatePicker] = React.useState(false)

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="general-cost-payment-form">
        {/* Row 1: payment_date | general_cost_id */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="payment_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha *</FormLabel>
                <FormControl>
                  <Popover open={openDatePicker} onOpenChange={setOpenDatePicker}>
                    <PopoverTrigger asChild>
                      <FormControl>
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
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                        initialFocus
                        autoClose
                        onClose={() => setOpenDatePicker(false)}
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
                    <SelectTrigger data-testid="select-general-cost">
                      <SelectValue placeholder="Seleccionar gasto general" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin asignar</SelectItem>
                      {generalCosts?.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })).map((gc) => (
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

        {/* Row 2: wallet_id | amount */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="wallet_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Billetera *</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger data-testid="select-wallet">
                      <SelectValue placeholder="Seleccionar billetera" />
                    </SelectTrigger>
                    <SelectContent>
                      {wallets?.map((orgWallet) => (
                        <SelectItem key={`wallet-${orgWallet.id}`} value={orgWallet.id || ''}>
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
                    data-testid="input-amount"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 3: currency_id | exchange_rate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="currency_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda *</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger data-testid="select-currency">
                      <SelectValue placeholder="Seleccionar moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies?.map((orgCurrency) => (
                        <SelectItem key={`currency-${orgCurrency.currency?.id}`} value={orgCurrency.currency?.id || ''}>
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
                <FormLabel>Cotización (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="Ej: 1000.00"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                    data-testid="input-exchange-rate"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 4: notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Observaciones adicionales..." {...field} rows={3} data-testid="textarea-notes" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Row 5: reference */}
        <FormField
          control={form.control}
          name="reference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Referencia (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Número de recibo, factura, etc." {...field} data-testid="input-reference" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Row 6: Adjuntos */}
        <div className="space-y-2">
          <FormLabel>Adjuntos (opcional)</FormLabel>
          <UploadMultiFileField
            existingFiles={existingFiles}
            filesToUpload={filesToUpload}
            onFilesChange={setFilesToUpload}
            onExistingFileDelete={handleExistingFileDelete}
            emptyStateTitle="Sin archivos adjuntos"
            emptyStateDescription="Arrastra archivos o haz clic para seleccionar"
            newFileBadgeText="Nuevo"
            maxSize={2 * 1024 * 1024}
          />
        </div>
      </form>
    </Form>
  )
}

// Subcomponente: Panel de vista
function ViewPanel({
  payment,
  isLoading,
  existingFiles,
}: {
  payment: any
  isLoading: boolean
  existingFiles: any[]
}) {
  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Cargando datos...</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="text-payment-date">
              <CalendarIcon className="h-4 w-4 text-accent" />
              {payment?.payment_date ? format(new Date(payment.payment_date), 'dd/MM/yyyy', { locale: es }) : '-'}
            </div>

            {payment?.creator?.users && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={payment.creator.users.avatar_url || undefined} alt={payment.creator.users.full_name || ''} />
                  <AvatarFallback className="text-xs">{payment.creator.users.full_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="text-sm text-muted-foreground" data-testid="text-creator">
                  {payment.creator.users.full_name}
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Gasto General</div>
              <div className="text-sm" data-testid="text-general-cost">
                {payment?.general_cost?.name || 'Sin categoría'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Monto</div>
              <div className="text-sm font-bold" data-testid="text-amount">
                {payment?.currency?.symbol || '$'} {payment?.amount?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) || '0.00'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Moneda</div>
              <div className="text-sm" data-testid="text-currency">
                {payment?.currency?.code || '-'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Billetera</div>
              <div className="text-sm" data-testid="text-wallet">
                {payment?.wallet?.wallets?.name || '-'}
              </div>
            </div>

            {payment?.exchange_rate && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Cotización</div>
                <div className="text-sm" data-testid="text-exchange-rate">
                  {payment.exchange_rate.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Estado</div>
              <div className="text-sm" data-testid="text-status">
                {payment?.status === 'confirmed'
                  ? 'Confirmado'
                  : payment?.status === 'pending'
                    ? 'Pendiente'
                    : payment?.status === 'rejected'
                      ? 'Rechazado'
                      : 'Anulado'}
              </div>
            </div>

            {payment?.reference && (
              <div className="space-y-2 col-span-2">
                <div className="text-sm font-medium text-muted-foreground">Referencia</div>
                <div className="text-sm" data-testid="text-reference">
                  {payment.reference}
                </div>
              </div>
            )}
          </div>

          {payment?.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Notas</div>
                <div className="text-sm bg-muted/20 p-3 rounded-md" data-testid="text-notes">
                  {payment.notes}
                </div>
              </div>
            </>
          )}

          {existingFiles.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Paperclip className="h-4 w-4 text-accent" />
                  Archivos Adjuntos ({existingFiles.length})
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {existingFiles.map((file: any) => (
                    <div key={file.id} className="aspect-square rounded overflow-hidden border">
                      {file.file_type?.startsWith('image') ? (
                        <img src={file.file_url} alt={file.file_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <Paperclip className="h-8 w-8 text-muted-foreground" />
                          <span className="text-xs ml-2">{file.file_name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default function GeneralCostPaymentForm({ modalData, onClose }: GeneralCostPaymentFormProps) {
  const { organizationId, paymentId, mode = 'create' } = modalData || {}
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [filesToUpload, setFilesToUpload] = React.useState<any[]>([])
  const [existingFiles, setExistingFiles] = React.useState<any[]>([])

  // Fetch existing payment data for edit/view mode
  const { data: existingPayment, isLoading: loadingPayment } = useGeneralCostPayment(
    mode !== 'create' ? paymentId : undefined,
    organizationId
  )

  // Fetch existing media files
  const { data: mediaFiles = [] } = useGeneralCostPaymentMedia(mode !== 'create' ? paymentId : undefined)

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
    },
  })

  // Fetch data
  const { data: currencies, isLoading: currenciesLoading } = useOrganizationCurrencies(organizationId)
  const { data: generalCosts, isLoading: generalCostsLoading } = useGeneralCosts(organizationId || null)
  const { data: wallets, isLoading: walletsLoading } = useOrganizationWallets(organizationId)
  const { data: members = [] } = useOrganizationMembers(organizationId)

  const isLoading = currenciesLoading || generalCostsLoading || walletsLoading || (mode !== 'create' && loadingPayment)

  // Load existing payment data
  React.useEffect(() => {
    if (existingPayment && mode !== 'create') {
      const paymentDate = existingPayment.payment_date ? new Date(existingPayment.payment_date) : new Date()
      form.reset({
        payment_date: paymentDate,
        general_cost_id: existingPayment.general_cost_id || '',
        currency_id: existingPayment.currency_id || '',
        wallet_id: existingPayment.wallet_id || '',
        amount: existingPayment.amount || 0,
        exchange_rate: existingPayment.exchange_rate ?? undefined,
        notes: existingPayment.notes || '',
        reference: existingPayment.reference || '',
        status: existingPayment.status || 'confirmed',
      })
    }
  }, [existingPayment, mode, form])

  // Load existing files
  React.useEffect(() => {
    if (mediaFiles && mediaFiles.length > 0) {
      setExistingFiles(mediaFiles)
    } else {
      setExistingFiles([])
    }
  }, [mediaFiles])

  // Initialize defaults for create mode
  React.useEffect(() => {
    if (mode === 'create' && !paymentId) {
      if (currencies && currencies.length > 0) {
        const defaultCurrency = currencies.find((c) => c.is_default)?.currency?.id
        if (defaultCurrency) {
          form.setValue('currency_id', defaultCurrency)
        } else {
          form.setValue('currency_id', currencies[0].currency?.id)
        }
      }
      if (wallets && wallets.length > 0) {
        const defaultWallet = wallets.find((w) => w.is_default)
        if (defaultWallet && defaultWallet.id) {
          form.setValue('wallet_id', defaultWallet.id)
        } else if (wallets[0].id) {
          form.setValue('wallet_id', wallets[0].id)
        }
      }
    }
  }, [currencies, wallets, mode, paymentId, form])

  // Mutations
  const createPaymentMutation = useCreateGeneralCostPayment()
  const updatePaymentMutation = useUpdateGeneralCostPayment()

  const handleExistingFileDelete = async (fileId: string) => {
    try {
      await deleteFile(fileId, false)
      queryClient.invalidateQueries({ queryKey: ['general-cost-payment-media', paymentId] })
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

  const onSubmit = async (data: GeneralCostPaymentFormData) => {
    if (!userData?.organization?.id || !userData?.user?.id) {
      toast({
        title: 'Error',
        description: 'Organization ID or User ID not found',
        variant: 'destructive',
      })
      return
    }

    if (!data.wallet_id) {
      toast({
        title: 'Error',
        description: 'Wallet ID is required',
        variant: 'destructive',
      })
      return
    }

    const selectedWallet = wallets?.find((w) => w.id === data.wallet_id)
    if (!selectedWallet) {
      toast({
        title: 'Error',
        description: `Wallet with ID ${data.wallet_id} not found`,
        variant: 'destructive',
      })
      return
    }

    const currentMember = members.find((m: any) => m.user_id === userData?.user?.id)
    if (!currentMember) {
      toast({
        title: 'Error',
        description: 'No se encontró el miembro de la organización para el usuario actual',
        variant: 'destructive',
      })
      return
    }

    const paymentData = {
      organization_id: userData.organization.id,
      payment_date: data.payment_date.toISOString().split('T')[0],
      currency_id: data.currency_id,
      wallet_id: data.wallet_id,
      amount: data.amount,
      notes: data.notes || null,
      exchange_rate: data.exchange_rate ?? undefined,
      reference: data.reference || null,
      general_cost_id: data.general_cost_id || null,
      status: (data.status || 'confirmed') as 'confirmed' | 'pending' | 'rejected' | 'void',
      created_by: currentMember.id,
    }

    try {
      let savedPaymentId = paymentId

      if (mode === 'edit' && paymentId) {
        await updatePaymentMutation.mutateAsync({
          id: paymentId,
          organizationId: userData.organization.id,
          updates: paymentData,
        })
      } else {
        const result = await createPaymentMutation.mutateAsync(paymentData)
        savedPaymentId = result.id
      }

      if (filesToUpload.length > 0 && savedPaymentId) {
        for (const fileInput of filesToUpload) {
          try {
            await uploadFile(fileInput.file, {
              entity: 'general_cost_payment_attachment',
              organization_id: userData.organization.id,
              created_by_member_id: currentMember.id,
              link_to: {
                general_cost_payment_id: savedPaymentId,
              },
              category: 'attachment',
              description: fileInput.description || fileInput.file.name,
            })
          } catch (uploadError: any) {
            toast({
              title: 'Error al subir archivo',
              description: uploadError.message,
              variant: 'destructive',
            })
          }
        }
        queryClient.invalidateQueries({ queryKey: ['general-cost-payment-media', savedPaymentId] })
        setFilesToUpload([])
      }

      toast({
        title: mode === 'edit' ? 'Pago actualizado' : 'Pago creado',
        description:
          mode === 'edit'
            ? 'El pago ha sido actualizado correctamente'
            : 'El pago ha sido creado correctamente',
      })

      onClose()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al guardar el pago',
        variant: 'destructive',
      })
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  const handleSubmitClick = () => {
    form.handleSubmit(onSubmit)()
  }

  if (mode === 'view') {
    return (
      <ModalLayout onClose={handleClose} size="lg">
        <ModalHeader
          title={`Pago de ${existingPayment?.general_cost?.name || 'Gasto General'}`}
          icon={DollarSign}
        />
        <ModalBody>
          <ViewPanel payment={existingPayment} isLoading={loadingPayment} existingFiles={existingFiles} />
        </ModalBody>
        <ModalFooter leftLabel="Cerrar" onLeftClick={handleClose} />
      </ModalLayout>
    )
  }

  return (
    <ModalLayout onClose={handleClose} size="lg">
      <ModalHeader
        title={mode === 'edit' ? 'Editar Pago de Gastos Generales' : 'Nuevo Pago de Gastos Generales'}
        icon={DollarSign}
      />
      <ModalBody>
        <FormPanel
          mode={mode}
          form={form}
          onSubmit={onSubmit}
          isLoading={isLoading}
          generalCosts={generalCosts || []}
          currencies={currencies || []}
          wallets={wallets || []}
          existingFiles={existingFiles}
          filesToUpload={filesToUpload}
          setFilesToUpload={setFilesToUpload}
          handleExistingFileDelete={handleExistingFileDelete}
        />
      </ModalBody>
      <ModalFooter
        leftLabel="Cancelar"
        onLeftClick={handleClose}
        submitText={mode === 'edit' ? 'Actualizar Pago' : 'Guardar Pago'}
        onSubmit={handleSubmitClick}
        isSubmitting={createPaymentMutation.isPending || updatePaymentMutation.isPending}
      />
    </ModalLayout>
  )
}
