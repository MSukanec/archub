import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

import { 
  useCreateTaskParameterOption, 
  useUpdateTaskParameterOption, 
  useTopLevelCategories, 
  useUnits,
  type TaskParameterOption 
} from '@/features/tasks'

export const taskParameterOptionSchema = z.object({
  value: z.string().min(1, 'El valor es requerido'),
  label: z.string().min(1, 'La etiqueta es requerida'),
  description: z.string().optional(),
  category_id: z.string().optional(),
  unit_id: z.string().optional(),
})

export type TaskParameterOptionFormData = z.infer<typeof taskParameterOptionSchema>

interface FormPanelProps {
  form: ReturnType<typeof useForm<TaskParameterOptionFormData>>
  categories: any[]
  units: any[]
  isTipoTareaParameter: boolean
}

export function FormPanel({ form, categories, units, isTipoTareaParameter }: FormPanelProps) {
  return (
    <Form {...form}>
      <form className="space-y-4">
        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre (visible) *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ej: Ladrillo cerámico hueco" 
                  {...field} 
                  data-testid="input-task-parameter-option-label"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descripción detallada de la opción (opcional)" 
                  {...field} 
                  rows={3}
                  data-testid="textarea-task-parameter-option-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="ej: ladrillo-ceramico-hueco" 
                  {...field} 
                  data-testid="input-task-parameter-option-value"
                />
              </FormControl>
              <div className="text-sm text-muted-foreground">
                Se genera automáticamente basado en el nombre. Puedes modificarlo si es necesario.
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {isTipoTareaParameter && (
          <>
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría (Rubro)</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-task-parameter-option-category">
                        <SelectValue placeholder="Seleccionar categoría..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Sin categoría</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name} ({category.code})
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
              name="unit_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidad</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-task-parameter-option-unit">
                        <SelectValue placeholder="Seleccionar unidad..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Sin unidad</SelectItem>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name} {unit.abbreviation && `(${unit.abbreviation})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </form>
    </Form>
  )
}

interface ViewPanelProps {
  option: TaskParameterOption
  categories: any[]
  units: any[]
  isTipoTareaParameter: boolean
}

export function ViewPanel({ option, categories, units, isTipoTareaParameter }: ViewPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium">Nombre (visible)</h4>
        <p className="text-muted-foreground mt-1" data-testid="text-task-parameter-option-label">
          {option?.label || 'Sin nombre'}
        </p>
      </div>
      
      <div>
        <h4 className="font-medium">Descripción</h4>
        <p className="text-muted-foreground mt-1" data-testid="text-task-parameter-option-description">
          {option?.description || 'Sin descripción'}
        </p>
      </div>
      
      <div>
        <h4 className="font-medium">Slug</h4>
        <p className="text-muted-foreground mt-1 font-mono text-sm" data-testid="text-task-parameter-option-slug">
          {option?.name || 'Sin slug'}
        </p>
      </div>

      {isTipoTareaParameter && (
        <>
          <div>
            <h4 className="font-medium">Categoría (Rubro)</h4>
            <p className="text-muted-foreground mt-1" data-testid="text-task-parameter-option-category">
              {(option as any)?.category_id 
                ? categories.find(c => c.id === (option as any)?.category_id)?.name || 'Categoría no encontrada'
                : 'Sin categoría'
              }
            </p>
          </div>
          
          <div>
            <h4 className="font-medium">Unidad</h4>
            <p className="text-muted-foreground mt-1" data-testid="text-task-parameter-option-unit">
              {(option as any)?.unit_id 
                ? units.find(u => u.id === (option as any)?.unit_id)?.name || 'Unidad no encontrada'
                : 'Sin unidad'
              }
            </p>
          </div>
        </>
      )}
    </div>
  )
}

interface UseTaskParameterOptionFormOptions {
  parameterId?: string
  option?: TaskParameterOption
  onSuccess: () => void
}

export function useTaskParameterOptionForm({ parameterId, option, onSuccess }: UseTaskParameterOptionFormOptions) {
  const { toast } = useToast()
  
  const createMutation = useCreateTaskParameterOption()
  const updateMutation = useUpdateTaskParameterOption()
  
  const { data: categories = [] } = useTopLevelCategories()
  const { data: units = [] } = useUnits()
  
  const isTipoTareaParameter = parameterId === '42d5048d-e839-496d-ad6c-9d185002eee8'
  
  const normalizeLabel = (label: string): string => {
    return label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9\s_]/g, '')
      .trim()
      .replace(/\s+/g, '_')
  }

  const form = useForm<TaskParameterOptionFormData>({
    resolver: zodResolver(taskParameterOptionSchema),
    defaultValues: {
      value: '',
      label: '',
      description: '',
      category_id: '',
      unit_id: '',
    },
  })

  useEffect(() => {
    if (option) {
      form.reset({
        value: option.name || '',
        label: option.label || '',
        description: option.description || '',
        category_id: (option as any).category_id || '',
        unit_id: (option as any).unit_id || '',
      })
    } else {
      form.reset({
        value: '',
        label: '',
        description: '',
        category_id: '',
        unit_id: '',
      })
    }
  }, [option, form])

  const watchedLabel = form.watch('label')
  useEffect(() => {
    if (!option && watchedLabel) {
      const normalizedValue = normalizeLabel(watchedLabel)
      form.setValue('value', normalizedValue)
    }
  }, [watchedLabel, option, form])

  const onSubmit = async (data: TaskParameterOptionFormData) => {
    if (!parameterId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se ha especificado el parámetro'
      })
      return
    }

    try {
      if (option) {
        const updateData: any = {
          id: option.id,
          parameter_id: parameterId,
          name: data.value,
          label: data.label,
          description: data.description
        }
        
        if (isTipoTareaParameter) {
          if (data.category_id) updateData.category_id = data.category_id
          if (data.unit_id) updateData.unit_id = data.unit_id
        }
        
        await updateMutation.mutateAsync(updateData)
        
        toast({
          title: 'Opción actualizada',
          description: 'La opción se ha actualizado correctamente'
        })
      } else {
        const createData: any = {
          parameter_id: parameterId,
          name: data.value,
          label: data.label,
          description: data.description
        }
        
        if (isTipoTareaParameter) {
          if (data.category_id) createData.category_id = data.category_id
          if (data.unit_id) createData.unit_id = data.unit_id
        }
        
        await createMutation.mutateAsync(createData)
        
        toast({
          title: 'Opción creada',
          description: 'La opción se ha creado correctamente'
        })
      }
      
      onSuccess()
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al procesar la solicitud'
      })
    }
  }

  return {
    form,
    onSubmit,
    categories,
    units,
    isTipoTareaParameter,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    isEditing: !!option,
  }
}
