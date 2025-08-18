import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormSubsectionButton } from '@/components/modal/form/FormSubsectionButton'
import { Package, Users } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'

interface DefaultFieldsProps {
  form: UseFormReturn<any>
  currencies: any[]
  wallets: any[]
  // Props opcionales para botones específicos
  showPersonButton?: boolean
  showTaskButton?: boolean
  showSubcontractButton?: boolean
  selectedPersonId?: string | null
  selectedTaskId?: string | null
  selectedSubcontractId?: string | null
  onOpenPersonSubform?: () => void
  onOpenTasksSubform?: () => void
  onOpenSubcontractSubform?: () => void
}

export function DefaultMovementFields({
  form,
  currencies,
  wallets,
  showPersonButton = false,
  showTaskButton = false,
  showSubcontractButton = false,
  selectedPersonId = null,
  selectedTaskId = null,
  selectedSubcontractId = null,
  onOpenPersonSubform,
  onOpenTasksSubform,
  onOpenSubcontractSubform
}: DefaultFieldsProps) {
  return (
    <>
      {/* Fila: Moneda | Billetera */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 col-span-2">
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

      {/* Fila: Monto | Cotización */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 col-span-2">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monto *</FormLabel>
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

      {/* Botón para Selección de Persona - Solo si showPersonButton es true */}
      {showPersonButton && onOpenPersonSubform && (
        <div className="col-span-2">
          <FormSubsectionButton
            icon={<Users />}
            title="Seleccionar Persona"
            description={selectedPersonId ? "Persona seleccionada" : "Selecciona la persona relacionada con este movimiento"}
            onClick={onOpenPersonSubform}
          />
        </div>
      )}

      {/* Botón para Selección de Tareas - Solo si showTaskButton es true */}
      {showTaskButton && onOpenTasksSubform && (
        <div className="col-span-2">
          <FormSubsectionButton
            icon={<Package />}
            title="Seleccionar Tarea de Construcción"
            description={selectedTaskId ? "Tarea seleccionada" : "Selecciona la tarea relacionada con este movimiento"}
            onClick={onOpenTasksSubform}
          />
        </div>
      )}

      {/* Botón para Selección de Subcontrato - Solo si showSubcontractButton es true */}
      {showSubcontractButton && onOpenSubcontractSubform && (
        <div className="col-span-2">
          <FormSubsectionButton
            icon={<Package />}
            title="Configurar Subcontrato"
            description={selectedSubcontractId ? "Subcontrato configurado" : "Configura el subcontrato relacionado con este pago"}
            onClick={onOpenSubcontractSubform}
          />
        </div>
      )}
    </>
  )
}