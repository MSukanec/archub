import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { DollarSign } from 'lucide-react'
import UserSelector from '@/components/ui-custom/UserSelector'

interface RetirosPropriosForm {
  created_by: string
  movement_date: Date
  type_id: string
  category_id: string
  description?: string
  member_id: string
  currency_id: string
  wallet_id: string
  amount: number
  exchange_rate?: number
}

interface Props {
  form: UseFormReturn<RetirosPropriosForm>
  currencies: any[]
  wallets: any[]
  members: any[]
  concepts: any[]
}

export function RetirosPropiosFields({ form, currencies, wallets, members, concepts }: Props) {
  // Filtrar categorías para este tipo
  const categories = concepts?.filter((concept: any) => concept.parent_id && concept.view_mode?.trim() === "retiros_propios")

  return (
    <>
      {/* Separador y título de sección de retiros propios */}
      <div className="col-span-2">
        <Separator className="mb-4" />
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-8 h-8 bg-accent/10 rounded-lg">
            <DollarSign className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">Información del Retiro Propio</h3>
            <p className="text-xs text-muted-foreground">Datos específicos del retiro de socio</p>
          </div>
        </div>
      </div>

      {/* Socio */}
      <FormField
        control={form.control}
        name="member_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Socio *</FormLabel>
            <FormControl>
              <UserSelector
                users={members || []}
                value={field.value}
                onChange={field.onChange}
                placeholder="Seleccionar socio"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Fila: Moneda | Billetera */}
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
                  {currencies?.map((currency) => (
                    <SelectItem key={currency.currency_id} value={currency.currency_id}>
                      {currency.currency?.name || 'Sin nombre'}
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
          name="wallet_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Billetera *</FormLabel>
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

      {/* Fila: Cantidad | Cotización */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  placeholder="Ej: 1.0000"
                  value={field.value || ''}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Descripción al final (full width) */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descripción (opcional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Descripción del movimiento..."
                rows={3}
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}