import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface InstallmentsIndexingSectionProps {
  form: any
}

export function InstallmentsIndexingSection({ form }: InstallmentsIndexingSectionProps) {
  return (
    <div className="space-y-4 pt-4 border-t border-border">
      <h3 className="text-sm font-semibold text-foreground">Indexación</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="index_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Índice de actualización *</FormLabel>
              <FormControl>
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger data-testid="select-index-type">
                    <SelectValue placeholder="Seleccionar índice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cac">CAC (Costo de la Construcción)</SelectItem>
                    <SelectItem value="uvi">UVI (Unidad de Vivienda)</SelectItem>
                    <SelectItem value="ipc">IPC (Índice de Precios al Consumidor)</SelectItem>
                    <SelectItem value="custom_index">Índice personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="index_frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frecuencia de indexación *</FormLabel>
              <FormControl>
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger data-testid="select-index-frequency">
                    <SelectValue placeholder="Seleccionar frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
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
