import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatDateForDB } from '@/lib/date-utils'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useOrganizationWallets, useOrganizationMembers } from '@/features/organization'
import { usePartners, useCreatePartnerContribution } from '../hooks'
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField'
import { FileUploader } from '@/components/shared/FileUploader'
import { uploadFile, deleteFile } from '@/lib/storage'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Partner } from '../types'

const partnerContributionSchema = z.object({
  contribution_date: z.date({
    required_error: "Fecha es requerida",
  }),
  partner_id: z.string().min(1, 'Socio es requerido'),
  wallet_id: z.string().min(1, 'Billetera es requerida'),
  amount: z.number().min(0.01, 'Monto debe ser mayor a 0'),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  exchange_rate: z.number().min(0.0001, 'Tipo de cambio debe ser mayor a 0').optional().nullable(),
  status: z.enum(['confirmed', 'pending', 'rejected', 'void']),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

type PartnerContributionFormData = z.infer<typeof partnerContributionSchema>

function getPartnerDisplayName(partner: Partner): string {
  if (!partner?.contacts) return 'Socio sin nombre'
  
  const { contacts } = partner
  if (contacts.full_name) {
    return contacts.full_name
  }
  const constructedName = `${contacts.first_name || ''} ${contacts.last_name || ''}`.trim()
  if (constructedName) {
    return constructedName
  }
  if (contacts.company_name) {
    return contacts.company_name
  }
  if (contacts.email) {
    return contacts.email
  }
  return 'Socio sin nombre'
}

export interface PartnerContributionFormFieldsProps {
  projectId?: string;
  organizationId?: string;
  contributionId?: string;
  mode: 'create' | 'edit' | 'view';
  onSuccess: () => void;
  onCancel: () => void;
  hideActions?: boolean;
  formRef?: React.RefObject<HTMLFormElement>;
}

export function PartnerContributionFormFields({ 
  projectId, 
  organizationId,
  contributionId,
  mode, 
  onSuccess, 
  onCancel,
  hideActions = false,
  formRef
}: PartnerContributionFormFieldsProps) {
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [filesToUpload, setFilesToUpload] = useState<any[]>([])
  const [attachments, setAttachments] = useState<any[]>([])

  const { data: partners = [], isLoading: partnersLoading } = usePartners(organizationId, { enabled: !!organizationId })
  const { data: currencies, isLoading: currenciesLoading } = useOrganizationCurrencies(organizationId || '')
  const { data: wallets, isLoading: walletsLoading } = useOrganizationWallets(organizationId || '')
  const { data: members = [], isLoading: membersLoading } = useOrganizationMembers(organizationId || '')

  const createMutation = useCreatePartnerContribution()

  const currentMember = useMemo(() => {
    return members.find(m => m.user_id === userData?.user?.id) || null
  }, [members, userData?.user?.id])

  const partnerOptions = useMemo(() => {
    return partners.map(partner => ({
      value: partner.id,
      label: getPartnerDisplayName(partner)
    })).sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }))
  }, [partners])

  const defaultCurrencyId = useMemo(() => {
    return currencies && currencies.length > 0 ? currencies[0].id : '';
  }, [currencies]);

  const defaultWalletId = useMemo(() => {
    return wallets && wallets.length > 0 ? wallets[0].id : '';
  }, [wallets]);

  const form = useForm<PartnerContributionFormData>({
    resolver: zodResolver(partnerContributionSchema),
    defaultValues: {
      contribution_date: new Date(),
      partner_id: '',
      wallet_id: defaultWalletId,
      amount: 0,
      currency_id: defaultCurrencyId,
      exchange_rate: undefined,
      status: 'confirmed',
      reference: '',
      notes: '',
    }
  })

  const isLoading = partnersLoading || currenciesLoading || walletsLoading || membersLoading

  useEffect(() => {
    const fetchAttachments = async () => {
      if (!contributionId || !organizationId) return
      
      try {
        const { data, error } = await supabase
          .from('media_links')
          .select(`
            id,
            description,
            category,
            created_at,
            media_file:media_file_id (
              id,
              file_url,
              file_name,
              file_type,
              file_size
            )
          `)
          .eq('partner_contribution_id', contributionId)
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: true })
        
        if (error) {
          console.error('Error fetching contribution attachments:', error)
          return
        }
        
        const transformedData = (data || []).map((item: any) => ({
          id: item.id,
          description: item.description,
          category: item.category,
          created_at: item.created_at,
          media_file: Array.isArray(item.media_file) && item.media_file.length > 0
            ? item.media_file[0]
            : item.media_file
        }))
        
        setAttachments(transformedData)
      } catch (error) {
        console.error('Error fetching contribution attachments:', error)
      }
    }
    
    if (mode === 'edit' || mode === 'view') {
      fetchAttachments()
    }
  }, [contributionId, organizationId, mode])

  const existingFiles = useMemo(() => {
    if (!attachments || attachments.length === 0) return []
    
    return attachments.map((attachment: any) => ({
      id: attachment.media_file?.id || attachment.id,
      file_name: attachment.media_file?.file_name || 'Archivo adjunto',
      file_type: attachment.media_file?.file_type || 'document',
      file_size: attachment.media_file?.file_size || 0,
      file_url: attachment.media_file?.file_url || '',
      isExisting: true,
    }))
  }, [attachments])

  const handleExistingFileDelete = async (fileId: string) => {
    try {
      await deleteFile(fileId, false)
      setAttachments(prev => prev.filter(a => (a.media_file?.id || a.id) !== fileId))
      queryClient.invalidateQueries({ queryKey: ['partner-contribution-media', contributionId] })
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

  const onSubmit = async (data: PartnerContributionFormData) => {
    if (!organizationId || !currentMember) {
      toast({
        title: "Error",
        description: "No se encontró la organización o el usuario actual",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await createMutation.mutateAsync({
        organization_id: organizationId,
        project_id: projectId || null,
        partner_id: data.partner_id,
        amount: data.amount,
        currency_id: data.currency_id,
        exchange_rate: data.exchange_rate || 1,
        contribution_date: formatDateForDB(data.contribution_date),
        wallet_id: data.wallet_id,
        status: data.status,
        reference: data.reference || null,
        notes: data.notes || null,
        created_by: currentMember.id,
      })

      const createdContributionId = result?.id || contributionId

      if (filesToUpload.length > 0 && createdContributionId) {
        for (const fileInput of filesToUpload) {
          try {
            if (!fileInput.file) continue
            
            await uploadFile(fileInput.file, {
              entity: 'partner_contribution_attachment',
              organization_id: organizationId,
              project_id: projectId,
              created_by_member_id: currentMember?.id,
              link_to: {
                partner_contribution_id: createdContributionId,
              },
              category: 'document',
              description: fileInput.description || fileInput.file.name,
            })
          } catch (uploadError: any) {
            console.error('Error uploading file:', uploadError)
            toast({
              variant: 'destructive',
              title: 'Error al subir archivo',
              description: uploadError?.message || 'Error desconocido',
            })
          }
        }
        setFilesToUpload([])
      }

      toast({
        title: "Aporte registrado",
        description: "El aporte de socio se ha registrado correctamente",
      })

      onSuccess()
    } catch (error: any) {
      console.error('Error creating partner contribution:', error)
      toast({
        title: "Error al registrar aporte",
        description: error.message || "Ocurrió un error al registrar el aporte",
        variant: "destructive",
      })
    }
  }

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
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contribution_date"
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
                          data-testid="input-partner-contribution-date"
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
            name="partner_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Socio <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <ComboBox
                    value={field.value}
                    onValueChange={field.onChange}
                    options={partnerOptions}
                    placeholder="Seleccionar socio"
                    searchPlaceholder="Buscar socio..."
                    emptyMessage="No se encontraron socios"
                    data-testid="combobox-partner-contribution-partner"
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
            name="wallet_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Billetera <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange} disabled={walletsLoading}>
                    <SelectTrigger data-testid="select-partner-contribution-wallet">
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
                    data-testid="input-partner-contribution-amount"
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
                    <SelectTrigger data-testid="select-partner-contribution-currency">
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
                    data-testid="input-partner-contribution-exchange-rate"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                  data-testid="input-partner-contribution-reference"
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
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Agregar notas adicionales..."
                  rows={2}
                  {...field}
                  data-testid="textarea-partner-contribution-notes"
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
            onExistingFileDelete={handleExistingFileDelete}
            emptyStateTitle="Sin archivos adjuntos"
            emptyStateDescription="Arrastra archivos o haz clic para seleccionar"
            newFileBadgeText="Nuevo"
          />
        </div>
      </form>
    </Form>
  )
}
