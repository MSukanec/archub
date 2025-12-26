import { useMemo, useEffect, useState } from 'react'
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
import { CalendarIcon, ArrowRightLeft } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationCurrencies, useOrgCurrencyContext } from '@/hooks/use-currencies'
import { useOrganizationWallets, useOrganizationMembers } from '@/features/organization'
import { useCreateCurrencyExchange } from '../hooks/use-financial-operations'
const currencyExchangeSchema = z.object({
  operation_date: z.date({
    required_error: "Fecha es requerida",
  }),
  wallet_id: z.string().min(1, 'Billetera es requerida'),
  source_currency_id: z.string().min(1, 'Moneda origen es requerida'),
  destination_currency_id: z.string().min(1, 'Moneda destino es requerida'),
  source_amount: z.number().min(0.01, 'Monto debe ser mayor a 0'),
  exchange_rate: z.number().min(0.0001, 'Tipo de cambio debe ser mayor a 0'),
  description: z.string().optional(),
}).refine((data) => data.source_currency_id !== data.destination_currency_id, {
  message: "Las monedas deben ser diferentes",
  path: ["destination_currency_id"],
})
type CurrencyExchangeFormData = z.infer<typeof currencyExchangeSchema>
export interface CurrencyExchangeFormFieldsProps {
  projectId?: string
  organizationId?: string
  mode: 'create'| 'edit'| 'view'
  onSuccess: () => void
  onCancel: () => void
  hideActions?: boolean
  formRef?: React.RefObject<HTMLFormElement>
}
export function CurrencyExchangeFormFields({ 
  projectId, 
  organizationId,
  mode, 
  onSuccess, 
  onCancel,
  hideActions = false,
  formRef
}: CurrencyExchangeFormFieldsProps) {
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()
  const { data: wallets = [], isLoading: walletsLoading } = useOrganizationWallets(organizationId || '')
  const { data: currencies = [], isLoading: currenciesLoading } = useOrganizationCurrencies(organizationId || '')
  const { data: members = [], isLoading: membersLoading } = useOrganizationMembers(organizationId || '')
  
  const orgCurrencyContext = useOrgCurrencyContext(organizationId)
  const createMutation = useCreateCurrencyExchange()
  const currentMember = useMemo(() => {
    return members.find(m => m.user_id === userData?.user?.id) || null
  }, [members, userData?.user?.id])
  const form = useForm<CurrencyExchangeFormData>({
    resolver: zodResolver(currencyExchangeSchema),
    defaultValues: {
      operation_date: new Date(),
      wallet_id: '',
      source_currency_id: '',
      destination_currency_id: '',
      source_amount: 0,
      exchange_rate: 1,
      description: '',
    }
  })
  const isLoading = walletsLoading || currenciesLoading || membersLoading || orgCurrencyContext.isLoading
  useEffect(() => {
    if (mode === 'create'&& !walletsLoading && wallets.length > 0) {
      form.setValue('wallet_id', wallets[0].id || '')
    }
  }, [wallets, walletsLoading, mode, form])
  useEffect(() => {
    if (mode === 'create'&& !currenciesLoading && currencies.length >= 2) {
      form.setValue('source_currency_id', currencies[0].currency?.id || '')
      form.setValue('destination_currency_id', currencies[1].currency?.id || '')
    }
  }, [currencies, currenciesLoading, mode, form])
  const sourceAmount = form.watch('source_amount')
  const exchangeRate = form.watch('exchange_rate')
  const destinationAmount = sourceAmount * exchangeRate
  const sourceCurrencyId = form.watch('source_currency_id')
  const destinationCurrencyId = form.watch('destination_currency_id')
  
  const sourceCurrency = currencies.find(c => c.currency?.id === sourceCurrencyId)?.currency
  const destinationCurrency = currencies.find(c => c.currency?.id === destinationCurrencyId)?.currency
  const onSubmit = async (data: CurrencyExchangeFormData) => {
    if (!organizationId || !currentMember) {
      toast({
        title: "Error",
        description: "No se encontró la organización o el usuario actual",
        variant: "destructive",
      })
      return
    }
    try {
      await createMutation.mutateAsync({
        organization_id: organizationId,
        project_id: projectId || null,
        operation_date: formatDateForDB(data.operation_date),
        description: data.description || null,
        wallet_id: data.wallet_id,
        source_currency_id: data.source_currency_id,
        destination_currency_id: data.destination_currency_id,
        source_amount: data.source_amount,
        exchange_rate: data.exchange_rate,
        created_by_user_id: currentMember.user_id,
        created_by_member_id: currentMember.id,
      })
      toast({
        title: "Cambio registrado",
        description: "El cambio de moneda se ha registrado correctamente",
      })
      onSuccess()
    } catch (error: any) {
      console.error('Error creating currency exchange:', error)
      toast({
        title: "Error al registrar cambio",
        description: error.message || "Ocurrió un error al registrar el cambio de moneda",
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
  if (!orgCurrencyContext.isMultiCurrency) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 px-4">
          <ArrowRightLeft className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Para registrar cambios de moneda, necesitas tener al menos 2 monedas activas en tu organización.
          </p>
        </div>
      </div>
    )
  }
  const availableDestinationCurrencies = currencies.filter(c => c.currency?.id !== sourceCurrencyId)
  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="operation_date"
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
                          data-testid="input-currency-exchange-date"
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
            name="wallet_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Billetera <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange} disabled={walletsLoading}>
                    <SelectTrigger data-testid="select-currency-exchange-wallet">
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
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="source_currency_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Moneda Origen <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange} disabled={currenciesLoading}>
                    <SelectTrigger data-testid="select-currency-exchange-source">
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
            name="destination_currency_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Moneda Destino <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange} disabled={currenciesLoading}>
                    <SelectTrigger data-testid="select-currency-exchange-destination">
                      <SelectValue placeholder="Seleccionar moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDestinationCurrencies?.map((orgCurrency) => (
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
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="source_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Monto Origen <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      {sourceCurrency?.symbol || '$'}
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="pl-8"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      data-testid="input-currency-exchange-source-amount"
                    />
                  </div>
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
                <FormLabel>
                  Tipo de Cambio <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    placeholder="1.0000"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                    data-testid="input-currency-exchange-rate"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <FormLabel>Monto Destino</FormLabel>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                {destinationCurrency?.symbol || '$'}
              </span>
              <Input
                type="text"
                className="pl-8 bg-muted"
                value={destinationAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                readOnly
                data-testid="input-currency-exchange-destination-amount"
              />
            </div>
          </FormItem>
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Agregar descripción..."
                  rows={2}
                  {...field}
                  data-testid="textarea-currency-exchange-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!hideActions && (
          <div className="flex gap-2 pt-4 border-t">
            <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 border rounded-md">
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={createMutation.isPending} 
              className="flex-[3] px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              {createMutation.isPending ? 'Registrando...': 'Registrar Cambio'}
            </button>
          </div>
        )}
      </form>
    </Form>
  )
}
