import { UseFormReturn } from 'react-hook-form'

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CurrencyAmountField } from '@/components/ui-custom/general/CurrencyAmountField'

import UserSelector from '@/components/ui-custom/UserSelector'

// Tipo importado del componente principal
interface TransferForm {
  movement_date: Date
  created_by: string
  description?: string
  type_id: string
  currency_id: string
  wallet_id_from: string
  wallet_id_to: string
  amount: number
}

interface Props {
  form: UseFormReturn<TransferForm>
  currencies: any[]
  wallets: any[]
  members: any[]
  concepts: any[]
}

export function TransferFields({ form, currencies, wallets, members, concepts }: Props) {
  return (
    <div className="space-y-4">

        {/* Billeteras Origen y Destino */}
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
        </div>

        {/* Moneda y Monto */}
        <div className="col-span-2">
          <FormItem>
            <FormLabel>Moneda y Monto *</FormLabel>
            <FormControl>
              <CurrencyAmountField
                value={form.watch('amount') || undefined}
                currency={form.watch('currency_id') || ''}
                currencies={currencies?.map(orgCurrency => ({
                  id: orgCurrency.currency?.id || '',
                  name: orgCurrency.currency?.name || 'Sin nombre',
                  symbol: orgCurrency.currency?.symbol || '$'
                })) || []}
                onValueChange={(value) => {
                  form.setValue('amount', value || 0)
                }}
                onCurrencyChange={(currencyId) => {
                  form.setValue('currency_id', currencyId)
                }}
                placeholder="0.00"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </div>


    </div>
  )
}