import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatDateForDB, parseLocalDate } from '@/lib/date-utils'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/features/users/hooks'
import { useOrganizationCurrencies, useOrgCurrencyContext } from '@/hooks/use-currencies'
import { useOrganizationWallets, useOrganizationMembers } from '@/features/organization'
import { getCurrencyFieldsVisibility } from '@/lib/currency-visibility'
import { usePartners, useCreatePartnerContribution, useUpdatePartnerContribution, usePartnerContribution } from '../hooks'
import { ComboBox } from '@/components/shared/fields/ComboBoxWriteField'
import { IdentityBadge } from '@/components/shared/IdentityBadge'
import { FileUploader } from '@/components/shared/fields/FileUploader'
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

export interface PartnerContributionFormProps {
  projectId?: string;
  organizationId?: string;
  contributionId?: string;
  mode: 'create' | 'edit' | 'view';
  onSuccess: () => void;
  onCancel: () => void;
  hideActions?: boolean;
  formRef?: React.RefObject<HTMLFormElement>;
}

export function PartnerContributionForm({ 
  projectId, 
  organizationId,
  contributionId,
  mode, 
  onSuccess, 
  onCancel,
  hideActions = false,
  formRef
}: PartnerContributionFormProps) {
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [filesToUpload, setFilesToUpload] = useState<any[]>([])
  const [attachments, setAttachments] = useState<any[]>([])

  const { data: partners = [], isLoading: partnersLoading } = usePartners(organizationId, { enabled: !!organizationId })
  const { data: currencies, isLoading: currenciesLoading } = useOrganizationCurrencies(organizationId || '')
  const { data: wallets, isLoading: walletsLoading } = useOrganizationWallets(organizationId || '')
  const { data: members = [], isLoading: membersLoading } = useOrganizationMembers(organizationId || '')
  
  const orgCurrencyContext = useOrgCurrencyContext(organizationId)

  const createMutation = useCreatePartnerContribution()
  const updateMutation = useUpdatePartnerContribution()
  const { data: existingContribution, isLoading: loadingContribution } = usePartnerContribution(
    contributionId,
    organizationId
  )

  const currentMember = useMemo(() => {
    return members.find(m => m.user_id === userData?.user?.id) || null
  }, [members, userData?.user?.id])

  const partnerOptions = useMemo(() => {
    return partners.map(partner => {
      const linkedUser = Array.isArray(partner.contacts?.linked_user) 
        ? partner.contacts?.linked_user[0]
        : partner.contacts?.linked_user;
      return {
        value: partner.id,
        label: getPartnerDisplayName(partner),
        linkedUser,
      };
    }).sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }))
  }, [partners])

  const form = useForm<PartnerContributionFormData>({
    resolver: zodResolver(partnerContributionSchema),
    defaultValues: {
      contribution_date: new Date(),
      partner_id: '',
      wallet_id: '',
      amount: 0,
      currency_id: '',
      exchange_rate: undefined,
      status: 'confirmed',
      reference: '',
      notes: '',
    }
  })

  const isLoading = partnersLoading || currenciesLoading || walletsLoading || membersLoading || loadingContribution

  // Load existing contribution data in edit/view mode
  useEffect(() => {
    if (existingContribution && (mode === 'edit' || mode === 'view')) {
      const contributionDate = parseLocalDate(existingContribution.contribution_date) || new Date()
      
      form.reset({
        contribution_date: contributionDate,
        partner_id: existingContribution.partner_id || '',
        wallet_id: existingContribution.wallet_id || '',
        amount: existingContribution.amount || 0,
        currency_id: existingContribution.currency_id || '',
        exchange_rate: existingContribution.exchange_rate || undefined,
        status: existingContribution.status || 'confirmed',
        reference: existingContribution.reference || '',
        notes: existingContribution.notes || '',
      })
    }
  }, [existingContribution, mode, form])

  // Set default wallet and currency when they load (create mode only)
  // Para organizaciones monomoneda, siempre usar la moneda por defecto
  useEffect(() => {
    if (mode === 'create' && !contributionId) {
      // Usar la moneda por defecto de la organización
      if (orgCurrencyContext.defaultCurrencyId && !orgCurrencyContext.isLoading) {
        form.setValue('currency_id', orgCurrencyContext.defaultCurrencyId)
      } else if (!currenciesLoading && currencies && currencies.length > 0) {
        // Fallback si no hay default currency
        form.setValue('currency_id', currencies[0].currency?.id || '')
      }
    }
  }, [currencies, currenciesLoading, mode, contributionId, form, orgCurrencyContext.defaultCurrencyId, orgCurrencyContext.isLoading])

  useEffect(() => {
    if (mode === 'create' && !contributionId) {
      if (!walletsLoading && wallets && wallets.length > 0) {
        form.setValue('wallet_id', wallets[0].id || '')
      }
    }
  }, [wallets, walletsLoading, mode, contributionId, form])

  useEffect(() => {
    if (mode === 'edit' || mode === 'view') {
      if (existingContribution?.media_links) {
        setAttachments(existingContribution.media_links)
      } else {
        setAttachments([])
      }
    }
  }, [existingContribution, mode])

  const existingFiles = useMemo(() => {
    if (!attachments || attachments.length === 0) return []
    
    return attachments.map((attachment: any) => {
      const mediaFile = attachment.media_file || attachment
      return {
        id: attachment.id || mediaFile.id,
        file_name: mediaFile.file_name || 'Archivo adjunto',
        file_type: mediaFile.file_type || 'document',
        file_size: mediaFile.file_size || 0,
        file_url: mediaFile.file_url || '',
        isExisting: true,
      }
    })
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
      let result;
      
      if (mode === 'edit' && contributionId) {
        result = await updateMutation.mutateAsync({
          contributionId,
          updates: {
            partner_id: data.partner_id,
            amount: data.amount,
            currency_id: data.currency_id,
            exchange_rate: data.exchange_rate || 1,
            contribution_date: formatDateForDB(data.contribution_date),
            wallet_id: data.wallet_id,
            status: data.status,
            reference: data.reference || null,
            notes: data.notes || null,
          },
          organizationId,
        })
      } else {
        result = await createMutation.mutateAsync({
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
      }

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
            toast({
              variant: 'destructive',
              title: 'Error al subir archivo',
              description: uploadError?.message || 'Error desconocido',
            })
          }
        }
        setFilesToUpload([])
      }

      const successMessage = mode === 'edit' ? 'actualizado' : 'registrado';
      toast({
        title: `Aporte ${successMessage}`,
        description: `El aporte de socio se ha ${successMessage} correctamente`,
      })

      onSuccess()
    } catch (error: any) {
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
                    renderOption={(option) => (
                      <IdentityBadge
                        name={option.label}
                        linkedUser={option.linkedUser}
                        size="sm"
                        layout="row"
                      />
                    )}
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
                    <SelectContent className="bg-[var(--card-bg)] text-[var(--card-fg)] border-[var(--card-border)]">
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

        {/* Campos de moneda - visibilidad condicional basada en isMultiCurrency */}
        {(() => {
          const visibility = getCurrencyFieldsVisibility({
            context: orgCurrencyContext,
            selectedCurrencyId: form.watch('currency_id')
          });
          
          return (
            <>
              {!visibility.showCurrencySelector && (
                <input type="hidden" {...form.register('currency_id')} />
              )}
              {(visibility.showCurrencySelector || visibility.showExchangeRate) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visibility.showCurrencySelector && (
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
                              <SelectContent className="bg-[var(--card-bg)] text-[var(--card-fg)] border-[var(--card-border)]">
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
                  )}

                  {visibility.showExchangeRate && (
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
                  )}
                </div>
              )}
            </>
          );
        })()}

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

        {!hideActions && (
          <div className="flex gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-input hover:bg-muted transition-colors"
              data-testid="button-cancel-contribution"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-[3] px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              data-testid="button-submit-contribution"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Guardando...'
                : mode === 'edit' ? 'Guardar Cambios' : 'Registrar Aporte'}
            </button>
          </div>
        )}
      </form>
    </Form>
  )
}
