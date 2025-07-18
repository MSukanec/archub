import { UseFormReturn } from 'react-hook-form'
import { ArrowLeftRight } from 'lucide-react'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
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

        {/* Tipo - mantiene interactivo para cambiar */}
        <FormField
          control={form.control}
          name="type_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {concepts?.filter((concept: any) => !concept.parent_id).map((concept: any) => (
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

        {/* Separador y título de sección de transferencia */}
        <div className="col-span-2">
          <Separator className="mb-4" />
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-8 h-8 bg-accent/10 rounded-lg">
              <ArrowLeftRight className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">Información de la Transferencia</h3>
              <p className="text-xs text-muted-foreground">Datos específicos del movimiento entre billeteras</p>
            </div>
          </div>
        </div>

        {/* Moneda */}
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

        {/* Cantidad */}
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

        {/* Descripción al final (full width) */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descripción de la transferencia..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
    </div>
  )
}