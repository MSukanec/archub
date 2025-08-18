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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, FileText } from 'lucide-react'

import { useCreateTaskTemplate, useUpdateTaskTemplate, TaskTemplate } from '@/hooks/use-task-templates'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useQuery as useSupabaseQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

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
  const { toast } = useToast()
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

  // Estados para el paso 2
  const [selectedParameterId, setSelectedParameterId] = useState<string>('')

  // Queries para el paso 2
  const templateId = createdTemplate?.id || (isEditing ? template?.id : null)

  // Fetch all available parameters
  const { data: allParameters = [] } = useQuery({
    queryKey: ['task-parameters-available'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_parameters')
        .select('*')
        .order('label')

      if (error) throw error
      return data || []
    },
    enabled: currentStep === 2
  })

  // Fetch current template parameters
  const { data: currentTemplateParams = [] } = useQuery({
    queryKey: ['task-template-parameters', templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_template_parameters')
        .select(`
          *,
          parameter:task_parameters(id, slug, label, type)
        `)
        .eq('template_id', templateId)
        .order('order_index')

      if (error) throw error
      return data || []
    },
    enabled: !!templateId && currentStep === 2
  })

  const addParameter = () => {
    console.log('Adding parameter:', selectedParameterId)
    toast({
      title: 'Parámetro agregado',
      description: 'Esta funcionalidad se implementará próximamente.',
    })
  }

  // Paso 2: Configuración de Parámetros
  const getStep2Content = () => {
    if (!templateId) {
      return (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Error: No se encontró el ID del template</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Add Parameter Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agregar parámetro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Seleccionar parámetro</label>
              <Select value={selectedParameterId} onValueChange={setSelectedParameterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Buscar parámetro..." />
                </SelectTrigger>
                <SelectContent>
                  {allParameters.map(param => (
                    <SelectItem key={param.id} value={param.id}>
                      <div className="flex items-center gap-2">
                        <span>{param.label}</span>
                        <code className="text-xs text-muted-foreground">
                          {param.slug}
                        </code>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={addParameter} 
              disabled={!selectedParameterId}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar parámetro
            </Button>
          </CardContent>
        </Card>

        {/* Assigned Parameters Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parámetros asignados</CardTitle>
          </CardHeader>
          <CardContent>
            {currentTemplateParams.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay parámetros asignados</p>
                <p className="text-xs">Agrega parámetros desde el panel superior</p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentTemplateParams.map((tp) => (
                  <div key={tp.id} className="border rounded-lg p-3 bg-background">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-sm">{tp.parameter?.label}</span>
                        <code className="text-xs text-muted-foreground ml-2">
                          {tp.parameter?.slug}
                        </code>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {tp.parameter?.type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

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
    stepTitle: currentStep === 1 ? 'Información Básica' : 'Configurar Parámetros',
    stepDescription: currentStep === 1 ? 'Define los datos principales de la plantilla' : 'Asigna y configura parámetros del template'
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