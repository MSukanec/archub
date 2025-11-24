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

interface GeneralCostsPaymentModalProps {
  modalData: {
    organizationId: string
    paymentId?: string
    mode?: 'create' | 'edit'
  }
  onClose: () => void
}

export function GeneralCostsPaymentModal({ modalData, onClose }: GeneralCostsPaymentModalProps) {
  const { organizationId, paymentId, mode = 'create' } = modalData
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [filesToUpload, setFilesToUpload] = React.useState<any[]>([])
  const [existingFiles, setExistingFiles] = React.useState<any[]>([])

  // Fetch existing payment data for edit mode
  const { data: existingPayment, isLoading: loadingPayment } = useGeneralCostPayment(
    paymentId,
    organizationId
  )

  // Fetch existing media files for this payment using shared hook
  const { data: mediaFiles = [] } = useGeneralCostPaymentMedia(mode === 'edit' ? paymentId : undefined)

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
  const { data: members = [] } = useOrganizationMembers(organizationId)
  
  // Loading state for all necessary data
  const isLoading = currenciesLoading || generalCostsLoading || walletsLoading || (mode === 'edit' && loadingPayment)

  // Load existing payment data
  React.useEffect(() => {
    if (existingPayment && mode === 'edit') {
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
    console.log('[DEBUG] Loading existing files - mediaFiles:', mediaFiles?.length || 0)
    if (mediaFiles && mediaFiles.length > 0) {
      console.log('[DEBUG] Setting existingFiles state with', mediaFiles.length, 'files')
      setExistingFiles(mediaFiles)
    } else {
      console.log('[DEBUG] No mediaFiles found, clearing existingFiles state')
      setExistingFiles([])
    }
  }, [mediaFiles])

  // Initialize default values for create mode
  React.useEffect(() => {
    if (mode === 'create' && !paymentId) {
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
        if (defaultWallet && defaultWallet.id) {
          form.setValue('wallet_id', defaultWallet.id)
        } else if (wallets[0].id) {
          form.setValue('wallet_id', wallets[0].id)
        }
      }
    }
  }, [currencies, wallets, mode, paymentId, form])

  // Mutaciones
  const createPaymentMutation = useCreateGeneralCostPayment()
  const updatePaymentMutation = useUpdateGeneralCostPayment()

  const handleExistingFileDelete = async (fileId: string) => {
    try {
      await deleteFile(fileId, false) // Soft delete
      
      // Invalidate queries
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

    // Validar que la billetera existe
    if (!data.wallet_id) {
      toast({
        title: 'Error',
        description: 'Wallet ID is required',
        variant: 'destructive',
      })
      return
    }

    const selectedWallet = wallets?.find(w => w.id === data.wallet_id)
    if (!selectedWallet) {
      toast({
        title: 'Error',
        description: `Wallet with ID ${data.wallet_id} not found`,
        variant: 'destructive',
      })
      return
    }

    // Obtener el organization_member.id del usuario actual
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
      file_url: null as string | null,
    }

    try {
      let savedPaymentId = paymentId

      // Create or update payment first
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

      // Upload new files if any
      if (filesToUpload.length > 0 && savedPaymentId) {
        for (const fileInput of filesToUpload) {
          try {
            await uploadFile(fileInput.file, {
              entity: 'general_cost_payment_attachment',
              organization_id: userData.organization.id,
              user_id: userData.user.id,
              link_to: {
                general_cost_payment_id: savedPaymentId,
              },
              category: 'attachment',
              description: fileInput.description || fileInput.file.name,
            })
          } catch (uploadError: any) {
            console.error('Error uploading file:', uploadError)
            toast({
              title: 'Error al subir archivo',
              description: uploadError.message,
              variant: 'destructive',
            })
          }
        }
        
        // Invalidate the media query to refresh the file list
        queryClient.invalidateQueries({ queryKey: ['general-cost-payment-media', savedPaymentId] })
        
        // Clear the filesToUpload state
        setFilesToUpload([])
      }

      toast({
        title: mode === 'edit' ? 'Pago actualizado' : 'Pago creado',
        description: mode === 'edit' 
          ? 'El pago ha sido actualizado correctamente'
          : 'El pago ha sido creado correctamente',
      })

      onClose()
    } catch (error: any) {
      console.error('Error saving payment:', error)
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
              render={({ field }) => {
                const [open, setOpen] = React.useState(false);
                return (
                  <FormItem>
                    <FormLabel>Fecha *</FormLabel>
                    <FormControl>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <div className="relative">
                              <Input
                                placeholder="Seleccionar fecha"
                                value={field.value ? format(field.value, 'dd/MM/yyyy', { locale: es }) : ''}
                                className="pr-10 cursor-pointer"
                                readOnly
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
                            disabled={(date) =>
                              date > new Date() || date < new Date('1900-01-01')
                            }
                            initialFocus
                            autoClose
                            onClose={() => setOpen(false)}
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
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
                        {generalCosts
                          ?.sort((a, b) => a.name.localeCompare(b.name))
                          .map((gc) => (
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
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar billetera" />
                      </SelectTrigger>
                      <SelectContent>
                        {wallets?.map((orgWallet) => (
                          <SelectItem 
                            key={`wallet-${orgWallet.id}`} 
                            value={orgWallet.id || ''}
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

          {/* Row 4: notes */}
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

          {/* Row 5: reference */}
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

  const headerContent = (
    <FormModalHeader
      icon={DollarSign}
      title={mode === 'edit' ? 'Editar Pago de Gastos Generales' : 'Nuevo Pago de Gastos Generales'}
      description={mode === 'edit' ? 'Modifica los datos del pago de gasto general' : 'Registra un nuevo pago de gasto general de la organización'}
    />
  )

  const handleSubmitClick = () => {
    form.handleSubmit(onSubmit)()
  }

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={mode === 'edit' ? "Actualizar Pago" : "Guardar Pago"}
      onRightClick={handleSubmitClick}
      showLoadingSpinner={createPaymentMutation.isPending || updatePaymentMutation.isPending}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      editPanel={editPanel()}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
      isEditing={true}
    />
  )
}
