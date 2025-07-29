import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { DollarSign, Package } from "lucide-react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useConstructionTasksView } from "@/hooks/use-construction-tasks"
import { TaskMultiSelector } from "@/components/ui-custom/TaskMultiSelector"


// Tipo específico para el formulario de materiales
type MaterialesFormType = {
  movement_date: Date
  created_by: string
  description?: string
  type_id: string
  category_id: string
  subcategory_id?: string
  construction_task_id: string
  currency_id: string
  wallet_id: string
  amount: number
  exchange_rate?: number
}

interface Props {
  form: UseFormReturn<MaterialesFormType>
  currencies: any[]
  wallets: any[]
  members: any[]
  concepts: any[]
  selectedTaskIds: string[]
  setSelectedTaskIds: (taskIds: string[]) => void
}

export function MaterialesFields({ form, currencies, wallets, members, concepts, selectedTaskIds, setSelectedTaskIds }: Props) {
  const { data: userData } = useCurrentUser()
  
  // Estados para la lógica jerárquica
  const [selectedCategoryId, setSelectedCategoryId] = React.useState(form.watch('category_id') || '')
  const [initialized, setInitialized] = React.useState(false)
  
  // Obtener tareas de construcción para el selector
  const projectId = userData?.preferences?.last_project_id
  const { data: constructionTasks, isLoading: tasksLoading } = useConstructionTasksView(projectId || '')
  
  // Obtener categorías basadas en el tipo seleccionado
  const selectedTypeId = form.watch('type_id')
  const categories = React.useMemo(() => {
    if (!selectedTypeId || !concepts) return []
    return concepts.filter((concept: any) => concept.parent_id === selectedTypeId)
  }, [selectedTypeId, concepts])

  // Efecto para inicializar valores por defecto SOLO UNA VEZ cuando están disponibles los datos
  React.useEffect(() => {
    if (!currencies || !wallets || !members || initialized) return
    
    const currentValues = form.getValues()
    let hasChanges = false
    
    // Inicializar billetera por defecto si no hay una seleccionada
    if (!currentValues.wallet_id && wallets.length > 0) {
      const defaultWallet = wallets.find(w => w.is_default) || wallets[0]
      if (defaultWallet) {
        form.setValue('wallet_id', defaultWallet.id)
        hasChanges = true
      }
    }
    
    // Inicializar moneda por defecto si no hay una seleccionada
    if (!currentValues.currency_id && currencies.length > 0) {
      const defaultCurrency = currencies.find(c => c.is_default) || currencies[0]
      if (defaultCurrency) {
        form.setValue('currency_id', defaultCurrency.currency_id)
        hasChanges = true
      }
    }
    
    // Inicializar creador si no hay uno seleccionado
    if (!currentValues.created_by && members.length > 0) {
      const currentMember = members.find(m => m.user_id === userData?.user?.id)
      if (currentMember) {
        form.setValue('created_by', currentMember.id)
        hasChanges = true
      }
    }
    
    // Marcar como inicializado para evitar futuros resets
    if (hasChanges) {
      setInitialized(true)
    }
  }, [currencies, wallets, members, userData?.user?.id, form, initialized])

  // Efecto para actualizar selectedCategoryId cuando cambia category_id en el form
  React.useEffect(() => {
    const subscription = form.watch((value: any, { name }: any) => {
      if (name === 'category_id') {
        setSelectedCategoryId(value.category_id || '')
      }
    })
    return () => subscription.unsubscribe()
  }, [form])
  
  // Efecto para mantener el valor de categoría cuando las categorías se cargan
  React.useEffect(() => {
    const currentCategoryId = form.getValues('category_id')
    if (currentCategoryId && categories.length > 0) {
      // Verificar si la categoría actual está en la lista de categorías disponibles
      const categoryExists = categories.find(cat => cat.id === currentCategoryId)
      if (categoryExists) {
        setSelectedCategoryId(currentCategoryId)
      }
    }
  }, [categories, form])



  return (
    <>
      {/* Separador y título de sección de materiales */}
      <div className="col-span-2">
        <Separator className="mb-4" />
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-8 h-8 bg-accent/10 rounded-lg">
            <DollarSign className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">Información Financiera</h3>
            <p className="text-xs text-muted-foreground">Detalles específicos del movimiento financiero</p>
          </div>
        </div>
      </div>

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

      {/* Descripción */}
      <div className="col-span-2">
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
                  value={field.value || ''} // Asegurar que inicie vacío
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Campo Tareas - múltiple para Materiales */}
      <div className="col-span-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tareas de Construcción</label>
          <TaskMultiSelector
            tasks={constructionTasks || []}
            selectedTaskIds={selectedTaskIds}
            onSelectionChange={setSelectedTaskIds}
            placeholder="Seleccionar tareas de construcción..."
            isLoading={tasksLoading}
          />
        </div>
      </div>
    </>
  )
}