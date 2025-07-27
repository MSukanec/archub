import { useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PackagePlus, FileText, Settings, GripVertical, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalStepHeader } from '@/components/modal/form/FormModalStepHeader'
import { FormModalStepFooter } from '@/components/modal/form/FormModalStepFooter'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ComboBox } from '@/components/ui-custom/ComboBoxWrite'
import { ComboBoxMultiSelect } from '@/components/ui-custom/ComboBoxMultiSelect'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

import { useCreateTaskGroup, useUpdateTaskGroup } from '@/hooks/use-task-groups'
import { useCreateTaskTemplate } from '@/hooks/use-task-templates-admin'
import { useSubcategoriesOnly } from '@/hooks/use-task-categories-admin'
import { useUnits } from '@/hooks/use-units'
import { useSaveTaskGroupParameterOptions, useLoadTaskGroupParameterOptions } from '@/hooks/use-task-group-parameter-options'

// Hook para obtener opciones de parámetro
const useParameterOptions = (parameterId: string) => {
  return useQuery({
    queryKey: ['parameter-options', parameterId],
    queryFn: async () => {
      console.log('🔍 Obteniendo opciones para parámetro:', parameterId)
      const { data, error } = await supabase!
        .from('task_parameter_options')
        .select('id, name, label')
        .eq('parameter_id', parameterId)
        .order('label', { ascending: true })

      if (error) {
        console.error('❌ Error obteniendo opciones:', error)
        throw error
      }
      
      console.log('📝 Opciones obtenidas:', data)
      return data || []
    },
    enabled: !!parameterId,
  })
}
import { TaskTemplate, TaskTemplateParameter, TaskParameter } from '@shared/schema'

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

const taskGroupCreatorSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  subcategory_id: z.string().min(1, 'La subcategoría es requerida'),
  unit_id: z.string().min(1, 'La unidad es requerida'),
})

type TaskGroupCreatorFormData = z.infer<typeof taskGroupCreatorSchema>

interface TaskGroupCreatorModalProps {
  modalData?: any
  onClose: () => void
}

interface SortableParameterItemProps {
  param: { id: string; parameter_id: string; template_id: string; position: number; option_group_id: string | null }
  parameter: { id: string; slug: string; label: string; type: string } | undefined
  onRemove: (id: string) => void
  selectedOptions: string[]
  onOptionsChange: (parameterId: string, options: string[]) => void
}

function SortableParameterItem({ param, parameter, onRemove, selectedOptions, onOptionsChange }: SortableParameterItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: param.id })

  const { data: parameterOptions = [] } = useParameterOptions(param.parameter_id)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const options = parameterOptions.map(option => ({
    value: option.id,
    label: option.label
  }))

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center space-x-3 p-3 bg-muted/30 rounded border"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      
      <div className="flex flex-col min-w-0">
        <p className="font-medium text-sm">{parameter?.label || 'Parámetro sin nombre'}</p>
        <Badge variant="outline" className="text-xs mt-1 w-fit">
          {parameter?.type || 'N/A'}
        </Badge>
      </div>
      
      {parameter?.type === 'select' && options && options.length > 0 && (
        <div className="flex-1 max-w-xs">
          <ComboBoxMultiSelect
            options={options}
            values={selectedOptions}
            onValuesChange={(values) => onOptionsChange(param.parameter_id, values)}
            placeholder="Seleccionar opciones..."
            className="w-full"
          />
        </div>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(param.id)}
        className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}

