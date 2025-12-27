import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'

import { useToast } from '@/hooks/use-toast'
import { useCreateTaskParameter, useUpdateTaskParameter } from '@/features/tasks'

export const taskParameterSchema = z.object({
  slug: z.string().min(1, 'El slug es requerido'),
  label: z.string().min(1, 'La etiqueta es requerida'),
  type: z.enum(['text', 'number', 'select', 'boolean'], { 
    required_error: 'El tipo es requerido' 
  }),
  expression_template: z.string().optional(),
  is_required: z.boolean().default(false),
})

export type TaskParameterFormData = z.infer<typeof taskParameterSchema>

export interface TaskParameterFormInput {
  id: string
  slug: string
  label: string
  type: string
  expression_template?: string | null
  is_required?: boolean | null
}

interface FormPanelProps {
  form: ReturnType<typeof useForm<TaskParameterFormData>>
  isEditing: boolean
}

export function FormPanel({ form, isEditing }: FormPanelProps) {
  return (
    <Form {...form}>
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre (visible) *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ej: Ladrillos y Bloques" 
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      if (!isEditing) {
                        const slug = e.target.value
                          .toLowerCase()
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .replace(/ñ/g, 'n')
                          .replace(/[^a-z0-9\s_]/g, '')
                          .replace(/\s+/g, '_')
                          .replace(/_+/g, '_')
                          .replace(/^_|_$/g, '');
                        form.setValue('slug', slug);
                      }
                    }}
                    data-testid="input-task-parameter-label"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="ej: ladrillos_y_bloques" 
                    {...field}
                    data-testid="input-task-parameter-slug"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="text-sm text-muted-foreground">
          El Slug se genera automáticamente en formato snake_case basado en el nombre. Puedes modificarlo si es necesario.
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-task-parameter-type">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="z-[9999]">
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="number">Número</SelectItem>
                    <SelectItem value="select">Selección</SelectItem>
                    <SelectItem value="boolean">Booleano</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expression_template"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plantilla de frase</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input 
                      placeholder="de {value}" 
                      {...field}
                      data-testid="input-task-parameter-expression"
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const currentValue = field.value || '';
                      const cursorPosition = (document.activeElement as HTMLInputElement)?.selectionStart || currentValue.length;
                      const newValue = currentValue.slice(0, cursorPosition) + '{value}' + currentValue.slice(cursorPosition);
                      field.onChange(newValue);
                    }}
                    data-testid="button-insert-value"
                  >
                    Insertar {'{value}'}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="text-sm text-muted-foreground">
          Usa <code className="bg-muted px-1 py-0.5 rounded text-xs">{'{value}'}</code> donde quieres que aparezca el valor seleccionado. Ejemplo: "de <code className="bg-muted px-1 py-0.5 rounded text-xs">{'{value}'}</code>"
        </div>

        <FormField
          control={form.control}
          name="is_required"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="checkbox-task-parameter-required"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Parámetro obligatorio
                </FormLabel>
                <FormDescription>
                  Si está marcado, el usuario deberá seleccionar una opción para este parámetro antes de poder crear la tarea.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}

interface ViewPanelProps {
  parameter: TaskParameterFormInput
}

export function ViewPanel({ parameter }: ViewPanelProps) {
  const typeLabels: Record<string, string> = {
    text: 'Texto',
    number: 'Número',
    select: 'Selección',
    boolean: 'Booleano'
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground mb-1">Nombre</p>
        <p className="font-medium" data-testid="text-task-parameter-label">
          {parameter?.label}
        </p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1">Slug</p>
        <p className="text-sm font-mono" data-testid="text-task-parameter-slug">
          {parameter?.slug}
        </p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1">Tipo</p>
        <p className="text-sm" data-testid="text-task-parameter-type">
          {typeLabels[parameter?.type] || parameter?.type}
        </p>
      </div>
      {parameter?.expression_template && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Plantilla de frase</p>
          <p className="text-sm" data-testid="text-task-parameter-expression">
            {parameter.expression_template}
          </p>
        </div>
      )}
      <div>
        <p className="text-sm text-muted-foreground mb-1">Obligatorio</p>
        <p className="text-sm" data-testid="text-task-parameter-required">
          {parameter?.is_required ? 'Sí' : 'No'}
        </p>
      </div>
    </div>
  )
}

interface UseTaskParameterFormOptions {
  parameter?: TaskParameterFormInput
  mode: 'create' | 'edit' | 'view'
  onSuccess: (parameterId?: string) => void
}

export function useTaskParameterForm({ parameter, mode, onSuccess }: UseTaskParameterFormOptions) {
  const { toast } = useToast()
  
  const createMutation = useCreateTaskParameter()
  const updateMutation = useUpdateTaskParameter()
  
  const form = useForm<TaskParameterFormData>({
    resolver: zodResolver(taskParameterSchema),
    defaultValues: {
      slug: '',
      label: '',
      type: 'text',
      expression_template: '{value}',
      is_required: false,
    },
  })

  useEffect(() => {
    if (parameter) {
      form.reset({
        slug: parameter.slug || '',
        label: parameter.label || '',
        type: parameter.type as any || 'text',
        expression_template: parameter.expression_template || '{value}',
        is_required: parameter.is_required || false,
      })
    }
  }, [parameter, form])

  const onSubmit = async (data: TaskParameterFormData) => {
    try {
      let result;
      if (mode === 'edit' && parameter) {
        result = await updateMutation.mutateAsync({
          id: parameter.id,
          ...data
        })
      } else {
        result = await createMutation.mutateAsync(data)
      }
      
      toast({
        title: parameter ? 'Parámetro actualizado' : 'Parámetro creado',
        description: parameter ? 'El parámetro se ha actualizado correctamente' : 'El parámetro se ha creado correctamente'
      })

      onSuccess(result?.id)
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
    parameter,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
  }
}
