import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users } from 'lucide-react'
import UserSelector from '@/components/ui-custom/UserSelector'
import { Button } from '@/components/ui/button'

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
    <div className="space-y-4">

      {/* Socio */}
      <FormField
        control={form.control}
        name="member_id"
        render={({ field }) => {
          // Mostrar estado vacío si no hay socios
          if (!members || members.length === 0) {
            return (
              <FormItem>
                <FormLabel>Socio</FormLabel>
                <FormControl>
                  <div className="flex items-center justify-center p-4 border-accent border-dashed border-2 rounded-lg bg-muted/50">
                    <div className="text-center">
                      <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Aún no tienes Socios, ¿quieres agregar uno?
                      </p>
                      <Button variant="default" size="sm" disabled>
                        Agregar
                      </Button>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )
          }

          return (
            <FormItem>
              <FormLabel>Socio</FormLabel>
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
          )
        }}
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


    </div>
  )
}