export function TaskGroupCreatorModal({ modalData, onClose }: TaskGroupCreatorModalProps) {
  const [currentStep, setCurrentStep] = useState(() => {
    // If editing existing group, start on step 2 (template configuration)
    return modalData?.taskGroup ? 2 : 1
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdTaskGroup, setCreatedTaskGroup] = useState<any>(null)
  
  const queryClient = useQueryClient()
  const createGroupMutation = useCreateTaskGroup()
  const createTemplateMutation = useCreateTaskTemplate()
  const updateGroupMutation = useUpdateTaskGroup()
  const saveParameterOptionsMutation = useSaveTaskGroupParameterOptions()
  
  // Hook para actualizar templates 
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ templateId, name_template }: { templateId: string, name_template: string }) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      console.log('🔄 Actualizando template en BD:', { templateId, name_template });
      
      const { data, error } = await supabase
        .from('task_templates')
        .update({ name_template })
        .eq('id', templateId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error actualizando template:', error);
        throw error;
      }

      console.log('✅ Template actualizado exitosamente:', data);
      return data;
    }
  })
  
  // Get task group for step 2
  const taskGroup = modalData?.taskGroup || createdTaskGroup
  
  // Load saved parameter options for the group
  const { data: savedOptionsMap = {} } = useLoadTaskGroupParameterOptions(taskGroup?.id)
  
  // Data hooks for step 1
  const { data: allCategories = [], isLoading: categoriesLoading } = useSubcategoriesOnly()
  const { data: units = [], isLoading: unitsLoading } = useUnits()
  
  // State for step 2 (template configuration)
  const [templateParameters, setTemplateParameters] = useState<any[]>([])
  const [selectedParameterId, setSelectedParameterId] = useState('')
  const [existingTemplate, setExistingTemplate] = useState<any>(null)
  const [availableParameters, setAvailableParameters] = useState<any[]>([])
  
  // State for selected options per parameter
  const [selectedOptionsMap, setSelectedOptionsMap] = useState<Record<string, string[]>>({})
  
  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Estado para almacenar las opciones cargadas
  const [parameterOptionsCache, setParameterOptionsCache] = useState<Record<string, any[]>>({});

  // Efecto para cargar opciones cuando se necesiten
  useEffect(() => {
    const loadOptionsForParameters = async () => {
      if (!templateParameters || templateParameters.length === 0) return;
      
      const optionsToLoad: string[] = [];
      templateParameters.forEach(tp => {
        if (!parameterOptionsCache[tp.parameter_id]) {
          optionsToLoad.push(tp.parameter_id);
        }
      });
      
      if (optionsToLoad.length === 0) return;
      
      console.log('🔄 Cargando opciones para parámetros:', optionsToLoad);
      
      for (const parameterId of optionsToLoad) {
        try {
          const { data, error } = await supabase!
            .from('task_parameter_options')
            .select('id, name, label')
            .eq('parameter_id', parameterId);
          
          if (!error && data) {
            setParameterOptionsCache(prev => ({
              ...prev,
              [parameterId]: data
            }));
            console.log(`✅ Opciones cargadas para ${parameterId}:`, data.length, data);
          }
        } catch (error) {
          console.error(`❌ Error cargando opciones para ${parameterId}:`, error);
        }
      }
    };
    
    loadOptionsForParameters();
  }, [templateParameters, supabase]);

  // Función para obtener el label de una opción
  const getParameterOptionLabel = (parameterId: string, optionId: string) => {
    const options = parameterOptionsCache[parameterId] || [];
    const option = options.find(opt => opt.id === optionId);
    return option?.label || `[${optionId.slice(0, 8)}]`;
  };

  // Generate preview function with real sentence construction
  const generatePreview = useMemo(() => {
    console.log('🎯 ExistingTemplate completo:', existingTemplate);
    console.log('🔧 TemplateParameters:', templateParameters);
    console.log('🎛️ SelectedOptionsMap:', selectedOptionsMap);
    
    // Si no tenemos parámetros, usar el template existente o fallback
    if (!templateParameters || templateParameters.length === 0) {
      const template = existingTemplate?.name_template || 'Nueva tarea.';
      console.log('🎯 Sin parámetros, usando template base:', template);
      return template;
    }
    
    // Si tenemos parámetros, construir template dinámicamente
    // Verificar si el template existente ya contiene placeholders
    let template = existingTemplate?.name_template || '';
    const hasPlaceholders = templateParameters.some(tp => {
      const parameter = availableParameters?.find(p => p.id === tp.parameter_id);
      return parameter && template.includes(`{{${parameter.slug}}}`);
    });
    
    if (!hasPlaceholders) {
      // El template no tiene placeholders, construir uno automáticamente
      const placeholders = templateParameters
        .sort((a, b) => a.position - b.position)
        .map(tp => {
          const parameter = availableParameters?.find(p => p.id === tp.parameter_id);
          return parameter ? `{{${parameter.slug}}}` : '[parámetro]';
        })
        .join(' ');
      
      template = `${placeholders}.`;
      console.log('🔧 Template construido automáticamente:', template);
    }
    
    console.log('🎯 Template a procesar:', template);

    // Replace each {{param}} with generated text using real option labels
    templateParameters.forEach((tp) => {
      const parameter = availableParameters?.find(p => p.id === tp.parameter_id);
      if (!parameter) return;
      
      const placeholder = `{{${parameter.slug}}}`;
      console.log(`🔍 Procesando placeholder: ${placeholder}`);
      
      // Get selected options for this parameter
      const selectedOptions = selectedOptionsMap?.[tp.parameter_id] || [];
      console.log(`📋 Opciones seleccionadas para ${parameter.slug}:`, selectedOptions);
      
      if (selectedOptions.length > 0) {
        // Get the first selected option ID
        const selectedOptionId = selectedOptions[0];
        
        // Obtener el label real de la opción seleccionada
        const parameterOptions = parameterOptionsCache[tp.parameter_id] || [];
        const selectedOption = parameterOptions.find(opt => opt.id === selectedOptionId);
        
        if (selectedOption) {
          // Aplicar expression_template o usar {value} como fallback
          const expressionTemplate = parameter.expression_template || '{value}';
          const generatedText = expressionTemplate.replace('{value}', selectedOption.label);
          template = template.replace(placeholder, generatedText);
          console.log(`✅ Reemplazado ${placeholder} con "${generatedText}" (label: "${selectedOption.label}", template: "${expressionTemplate}")`);
        } else {
          // Si las opciones aún no están cargadas, esperar a que se carguen
          template = template.replace(placeholder, '[...]');
          console.log(`⚠️ Reemplazado ${placeholder} con [...] (opción no encontrada en cache)`);
        }
      } else {
        // No option selected, show placeholder
        template = template.replace(placeholder, '[...]');
        console.log(`⏸️ Reemplazado ${placeholder} con [...]`);
      }
    });
    
    // Add final period if missing
    if (!template.endsWith('.')) {
      template += '.';
    }
    
    // Clean up extra spaces
    template = template.replace(/\s+/g, ' ').trim();
    
    console.log('🎉 Template final:', template);
    return template;
  }, [existingTemplate?.name_template, templateParameters, availableParameters, selectedOptionsMap, parameterOptionsCache]);

  // Handle options selection changes
  const handleOptionsChange = (parameterId: string, selectedOptions: string[]) => {
    setSelectedOptionsMap(prev => ({
      ...prev,
      [parameterId]: selectedOptions
    }));
  }

  const form = useForm<TaskGroupCreatorFormData>({
    resolver: zodResolver(taskGroupCreatorSchema),
    defaultValues: {
      name: '',
      subcategory_id: '',
      unit_id: '',
    },
  })

  // Load data when editing existing task group
  useEffect(() => {
    if (modalData?.taskGroup) {
      form.reset({
        name: modalData.taskGroup.name,
        subcategory_id: modalData.taskGroup.category_id,
        unit_id: '',
      })
    }
  }, [modalData, form])

  // Load template data for step 2
  useEffect(() => {
    if (currentStep === 2 && taskGroup?.id) {
      fetchTemplateData(taskGroup.id)
    } else if (currentStep === 2 && createdTaskGroup?.id) {
      fetchTemplateData(createdTaskGroup.id)
    } else if (currentStep === 2 && !taskGroup?.id && !createdTaskGroup?.id) {
      // For new task groups, initialize with default parameters
      initializeDefaultParameters()
    }
  }, [currentStep, taskGroup, createdTaskGroup])
  
  // Load saved parameter options when they become available AND template parameters are loaded
  useEffect(() => {
    if (Object.keys(savedOptionsMap).length > 0 && templateParameters.length > 0) {
      console.log('📥 Cargando opciones guardadas después de cargar parámetros:', savedOptionsMap)
      setSelectedOptionsMap(savedOptionsMap)
    }
  }, [savedOptionsMap, templateParameters])

  // Initialize default parameters for new task groups
  const initializeDefaultParameters = async () => {
    try {
      if (!supabase) return

      // Fetch available parameters to find the default ones
      const { data: params } = await supabase
        .from('task_parameters')
        .select('*')
        .in('slug', ['tipo-de-tarea', 'tipo-de-elemento'])
        .order('slug')

      console.log('🎯 Parámetros por defecto encontrados:', params)
      setAvailableParameters(params || [])

      if (params && params.length >= 2) {
        // Find specific parameters by slug
        const tipoTareaParam = params.find(p => p.slug === 'tipo-de-tarea')
        const tipoElementoParam = params.find(p => p.slug === 'tipo-de-elemento')

        if (tipoTareaParam && tipoElementoParam) {
          // Create default template parameters in the correct order
          const defaultParameters = [
            {
              id: `temp-tipo-tarea-${Date.now()}`,
              parameter_id: tipoTareaParam.id,
              position: 1,
              parameter: tipoTareaParam
            },
            {
              id: `temp-tipo-elemento-${Date.now() + 1}`,
              parameter_id: tipoElementoParam.id,
              position: 2,
              parameter: tipoElementoParam
            }
          ]

          console.log('🏗️ Inicializando parámetros por defecto:', defaultParameters)
          setTemplateParameters(defaultParameters)

          // Create a simple template for preview
          setExistingTemplate({
            id: 'temp-template',
            name_template: '{{tipo-de-tarea}} {{tipo-de-elemento}}.',
            task_group_id: '',
            unit_id: '',
            task_code: 'TMP',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
      }

      // Also fetch all available parameters for the dropdown
      const { data: allParams } = await supabase
        .from('task_parameters')
        .select('*')
        .order('slug')

      setAvailableParameters(allParams || [])
    } catch (error) {
      console.error('❌ Error inicializando parámetros por defecto:', error)
    }
  }

  const fetchTemplateData = async (taskGroupId: string) => {
    try {
      if (!supabase) return
      
      console.log('🔍 Buscando plantilla para task_group_id:', taskGroupId)
      
      // Fetch existing template using task_group_id
      const { data: template } = await supabase
        .from('task_templates')
        .select('*')
        .eq('task_group_id', taskGroupId)
        .single()

      console.log('🔍 Resultado búsqueda plantilla:', { data: template })

      if (template) {
        setExistingTemplate(template)
        
        // Fetch group parameter options with parameter details, ordered by position
        const { data: groupOptions } = await supabase
          .from('task_group_parameter_options')
          .select(`
            parameter_id,
            parameter_option_id,
            position,
            task_parameters!inner(*)
          `)
          .eq('group_id', taskGroupId)
          .order('position', { ascending: true })

        console.log('📋 Opciones de parámetros de grupo cargadas:', groupOptions)
        
        // Convert to templateParameters format for compatibility, preserving original positions
        const uniqueParameters: Record<string, any> = {}
        if (groupOptions) {
          groupOptions.forEach((opt: any, index: number) => {
            if (!uniqueParameters[opt.parameter_id]) {
              uniqueParameters[opt.parameter_id] = {
                id: `param_${index}`,
                template_id: template.id,
                parameter_id: opt.parameter_id,
                position: opt.position || index + 1, // Use database position if available
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                task_parameter: opt.task_parameters
              }
            }
          })
        }
        
        const templateParams = Object.values(uniqueParameters)
          .sort((a, b) => a.position - b.position) // Sort by position
        
        // If no existing parameters, add default ones
        if (templateParams.length === 0) {
          await initializeDefaultParameters()
        } else {
          setTemplateParameters(templateParams)
        }
      }

      // Fetch available parameters
      const { data: params } = await supabase
        .from('task_parameters')
        .select('*')
        .order('slug')

      console.log('⚙️ Parámetros disponibles:', params)
      setAvailableParameters(params || [])
    } catch (error) {
      console.error('❌ Error fetching template data:', error)
    }
  }

  // Get subcategories (categories that have parent_id - are not root level)
  const subcategories = allCategories.filter(category => category.parent_id !== null)

  // Prepare subcategories for ComboBoxWrite
  const subcategoryOptions = subcategories.map(subcategory => ({
    label: subcategory.name,
    value: subcategory.id,
  }))

  const onSubmitStep1 = async (data: TaskGroupCreatorFormData) => {
    setIsSubmitting(true)
    
    try {
      if (modalData?.taskGroup) {
        // Editing existing task group
        await updateGroupMutation.mutateAsync({
          id: modalData.taskGroup.id,
          name: data.name,
          category_id: data.subcategory_id,
        })
        
        toast({
          title: "Grupo actualizado",
          description: "El grupo de tareas se actualizó correctamente.",
        })
        
        handleClose()
      } else {
        // Creating new task group
        const newGroup = await createGroupMutation.mutateAsync({
          name: data.name,
          category_id: data.subcategory_id,
        })

        // Create the associated template
        const selectedCategory = subcategories.find(cat => cat.id === data.subcategory_id)
        const taskCode = selectedCategory?.code || 'GEN'
        
        const newTemplate = await createTemplateMutation.mutateAsync({
          name_template: `${data.name}.`,
          task_group_id: newGroup.id,
          unit_id: data.unit_id,
          task_code: taskCode, // Usar el código de la subcategoría seleccionada
        })

        // Update the task group with the template_id
        await updateGroupMutation.mutateAsync({
          id: newGroup.id,
          name: data.name,
          category_id: data.subcategory_id,
          template_id: newTemplate.id,
        })

        setCreatedTaskGroup(newGroup)
        setCurrentStep(2)
        
        // Initialize with default parameters for new groups
        await initializeDefaultParameters()
        
        toast({
          title: "Grupo creado",
          description: "El grupo de tareas se creó correctamente. Ahora configura los parámetros.",
        })
      }
    } catch (error) {
      console.error('Error creating/updating group and template:', error)
      toast({
        title: "Error",
        description: "No se pudo completar la operación.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeIndex = templateParameters.findIndex(p => p.id === active.id)
    const overIndex = templateParameters.findIndex(p => p.id === over.id)

    if (activeIndex !== overIndex) {
      const newParams = arrayMove(templateParameters, activeIndex, overIndex)
      
      // Update positions after drag
      const updatedParams = newParams.map((param, index) => ({
        ...param,
        position: index + 1
      }))

      console.log('🔄 Parámetros reordenados con nuevas posiciones:', updatedParams.map(p => ({
        id: p.id,
        parameter_id: p.parameter_id,
        position: p.position
      })))

      setTemplateParameters(updatedParams)
    }
  }

  const addParameter = () => {
    if (!selectedParameterId) return

    const newPosition = templateParameters.length + 1
    
    // Find the parameter details from available parameters
    const selectedParameter = availableParameters.find(p => p.id === selectedParameterId)
    if (!selectedParameter) return
    
    // Create a temporary parameter object for local state
    const newParameter = {
      id: `temp-${Date.now()}`, // Temporary ID for local state
      parameter_id: selectedParameterId,
      position: newPosition,
      parameter: selectedParameter // Include parameter details for display
    }
    
    setTemplateParameters([...templateParameters, newParameter])
    setSelectedParameterId('')
    
    toast({
      title: "Parámetro agregado",
      description: "El parámetro se agregó correctamente a la plantilla.",
    })
  }

  const removeParameter = (paramId: string) => {
    // Remove from local state and update positions
    const filteredParams = templateParameters.filter(p => p.id !== paramId)
    
    // Update positions after removal
    const updatedParams = filteredParams.map((param, index) => ({
      ...param,
      position: index + 1
    }))
    
    setTemplateParameters(updatedParams)
    
    // Also remove from selected options if exists
    const paramToRemove = templateParameters.find(p => p.id === paramId)
    if (paramToRemove?.parameter_id) {
      const newSelectedOptionsMap = { ...selectedOptionsMap }
      delete newSelectedOptionsMap[paramToRemove.parameter_id]
      setSelectedOptionsMap(newSelectedOptionsMap)
    }
    
    toast({
      title: "Parámetro eliminado",
      description: "El parámetro se eliminó correctamente.",
    })
  }

  const handleClose = () => {
    form.reset()
    setCurrentStep(1)
    setTemplateParameters([])
    setExistingTemplate(null)
    setCreatedTaskGroup(null)
    onClose()
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      form.handleSubmit(onSubmitStep1)()
    } else {
      // Step 2: Save parameter options using new system
      await saveParameterOptions()
      handleClose()
    }
  }

  const saveParameterOptions = async () => {
    const currentGroupId = taskGroup?.id || createdTaskGroup?.id
    if (!currentGroupId || !existingTemplate?.id) return

    console.log('💾 Guardando opciones con nuevo sistema para grupo:', currentGroupId)
    console.log('📋 Opciones actuales:', selectedOptionsMap)

    try {
      // Prepare data for new table structure with positions
      const parameterOptions = templateParameters
        .sort((a, b) => a.position - b.position)
        .filter(tp => selectedOptionsMap[tp.parameter_id]?.length > 0)
        .map((tp, index) => ({
          parameter_id: tp.parameter_id,
          parameter_option_ids: selectedOptionsMap[tp.parameter_id] || [],
          position: index + 1
        }))

      console.log('📤 Enviando opciones al nuevo sistema:', parameterOptions)

      // Construct template with placeholders only (not values)
      let realTemplate = ''
      
      if (templateParameters.length > 0) {
        // Build template with placeholders only
        const placeholders = templateParameters
          .sort((a, b) => a.position - b.position)
          .map(tp => {
            const parameter = availableParameters?.find(p => p.id === tp.parameter_id);
            return parameter ? `{{${parameter.slug}}}` : '';
          })
          .filter(Boolean)
          .join(' ');
        
        realTemplate = placeholders + '.';
        console.log('🏗️ Template con placeholders para guardar:', realTemplate);
      } else {
        realTemplate = existingTemplate?.name_template || 'Nueva tarea.';
      }
      
      console.log('🏗️ Template final para guardar (solo placeholders):', realTemplate);

      // Update the template's name_template with the real constructed template
      if (existingTemplate?.id) {
        console.log('🔄 Iniciando actualización de template:', {
          template_id: existingTemplate.id,
          old_template: existingTemplate.name_template,
          new_template: realTemplate
        });

        await updateTemplateMutation.mutateAsync({
          templateId: existingTemplate.id,
          name_template: realTemplate
        });
      } else {
        console.warn('⚠️ No se pudo actualizar template: existingTemplate.id no disponible', existingTemplate);
      }

      await saveParameterOptionsMutation.mutateAsync({
        groupId: currentGroupId,
        parameterOptions
      })

      console.log('✅ Opciones guardadas exitosamente con nuevo sistema')
      
      // Invalidate all relevant caches to refresh UI
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['task-groups'] }),
        queryClient.invalidateQueries({ queryKey: ['task-groups', currentGroupId] }),
        queryClient.invalidateQueries({ queryKey: ['task-templates'] }),
        queryClient.invalidateQueries({ queryKey: ['task-template-parameters'] }),
        queryClient.invalidateQueries({ queryKey: ['task-group-parameter-options'] }),
        queryClient.invalidateQueries({ queryKey: ['task-group-parameter-options-loaded'] }),
        queryClient.invalidateQueries({ queryKey: ['adminTaskGroups'] }),
      ])
      console.log('🔄 Cache completamente invalidado para actualización inmediata')
    } catch (error) {
      console.error('❌ Error guardando opciones:', error)
    }
  }

  const isLoading = categoriesLoading || unitsLoading || isSubmitting
  const isEditing = !!modalData?.taskGroup

  // Step titles
  const stepTitles = {
    1: isEditing ? "Editar Grupo de Tareas" : "Crear Grupo de Tareas",
    2: "Configurar Plantilla"
  }

  // Step 1: Group creation/editing
  const step1Panel = (
    <Form {...form}>
      <form className="space-y-6">
        {/* Subcategory Selection */}
        <FormField
          control={form.control}
          name="subcategory_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subcategoría <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <ComboBox
                  options={subcategoryOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Buscar subcategoría..."
                  disabled={categoriesLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Group Name */}
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

        {/* Unit Selection */}
        <FormField
          control={form.control}
          name="unit_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unidad <span className="text-red-500">*</span></FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={unitsLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar unidad..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name} ({unit.symbol})
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

  // Step 2: Template configuration
  const step2Panel = (
    <div className="space-y-6">
      {/* Vista Previa */}
      {taskGroup && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Vista Previa</h4>
          <div className="p-3 bg-background rounded border">
            <p className="text-sm font-medium text-foreground">{generatePreview}</p>
          </div>
        </div>
      )}

      {/* Add Parameter */}
      <div className="space-y-3">
        <Label>Agregar Parámetro</Label>
        <div className="flex space-x-2">
          <div className="flex-1">
            <Select value={selectedParameterId} onValueChange={setSelectedParameterId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar parámetro..." />
              </SelectTrigger>
              <SelectContent>
                {availableParameters
                  .filter(p => !templateParameters.some(tp => tp.parameter_id === p.id))
                  .map((param) => (
                  <SelectItem key={param.id} value={param.id}>
                    {param.label} ({param.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={addParameter} disabled={!selectedParameterId} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Agregar
          </Button>
        </div>
      </div>

      {/* Current Parameters */}
      <div className="space-y-3">
        <Label>Parámetros Configurados ({templateParameters.length})</Label>
        {templateParameters.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No hay parámetros configurados</p>
            <p className="text-sm">Agrega parámetros para personalizar la plantilla</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={templateParameters.map(p => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {templateParameters.map((param) => {
                  const parameter = availableParameters.find(p => p.id === param.parameter_id)
                  return (
                    <SortableParameterItem
                      key={param.id}
                      param={param}
                      parameter={parameter}
                      onRemove={removeParameter}
                      selectedOptions={selectedOptionsMap[param.parameter_id] || []}
                      onOptionsChange={handleOptionsChange}
                    />
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )

  const stepConfig = {
    currentStep,
    totalSteps: 2,
    stepTitle: stepTitles[currentStep as keyof typeof stepTitles]
  }

  const headerContent = (
    <FormModalStepHeader 
      title={modalData?.taskGroup ? "Editar Grupo de Tareas" : "Crear Grupo de Tareas"}
      icon={currentStep === 1 ? PackagePlus : Settings}
      stepConfig={stepConfig}
    />
  )

  const getFooterConfig = () => {
    switch (currentStep) {
      case 1:
        return {
          cancelAction: { 
            label: 'Cancelar', 
            onClick: handleClose 
          },
          nextAction: { 
            label: 'Siguiente', 
            onClick: handleNext,
            disabled: !form.formState.isValid,
            loading: isSubmitting
          }
        }
      case 2:
        return {
          cancelAction: { 
            label: 'Cancelar', 
            onClick: handleClose 
          },
          previousAction: { 
            label: 'Anterior', 
            onClick: handlePrevious 
          },
          submitAction: { 
            label: modalData?.taskGroup ? 'Actualizar' : 'Finalizar', 
            onClick: handleNext,
            loading: isSubmitting
          }
        }
      default:
        return {
          cancelAction: { 
            label: 'Cancelar', 
            onClick: handleClose 
          }
        }
    }
  }

  const footerContent = (
    <FormModalStepFooter
      config={getFooterConfig()}
    />
  )

  return (
    <FormModalLayout
      headerContent={headerContent}
      footerContent={footerContent}
      stepContent={currentStep === 1 ? step1Panel : step2Panel}
      columns={1}
      onClose={onClose}
    >
    </FormModalLayout>
  )
}