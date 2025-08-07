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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { useCreateTaskTemplate, useUpdateTaskTemplate, TaskTemplate } from '@/hooks/use-task-templates'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/use-current-user'

const taskTemplateSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  slug: z.string().min(1, 'El slug es requerido'),
  description: z.string().optional(),
  unit_id: z.string().optional(),
  name_expression: z.string().min(1, 'La expresión de nombre es requerida'),
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

  const form = useForm<TaskTemplateFormData>({
    resolver: zodResolver(taskTemplateSchema),
    defaultValues: {
      name: template?.name || '',
      slug: template?.slug || '',
      description: template?.description || '',
      unit_id: template?.unit_id || '',
      name_expression: template?.name_expression || '',
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

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    form.setValue('name', value)
    if (!isEditing) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim()
      form.setValue('slug', slug)
    }
  }

  const editPanel = (
    <Form {...form}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Plantilla</FormLabel>
              <FormControl>
                <Input
                  placeholder="ej: Muro de Mampostería"
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
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug (identificador único)</FormLabel>
              <FormControl>
                <Input
                  placeholder="ej: muro-mamposteria"
                  {...field}
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
                  placeholder="Describe el propósito de esta plantilla..."
                  {...field}
                />
              </FormControl>
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
                  placeholder="ej: Muro {tipo_muro} con {tipo_ladrillo}"
                  {...field}
                />
              </FormControl>
                Usa llaves {'{}'} para indicar parámetros dinámicos que se reemplazarán.
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
              <FormLabel>Unidad</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar unidad" />
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
          name="is_active"
          render={({ field }) => (
                  Plantilla {field.value ? 'activa' : 'inactiva'}
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