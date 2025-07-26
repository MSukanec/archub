import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import { Package2, Settings, FileText, Trash2, GripVertical, Plus } from 'lucide-react'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalStepHeader } from '@/components/modal/form/FormModalStepHeader'
import { FormModalStepFooter } from '@/components/modal/form/FormModalStepFooter'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { StepModalConfig, StepModalFooterConfig } from '@/components/modal/form/types'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ComboBox } from '@/components/ui-custom/ComboBoxWrite'
import { Badge } from '@/components/ui/badge'

import { useCreateTaskGroup, useUpdateTaskGroup } from '@/hooks/use-task-groups'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import {
  CSS,
} from '@dnd-kit/utilities'

const taskGroupSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  category_id: z.string().min(1, 'La categoría es requerida'),
})

type TaskGroupFormData = z.infer<typeof taskGroupSchema>

interface TaskGroupFormModalProps {
  modalData?: {
    categoryId?: string
    categoryName?: string
    taskGroup?: {
      id: string
      name: string
      category_id: string
    }
    isEditing?: boolean
  }
  onClose: () => void
}

interface SortableParameterItemProps {
  param: { id: string; parameter_id: string; template_id: string; position: number; option_group_id: string | null };
  parameter: { id: string; name: string; label: string; type: string } | undefined;
  onRemove: (id: string) => void;
}

function SortableParameterItem({ param, parameter, onRemove }: SortableParameterItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: param.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 bg-muted/30 rounded border"
    >
      <div className="flex items-center space-x-3 flex-1">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <span className="font-medium text-sm">{parameter?.label || parameter?.name || 'Parámetro desconocido'}</span>
          <Badge variant="outline" className="ml-2 text-xs">
            {parameter?.type || 'unknown'}
          </Badge>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(param.id)}
        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function TaskGroupFormModal({ modalData, onClose }: TaskGroupFormModalProps) {
  const { closeModal } = useGlobalModalStore()
  const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = useState(1)
  const [createdTaskGroupId, setCreatedTaskGroupId] = useState<string | null>(null)
  const [templateParameters, setTemplateParameters] = useState<any[]>([])
  const [newParameterId, setNewParameterId] = useState<string>('')
  const [newOptionGroupId, setNewOptionGroupId] = useState<string>('')

  const createMutation = useCreateTaskGroup()
  const updateMutation = useUpdateTaskGroup()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const form = useForm<TaskGroupFormData>({
    resolver: zodResolver(taskGroupSchema),
    defaultValues: {
      name: '',
      category_id: modalData?.categoryId || '',
    },
  })

  // Load data when editing
  useEffect(() => {
    if (modalData?.taskGroup) {
      form.reset({
        name: modalData.taskGroup.name,
        category_id: modalData.taskGroup.category_id,
      })
      setCreatedTaskGroupId(modalData.taskGroup.id)
    } else if (modalData?.categoryId) {
      form.reset({
        name: '',
        category_id: modalData.categoryId,
      })
    }
  }, [modalData, form])

  // Query for task template if we have a task group ID
  const taskGroupIdForTemplate = createdTaskGroupId || modalData?.taskGroup?.id
  
  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ['task-template', taskGroupIdForTemplate],
    queryFn: async () => {
      if (!taskGroupIdForTemplate) return null
      
      console.log('🔍 Buscando plantilla para task_group_id:', taskGroupIdForTemplate)
      
      const { data, error } = await supabase
        .from('task_templates')
        .select(`
          *,
          task_template_parameters (
            id,
            position,
            parameter_id,
            task_parameter (
              id,
              name,
              label,
              type
            ),
            option_group_id
          )
        `)
        .eq('task_group_id', taskGroupIdForTemplate)
        .single()

      console.log('🔍 Resultado búsqueda plantilla:', { data, error })

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data
    },
    enabled: !!taskGroupIdForTemplate && currentStep === 2,
  })

  // Query for available parameters
  const { data: availableParameters = [] } = useQuery({
    queryKey: ['task-parameters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_parameters')
        .select('*')
        .order('label')

      if (error) throw error
      return data
    },
    enabled: currentStep === 2,
  })

  // Query for available option groups
  const { data: availableOptionGroups = [] } = useQuery({
    queryKey: ['task-parameter-option-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_parameter_option_groups')
        .select('*')
        .order('name')

      if (error) throw error
      return data
    },
    enabled: currentStep === 2,
  })

  // Load template parameters when template is loaded
  useEffect(() => {
    if (template?.task_template_parameters) {
      const sortedParams = [...template.task_template_parameters].sort((a, b) => a.position - b.position)
      setTemplateParameters(sortedParams)
    }
  }, [template])

  const isEditing = !!modalData?.taskGroup
  const isLoading = createMutation.isPending || updateMutation.isPending

  // Edit panel with form
  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Category context */}
        {modalData?.categoryName && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              Categoría: <span className="font-medium text-foreground">{modalData.categoryName}</span>
            </p>
          </div>
        )}

        {/* Task Group Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Grupo <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ej: Muros de Mampostería, Estructuras de Hormigón..." 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )

  const headerContent = (
    <FormModalHeader 
      title={isEditing ? "Editar Grupo de Tareas" : "Nuevo Grupo de Tareas"}
      icon={Package2}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={isEditing ? "Actualizar Grupo" : "Crear Grupo"}
      onRightClick={form.handleSubmit(onSubmit)}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      viewPanel={null}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      isEditing={true} // Always show edit panel since this is a form-only modal
      onClose={handleClose}
    />
  )
}