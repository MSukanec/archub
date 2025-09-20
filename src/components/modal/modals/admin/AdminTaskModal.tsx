import React, { useState, useEffect } from 'react'
import { toast } from '@/hooks/use-toast'
import { useCreateGeneratedTask, useGeneratedTask } from '@/hooks/use-generated-tasks'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useTaskTemplates } from '@/hooks/use-task-templates'
import { useTaskCategories } from '@/hooks/use-task-categories'
import { useUnits } from '@/hooks/use-units'
import { supabase } from '@/lib/supabase'
import { useQueryClient, useQuery } from '@tanstack/react-query'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { ParametricTaskBuilder } from '@/components/ui-custom/admin/tasks/ParametricTaskBuilder'
import { TemplateParametersSelector } from '@/components/ui-custom/admin/tasks/TemplateParametersSelector'
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

import { Zap, Plus, Trash2, Settings } from 'lucide-react'

interface AdminTaskModalProps {
  modalData?: {
    isEditing?: boolean
    task?: any
    taskData?: any
    taskId?: string
  } | null
  onClose: () => void
}

interface ParameterSelection {
  parameterId: string
  optionId: string
  parameterSlug: string
  parameterLabel: string
  optionName: string
  optionLabel: string
}


export function AdminTaskModal({ modalData, onClose }: AdminTaskModalProps) {
  const { task, isEditing, taskData, taskId } = modalData || {}
  
  // Use direct task fetch when taskId is provided, otherwise use passed task/taskData
  const { data: fetchedTask, isLoading: isTaskLoading, error: taskError } = useGeneratedTask(taskId || '')
  
  // Determine the actual task data with proper fallback hierarchy
  const actualTask = React.useMemo(() => {
    // Priority 1: Use passed task or taskData directly (no fetch needed)
    if (task || taskData) {
      return task || taskData
    }
    // Priority 2: Use fetched task when taskId is provided
    if (taskId && fetchedTask) {
      return fetchedTask
    }
    return null
  }, [task, taskData, taskId, fetchedTask])
  
  // Determine if we're editing (either explicit flag or taskId provided)
  // CRITICAL FIX: Account for loading state - if taskId exists, we're editing regardless of actualTask
  const isEditingMode = isEditing || Boolean(taskId)
  
  // Show loading state when fetching task by ID
  const isLoadingTaskData = taskId && isTaskLoading && !task && !taskData
  
  // DEBUG: Ver qué está pasando
  console.log('🔧 AdminTaskModal Debug:', {
    taskId,
    isTaskLoading,
    task: !!task,
    taskData: !!taskData,
    isLoadingTaskData,
    modalData,
    isEditingMode,
    divisionsCount: taskDivisions.length,
    unitsCount: units.length
  });
  
  const [isLoading, setIsLoading] = useState(false)
  const [selections, setSelections] = useState<ParameterSelection[]>([])
  const [taskPreview, setTaskPreview] = useState<string>('')
  const [parameterOrder, setParameterOrder] = useState<string[]>([])
  const [savedTaskId, setSavedTaskId] = useState<string | null>(null)
  const [customName, setCustomName] = useState<string>('')
  const [taskTemplateId, setTaskTemplateId] = useState<string>('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [taskDivisionId, setTaskDivisionId] = useState<string>('')
  const [unitId, setUnitId] = useState<string>('')
  const [isCompleted, setIsCompleted] = useState<boolean>(false)
  
  // Parse existing param_values if editing
  const existingParamValues = React.useMemo(() => {
    if (!actualTask?.param_values) return null;
    
    try {
      if (typeof actualTask.param_values === 'string') {
        const parsed = JSON.parse(actualTask.param_values);
        return parsed;
      } else {
        return actualTask.param_values;
      }
    } catch (e) {
      console.error('❌ Error parsing param_values:', e);
      return null;
    }
  }, [actualTask?.param_values]);

  const existingParamOrder = React.useMemo(() => {
    if (!actualTask?.param_order) return null;
    
    if (typeof actualTask.param_order === 'string') {
      try {
        return JSON.parse(actualTask.param_order);
      } catch (e) {
        console.error('❌ Error parsing param_order:', e);
        return null;
      }
    }
    return actualTask.param_order;
  }, [actualTask?.param_order]);

  // Effect to load existing task data when editing
  useEffect(() => {
    if (isEditingMode && actualTask && existingParamValues) {

      const loadedSelections: ParameterSelection[] = []
      
      if (existingParamValues && typeof existingParamValues === 'object') {
        Object.entries(existingParamValues).forEach(([parameterSlug, optionSlug]) => {
          if (typeof optionSlug === 'string') {
            loadedSelections.push({
              parameterId: '',
              optionId: '',
              parameterSlug,
              parameterLabel: parameterSlug,
              optionName: optionSlug,
              optionLabel: optionSlug
            })
          }
        })
      }
      
      setSelections(loadedSelections)
      
      if (existingParamOrder) {
        setParameterOrder(existingParamOrder)
      }
    }
  }, [isEditingMode, actualTask, existingParamValues, existingParamOrder])

  // Mutations
  const createTaskMutation = useCreateGeneratedTask()
  
  // Current user data
  const { data: userData } = useCurrentUser()
  
  // Query client for cache invalidation
  const queryClient = useQueryClient()
  
  
  // Task templates data
  const { data: taskTemplates = [] } = useTaskTemplates()
  
  // Task categories data
  const { data: categories = [] } = useTaskCategories()
  
  // Units data
  const { data: units = [] } = useUnits()

  // Task divisions data
  const { data: taskDivisions = [] } = useQuery({
    queryKey: ['task-divisions'],
    queryFn: async () => {
      if (!supabase) return [];
      
      const { data, error } = await supabase
        .from('task_divisions')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching task divisions:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!supabase
  })


  // Load form data when task and reference data is available
  React.useEffect(() => {
    if (isEditingMode && actualTask) {
      // Load existing custom_name and is_completed
      if (actualTask.custom_name) {
        setCustomName(actualTask.custom_name)
      }
      
      // Find unit ID by name from TASKS_VIEW
      if (actualTask.unit && units.length > 0) {
        const foundUnit = units.find(unit => unit.name === actualTask.unit)
        if (foundUnit) {
          setUnitId(foundUnit.id)
        }
      }
      
      if (actualTask.is_completed !== undefined) {
        setIsCompleted(actualTask.is_completed)
      }
      
      // Load task_division_id if exists - CRITICAL FIX
      if (actualTask.task_division_id) {
        setTaskDivisionId(actualTask.task_division_id)
      } else if (actualTask.division && taskDivisions.length > 0) {
        // Fallback: try to find division by name from the view
        const foundDivision = taskDivisions.find(div => div.name === actualTask.division)
        if (foundDivision) {
          setTaskDivisionId(foundDivision.id)
        }
      }
      
      // Load category_id if exists - MISSING LOGIC ADDED!
      if (actualTask.category_id) {
        setCategoryId(actualTask.category_id)
      } else if (actualTask.category && categories.length > 0) {
        // Fallback: try to find category by name from the view
        const foundCategory = categories.find(cat => cat.name === actualTask.category)
        if (foundCategory) {
          setCategoryId(foundCategory.id)
        }
      }
    }
  }, [isEditingMode, actualTask, units, taskDivisions, categories])

  // Initialize task materials when editing
  React.useEffect(() => {
    if (isEditingMode && actualTask?.id) {
      setSavedTaskId(actualTask.id)
    }
  }, [isEditingMode, actualTask?.id])




  // Complete and save task with materials
  const handleSubmit = async () => {
    if (!customName.trim()) {
      toast({
        title: "Error",
        description: "Debes especificar un nombre personalizado para la tarea.",
        variant: "destructive",
      })
      return
    }

    if (!userData?.organization?.id) {
      toast({
        title: "Error", 
        description: "No se pudo obtener la información de la organización.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      let taskId = savedTaskId;
      
      // Generate task code if creating new task
      const generateTaskCode = () => {
        return `CU-${Date.now()}`
      }
      
      if (isEditingMode && actualTask) {
        // Update existing task
        const updateData: any = {
          custom_name: customName,
          category_id: categoryId || null, // FIXED: Use actual categoryId instead of hardcoded null
          unit_id: unitId || null,
          task_template_id: null,
          task_division_id: taskDivisionId || null,
          is_completed: isCompleted
        }
        
        console.log('🔧 Updating task with data:', updateData)
        console.log('🔧 Current isCompleted value:', isCompleted)
        console.log('🔧 CategoryId value:', categoryId)
        console.log('🔧 UnitId value:', unitId)
        
        const { error: updateError } = await supabase
          .from('tasks')
          .update(updateData)
          .eq('id', actualTask.id)
        
        if (updateError) {
          console.error('Error updating task:', updateError)
          throw updateError
        }
        
        taskId = actualTask.id
      } else {
        // Create new task directly in tasks table
        const generateTaskCode = () => {
          return `CU-${Date.now()}`
        }

        const newTask = {
          code: generateTaskCode(),
          custom_name: customName,
          param_values: {}, // Empty object since we're not using parameters
          param_order: [], // Empty array since we're not using parameters
          name_rendered: null, // NULL since we're not using parametric generation
          unit_id: unitId || null,
          category_id: null,
          task_template_id: null,
          task_division_id: taskDivisionId || null,
          organization_id: null, // Always NULL as specified
          is_system: true, // Always TRUE as specified
          is_completed: isCompleted
        }
        
        console.log('🔧 Creating task with data:', newTask)
        console.log('🔧 Current isCompleted value:', isCompleted)
        console.log('🔧 CategoryId value:', categoryId)
        console.log('🔧 UnitId value:', unitId)
        console.log('🔧 TaskDivisionId value:', taskDivisionId)
        console.log('🔧 TaskTemplateId value:', taskTemplateId)
        
        const { data, error } = await supabase
          .from('tasks')
          .insert([newTask])
          .select()
          .single()
        
        if (error) {
          console.error('Error creating task:', error)
          throw error
        }
        
        taskId = data.id
        console.log('✅ Task created successfully with ID:', taskId)
      }

      
      // Invalidate queries to refresh the task list
      queryClient.invalidateQueries({ queryKey: ['generated-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task-view'] })
      queryClient.invalidateQueries({ queryKey: ['tasks-view'] })
      console.log('✅ Cache invalidated for generated-tasks, task-view, and tasks-view')
      
      toast({
        title: isEditingMode ? "Tarea actualizada" : "Tarea creada",
        description: `Tarea ${isEditingMode ? 'actualizada' : 'creada'} exitosamente: "${customName}".`,
      })
      
      onClose()
    } catch (error: any) {
      console.error('Error completing task:', error)
      toast({
        title: "Error",
        description: error.message || "Error al procesar la tarea.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }


  // ViewPanel - null for creation modal
  const viewPanel = null;

  // EditPanel - all form content with proper loading and error states
  const editPanel = (() => {
    // Show loading state when fetching task data
    if (isLoadingTaskData) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Cargando datos de la tarea...</span>
          </div>
        </div>
      );
    }
    
    // Show error state when task fetch failed
    if (taskError && taskId) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-destructive mb-2">Error al cargar la tarea</p>
              <p className="text-muted-foreground text-sm">{taskError.message}</p>
            </div>
          </div>
        </div>
      );
    }
    
    // Show form content when data is ready or for new task creation
    return (
      <div className="space-y-6">
        {/* Tarea Section */}
        <div className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="task-division" className="flex items-center gap-2 font-semibold">
                <div className="h-4 w-4 text-blue-600">📦</div>
                Rubro de la Tarea
              </Label>
              <p className="text-sm text-muted-foreground mb-2">Selecciona la categoría principal para clasificar tu tarea</p>
              <ComboBox
                value={taskDivisionId}
                onValueChange={setTaskDivisionId}
                options={taskDivisions.map(division => ({
                  value: division.id,
                  label: division.name
                }))}
                placeholder="🔍 Selecciona un rubro para tu tarea..."
                searchPlaceholder="Buscar rubro..."
                emptyMessage="No se encontraron rubros disponibles"
              />
            </div>
            
            <div>
              <Label htmlFor="unit-select" className="flex items-center gap-2 font-semibold">
                <div className="h-4 w-4 text-green-600">⚙️</div>
                Unidad de Medida
              </Label>
              <p className="text-sm text-muted-foreground mb-2">Define cómo se medirá esta tarea (m², kg, hrs, etc.)</p>
              <ComboBox
                value={unitId}
                onValueChange={setUnitId}
                options={units.map(unit => ({
                  value: unit.id,
                  label: unit.name
                }))}
                placeholder="📏 Selecciona la unidad de medida..."
                searchPlaceholder="Buscar unidad..."
                emptyMessage="No se encontraron unidades disponibles"
              />
            </div>
            
            <div>
              <Label htmlFor="custom-name" className="flex items-center gap-2 font-semibold">
                <div className="h-4 w-4 text-purple-600">📝</div>
                Nombre y Descripción de tu Tarea
              </Label>
              <p className="text-sm text-muted-foreground mb-2">Describe claramente qué trabajo se realizará en esta tarea</p>
              <Textarea
                id="custom-name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="✏️ Ejemplo: Instalación de pisos cerámicos en baño principal con preparación de superficie..."
                rows={4}
                className="resize-none"
              />
              {customName.trim() && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-1">
                    ✅ <strong>Perfecto!</strong> Tu tarea tiene una descripción clara
                  </p>
                </div>
              )}
            </div>
            
            {/* Task Completion Status */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is-completed">Tarea Completada</Label>
                <p className="text-xs text-muted-foreground">Indica si esta tarea está completada</p>
              </div>
              <Switch
                id="is-completed"
                checked={isCompleted}
                onCheckedChange={setIsCompleted}
              />
            </div>
          </div>
        </div>
      </div>
    );
  })();

  // Header content - show edit intent when taskId exists, even during loading
  const headerContent = (
    <FormModalHeader 
      title={taskId ? "✏️ Editar Tarea Personalizada" : "✨ Nueva Tarea Personalizada"}
      description={taskId ? "Modifica y actualiza tu tarea personalizada con parámetros específicos y configuración personalizada" : "Crea una nueva tarea personalizada para tu proyecto con configuración específica y parámetros únicos"}
      icon={Zap}
    />
  );

  // Footer content - show edit intent when taskId exists, even during loading
  // CRITICAL FIX: Disable submission during loading to prevent race condition
  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={taskId ? "Actualizar Tarea" : "Crear Tarea"}
      onRightClick={handleSubmit}
      submitDisabled={isLoadingTaskData || isLoading}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
      isEditing={isEditingMode} // FIXED: Use computed isEditingMode instead of hardcoded true
    />
  );
}