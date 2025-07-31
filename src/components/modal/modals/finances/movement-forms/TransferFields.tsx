import { UseFormReturn } from 'react-hook-form'

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

        {/* Moneda y Cantidad en la misma línea */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="currency_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {currencies?.map((orgCurrency) => (
                      <SelectItem key={orgCurrency.currency?.id} value={orgCurrency.currency?.id || ''}>
                        {orgCurrency.currency?.name || 'Sin nombre'} ({orgCurrency.currency?.symbol || '$'})
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
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cantidad *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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


    </div>
  )
}