import React, { useState, useEffect } from 'react'
import { toast } from '@/hooks/use-toast'
import { useCreateGeneratedTask, useUpdateGeneratedTask, useGeneratedTasks } from '@/hooks/use-generated-tasks'
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
  
  // Load tasks data to find the task by ID if taskId is provided
  const { data: tasksData } = useGeneratedTasks()
  
  // Determine the actual task data
  const actualTask = React.useMemo(() => {
    if (task || taskData) {
      return task || taskData
    }
    if (taskId && tasksData) {
      return tasksData.find(t => t.id === taskId)
    }
    return null
  }, [task, taskData, taskId, tasksData])
  
  // Determine if we're editing (either explicit flag or taskId provided)
  const isEditingMode = isEditing || (taskId && actualTask)
  
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
  const updateTaskMutation = useUpdateGeneratedTask()
  
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

  // Initialize existing task values
  React.useEffect(() => {
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
          category_id: null,
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
      queryClient.invalidateQueries({ queryKey: ['task-view'] })
      
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

  // EditPanel - all form content
  const editPanel = (
    <div className="space-y-6">
      {/* Tarea Section */}
      <div className="space-y-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="task-division">Rubro</Label>
            <ComboBox
              value={taskDivisionId}
              onValueChange={setTaskDivisionId}
              options={taskDivisions.map(division => ({
                value: division.id,
                label: division.name
              }))}
              placeholder="Seleccionar rubro..."
              searchPlaceholder="Buscar rubro..."
              emptyMessage="No se encontraron rubros"
            />
          </div>
          
          <div>
            <Label htmlFor="unit-select">Unidad</Label>
            <ComboBox
              value={unitId}
              onValueChange={setUnitId}
              options={units.map(unit => ({
                value: unit.id,
                label: unit.name
              }))}
              placeholder="Seleccionar unidad..."
              searchPlaceholder="Buscar unidad..."
              emptyMessage="No se encontraron unidades"
            />
          </div>
          
          <div>
            <Label htmlFor="custom-name">Nombre Personalizado</Label>
            <Textarea
              id="custom-name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Nombre personalizado para la tarea..."
              rows={3}
            />
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

  // Header content
  const headerContent = (
    <FormModalHeader 
      title={isEditingMode ? "Editar Tarea" : "Nueva Tarea Personalizada"}
      description={isEditingMode ? "Modifica los parámetros y materiales de la tarea existente" : "Crea una nueva tarea personalizada configurando parámetros y materiales"}
      icon={Zap}
    />
  );

  // Footer content
  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isEditingMode ? "Actualizar Tarea" : "Crear Tarea"}
      onRightClick={handleSubmit}

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
      isEditing={true} // Siempre abrir en modo edición
    />
  );
}