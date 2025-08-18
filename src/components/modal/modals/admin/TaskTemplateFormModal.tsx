import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FileCode } from 'lucide-react'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { useCreateTaskTemplate, useUpdateTaskTemplate, TaskTemplate } from '@/hooks/use-task-templates'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/use-current-user'

const taskTemplateSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().min(1, 'El código es requerido'),
  name_expression: z.string().min(1, 'La expresión de nombre es requerida'),
  unit_id: z.string().optional(),
  task_category_id: z.string().optional(),
  task_kind_id: z.string().optional(),
  version: z.number().min(1, 'La versión debe ser mayor a 0').default(1),
  is_active: z.boolean().default(true),
})

type TaskTemplateFormData = z.infer<typeof taskTemplateSchema>

interface TaskTemplateFormModalProps {
  modalData?: {
    template?: TaskTemplate
  }
  onClose: () => void
}

export function TaskTemplateFormModal({ modalData, onClose }: TaskTemplateFormModalProps) {
  const { data: currentUser } = useCurrentUser()
  const createMutation = useCreateTaskTemplate()
  const updateMutation = useUpdateTaskTemplate()
  
  const isEditing = Boolean(modalData?.template)
  const template = modalData?.template

  // Fetch units for dropdown
  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      if (!supabase) return []
      const { data, error } = await supabase
        .from('units')
        .select('id, name')
        .order('name')
      if (error) throw error
      return data
    }
  })

  // Fetch task categories for dropdown
  const { data: taskCategories = [] } = useQuery({
    queryKey: ['task-categories'],
    queryFn: async () => {
      if (!supabase) return []
      const { data, error } = await supabase
        .from('task_categories')
        .select('id, name')
        .order('name')
      if (error) throw error
      return data
    }
  })

  // Fetch task kinds for dropdown
  const { data: taskKinds = [] } = useQuery({
    queryKey: ['task-kinds'],
    queryFn: async () => {
      if (!supabase) return []
      const { data, error } = await supabase
        .from('task_kind')
        .select('id, name')
        .order('name')
      if (error) throw error
      return data
    }
  })

  const form = useForm<TaskTemplateFormData>({
    resolver: zodResolver(taskTemplateSchema),
    defaultValues: {
      name: template?.name || '',
      code: template?.code || '',
      name_expression: template?.name_expression || '',
      unit_id: template?.unit_id || '',
      task_category_id: template?.task_category_id || '',
      task_kind_id: template?.task_kind_id || '',
      version: template?.version || 1,
      is_active: template?.is_active ?? true,
    },
  })

  const isLoading = createMutation.isPending || updateMutation.isPending

  const onSubmit = async (data: TaskTemplateFormData) => {
    try {
      if (isEditing && template) {
        await updateMutation.mutateAsync({
          id: template.id,
          updates: data
        })
      } else {
        await createMutation.mutateAsync({
          ...data,
          created_by: currentUser?.user?.id || '',
        })
      }
      onClose()
    } catch (error) {
      console.error('Error saving template:', error)
    }
  }

  // Auto-generate code from name
  const handleNameChange = (value: string) => {
    form.setValue('name', value)
    if (!isEditing) {
      const code = value
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .trim()
      form.setValue('code', code)
    }
  }

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Plantilla</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Muro de mampostería"
                  {...field}
                  onChange={(e) => handleNameChange(e.target.value)}
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
              <FormLabel>Código / Slug Único</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: MURO_MAMPOSTERIA"
                  {...field}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Debe ser único en la base de datos
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name_expression"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expresión de Nombre</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Muro {tipo_muro} con {tipo_ladrillo}"
                  {...field}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Usar llaves {'{}'} para parámetros dinámicos
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="unit_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unidad de Medida</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar unidad (m2, ml, unidad...)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
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
          name="task_category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría (ej: Albañilería, Terminaciones...)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {taskCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
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
          name="task_kind_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Acción / Kind</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo (ej: Ejecución, Instalación, Pintura...)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {taskKinds.map((kind) => (
                    <SelectItem key={kind.id} value={kind.id}>
                      {kind.name}
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
          name="version"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Versión</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Ej: 1"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Estado</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Plantilla activa
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  )

  const headerContent = (
    <FormModalHeader
      title={isEditing ? 'Editar Plantilla' : 'Nueva Plantilla'}
      icon={FileCode}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isEditing ? 'Guardar Cambios' : 'Crear Plantilla'}
      onRightClick={form.handleSubmit(onSubmit)}
      isLoading={isLoading}
    />
  )

  return (
    <FormModalLayout
      viewPanel={null}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
      isEditing={true}
      columns={1}
    />
  )
}