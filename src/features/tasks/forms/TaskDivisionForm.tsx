import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { useCreateTaskDivision, useUpdateTaskDivision, TaskDivisionAdmin, useAllTaskDivisions } from '@/features/tasks'

export const taskDivisionSchema = z.object({
  parent_id: z.string().optional(),
  code: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
})

export type TaskDivisionFormData = z.infer<typeof taskDivisionSchema>

interface FormPanelProps {
  form: ReturnType<typeof useForm<TaskDivisionFormData>>
  allDivisions: TaskDivisionAdmin[]
  editingDivisionId?: string
}

export function FormPanel({ form, allDivisions, editingDivisionId }: FormPanelProps) {
  return (
    <Form {...form}>
      <form className="space-y-4">
        <FormField
          control={form.control}
          name="parent_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Padre (opcional)</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value === "no-parent" ? "" : value);
                }} 
                value={field.value || "no-parent"}
              >
                <FormControl>
                  <SelectTrigger data-testid="select-task-division-parent">
                    <SelectValue placeholder="Seleccionar división padre" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="no-parent">Sin padre</SelectItem>
                  {allDivisions
                    .filter(division => division.id !== editingDivisionId)
                    .map((division) => (
                      <SelectItem key={division.id} value={division.id}>
                        {division.name}
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
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código (opcional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ingresa el código de la división" 
                  {...field} 
                  data-testid="input-task-division-code"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ingresa el nombre de la división" 
                  {...field} 
                  data-testid="input-task-division-name"
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
              <FormLabel>Descripción (opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Ingresa una descripción de la división" 
                  rows={3}
                  {...field} 
                  data-testid="textarea-task-division-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}

interface ViewPanelProps {
  division: TaskDivisionAdmin
  allDivisions: TaskDivisionAdmin[]
}

export function ViewPanel({ division, allDivisions }: ViewPanelProps) {
  const parentDivision = division.parent_id 
    ? allDivisions.find(d => d.id === division.parent_id) 
    : null

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground mb-1">Nombre</p>
        <p className="font-medium" data-testid="text-task-division-name">
          {division.name}
        </p>
      </div>
      {division.code && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Código</p>
          <p className="text-sm" data-testid="text-task-division-code">
            {division.code}
          </p>
        </div>
      )}
      {division.description && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Descripción</p>
          <p className="text-sm whitespace-pre-wrap" data-testid="text-task-division-description">
            {division.description}
          </p>
        </div>
      )}
      {parentDivision && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">División Padre</p>
          <p className="text-sm" data-testid="text-task-division-parent">
            {parentDivision.name}
          </p>
        </div>
      )}
    </div>
  )
}

interface UseTaskDivisionFormOptions {
  editingDivision?: TaskDivisionAdmin
  onSuccess: () => void
}

export function useTaskDivisionForm({ editingDivision, onSuccess }: UseTaskDivisionFormOptions) {
  const createMutation = useCreateTaskDivision()
  const updateMutation = useUpdateTaskDivision()
  const { data: allDivisions = [] } = useAllTaskDivisions()

  const form = useForm<TaskDivisionFormData>({
    resolver: zodResolver(taskDivisionSchema),
    defaultValues: {
      parent_id: editingDivision?.parent_id || '',
      code: editingDivision?.code || '',
      name: editingDivision?.name || '',
      description: editingDivision?.description || '',
    },
  })

  useEffect(() => {
    if (editingDivision) {
      form.reset({
        parent_id: editingDivision.parent_id || '',
        code: editingDivision.code || '',
        name: editingDivision.name,
        description: editingDivision.description || '',
      })
    } else {
      form.reset({
        parent_id: '',
        code: '',
        name: '',
        description: '',
      })
    }
  }, [editingDivision, form])

  const onSubmit = async (data: TaskDivisionFormData) => {
    try {
      const parentId = data.parent_id && data.parent_id !== '' ? data.parent_id : null
      
      const submitData = {
        parent_id: parentId,
        code: data.code || undefined,
        name: data.name,
        description: data.description || undefined,
        is_system: true,
        organization_id: undefined,
      }

      if (editingDivision) {
        await updateMutation.mutateAsync({ 
          id: editingDivision.id, 
          ...submitData 
        })
      } else {
        await createMutation.mutateAsync(submitData)
      }
      
      onSuccess()
    } catch (error) {
      console.error('Error saving division:', error)
    }
  }

  return {
    form,
    onSubmit,
    allDivisions,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
  }
}
