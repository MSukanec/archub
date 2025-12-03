import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { DollarSign, CalendarIcon } from 'lucide-react'

import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useOrganizationWallets, useOrganizationMembers } from '@/features/organization'
import { useGeneralCosts } from '../hooks/use-general-costs'
import { useGeneralCostPayment } from '../hooks/use-general-cost-payment'
import { useCreateGeneralCostPayment } from '../hooks/use-create-general-cost-payment'
import { useUpdateGeneralCostPayment } from '../hooks/use-update-general-cost-payment'
import { generalCostPaymentSchema, type GeneralCostPaymentFormData } from '../schemas'
import { FileUploader } from '@/components/shared/FileUploader'
import { uploadFile, deleteFile } from '@/lib/storage'
import { useQueryClient } from '@tanstack/react-query'
import { useGeneralCostPaymentMedia } from '../hooks/use-general-cost-payment-media'

interface GeneralCostPaymentFormProps {
  modalData?: any
  organizationId?: string
  paymentId?: string
  mode?: 'create' | 'edit'
  onClose: () => void
}

export default function GeneralCostPaymentForm({ 
  modalData, 
  organizationId: orgIdProp, 
  paymentId: paymentIdProp, 
  mode: modeProp, 
  onClose 
}: GeneralCostPaymentFormProps) {
  const organizationId = orgIdProp || modalData?.organizationId
  const paymentId = paymentIdProp || modalData?.paymentId
  const mode = modeProp || modalData?.mode || (paymentId ? 'edit' : 'create')
  
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [filesToUpload, setFilesToUpload] = React.useState<any[]>([])
  const [existingFiles, setExistingFiles] = React.useState<any[]>([])
  const [openDatePicker, setOpenDatePicker] = React.useState(false)
  
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

  const { data: existingPayment, isLoading: loadingPayment, isSuccess: paymentLoaded } = useGeneralCostPayment(
    mode === 'edit' ? paymentId : undefined,
    organizationId
  )
  const { data: mediaFiles = [] } = useGeneralCostPaymentMedia(mode === 'edit' ? paymentId : undefined)
  const { data: currencies, isLoading: currenciesLoading } = useOrganizationCurrencies(organizationId)
  const { data: generalCosts, isLoading: generalCostsLoading } = useGeneralCosts(organizationId || null)
  const { data: wallets, isLoading: walletsLoading } = useOrganizationWallets(organizationId)
  const { data: members = [] } = useOrganizationMembers(organizationId)

  const isLoading = currenciesLoading || generalCostsLoading || walletsLoading || (mode === 'edit' && loadingPayment)

  React.useEffect(() => {
    if (mode !== 'edit' || !paymentLoaded || !existingPayment) return
    
    let paymentDate: Date
    if (existingPayment.payment_date) {
      const [year, month, day] = existingPayment.payment_date.split('-').map(Number)
      paymentDate = new Date(year, month - 1, day)
    } else {
      paymentDate = new Date()
    }
    
    form.reset({
      payment_date: paymentDate,
      general_cost_id: existingPayment.general_cost?.id || '',
      currency_id: existingPayment.currency?.id || '',
      wallet_id: existingPayment.wallet?.id || '',
      amount: existingPayment.amount || 0,
      exchange_rate: existingPayment.exchange_rate ?? undefined,
      notes: existingPayment.notes || '',
      reference: existingPayment.reference || '',
      status: (existingPayment.status || 'confirmed') as 'confirmed' | 'pending' | 'rejected' | 'void',
    })
  }, [paymentId, paymentLoaded, existingPayment, mode, form])

  React.useEffect(() => {
    if (mediaFiles && mediaFiles.length > 0) {
      setExistingFiles(mediaFiles)
    } else {
      setExistingFiles([])
    }
  }, [mediaFiles])

  const hasSetDefaultsRef = React.useRef(false)
  React.useEffect(() => {
    if (mode !== 'create' || paymentId || hasSetDefaultsRef.current) return
    
    if (currencies && currencies.length > 0 && wallets && wallets.length > 0) {
      hasSetDefaultsRef.current = true
      
      const defaultCurrency = currencies.find((c) => c.is_default)?.currency?.id
      if (defaultCurrency) {
        form.setValue('currency_id', defaultCurrency)
      } else if (currencies[0].currency?.id) {
        form.setValue('currency_id', currencies[0].currency?.id)
      }
      
      const defaultWallet = wallets.find((w) => w.is_default)
      if (defaultWallet && defaultWallet.id) {
        form.setValue('wallet_id', defaultWallet.id)
      } else if (wallets[0].id) {
        form.setValue('wallet_id', wallets[0].id)
      }
    }
  }, [currencies, wallets, mode, paymentId, form])

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
      toast({ title: 'Error', description: 'Organization ID or User ID not found', variant: 'destructive' })
      return
    }

    if (!data.wallet_id) {
      toast({ title: 'Error', description: 'Wallet ID is required', variant: 'destructive' })
      return
    }

    const selectedWallet = wallets?.find((w) => w.id === data.wallet_id)
    if (!selectedWallet) {
      toast({ title: 'Error', description: `Wallet with ID ${data.wallet_id} not found`, variant: 'destructive' })
      return
    }

    const currentMember = members.find((m: any) => m.user_id === userData?.user?.id)
    if (!currentMember) {
      toast({ title: 'Error', description: 'No se encontró el miembro de la organización', variant: 'destructive' })
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

      console.log('[GeneralCostPaymentForm] Upload check:', { 
        filesToUploadLength: filesToUpload.length, 
        savedPaymentId,
        files: filesToUpload.map(f => ({ name: f.file?.name, size: f.file?.size }))
      })
      
      if (filesToUpload.length > 0 && savedPaymentId) {
        console.log('[GeneralCostPaymentForm] Starting file upload...')
        for (const fileInput of filesToUpload) {
          try {
            console.log('[GeneralCostPaymentForm] Uploading file:', {
              fileName: fileInput.file?.name,
              entity: 'general_cost_payment_attachment',
              organization_id: userData.organization.id,
              paymentId: savedPaymentId
            })
            const uploadResult = await uploadFile(fileInput.file, {
              entity: 'general_cost_payment_attachment',
              organization_id: userData.organization.id,
              created_by_member_id: currentMember.id,
              link_to: { general_cost_payment_id: savedPaymentId },
              category: 'document',
              description: fileInput.description || fileInput.file.name,
            })
            console.log('[GeneralCostPaymentForm] Upload success:', uploadResult)
          } catch (uploadError: any) {
            console.error('[GeneralCostPaymentForm] Upload error:', uploadError)
            toast({ title: 'Error al subir archivo', description: uploadError.message, variant: 'destructive' })
          }
        }
        queryClient.invalidateQueries({ queryKey: ['general-cost-payment-media', savedPaymentId] })
        setFilesToUpload([])
      } else {
        console.log('[GeneralCostPaymentForm] Skipping upload - no files or no payment id')
      }

      toast({
        title: mode === 'edit' ? 'Pago actualizado' : 'Pago creado',
        description: mode === 'edit' ? 'El pago ha sido actualizado correctamente' : 'El pago ha sido creado correctamente',
      })

      onClose()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Error al guardar el pago', variant: 'destructive' })
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  if (isLoading) {
    return (
      <ModalLayout onClose={handleClose} size="lg">
        <ModalHeader
          title={mode === 'edit' ? 'Editar Pago' : 'Nuevo Pago'}
          description="Cargando..."
          icon={DollarSign}
        />
        <ModalBody>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        </ModalBody>
      </ModalLayout>
    )
  }

  return (
    <ModalLayout onClose={handleClose} size="lg">
      <ModalHeader
        title={mode === 'edit' ? 'Editar Pago de Gastos Generales' : 'Nuevo Pago de Gastos Generales'}
        description={mode === 'edit' ? 'Actualiza los detalles del pago' : 'Registra un nuevo pago de gastos generales'}
        icon={DollarSign}
      />
      <ModalBody>
        <Form {...form}>
          <form className="space-y-4" data-testid="general-cost-payment-form">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
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

            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
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
                    <FormLabel>Cotización</FormLabel>
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

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observaciones adicionales..." {...field} rows={3} data-testid="textarea-notes" />
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
                  <FormLabel>Referencia</FormLabel>
                  <FormControl>
                    <Input placeholder="Número de recibo, factura, etc." {...field} data-testid="input-reference" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Adjuntos (opcional)</FormLabel>
              <FileUploader
                mode="multiple"
                existingFiles={existingFiles}
                filesToUpload={filesToUpload}
                onFilesChange={setFilesToUpload}
                onExistingFileDelete={handleExistingFileDelete}
                emptyStateDescription="Arrastra archivos o haz clic para seleccionar"
                maxSize={2 * 1024 * 1024}
              />
            </div>
          </form>
        </Form>
      </ModalBody>
      <ModalFooter
        leftLabel="Cancelar"
        onLeftClick={handleClose}
        submitText={mode === 'edit' ? 'Actualizar Pago' : 'Guardar Pago'}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={createPaymentMutation.isPending || updatePaymentMutation.isPending}
      />
    </ModalLayout>
  )
}
