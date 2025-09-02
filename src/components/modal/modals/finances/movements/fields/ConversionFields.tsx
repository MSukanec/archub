import { UseFormReturn } from 'react-hook-form'

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CurrencyAmountField } from '@/components/ui-custom/fields/CurrencyAmountField'

import UserSelectorField from '@/components/ui-custom/fields/UserSelectorField'

// Definir el tipo para el formulario de conversión basado en el schema del archivo principal
interface ConversionForm {
  movement_date: Date
  created_by: string
  description?: string
  type_id: string
  project_id?: string | null
  currency_id_from: string
  wallet_id_from: string
  amount_from: number
  currency_id_to: string
  wallet_id_to: string
  amount_to: number
  exchange_rate?: number
}

interface Props {
  form: UseFormReturn<ConversionForm>
  currencies: any[]
  wallets: any[]
  members: any[]
  concepts: any[]
  movement?: any
}

export function ConversionFields({ form, currencies, wallets, members, concepts, movement }: Props) {
  return (
    <div className="space-y-4">

        {/* Sección ORIGEN */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <label className="text-sm font-medium leading-none">Datos de Origen (Egreso)</label>
          </div>
          
          {/* Billetera y Moneda y Monto en la misma fila */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="wallet_id_from"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Billetera Origen *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {wallets?.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.wallets?.name || 'Sin nombre'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormField
                control={form.control}
                name="amount_from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda y Monto Origen *</FormLabel>
                    <FormControl>
                      <CurrencyAmountField
                        value={field.value || undefined}
                        currency={form.watch('currency_id_from') || ''}
                        currencies={currencies?.map(orgCurrency => ({
                          id: orgCurrency.currency?.id || '',
                          name: orgCurrency.currency?.name || 'Sin nombre',
                          symbol: orgCurrency.currency?.symbol || '$'
                        })) || []}
                        onValueChange={(value) => {
                          field.onChange(value || 0)
                          form.setValue('amount_from', value || 0, { shouldValidate: true })
                        }}
                        onCurrencyChange={(currencyId) => {
                          form.setValue('currency_id_from', currencyId, { shouldValidate: true })
                        }}
                        placeholder="0.00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Campo oculto para currency_id_from */}
              <FormField
                control={form.control}
                name="currency_id_from"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input type="hidden" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Sección DESTINO */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <label className="text-sm font-medium leading-none">Datos de Destino (Ingreso)</label>
          </div>
          
          {/* Billetera y Moneda y Monto en la misma fila */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="wallet_id_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Billetera Destino *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {wallets?.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.wallets?.name || 'Sin nombre'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormField
                control={form.control}
                name="amount_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda y Monto Destino *</FormLabel>
                    <FormControl>
                      <CurrencyAmountField
                        value={field.value || undefined}
                        currency={form.watch('currency_id_to') || ''}
                        currencies={currencies?.map(orgCurrency => ({
                          id: orgCurrency.currency?.id || '',
                          name: orgCurrency.currency?.name || 'Sin nombre',
                          symbol: orgCurrency.currency?.symbol || '$'
                        })) || []}
                        onValueChange={(value) => {
                          field.onChange(value || 0)
                          form.setValue('amount_to', value || 0, { shouldValidate: true })
                        }}
                        onCurrencyChange={(currencyId) => {
                          form.setValue('currency_id_to', currencyId, { shouldValidate: true })
                        }}
                        placeholder="0.00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Campo oculto para currency_id_to */}
              <FormField
                control={form.control}
                name="currency_id_to"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input type="hidden" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Cotización */}
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
                    min="0"
                    placeholder="Ej: 1.25"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>


    </div>
  )
}