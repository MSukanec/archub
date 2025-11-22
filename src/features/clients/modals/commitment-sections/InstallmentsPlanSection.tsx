import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface InstallmentsPlanSectionProps {
  form: any
}

export function InstallmentsPlanSection({ form }: InstallmentsPlanSectionProps) {
  return (
    <div className="space-y-4 pt-4 border-t border-border">
      <h3 className="text-sm font-semibold text-foreground">Plan de Cuotas</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="installments_count"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de cuotas *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  placeholder="Ej: 12"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  value={field.value || ''}
                  data-testid="input-installments-count"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="installments_frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frecuencia *</FormLabel>
              <FormControl>
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger data-testid="select-installments-frequency">
                    <SelectValue placeholder="Seleccionar frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="bimonthly">Bimestral</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="installments_start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de inicio *</FormLabel>
              <FormControl>
                <Popover>
                  <PopoverTrigger asChild>
                    <div
                      className={cn(
                        'flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer',
                        'hover:bg-accent/5 transition-colors',
                        !field.value && 'text-muted-foreground'
                      )}
                      data-testid="button-installments-start-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="flex-1">
                        {field.value ? (
                          format(new Date(field.value), 'PPP', { locale: es })
                        ) : (
                          'Seleccionar fecha'
                        )}
                      </span>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date: Date | undefined) => field.onChange(date?.toISOString())}
                      locale={es}
                      initialFocus
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
          name="installments_distribution"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Distribución *</FormLabel>
              <FormControl>
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger data-testid="select-installments-distribution">
                    <SelectValue placeholder="Seleccionar distribución" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equal">Cuotas iguales</SelectItem>
                    <SelectItem value="custom">Montos personalizados</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
