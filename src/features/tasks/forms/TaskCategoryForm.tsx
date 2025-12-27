import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ComboBox } from '@/components/shared/fields/ComboBoxWriteField'

import { useCreateTaskCategory, useUpdateTaskCategory, useAllTaskCategories, TaskCategoryAdmin } from '@/features/tasks'

export const taskCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().optional(),
  parent_id: z.string().nullable().optional(),
})

export type TaskCategoryFormData = z.infer<typeof taskCategorySchema>

interface FormPanelProps {
  form: ReturnType<typeof useForm<TaskCategoryFormData>>
  categories: TaskCategoryAdmin[]
}

export function FormPanel({ form, categories }: FormPanelProps) {
  return (
    <Form {...form}>
      <form className="space-y-4">
        <FormField
          control={form.control}
          name="parent_id"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Categoría Padre</FormLabel>
              <FormControl>
                <ComboBox
                  value={field.value || ""}
                  onValueChange={(value) => field.onChange(value || null)}
                  options={(categories || []).map(category => ({ value: category.id, label: category.name }))}
                  placeholder="Seleccionar categoría padre (opcional)"
                  searchPlaceholder="Buscar categoría..."
                  emptyMessage="No se encontraron categorías."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prefijo de Código</FormLabel>
              <FormControl>
                <Input
                  placeholder="Código de la categoría (ej: ABC)"
                  {...field}
                  data-testid="input-task-category-code"
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
              <FormLabel>Nombre *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nombre de la categoría"
                  {...field}
                  data-testid="input-task-category-name"
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
  category: TaskCategoryAdmin
}

export function ViewPanel({ category }: ViewPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground mb-1">Nombre</p>
        <p className="font-medium" data-testid="text-task-category-name">
          {category?.name}
        </p>
      </div>
      {category?.code && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Código</p>
          <p className="text-sm" data-testid="text-task-category-code">
            {category.code}
          </p>
        </div>
      )}
      {category?.parent_id && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Categoría Padre</p>
          <p className="text-sm" data-testid="text-task-category-parent">
            {category.parent_id}
          </p>
        </div>
      )}
    </div>
  )
}

interface UseTaskCategoryFormOptions {
  editingCategory?: TaskCategoryAdmin
  mode: 'create' | 'edit' | 'view'
  onSuccess: () => void
}

export function useTaskCategoryForm({ editingCategory, mode, onSuccess }: UseTaskCategoryFormOptions) {
  const createMutation = useCreateTaskCategory()
  const updateMutation = useUpdateTaskCategory()
  const { data: allCategories = [] } = useAllTaskCategories()

  const form = useForm<TaskCategoryFormData>({
    resolver: zodResolver(taskCategorySchema),
    defaultValues: {
      name: editingCategory?.name || '',
      code: editingCategory?.code || '',
      parent_id: editingCategory?.parent_id || null,
    },
  })

  useEffect(() => {
    if (editingCategory) {
      form.reset({
        name: editingCategory.name,
        code: editingCategory.code || '',
        parent_id: editingCategory.parent_id,
      })
    } else {
      form.reset({
        name: '',
        code: '',
        parent_id: null,
      })
    }
  }, [editingCategory, form])

  const onSubmit = async (data: TaskCategoryFormData) => {
    try {
      const submitData = {
        name: data.name,
        code: data.code || undefined,
        parent_id: data.parent_id,
      }

      if (editingCategory) {
        await updateMutation.mutateAsync({ 
          id: editingCategory.id, 
          ...submitData 
        })
      } else {
        await createMutation.mutateAsync(submitData)
      }
      
      onSuccess()
    } catch (error) {
      console.error('Error saving category:', error)
    }
  }

  return {
    form,
    onSubmit,
    categories: allCategories,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    editingCategory,
  }
}
