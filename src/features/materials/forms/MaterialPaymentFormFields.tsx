import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { parseLocalDate, formatDateForDB } from '@/lib/date-utils'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/features/users/hooks'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useOrganizationWallets, useOrganizationMembers } from '@/features/organization'
import { uploadFile, deleteFile } from '@/lib/storage'
import { FileUploader } from '@/components/shared/fields/FileUploader'
import { useQueryClient } from '@tanstack/react-query'
import { 
  useMaterialPayment, 
  useCreateMaterialPayment, 
  useUpdateMaterialPayment,
} from '@/features/materials'
import { getMaterialPaymentStatusBadgeConfig } from '../utils/statusBadge'

const materialPaymentSchema = z.object({
  payment_date: z.date({
    required_error: "Fecha de pago es requerida",
  }),
  wallet_id: z.string().min(1, 'Billetera es requerida'),
  amount: z.number().min(0.01, 'Monto debe ser mayor a 0'),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  exchange_rate: z.number().min(0.0001, 'Tipo de cambio debe ser mayor a 0').optional().nullable(),
  status: z.enum(['confirmed', 'pending', 'rejected', 'void']),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

type MaterialPaymentFormData = z.infer<typeof materialPaymentSchema>

function FormPanel({
  form,
  onSubmit,
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
  form: ReturnType<typeof useForm<MaterialPaymentFormData>>;
  onSubmit: (data: MaterialPaymentFormData) => void;
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="payment_date"
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
                        data-testid="input-material-payment-date"
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
                  <SelectTrigger data-testid="select-material-payment-status">
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
                  <SelectTrigger data-testid="select-material-payment-wallet">
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
                  data-testid="input-material-payment-amount"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

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
                  <SelectTrigger data-testid="select-material-payment-currency">
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
              <FormLabel>Cotización (opcional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  placeholder="1.0000"
                  value={field.value || ''}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                  data-testid="input-material-payment-exchange-rate"
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
            <FormLabel>Notas (opcional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Agregar notas adicionales sobre el pago..."
                rows={2}
                {...field}
                data-testid="textarea-material-payment-notes"
              />
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
                data-testid="input-material-payment-reference"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div>
        <FileUploader
          mode="multiple"
          filesToUpload={filesToUpload}
          existingFiles={existingFiles}
          onFilesChange={setFilesToUpload}
          maxSize={10 * 1024 * 1024}
          accept={{
            'image/*': ['.png', '.jpg', '.jpeg'],
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
          }}
          compressionPreset="document"
          onExistingFileDelete={onExistingFileDelete}
          emptyStateDescription="Arrastra archivos o haz clic para seleccionar"
          newFileBadgeText="Nuevo"
        />
      </div>
    </div>
  )
}

function ViewPanel({
  existingPayment,
  attachments,
}: {
  existingPayment: any;
  attachments: any[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Monto</h4>
          <span className="text-base font-bold text-green-700 dark:text-green-400" data-testid="text-material-payment-amount">
            {existingPayment.currency?.symbol} {existingPayment.amount?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <div className="text-xs text-muted-foreground mt-1">
            {existingPayment.currency?.code} - Tipo de cambio: {existingPayment.exchange_rate?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) || '1.00'}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Estado</h4>
          {(() => {
            const statusConfig = getMaterialPaymentStatusBadgeConfig(existingPayment.status);
            return (
              <Badge variant={statusConfig.variant} className={statusConfig.className} data-testid="badge-material-payment-status">
                {statusConfig.label}
              </Badge>
            );
          })()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Fecha de Pago</h4>
          <span className="text-sm font-medium" data-testid="text-material-payment-date">
            {existingPayment.payment_date ? format(parseLocalDate(existingPayment.payment_date)!, 'dd/MM/yyyy', { locale: es }) : '-'}
          </span>
        </div>
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Billetera</h4>
          <span className="text-sm font-medium" data-testid="text-material-payment-wallet">
            {existingPayment.wallet?.wallets?.name || '-'}
          </span>
        </div>
      </div>

      {existingPayment.reference && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Referencia</h4>
          <span className="text-sm" data-testid="text-material-payment-reference">{existingPayment.reference}</span>
        </div>
      )}

      {existingPayment.notes && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Notas</h4>
          <p className="text-sm bg-muted/30 p-3 rounded-md" data-testid="text-material-payment-notes">{existingPayment.notes}</p>
        </div>
      )}

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
                data-testid={`link-material-payment-attachment-${attachment.id}`}
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

      <div className="pt-4 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div data-testid="text-material-payment-created-at">
            <span className="font-medium">Creado:</span> {format(new Date(existingPayment.created_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
          </div>
          {existingPayment.updated_at && existingPayment.updated_at !== existingPayment.created_at && (
            <div data-testid="text-material-payment-updated-at">
              <span className="font-medium">Actualizado:</span> {format(new Date(existingPayment.updated_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export interface MaterialPaymentFormFieldsProps {
  projectId?: string;
  organizationId?: string;
  paymentId?: string;
  mode: 'create' | 'edit' | 'view';
  onSuccess: () => void;
  onCancel: () => void;
  hideActions?: boolean;
  formRef?: React.RefObject<HTMLFormElement>;
}

export function MaterialPaymentFormFields({ 
  projectId, 
  organizationId, 
  paymentId, 
  mode, 
  onSuccess, 
  onCancel,
  hideActions = false,
  formRef
}: MaterialPaymentFormFieldsProps) {
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()
  const [filesToUpload, setFilesToUpload] = useState<any[]>([])
  const [attachments, setAttachments] = useState<any[]>([])

  const { data: existingPayment, isLoading: loadingPayment } = useMaterialPayment(
    projectId,
    paymentId,
    organizationId
  )

  const { data: currencies, isLoading: currenciesLoading } = useOrganizationCurrencies(organizationId || '')
  const { data: wallets, isLoading: walletsLoading } = useOrganizationWallets(organizationId || '')
  const { data: members = [], isLoading: membersLoading } = useOrganizationMembers(organizationId || '')

  const currentMember = useMemo(() => {
    return members.find(m => m.user_id === userData?.user?.id) || null
  }, [members, userData?.user?.id])

  const form = useForm<MaterialPaymentFormData>({
    resolver: zodResolver(materialPaymentSchema),
    defaultValues: {
      payment_date: new Date(),
      wallet_id: '',
      amount: 0,
      currency_id: '',
      exchange_rate: undefined,
      status: 'confirmed',
      reference: '',
      notes: '',
    }
  })

  const isLoading = currenciesLoading || walletsLoading || membersLoading || ((mode === 'edit' || mode === 'view') && loadingPayment)

  useEffect(() => {
    if (existingPayment && (mode === 'edit' || mode === 'view')) {
      const paymentDate = parseLocalDate(existingPayment.payment_date) || new Date()
      
      form.reset({
        payment_date: paymentDate,
        wallet_id: existingPayment.wallet_id || '',
        amount: existingPayment.amount || 0,
        currency_id: existingPayment.currency_id || '',
        exchange_rate: existingPayment.exchange_rate || undefined,
        status: existingPayment.status || 'confirmed',
        reference: existingPayment.reference || '',
        notes: existingPayment.notes || '',
      })
    }
  }, [existingPayment, mode, form])

  useEffect(() => {
    const fetchAttachments = async () => {
      if (!paymentId || !organizationId || !projectId) return
      
      try {
        const { supabase } = await import('@/lib/supabase')
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData?.session?.access_token
        
        if (!token) {
          console.error('No auth token available for fetching attachments')
          return
        }
        
        const response = await fetch(
          `/api/projects/${projectId}/material-payments/${paymentId}/attachments?organization_id=${organizationId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )
        
        if (response.ok) {
          const result = await response.json()
          if (result.data) {
            setAttachments(result.data)
          }
        }
      } catch (error) {
        console.error('Error fetching material payment attachments:', error)
      }
    }
    
    if (mode === 'edit' || mode === 'view') {
      fetchAttachments()
    }
  }, [paymentId, organizationId, projectId, mode])
  
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

  useEffect(() => {
    if (mode === 'create' && !paymentId) {
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
  }, [currencies, wallets, mode, paymentId, form])

  const createPaymentMutation = useCreateMaterialPayment()
  const updatePaymentMutation = useUpdateMaterialPayment()
  const queryClient = useQueryClient()

  const handleExistingFileDelete = async (fileId: string) => {
    try {
      await deleteFile(fileId, false)
      queryClient.invalidateQueries({ queryKey: ['material-payment-media', paymentId] })
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

  const isSubmitting = createPaymentMutation.isPending || updatePaymentMutation.isPending

  const onSubmit = async (data: MaterialPaymentFormData) => {
    try {
      let paymentResult;
      
      if (mode === 'edit' && paymentId) {
        paymentResult = await updatePaymentMutation.mutateAsync({
          projectId: projectId || '',
          paymentId,
          updates: {
            wallet_id: data.wallet_id,
            amount: data.amount,
            currency_id: data.currency_id,
            exchange_rate: data.exchange_rate ?? undefined,
            payment_date: formatDateForDB(data.payment_date),
            status: data.status,
            reference: data.reference || null,
            notes: data.notes || null,
          },
          organizationId: organizationId || '',
        })
      } else {
        paymentResult = await createPaymentMutation.mutateAsync({
          payment: {
            wallet_id: data.wallet_id,
            amount: data.amount,
            currency_id: data.currency_id,
            exchange_rate: data.exchange_rate ?? undefined,
            payment_date: formatDateForDB(data.payment_date),
            status: data.status,
            reference: data.reference || null,
            notes: data.notes || null,
            purchase_id: null,
            created_by: currentMember?.id || null,
          },
          projectId: projectId || '',
          organizationId: organizationId || '',
        })
      }

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
            console.log('[MaterialPaymentFormFields] Uploading file:', {
              fileName: fileInput.file?.name,
              fileSize: fileInput.file?.size,
              organizationId,
              projectId,
              createdPaymentId,
              createdByMemberId: currentMember?.id,
            })
            
            if (!fileInput.file) {
              console.error('[MaterialPaymentFormFields] No file object in fileInput:', fileInput)
              continue
            }
            
            const uploadResult = await uploadFile(fileInput.file, {
              entity: 'material_payment_attachment',
              organization_id: organizationId,
              project_id: projectId,
              created_by_member_id: currentMember?.id,
              link_to: {
                material_payment_id: createdPaymentId,
              },
              category: 'document',
              description: fileInput.description || fileInput.file.name,
            })
            
            console.log('[MaterialPaymentFormFields] Upload successful:', uploadResult)
          } catch (uploadError: any) {
            console.error('[MaterialPaymentFormFields] Error uploading file:', {
              error: uploadError,
              message: uploadError?.message,
              code: uploadError?.code,
              details: uploadError?.details,
              hint: uploadError?.hint,
              stack: uploadError?.stack,
            })
            toast({
              variant: 'destructive',
              title: 'Error al subir archivo',
              description: uploadError?.message || String(uploadError) || 'Error desconocido',
              duration: 8000,
            })
          }
        }
        queryClient.invalidateQueries({ queryKey: ['material-payment-media', createdPaymentId] })
        setFilesToUpload([])
      }
      
      toast({
        title: mode === 'edit' ? 'Pago actualizado' : 'Pago registrado',
        description: mode === 'edit'
          ? 'El pago de materiales ha sido actualizado correctamente'
          : 'El pago de materiales ha sido registrado correctamente',
      })
      form.reset()
      onSuccess()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Error al ${mode === 'edit' ? 'actualizar' : 'registrar'} el pago: ${error.message || 'Error desconocido'}`,
      })
    }
  }

  if (mode === 'view') {
    return (
      <div className="space-y-6 w-full">
        {existingPayment && (
          <ViewPanel
            existingPayment={existingPayment}
            attachments={attachments}
          />
        )}
        {!hideActions && (
          <div className="flex justify-end pt-4 border-t">
            <Button 
              variant="secondary" 
              onClick={onCancel}
              data-testid="button-material-payment-close"
            >
              Cerrar
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
        <FormPanel
          form={form}
          onSubmit={onSubmit}
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
        
        {!hideActions && (
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={onCancel} 
              className="flex-1"
              data-testid="button-material-payment-cancel"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !currentMember || isLoading} 
              className="flex-[3]"
              data-testid="button-material-payment-submit"
            >
              {isSubmitting ? 'Guardando...' : mode === 'edit' ? 'Guardar Cambios' : 'Registrar Pago'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}

export default MaterialPaymentFormFields
