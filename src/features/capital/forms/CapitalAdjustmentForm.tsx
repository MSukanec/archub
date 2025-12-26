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
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationCurrencies, useOrgCurrencyContext } from '@/hooks/use-currencies'
import { useOrganizationMembers } from '@/features/organization'
import { getCurrencyFieldsVisibility } from '@/lib/currency-visibility'
import { usePartners, useCreateCapitalAdjustment, useUpdateCapitalAdjustment, useCapitalAdjustment } from '../hooks'
import { ComboBox } from '@/components/shared/fields/ComboBoxWriteField'
import { IdentityBadge } from '@/components/shared/IdentityBadge'
import type { Partner } from '../types'

const capitalAdjustmentSchema = z.object({
  adjustment_date: z.date({
    required_error: "Fecha es requerida",
  }),
  partner_id: z.string().optional().nullable(),
  amount: z.number().refine(val => val !== 0, { message: 'El monto no puede ser 0' }),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  exchange_rate: z.number().min(0.0001, 'Tipo de cambio debe ser mayor a 0').optional().nullable(),
  reason: z.string().optional().nullable(),
  status: z.enum(['confirmed', 'pending', 'rejected', 'void']),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

type CapitalAdjustmentFormData = z.infer<typeof capitalAdjustmentSchema>

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

export interface CapitalAdjustmentFormProps {
  projectId?: string;
  organizationId?: string;
  adjustmentId?: string;
  mode: 'create' | 'edit' | 'view';
  onSuccess: () => void;
  onCancel: () => void;
  hideActions?: boolean;
  formRef?: React.RefObject<HTMLFormElement>;
}

export function CapitalAdjustmentForm({ 
  projectId, 
  organizationId,
  adjustmentId,
  mode, 
  onSuccess, 
  onCancel,
  hideActions = false,
  formRef
}: CapitalAdjustmentFormProps) {
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()

  const { data: partners = [], isLoading: partnersLoading } = usePartners(organizationId, { enabled: !!organizationId })
  const { data: currencies, isLoading: currenciesLoading } = useOrganizationCurrencies(organizationId || '')
  const { data: members = [], isLoading: membersLoading } = useOrganizationMembers(organizationId || '')
  
  const orgCurrencyContext = useOrgCurrencyContext(organizationId)

  const createMutation = useCreateCapitalAdjustment()
  const updateMutation = useUpdateCapitalAdjustment()
  const { data: existingAdjustment, isLoading: loadingAdjustment } = useCapitalAdjustment(
    adjustmentId,
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

  const form = useForm<CapitalAdjustmentFormData>({
    resolver: zodResolver(capitalAdjustmentSchema),
    defaultValues: {
      adjustment_date: new Date(),
      partner_id: null,
      amount: 0,
      currency_id: '',
      exchange_rate: undefined,
      reason: null,
      status: 'confirmed',
      reference: '',
      notes: '',
    }
  })

  const isLoading = partnersLoading || currenciesLoading || membersLoading || loadingAdjustment

  useEffect(() => {
    if (existingAdjustment && (mode === 'edit' || mode === 'view')) {
      const adjustmentDate = parseLocalDate(existingAdjustment.adjustment_date) || new Date()
      
      form.reset({
        adjustment_date: adjustmentDate,
        partner_id: existingAdjustment.partner_id || null,
        amount: existingAdjustment.amount || 0,
        currency_id: existingAdjustment.currency_id || '',
        exchange_rate: existingAdjustment.exchange_rate || undefined,
        reason: existingAdjustment.reason || null,
        status: existingAdjustment.status || 'confirmed',
        reference: existingAdjustment.reference || '',
        notes: existingAdjustment.notes || '',
      })
    }
  }, [existingAdjustment, mode, form])

  useEffect(() => {
    if (mode === 'create' && !adjustmentId) {
      if (orgCurrencyContext.defaultCurrencyId && !orgCurrencyContext.isLoading) {
        form.setValue('currency_id', orgCurrencyContext.defaultCurrencyId)
      } else if (!currenciesLoading && currencies && currencies.length > 0) {
        form.setValue('currency_id', currencies[0].currency?.id || '')
      }
    }
  }, [currencies, currenciesLoading, mode, adjustmentId, form, orgCurrencyContext.defaultCurrencyId, orgCurrencyContext.isLoading])

  const onSubmit = async (data: CapitalAdjustmentFormData) => {
    if (!organizationId || !currentMember) {
      toast({
        title: "Error",
        description: "No se encontró la organización o el usuario actual",
        variant: "destructive",
      })
      return
    }

    try {
      const shouldUseExchangeRate = orgCurrencyContext.shouldShowExchangeRate(data.currency_id);
      const effectiveExchangeRate = shouldUseExchangeRate ? (data.exchange_rate || 1) : 1;
      
      if (mode === 'edit' && adjustmentId) {
        await updateMutation.mutateAsync({
          adjustmentId,
          updates: {
            amount: data.amount,
            adjustment_date: formatDateForDB(data.adjustment_date),
            reason: data.reason ?? undefined,
            status: data.status,
            reference: data.reference || null,
            notes: data.notes || null,
          },
          organizationId,
        })
      } else {
        await createMutation.mutateAsync({
          organization_id: organizationId,
          project_id: projectId || null,
          partner_id: data.partner_id ?? undefined,
          amount: data.amount,
          currency_id: data.currency_id,
          exchange_rate: effectiveExchangeRate,
          adjustment_date: formatDateForDB(data.adjustment_date),
          reason: data.reason ?? undefined,
          status: data.status,
          reference: data.reference || null,
          notes: data.notes || null,
          created_by: currentMember.id,
        })
      }

      const successMessage = mode === 'edit' ? 'actualizado' : 'registrado';
      toast({
        title: `Ajuste ${successMessage}`,
        description: `El ajuste de capital se ha ${successMessage} correctamente`,
      })

      onSuccess()
    } catch (error: any) {
      toast({
        title: "Error al registrar ajuste",
        description: error.message || "Ocurrió un error al registrar el ajuste",
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
            name="adjustment_date"
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
                          data-testid="input-capital-adjustment-date"
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
                <FormLabel>Socio (opcional)</FormLabel>
                <FormControl>
                  <ComboBox
                    value={field.value || ''}
                    onValueChange={field.onChange}
                    options={partnerOptions}
                    placeholder="Seleccionar socio"
                    searchPlaceholder="Buscar socio..."
                    emptyMessage="No se encontraron socios"
                    data-testid="combobox-capital-adjustment-partner"
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
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Monto (con signo) <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 1000 o -500"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    data-testid="input-capital-adjustment-amount"
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Positivo (+) suma al capital, Negativo (-) resta
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger data-testid="select-capital-adjustment-status">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--card-bg)] text-[var(--card-fg)] border-[var(--card-border)]">
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

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Razón del ajuste (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Corrección de saldo inicial, Ajuste por diferencia de cambio..."
                  {...field}
                  value={field.value || ''}
                  data-testid="input-capital-adjustment-reason"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                              <SelectTrigger data-testid="select-capital-adjustment-currency">
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
                              data-testid="input-capital-adjustment-exchange-rate"
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
                  data-testid="textarea-capital-adjustment-notes"
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
                  placeholder="Ej: ADJ-12345"
                  {...field}
                  data-testid="input-capital-adjustment-reference"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!hideActions && (
          <div className="flex gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-input rounded-md hover:bg-accent transition-colors"
              data-testid="button-cancel-capital-adjustment"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              data-testid="button-submit-capital-adjustment"
            >
              {createMutation.isPending || updateMutation.isPending 
                ? 'Guardando...' 
                : mode === 'edit' 
                ? 'Actualizar Ajuste' 
                : 'Registrar Ajuste'
              }
            </button>
          </div>
        )}
      </form>
    </Form>
  )
}
