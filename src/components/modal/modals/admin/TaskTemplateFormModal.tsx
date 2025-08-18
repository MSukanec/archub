import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FileCode } from 'lucide-react'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalStepHeader } from '@/components/modal/form/FormModalStepHeader'
import { FormModalStepFooter } from '@/components/modal/form/FormModalStepFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ComboBox } from '@/components/ui-custom/ComboBoxWrite'
import { StepModalConfig, StepModalFooterConfig } from '@/components/modal/form/types'

import { useCreateTaskTemplate, useUpdateTaskTemplate, TaskTemplate } from '@/hooks/use-task-templates'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useQuery as useSupabaseQuery } from '@tanstack/react-query'

const taskTemplateSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().min(1, 'El código es requerido'),
  unit_id: z.string().optional(),
  task_category_id: z.string().optional(),
  task_kind_id: z.string().optional(),
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
  
  const [currentStep, setCurrentStep] = useState(1)
  const [createdTemplate, setCreatedTemplate] = useState<any>(null)
  
  const isEditing = Boolean(modalData?.template)
  const template = modalData?.template

  // Fetch organization members to get current member ID
  const { data: organizationMembers = [] } = useSupabaseQuery({
    queryKey: ['organization-members', currentUser?.organization?.id],
    queryFn: async () => {
      if (!supabase || !currentUser?.organization?.id) return []
      const { data, error } = await supabase
        .from('organization_members')
        .select('id, user_id')
        .eq('organization_id', currentUser.organization.id)
        .eq('is_active', true)
      if (error) throw error
      return data
    },
    enabled: !!currentUser?.organization?.id
  })

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

  // Fetch task categories for dropdown (only third level - 3 letter codes)
  const { data: taskCategories = [] } = useQuery({
    queryKey: ['task-categories-third-level'],
    queryFn: async () => {
      if (!supabase) return []
      const { data, error } = await supabase
        .from('task_categories')
        .select('id, name, code')
        .not('code', 'is', null)
        .order('name')
      if (error) throw error
      // Filter only categories with 3-letter codes (third level)
      return data.filter(category => category.code && category.code.length === 3)
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
      unit_id: template?.unit_id || '',
      task_category_id: template?.task_category_id || '',
      task_kind_id: template?.task_kind_id || '',
    },
  })

  const isLoading = createMutation.isPending || updateMutation.isPending

  const onSubmitStep1 = async (data: TaskTemplateFormData) => {
    try {
      if (isEditing && template) {
        const updated = await updateMutation.mutateAsync({
          id: template.id,
          updates: data
        })
        setCreatedTemplate(updated)
      } else {
        // Get current organization member ID
        const currentUserId = currentUser?.user?.id
        const currentMember = organizationMembers.find(m => m.user_id === currentUserId)
        if (!currentMember) throw new Error('No se encontró el miembro de la organización')

        const newTemplate = await createMutation.mutateAsync({
          ...data,
          is_active: true,
          created_by: currentMember.id, // Use organization member UUID
        })
        setCreatedTemplate(newTemplate)
      }
      setCurrentStep(2)
    } catch (error) {
      console.error('Error saving template:', error)
    }
  }

  // Auto-generate code from name with accent normalization (always update, even in edit mode)
  const handleNameChange = (value: string) => {
    form.setValue('name', value)
    const code = value
      .normalize('NFD') // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '') // Keep only alphanumeric and spaces
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .trim()
    form.setValue('code', code)
  }

  // Paso 1: Información básica
  const getStep1Content = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitStep1)} className="space-y-4">
        {/* Grid de 2 columnas: Nombre y Código inline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <FormLabel>Código</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Se genera automáticamente"
                    {...field}
                    disabled={true}
                    className="bg-muted"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Categoría */}
        <FormField
          control={form.control}
          name="task_category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <FormControl>
                <ComboBox
                  value={field.value}
                  onValueChange={field.onChange}
                  options={taskCategories.map(category => ({
                    value: category.id,
                    label: `${category.code} - ${category.name}`
                  }))}
                  placeholder="Seleccionar categoría"
                  searchPlaceholder="Buscar categoría..."
                  emptyMessage="No se encontraron categorías"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tipo de Acción */}
        <FormField
          control={form.control}
          name="task_kind_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Acción</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo de acción" />
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

        {/* Unidad de Medida */}
        <FormField
          control={form.control}
          name="unit_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unidad de Medida</FormLabel>
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
      </form>
    </Form>
  )

  // Paso 2: Configuración JSON (por implementar)
  const getStep2Content = () => (
    <div className="space-y-4">
      <div className="text-center py-8">
        <h3 className="text-lg font-medium">Configuración JSON</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Aquí podrás configurar parámetros y estructura JSON de la plantilla
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Plantilla creada: {createdTemplate?.name}
        </p>
      </div>
    </div>
  )

  const getCurrentStepContent = () => {
    switch (currentStep) {
      case 1:
        return getStep1Content()
      case 2:
        return getStep2Content()
      default:
        return getStep1Content()
    }
  }

  // Configuración del paso actual
  const stepConfig: StepModalConfig = {
    currentStep,
    totalSteps: 2,
    stepTitle: currentStep === 1 ? 'Información Básica' : 'Configuración JSON',
    stepDescription: currentStep === 1 ? 'Define los datos principales de la plantilla' : 'Configura parámetros y estructura'
  }

  // Configuración del footer según el paso
  const getFooterConfig = (): StepModalFooterConfig => {
    switch (currentStep) {
      case 1:
        return {
          cancelAction: { label: 'Cancelar', onClick: onClose },
          nextAction: { 
            label: isEditing ? 'Guardar y Continuar' : 'Crear y Continuar', 
            onClick: form.handleSubmit(onSubmitStep1),
            loading: isLoading
          }
        }
      case 2:
        return {
          cancelAction: { label: 'Cancelar', onClick: onClose },
          previousAction: { label: 'Anterior', onClick: () => setCurrentStep(1) },
          submitAction: { 
            label: 'Finalizar', 
            onClick: () => {
              // TODO: Implementar guardado final
              onClose()
            }
          }
        }
      default:
        return {
          cancelAction: { label: 'Cancelar', onClick: onClose }
        }
    }
  }

  const headerContent = (
    <FormModalStepHeader
      title={isEditing ? 'Editar Plantilla' : 'Nueva Plantilla'}
      icon={FileCode}
      stepConfig={stepConfig}
    />
  )

  const footerContent = (
    <FormModalStepFooter
      config={getFooterConfig()}
    />
  )

  return (
    <FormModalLayout
      headerContent={headerContent}
      footerContent={footerContent}
      stepContent={getCurrentStepContent()}
      onClose={onClose}
      columns={1}
    />
  )
}