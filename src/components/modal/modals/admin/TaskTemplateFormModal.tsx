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
import { Plus, FileText, GripVertical, Settings, Eye, Trash2 } from 'lucide-react'

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
function SortableParameterItem({ 
  id, 
  parameter, 
  templateParam, 
  onRequiredChange,
  onDelete
}: { 
  id: string; 
  parameter: any; 
  templateParam: any;
  onRequiredChange: (templateParamId: string, isRequired: boolean) => void;
  onDelete: (templateParamId: string) => void;
}) {
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
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">
            {parameter?.type}
          </div>
          <Select
            value={templateParam?.is_required ? "true" : "false"}
            onValueChange={(value) => onRequiredChange(templateParam.id, value === "true")}
          >
            <SelectTrigger className="w-24 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">Opcional</SelectItem>
              <SelectItem value="true">Requerido</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(templateParam.id)}
            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
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
  const [localTemplateParams, setLocalTemplateParams] = useState<any[]>([])
  const [hasLoadedParams, setHasLoadedParams] = useState(false)

  // Handle required change locally
  const handleRequiredChange = (templateParamId: string, isRequired: boolean) => {
    setLocalTemplateParams(params =>
      params.map(param =>
        param.id === templateParamId
          ? { ...param, is_required: isRequired }
          : param
      )
    )
  }

  // Handle parameter deletion locally
  const handleDeleteParameter = (templateParamId: string) => {
    setLocalTemplateParams(params =>
      params.filter(param => param.id !== templateParamId)
    )
  }

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
          parameter:task_parameters(id, slug, label, type, expression_template)
        `)
        .eq('template_id', templateId)
        .order('order_index')

      if (error) throw error
      return data || []
    },
    enabled: !!templateId && currentStep === 2
  })

  // Load existing parameters to local state when they're fetched
  React.useEffect(() => {
    if (currentTemplateParams.length > 0 && !hasLoadedParams) {
      setLocalTemplateParams(currentTemplateParams)
      setHasLoadedParams(true)
    }
  }, [currentTemplateParams, hasLoadedParams])

  const addParameter = () => {
    if (!selectedParameterId) return

    // Check if parameter is already assigned
    const isAlreadyAssigned = localTemplateParams.some(tp => tp.parameter_id === selectedParameterId)
    if (isAlreadyAssigned) {
      toast({
        title: 'Parámetro duplicado',
        description: 'Este parámetro ya está asignado al template.',
        variant: 'destructive',
      })
      return
    }

    // Find the parameter data
    const parameterData = allParameters.find(p => p.id === selectedParameterId)
    if (!parameterData) return

    // Add parameter to local state
    const newTemplateParam = {
      id: `temp-${Date.now()}`, // Temporary ID for local state
      template_id: templateId || 'temp',
      parameter_id: selectedParameterId,
      order_index: localTemplateParams.length,
      is_required: true,
      parameter: parameterData
    }

    setLocalTemplateParams([...localTemplateParams, newTemplateParam])
    setSelectedParameterId('')
  }

  // Generate template preview phrase using expression_template from local state
  const generateTemplatePreview = () => {
    if (localTemplateParams.length === 0) {
      return 'Sin parámetros configurados'
    }

    const sortedParams = localTemplateParams
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    
    // Use expression_template as-is from each parameter
    const parts = sortedParams.map(tp => {
      // Return the expression_template exactly as it is in the database
      return tp.parameter?.expression_template || '{value}'
    })
    
    // Filter out empty parts and join with spaces
    const filteredParts = parts.filter(part => part && part.trim())
    
    // Join with spaces and clean up
    let result = filteredParts.join(' ')
    
    // Clean up multiple spaces
    result = result.replace(/\s+/g, ' ').trim()
    
    // Add period at the end
    return result + '.'
  }

  // Save template parameters to database (called when finishing the modal)
  const saveTemplateParameters = async (finalTemplateId: string) => {
    try {
      // First, delete existing parameters for this template
      const { error: deleteError } = await supabase
        .from('task_template_parameters')
        .delete()
        .eq('template_id', finalTemplateId)

      if (deleteError) throw deleteError

      // Then insert all local parameters
      if (localTemplateParams.length > 0) {
        const parametersToInsert = localTemplateParams.map((param, index) => ({
          template_id: finalTemplateId,
          parameter_id: param.parameter_id,
          order_index: index,
          is_required: param.is_required
        }))

        const { error: insertError } = await supabase
          .from('task_template_parameters')
          .insert(parametersToInsert)

        if (insertError) throw insertError
      }

      // Update the template's name_expression with the preview
      const preview = generateTemplatePreview()
      const { error: updateError } = await supabase
        .from('task_templates')
        .update({ name_expression: preview })
        .eq('id', finalTemplateId)

      if (updateError) throw updateError

    } catch (error) {
      console.error('Error saving template parameters:', error)
      throw error
    }
  }

  // Handle drag end for parameter reordering (local state only)
  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = localTemplateParams.findIndex((param) => param.id === active.id)
      const newIndex = localTemplateParams.findIndex((param) => param.id === over.id)

      const newOrder = arrayMove(localTemplateParams, oldIndex, newIndex)
      
      // Update order_index for all parameters
      const updatedParams = newOrder.map((param, index) => ({
        ...param,
        order_index: index
      }))

      setLocalTemplateParams(updatedParams)
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
          
          {localTemplateParams.length === 0 ? (
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
                items={localTemplateParams.map(tp => tp.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {localTemplateParams.map((tp) => (
                    <SortableParameterItem
                      key={tp.id}
                      id={tp.id}
                      parameter={tp.parameter}
                      templateParam={tp}
                      onRequiredChange={handleRequiredChange}
                      onDelete={handleDeleteParameter}
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
              <div className="bg-muted/50 rounded-lg p-2">
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