import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { DollarSign, Clock, Calendar } from 'lucide-react'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

import DatePickerField from '@/components/ui-custom/fields/DatePickerField'
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'
import { apiRequest, queryClient as globalQueryClient } from '@/lib/queryClient'

const rateSchema = z.object({
  pay_type: z.enum(['hour', 'day', 'month']),
  rate_hour: z.number().nullable(),
  rate_day: z.number().nullable(),
  rate_month: z.number().nullable(),
  currency_id: z.string(),
  valid_from: z.date(),
  valid_to: z.date().nullable()
}).refine(data => {
  if (data.pay_type === 'hour') return data.rate_hour !== null && data.rate_hour > 0
  if (data.pay_type === 'day') return data.rate_day !== null && data.rate_day > 0
  if (data.pay_type === 'month') return data.rate_month !== null && data.rate_month > 0
  return false
}, {
  message: "Debe ingresar el monto para el tipo de pago seleccionado",
  path: ['rate_hour']
})

type RateForm = z.infer<typeof rateSchema>

interface PersonnelRatesModalProps {
  modalData?: {
    personnelRecord?: any
  }
  onClose: () => void
}

export function PersonnelRatesModal({ modalData, onClose }: PersonnelRatesModalProps) {
  const { toast } = useToast()
  const { data: currentUser } = useCurrentUser()
  const queryClient = useQueryClient()
  const personnelRecord = modalData?.personnelRecord
  const personnelId = personnelRecord?.id
  const organizationId = currentUser?.preferences?.last_organization_id
  const projectId = currentUser?.preferences?.last_project_id

  // Obtener session de Supabase para autenticación
  const [session, setSession] = useState<any>(null)
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
  }, [])

  // Query para obtener currencies
  const { data: currencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      if (!supabase) return []
      
      const { data, error } = await supabase
        .from('currencies')
        .select('id, code, name, symbol')
        .order('code', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!supabase
  })

  // Query para obtener historial de tarifas
  const { data: ratesHistory = [], isLoading: ratesLoading } = useQuery({
    queryKey: ['personnel-rates', personnelId],
    queryFn: async () => {
      if (!personnelId || !organizationId) return []

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(
        `/api/personnel/${personnelId}/rates?organization_id=${organizationId}`,
        {
          headers,
          credentials: 'include'
        }
      )
      
      if (!response.ok) throw new Error('Error al cargar tarifas')
      
      return response.json()
    },
    enabled: !!personnelId && !!organizationId && !!session
  })

  const form = useForm<RateForm>({
    resolver: zodResolver(rateSchema),
    defaultValues: {
      pay_type: 'hour',
      rate_hour: null,
      rate_day: null,
      rate_month: null,
      currency_id: '',
      valid_from: new Date(),
      valid_to: null
    }
  })

  const watchPayType = form.watch('pay_type')

  const createRateMutation = useMutation({
    mutationFn: async (data: RateForm) => {
      if (!personnelId || !organizationId) {
        throw new Error('Información de personal u organización no disponible')
      }

      const payload = {
        organization_id: organizationId,
        personnel_id: personnelId,
        pay_type: data.pay_type,
        rate_hour: data.pay_type === 'hour' ? data.rate_hour : null,
        rate_day: data.pay_type === 'day' ? data.rate_day : null,
        rate_month: data.pay_type === 'month' ? data.rate_month : null,
        currency_id: data.currency_id,
        valid_from: data.valid_from.toISOString().split('T')[0],
        valid_to: data.valid_to ? data.valid_to.toISOString().split('T')[0] : null,
        is_active: true
      }

      return apiRequest('POST', `/api/personnel/${personnelId}/rates`, payload)
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['personnel-rates', personnelId] })
      await globalQueryClient.refetchQueries({ queryKey: ['project-personnel', projectId] })
      
      toast({
        title: 'Tarifa creada exitosamente',
        description: 'La tarifa ha sido registrada correctamente'
      })
      
      form.reset({
        pay_type: 'hour',
        rate_hour: null,
        rate_day: null,
        rate_month: null,
        currency_id: '',
        valid_from: new Date(),
        valid_to: null
      })
    },
    onError: (error: any) => {
      console.error('Error creating rate:', error)
      toast({
        title: 'Error al crear tarifa',
        description: error.message || 'No se pudo crear la tarifa',
        variant: 'destructive'
      })
    }
  })

  const handleSubmit = (data: RateForm) => {
    createRateMutation.mutate(data)
  }

  const isLoading = createRateMutation.isPending

  // Get contact display name
  const contactDisplayName = personnelRecord?.contact?.first_name || personnelRecord?.contact?.last_name
    ? `${personnelRecord.contact.first_name || ''} ${personnelRecord.contact.last_name || ''}`.trim()
    : personnelRecord?.contact?.full_name || 'Sin nombre'

  // Format currency amount
  const formatAmount = (amount: any, currency: any) => {
    const num = parseFloat(amount)
    if (isNaN(num)) return '-'
    return `${currency?.symbol || ''} ${num.toFixed(2)}`
  }

  // Get pay type label
  const getPayTypeLabel = (payType: string) => {
    const labels: Record<string, string> = {
      hour: 'Por Hora',
      day: 'Por Día',
      month: 'Por Mes'
    }
    return labels[payType] || payType
  }

  // Format date range
  const formatDateRange = (validFrom: string, validTo: string | null) => {
    const from = new Date(validFrom).toLocaleDateString('es-AR', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
    
    if (!validTo) {
      return `Desde ${from}`
    }
    
    const to = new Date(validTo).toLocaleDateString('es-AR', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
    
    return `${from} - ${to}`
  }

  // Check if rate is currently active
  const isRateActive = (rate: any) => {
    const now = new Date().toISOString().split('T')[0]
    const validFrom = rate.valid_from
    const validTo = rate.valid_to
    
    return rate.is_active && validFrom <= now && (!validTo || validTo >= now)
  }

  const editPanel = (
    <div className="space-y-6">
      {/* Personnel Info */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1">Personal</p>
        <p className="font-medium text-lg">{contactDisplayName}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Pay Type */}
          <FormField
            control={form.control}
            name="pay_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Pago</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-pay-type">
                      <SelectValue placeholder="Seleccionar tipo de pago" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="hour">Por Hora</SelectItem>
                    <SelectItem value="day">Por Día</SelectItem>
                    <SelectItem value="month">Por Mes</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Rate Amount - Conditional based on pay_type */}
          {watchPayType === 'hour' && (
            <FormField
              control={form.control}
              name="rate_hour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tarifa por Hora</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      data-testid="input-rate-hour"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {watchPayType === 'day' && (
            <FormField
              control={form.control}
              name="rate_day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tarifa por Día</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      data-testid="input-rate-day"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {watchPayType === 'month' && (
            <FormField
              control={form.control}
              name="rate_month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tarifa por Mes</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      data-testid="input-rate-month"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Currency */}
          <FormField
            control={form.control}
            name="currency_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-currency">
                      <SelectValue placeholder="Seleccionar moneda" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {currencies.map((currency: any) => (
                      <SelectItem key={currency.id} value={currency.id}>
                        {currency.code} - {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="valid_from"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Válido Desde</FormLabel>
                  <FormControl>
                    <DatePickerField
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Seleccionar fecha de inicio"
                      disableFuture={false}
                      minDate={new Date("1900-01-01")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valid_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Válido Hasta (opcional)</FormLabel>
                  <FormControl>
                    <DatePickerField
                      value={field.value ?? undefined}
                      onChange={field.onChange}
                      placeholder="Sin fecha de fin"
                      disableFuture={false}
                      minDate={new Date("1900-01-01")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
    </div>
  )

  const viewPanel = (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-1">Historial de Tarifas</h3>
        <p className="text-sm text-muted-foreground">
          Tarifas registradas para este personal
        </p>
      </div>

      {ratesLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando historial...</div>
        </div>
      ) : ratesHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <DollarSign className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No hay tarifas registradas</p>
          <p className="text-sm text-muted-foreground mt-1">
            Crea la primera tarifa usando el formulario
          </p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-3 pr-4">
            {ratesHistory.map((rate: any) => {
              const rateAmount = rate[`rate_${rate.pay_type}`]
              const isActive = isRateActive(rate)

              return (
                <div
                  key={rate.id}
                  className={`border rounded-lg p-4 space-y-2 ${
                    isActive ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                  data-testid={`rate-card-${rate.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {getPayTypeLabel(rate.pay_type)}
                        </span>
                        {isActive && (
                          <Badge variant="default" className="text-xs">
                            Activa
                          </Badge>
                        )}
                        {!rate.is_active && (
                          <Badge variant="outline" className="text-xs">
                            Inactiva
                          </Badge>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {formatAmount(rateAmount, rate.currency)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDateRange(rate.valid_from, rate.valid_to)}</span>
                  </div>

                  {rate.currency && (
                    <div className="text-xs text-muted-foreground">
                      {rate.currency.code} - {rate.currency.name}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  )

  const headerContent = (
    <FormModalHeader
      title="Gestionar Tarifas"
      description={`Administra las tarifas de pago para ${contactDisplayName}`}
      icon={DollarSign}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      submitText="Guardar Tarifa"
      onSubmit={form.handleSubmit(handleSubmit)}
      isSubmitting={isLoading}
    />
  )

  return (
    <FormModalLayout
      columns={2}
      editPanel={editPanel}
      viewPanel={viewPanel}
      onClose={onClose}
      headerContent={headerContent}
      footerContent={footerContent}
      isEditing={true}
      className="max-w-6xl"
    />
  )
}
