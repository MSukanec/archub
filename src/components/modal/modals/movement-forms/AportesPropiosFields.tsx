import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { DollarSign } from 'lucide-react'
import UserSelector from '@/components/ui-custom/UserSelector'

interface AportesPropriosForm {
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
  form: UseFormReturn<AportesPropriosForm>
  currencies: any[]
  wallets: any[]
  members: any[]
  concepts: any[]
}

export function AportesPropiosFields({ form, currencies, wallets, members, concepts }: Props) {
  // Filtrar categorías para este tipo
  const categories = concepts?.filter((concept: any) => concept.parent_id && concept.view_mode?.trim() === "aportes_propios")

  return (
    <>
      {/* Fila 1: Creador | Fecha */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="created_by"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Creador *</FormLabel>
              <FormControl>
                <UserSelector
                  users={members || []}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Seleccionar creador"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="movement_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha *</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  value={field.value ? field.value.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const localDate = new Date(e.target.value + 'T00:00:00');
                    field.onChange(localDate);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Fila 2: Tipo (full width) */}
      <FormField
        control={form.control}
        name="type_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {concepts?.filter((concept: any) => !concept.parent_id).map((concept) => (
                  <SelectItem key={concept.id} value={concept.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{concept.name}</span>
                      {concept.is_system && (
                        <span className="text-xs border rounded px-1 ml-2 text-muted-foreground border-muted-foreground/30">
                          Sistema
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Fila 3: Categoría (full width) */}
      <FormField
        control={form.control}
        name="category_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Categoría *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {categories?.map((category: any) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Separador y título de sección de aportes propios */}
      <div className="col-span-2">
        <Separator className="mb-4" />
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-8 h-8 bg-accent/10 rounded-lg">
            <DollarSign className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">Información del Aporte Propio</h3>
            <p className="text-xs text-muted-foreground">Datos específicos del aporte de socio</p>
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