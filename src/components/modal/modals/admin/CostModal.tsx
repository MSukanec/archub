import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { useModalPanelStore } from '@/components/modal/form/modalPanelStore'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField'

import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useMaterials } from '@/hooks/use-materials'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'
import { toast } from '@/hooks/use-toast'

import { DollarSign } from 'lucide-react'

const costSchema = z.object({
  type: z.enum(['material', 'consumable', 'labor'], { required_error: 'Selecciona un tipo de costo' }),
  item_id: z.string().min(1, 'Selecciona un material o mano de obra'),
  quantity: z.coerce.number().min(0.001, 'La cantidad debe ser mayor a 0'),
})

interface LaborType {
  labor_id: string
  labor_name: string
  labor_description: string | null
  unit_id: string | null
  unit_name: string | null  // Para mostrar la unidad
  is_system: boolean
  organization_id: string | null
  created_at: string
  updated_at: string | null
}

interface CostModalProps {
  modalData: {
    task?: any
    isEditing?: boolean
    costData?: any
  }
  onClose: () => void
}

export function CostModal({ modalData, onClose }: CostModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [costType, setCostType] = useState<'material' | 'consumable' | 'labor' | ''>('')
  const [selectedItemUnit, setSelectedItemUnit] = useState<string>('')
  
  const { task, isEditing = false, costData } = modalData
  
  // Hooks
  const queryClient = useQueryClient()
  const { setPanel } = useModalPanelStore()
  const { data: userData } = useCurrentUser()
  const { currentOrganizationId } = useProjectContext()
  const { data: materials = [] } = useMaterials()

  // Hook para obtener tipos de mano de obra con unit_name desde labor_view (global, sin filtro de organización)
  const { data: laborTypes = [] } = useQuery({
    queryKey: ['labor-types'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { data, error } = await supabase
        .from('labor_view')
        .select('*')
        .order('labor_name')
      
      if (error) {
        throw error
      }
      
      if (data?.length > 0) {
      }
      
      return data || []
    }
  })

  // Mutation para crear task_material
  const createTaskMaterialMutation = useMutation({
    mutationFn: async (data: { task_id: string; material_id: string; amount: number }) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { error } = await supabase
        .from('task_materials')
        .insert({
          task_id: data.task_id,
          material_id: data.material_id,
          amount: data.amount,
          organization_id: userData?.organization?.id
        })
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-materials'] })
      queryClient.invalidateQueries({ queryKey: ['task-costs'] })
      toast({
        title: "Material agregado",
        description: "El material ha sido agregado a la tarea correctamente.",
      })
    },
    onError: (error) => {
      toast({
        title: "Error al agregar material",
        description: "No se pudo agregar el material a la tarea.",
        variant: "destructive",
      })
    }
  })

  // Mutation para crear task_labor
  const createTaskLaborMutation = useMutation({
    mutationFn: async (data: { task_id: string; labor_type_id: string; quantity: number }) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { error } = await supabase
        .from('task_labor')
        .insert({
          task_id: data.task_id,
          labor_type_id: data.labor_type_id,
          quantity: data.quantity
        })
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-labor'] })
      queryClient.invalidateQueries({ queryKey: ['task-costs'] })
      toast({
        title: "Mano de obra agregada",
        description: "La mano de obra ha sido agregada a la tarea correctamente.",
      })
    },
    onError: (error) => {
      toast({
        title: "Error al agregar mano de obra",
        description: "No se pudo agregar la mano de obra a la tarea.",
        variant: "destructive",
      })
    }
  })

  // Mutation para actualizar task_material
  const updateTaskMaterialMutation = useMutation({
    mutationFn: async (data: { id: string; material_id: string; amount: number }) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { error } = await supabase
        .from('task_materials')
        .update({
          material_id: data.material_id,
          amount: data.amount
        })
        .eq('id', data.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-materials'] })
      queryClient.invalidateQueries({ queryKey: ['task-costs'] })
      toast({
        title: "Material actualizado",
        description: "El material ha sido actualizado correctamente.",
      })
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar material",
        description: "No se pudo actualizar el material.",
        variant: "destructive",
      })
    }
  })

  // Mutation para actualizar task_labor
  const updateTaskLaborMutation = useMutation({
    mutationFn: async (data: { id: string; labor_type_id: string; quantity: number }) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { error } = await supabase
        .from('task_labor')
        .update({
          labor_type_id: data.labor_type_id,
          quantity: data.quantity
        })
        .eq('id', data.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-labor'] })
      queryClient.invalidateQueries({ queryKey: ['task-costs'] })
      toast({
        title: "Mano de obra actualizada",
        description: "La mano de obra ha sido actualizada correctamente.",
      })
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar mano de obra",
        description: "No se pudo actualizar la mano de obra.",
        variant: "destructive",
      })
    }
  })

  // Force edit mode when modal opens
  useEffect(() => {
    setPanel('edit')
  }, [setPanel])

  // Form setup
  const form = useForm<z.infer<typeof costSchema>>({
    resolver: zodResolver(costSchema),
    defaultValues: {
      type: undefined,
      item_id: '',
      quantity: undefined,
    },
  })

  // Precargar datos en modo edición
  useEffect(() => {
    if (isEditing && costData) {
      // Lógica robusta: usar datos reales en lugar de strings de display
      let type: 'material' | 'consumable' | 'labor';
      if (costData.material_id) {
        // Buscar el material en materials array
        const material = materials.find(m => m.id === costData.material_id);
        type = material?.material_type === 'consumable' ? 'consumable' : 'material';
      } else {
        type = 'labor';
      }
      
      const itemId = costData.material_id || costData.labor_type_id;
      
      form.setValue('type', type);
      form.setValue('quantity', costData.quantity || 0);
      setCostType(type);
      
      // Establecer item_id después de que el tipo esté establecido
      setTimeout(() => {
        form.setValue('item_id', itemId || '');
      }, 100);
    }
  }, [isEditing, costData, form, materials]);

  // Función para obtener la unidad del item seleccionado
  const getSelectedItemUnit = useCallback((itemId: string, type: string): string => {
    if (type === 'material' || type === 'consumable') {
      const material = materials.find(m => m.id === itemId)
      return material?.unit_of_computation || ''
    } else if (type === 'labor') {
      const laborType = laborTypes.find((lt: LaborType) => lt.labor_id === itemId)
      return laborType?.unit_name || ''
    }
    return ''
  }, [materials, laborTypes])

  // Watch for type changes to reset item selection
  const watchedType = form.watch('type')
  useEffect(() => {
    if (watchedType !== costType) {
      setCostType(watchedType)
      // Solo limpiar item_id si no estamos en modo edición inicial
      if (!isEditing || costType !== '') {
        form.setValue('item_id', '')
        setSelectedItemUnit('')
      }
    }
  }, [watchedType, costType, form, isEditing])

  // Watch for item_id changes to update unit display
  const watchedItemId = form.watch('item_id')
  useEffect(() => {
    if (watchedItemId && costType) {
      const unit = getSelectedItemUnit(watchedItemId, costType)
      setSelectedItemUnit(unit)
    } else {
      setSelectedItemUnit('')
    }
  }, [watchedItemId, costType, getSelectedItemUnit])

  const onSubmit = async (data: z.infer<typeof costSchema>) => {
    if (!task?.id) {
      toast({
        title: "Error",
        description: "No se pudo identificar la tarea.",
        variant: "destructive",
      })
      return
    }

    // Validación adicional para modo edición
    if (isEditing && !costData?.id) {
      toast({
        title: "Error",
        description: "No se encontró el ID del costo a editar.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    
    try {
      if (isEditing && costData?.id) {
        // Modo edición - actualizar registro existente
        if (data.type === 'material' || data.type === 'consumable') {
          await updateTaskMaterialMutation.mutateAsync({
            id: costData.id,
            material_id: data.item_id,
            amount: data.quantity
          })
        } else if (data.type === 'labor') {
          await updateTaskLaborMutation.mutateAsync({
            id: costData.id,
            labor_type_id: data.item_id,
            quantity: data.quantity
          })
        }
      } else {
        // Modo crear - insertar nuevo registro
        if (data.type === 'material' || data.type === 'consumable') {
          await createTaskMaterialMutation.mutateAsync({
            task_id: task.id,
            material_id: data.item_id,
            amount: data.quantity
          })
        } else if (data.type === 'labor') {
          await createTaskLaborMutation.mutateAsync({
            task_id: task.id,
            labor_type_id: data.item_id,
            quantity: data.quantity
          })
        }
      }
      
      onClose()
      form.reset()
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  // Prepare options based on selected type
  const getItemOptions = () => {
    if (costType === 'material') {
      return materials.filter(m => m.material_type !== 'consumable').map(material => ({
        value: material.id,
        label: material.name
      }))
    } else if (costType === 'consumable') {
      return materials.filter(m => m.material_type === 'consumable').map(material => ({
        value: material.id,
        label: material.name
      }))
    } else if (costType === 'labor') {
      return laborTypes.map((laborType: LaborType) => ({
        value: laborType.labor_id,
        label: laborType.labor_name
      }))
    }
    return []
  }

  const getItemPlaceholder = () => {
    if (costType === 'material') return 'Buscar material...'
    if (costType === 'consumable') return 'Buscar insumo...'
    if (costType === 'labor') return 'Buscar tipo de mano de obra...'
    return 'Selecciona un tipo primero'
  }

  // View panel (not needed for this modal as it's always in edit mode)
  const viewPanel = null

  // Edit panel with form
  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Cost Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Costo *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de costo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="material">Material</SelectItem>
                  <SelectItem value="consumable">Insumo</SelectItem>
                  <SelectItem value="labor">Mano de Obra</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Item Selection (Material or Labor) */}
        <FormField
          control={form.control}
          name="item_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {costType === 'material' ? 'Material *' : costType === 'consumable' ? 'Insumo *' : costType === 'labor' ? 'Tipo de Mano de Obra *' : 'Item *'}
              </FormLabel>
              <FormControl>
                <ComboBox
                  value={field.value}
                  onValueChange={field.onChange}
                  options={getItemOptions()}
                  placeholder={getItemPlaceholder()}
                  searchPlaceholder={getItemPlaceholder()}
                  emptyMessage={`No se encontraron ${costType === 'material' ? 'materiales' : costType === 'consumable' ? 'insumos' : 'tipos de mano de obra'}.`}
                  disabled={!costType}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        {/* Quantity */}
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cantidad *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder={selectedItemUnit ? `Cantidad en ${selectedItemUnit}` : "Cantidad"}
                    className={selectedItemUnit ? "pr-16" : ""}
                    {...field}
                    value={field.value || ''}
                  />
                  {selectedItemUnit && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-sm text-muted-foreground font-medium">
                        {selectedItemUnit}
                      </span>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )

  const headerContent = (
    <FormModalHeader 
      title={isEditing ? "Editar Costo de Tarea" : "Agregar Costo a Tarea"}
      description={isEditing 
        ? 'Modifica el material, insumo o mano de obra asignado a esta tarea'
        : 'Asigna materiales, insumos o mano de obra necesarios para completar esta tarea'}
      icon={DollarSign}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isEditing ? "Guardar" : "Agregar"}
      onRightClick={form.handleSubmit(onSubmit)}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
    />
  )
}