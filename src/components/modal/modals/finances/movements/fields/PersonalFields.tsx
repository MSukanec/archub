import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Users, Package } from "lucide-react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { FormSubsectionButton } from "@/components/modal/form/FormSubsectionButton"
import { ComboBox } from "@/components/ui-custom/ComboBoxWrite"
import { useProjectPersonnel } from "@/hooks/use-project-personnel"


// Tipo específico para el formulario de personal
type PersonalFormType = {
  movement_date: Date
  created_by: string
  description?: string
  type_id: string
  category_id: string
  subcategory_id?: string
  personal?: string
  currency_id: string
  wallet_id: string
  amount: number
  exchange_rate?: number
}

interface Props {
  form: UseFormReturn<PersonalFormType>
  currencies: any[]
  wallets: any[]
  members: any[]
  concepts: any[]
  onOpenPersonnelSubform: () => void
  projectId?: string
  selectedPersonnelId?: string
  setSelectedPersonnelId?: (id: string) => void
}

export function PersonalFields({ form, currencies, wallets, members, concepts, onOpenPersonnelSubform, projectId, selectedPersonnelId, setSelectedPersonnelId }: Props) {
  const { data: userData } = useCurrentUser()
  
  // Estados para la lógica jerárquica
  const [selectedCategoryId, setSelectedCategoryId] = React.useState(form.watch('category_id') || '')
  const [initialized, setInitialized] = React.useState(false)
  
  // Hook para obtener personal del proyecto
  const { data: personnel = [] } = useProjectPersonnel(projectId || null)
  
  // Sincronizar el campo del formulario con selectedPersonnelId
  React.useEffect(() => {
    if (selectedPersonnelId && selectedPersonnelId !== form.getValues().personal) {
      form.setValue('personal', selectedPersonnelId)
    }
  }, [selectedPersonnelId, form])
  
  // Ya no necesitamos cargar las tareas aquí, se manejan en el subform
  
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



      {/* Campo para Selección de Personal */}
      <div className="col-span-2">
        <FormField
          control={form.control}
          name="personal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Personal</FormLabel>
              <FormControl>
                <ComboBox
                  options={personnel.map(person => ({
                    value: person.id,
                    label: person.contact?.full_name || 'Sin nombre'
                  }))}
                  value={field.value || selectedPersonnelId || ''}
                  onValueChange={(value) => {
                    field.onChange(value)
                    if (setSelectedPersonnelId) {
                      setSelectedPersonnelId(value)
                    }
                  }}
                  placeholder="Seleccionar personal..."
                  emptyMessage="No se encontró personal"
                  searchPlaceholder="Buscar personal..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Botón para Configuración Adicional */}
      <div className="col-span-2">
        <FormSubsectionButton
          icon={<Users />}
          title="Configuración de Personal"
          description="Configura el personal relacionado con este pago"
          onClick={onOpenPersonnelSubform}
        />
      </div>
    </>
  )
}