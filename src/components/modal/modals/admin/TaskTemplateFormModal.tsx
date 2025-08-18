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
import { Plus, FileText, GripVertical, Settings, Eye } from 'lucide-react'

import { useCreateTaskTemplate, useUpdateTaskTemplate, TaskTemplate } from '@/hooks/use-task-templates'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useQuery as useSupabaseQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Componente sortable para los parámetros asignados
function SortableParameterItem({ id, parameter }: { id: string; parameter: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="border rounded-lg p-3 bg-background"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          <div>
            <span className="font-medium text-sm">{parameter?.label}</span>
            <code className="text-xs text-muted-foreground ml-2">
              {parameter?.slug}
            </code>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {parameter?.type}
        </div>
      </div>
    </div>
  )
}

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
  const queryClient = useQueryClient()
  const createMutation = useCreateTaskTemplate()
  const updateMutation = useUpdateTaskTemplate()
  
  const isEditing = Boolean(modalData?.template)
  const template = modalData?.template
  
  const [currentStep, setCurrentStep] = useState(isEditing ? 2 : 1)
  const [createdTemplate, setCreatedTemplate] = useState<any>(null)
  const [selectedParameterId, setSelectedParameterId] = useState('')

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

  const addParameter = async () => {
    if (!selectedParameterId || !templateId) return

    try {
      // Check if parameter is already assigned
      const isAlreadyAssigned = currentTemplateParams.some(tp => tp.parameter_id === selectedParameterId)
      if (isAlreadyAssigned) {
        toast({
          title: 'Parámetro duplicado',
          description: 'Este parámetro ya está asignado al template.',
          variant: 'destructive',
        })
        return
      }

      // Add parameter to template
      const { error } = await supabase
        .from('task_template_parameters')
        .insert({
          template_id: templateId,
          parameter_id: selectedParameterId,
          order_index: currentTemplateParams.length,
          is_required: false
        })

      if (error) throw error

      // Reset selection and show success
      setSelectedParameterId('')
      toast({
        title: 'Parámetro agregado',
        description: 'El parámetro se ha agregado correctamente al template.',
      })

      // Refresh the template parameters list
      queryClient.invalidateQueries({ queryKey: ['task-template-parameters', templateId] })
    } catch (error) {
      console.error('Error adding parameter:', error)
      toast({
        title: 'Error',
        description: 'No se pudo agregar el parámetro al template.',
        variant: 'destructive',
      })
    }
  }

  // Generate template preview phrase
  const generateTemplatePreview = () => {
    if (currentTemplateParams.length === 0) {
      return 'Sin parámetros configurados'
    }

    const sortedParams = currentTemplateParams
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    
    // Generate a simple preview showing parameter placeholders
    const parts = sortedParams.map(tp => `{{${tp.parameter?.slug || 'parámetro'}}}`)
    
    // Join with spaces to create a basic template preview
    return parts.join(' ')
  }

  // Handle drag end for parameter reordering
  const handleDragEnd = async (event: any) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = currentTemplateParams.findIndex((param) => param.id === active.id)
      const newIndex = currentTemplateParams.findIndex((param) => param.id === over.id)

      const newOrder = arrayMove(currentTemplateParams, oldIndex, newIndex)

      try {
        // Update order_index for all affected parameters
        const updates = newOrder.map((param, index) => ({
          id: param.id,
          order_index: index
        }))

        for (const update of updates) {
          const { error } = await supabase
            .from('task_template_parameters')
            .update({ order_index: update.order_index })
            .eq('id', update.id)

          if (error) throw error
        }

        // Refresh the data
        queryClient.invalidateQueries({ queryKey: ['task-template-parameters', templateId] })
        
        toast({
          title: 'Orden actualizado',
          description: 'El orden de los parámetros se ha guardado correctamente.',
        })
      } catch (error) {
        console.error('Error updating parameter order:', error)
        toast({
          title: 'Error',
          description: 'No se pudo actualizar el orden de los parámetros.',
          variant: 'destructive',
        })
      }
    }
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
        {/* Agregar parámetro */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Plus className="h-4 w-4 text-[var(--accent)]" />
            <div className="flex-1 pr-2">
              <h2 className="text-sm font-medium text-[var(--card-fg)]">
                Agregar parámetro
              </h2>
              <p className="text-xs text-[var(--text-muted)] leading-tight">
                Selecciona un parámetro para agregar al template
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <ComboBox
              value={selectedParameterId}
              onValueChange={setSelectedParameterId}
              options={allParameters.map(param => ({
                label: `${param.label} (${param.slug})`,
                value: param.id
              }))}
              placeholder="Buscar parámetro..."
              searchPlaceholder="Buscar parámetro..."
              emptyMessage="No se encontraron parámetros"
            />
            
            <Button 
              onClick={addParameter} 
              disabled={!selectedParameterId}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar parámetro
            </Button>
          </div>
        </div>

        {/* Parámetros asignados */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Settings className="h-4 w-4 text-[var(--accent)]" />
            <div className="flex-1 pr-2">
              <h2 className="text-sm font-medium text-[var(--card-fg)]">
                Parámetros asignados
              </h2>
              <p className="text-xs text-[var(--text-muted)] leading-tight">
                Arrastra para reordenar los parámetros del template
              </p>
            </div>
          </div>
          
          {currentTemplateParams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay parámetros asignados</p>
              <p className="text-xs">Agrega parámetros desde el panel superior</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={currentTemplateParams.map(tp => tp.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {currentTemplateParams.map((tp) => (
                    <SortableParameterItem
                      key={tp.id}
                      id={tp.id}
                      parameter={tp.parameter}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Vista Previa */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Eye className="h-4 w-4 text-[var(--accent)]" />
            <div className="flex-1 pr-2">
              <h2 className="text-sm font-medium text-[var(--card-fg)]">
                Vista Previa
              </h2>
              <p className="text-xs text-[var(--text-muted)] leading-tight">
                Cómo se verá el template en la creación de tareas
              </p>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-muted/20">
            {currentTemplateParams.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Sin parámetros asignados</p>
                <p className="text-xs">La vista previa aparecerá cuando agregues parámetros</p>
              </div>
            ) : (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Frase del template:
                </p>
                <p className="text-base font-medium text-foreground italic">
                  {generateTemplatePreview()}
                </p>
              </div>
            )}
          </div>
        </div>
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