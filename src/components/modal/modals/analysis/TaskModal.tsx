import React, { useState, useEffect } from 'react'
import { toast } from '@/hooks/use-toast'
import { useCreateGeneratedTask, useUpdateGeneratedTask, useTaskMaterials, useCreateTaskMaterial, useDeleteTaskMaterial, useGeneratedTasks } from '@/hooks/use-generated-tasks'
import { useMaterials } from '@/hooks/use-materials'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { Zap, Plus, Trash2, FileText, Settings, Package, Edit2 } from 'lucide-react'

interface TaskModalProps {
  modalData?: {
    isEditing?: boolean
    task?: any
    taskData?: any
    taskId?: string
    isDuplicating?: boolean
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

interface MaterialEditRowProps {
  material: any
  index: number
  onEdit: (material: any) => void
  onRemove: () => void
  disabled: boolean
}

function MaterialEditRow({ material, index, onEdit, onRemove, disabled }: MaterialEditRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editAmount, setEditAmount] = useState(material.amount.toString())

  const handleSaveEdit = () => {
    const newAmount = parseFloat(editAmount)
    if (newAmount > 0) {
      onEdit({ ...material, amount: newAmount })
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setEditAmount(material.amount.toString())
    setIsEditing(false)
  }

  return (
    <div className="py-2">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium text-sm leading-tight">
            {material.material_name}
          </p>
          {!isEditing && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {material.amount} {material.unit_name}
            </p>
          )}
          {isEditing && (
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="h-7 text-xs w-20"
                step="0.01"
                min="0"
                autoFocus
              />
              <span className="text-xs text-muted-foreground">{material.unit_name}</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveEdit}
                  className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                  disabled={disabled}
                >
                  ✓
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  disabled={disabled}
                >
                  ✕
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
              disabled={disabled}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function TaskModal({ modalData, onClose }: TaskModalProps) {
  const { task, isEditing, taskData, taskId, isDuplicating } = modalData || {}
  
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
  
  // Determine if we're editing (either explicit flag or taskId provided, but not if duplicating)
  const isEditingMode = !isDuplicating && (isEditing || (taskId && actualTask))
  
  const [isLoading, setIsLoading] = useState(false)
  const [selections, setSelections] = useState<ParameterSelection[]>([])
  const [taskPreview, setTaskPreview] = useState<string>('')
  const [parameterOrder, setParameterOrder] = useState<string[]>([])
  const [savedTaskId, setSavedTaskId] = useState<string | null>(null)
  const [taskMaterials, setTaskMaterials] = useState<Array<{id?: string, material_id: string, amount: number, material_name?: string, unit_name?: string}>>([])
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('')
  const [materialAmount, setMaterialAmount] = useState<string>('')
  const [customName, setCustomName] = useState<string>('')
  const [taskTemplateId, setTaskTemplateId] = useState<string>('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [taskDivisionId, setTaskDivisionId] = useState<string>('')
  const [unitId, setUnitId] = useState<string>('')
  const [isCompleted, setIsCompleted] = useState<boolean>(false)
  const [editingMaterialIndex, setEditingMaterialIndex] = useState<number | null>(null)
  
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
  const createTaskMaterialMutation = useCreateTaskMaterial()
  const deleteTaskMaterialMutation = useDeleteTaskMaterial()
  
  // Current user data with success tracking
  const { data: userData, isSuccess: userLoaded } = useCurrentUser()
  
  // Query client for cache invalidation
  const queryClient = useQueryClient()
  
  // Materials data with success tracking
  const { data: materials = [], isSuccess: materialsLoaded } = useMaterials()
  const { data: existingTaskMaterials = [] } = useTaskMaterials(savedTaskId || actualTask?.id)
  
  // Task templates data (not used in this modal but keeping for potential future use)
  const { data: taskTemplates = [] } = useTaskTemplates()
  
  // Task categories data (not used in this modal but keeping for potential future use)
  const { data: categories = [] } = useTaskCategories()
  
  // Units data with success tracking
  const { data: units = [], isSuccess: unitsLoaded } = useUnits()

  // Task divisions data with success tracking
  const { data: taskDivisions = [], isSuccess: divisionsLoaded } = useQuery({
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
  
  // Readiness guard - only check data actually used in this modal
  const isDataReady = divisionsLoaded && unitsLoaded && materialsLoaded
  
  // Separate user check for submit button enablement
  const canSubmit = isDataReady && userLoaded

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
    if ((isEditingMode || isDuplicating) && actualTask) {
      console.log('🔧 Loading task data for editing/duplicating:', actualTask)
      
      // Load existing custom_name (always load first)
      if (actualTask.custom_name) {
        setCustomName(actualTask.custom_name)
        console.log('🔧 Set custom name:', actualTask.custom_name)
      }
      
      // Find unit ID by name from tasks_view
      if (actualTask.unit && units.length > 0) {
        const foundUnit = units.find(unit => unit.name === actualTask.unit)
        if (foundUnit) {
          setUnitId(foundUnit.id)
          console.log('🔧 Set unit ID:', foundUnit.id, 'for unit name:', actualTask.unit)
        }
      } else if (actualTask.unit_id && units.length > 0) {
        // Fallback: if we have unit_id directly
        const foundUnit = units.find(unit => unit.id === actualTask.unit_id)
        if (foundUnit) {
          setUnitId(foundUnit.id)
          console.log('🔧 Set unit ID from unit_id field:', foundUnit.id)
        }
      }
      
      // Always keep is_completed as false for analysis tasks
      
      // Load task_division_id if exists
      if (actualTask.task_division_id) {
        setTaskDivisionId(actualTask.task_division_id)
        console.log('🔧 Set division ID from task_division_id:', actualTask.task_division_id)
      } else if (actualTask.division && taskDivisions.length > 0) {
        // Fallback: try to find division by name from the view
        const foundDivision = taskDivisions.find(div => div.name === actualTask.division)
        if (foundDivision) {
          setTaskDivisionId(foundDivision.id)
          console.log('🔧 Set division ID from name lookup:', foundDivision.id, 'for division name:', actualTask.division)
        }
      }
    }
  }, [isEditingMode, isDuplicating, actualTask, units, taskDivisions])

  // Initialize task materials when editing
  React.useEffect(() => {
    if (isEditingMode && actualTask?.id) {
      setSavedTaskId(actualTask.id)
    }
  }, [isEditingMode, actualTask?.id])

  React.useEffect(() => {
    if (existingTaskMaterials.length > 0) {
      setTaskMaterials(existingTaskMaterials.map(tm => ({
        id: tm.id,
        material_id: tm.material_id,
        amount: tm.amount,
        material_name: (tm as any).material_view?.name || 'Material sin nombre',
        unit_name: (tm as any).material_view?.unit_of_computation || 'Sin unidad'
      })))
    }
  }, [existingTaskMaterials])

  // Add material to local state
  // Handle edit material function
  const handleEditMaterial = (index: number, updatedMaterial: any) => {
    setTaskMaterials(prev => prev.map((material, i) => 
      i === index ? { ...material, amount: updatedMaterial.amount } : material
    ));
    setEditingMaterialIndex(null);
  };

  const handleAddMaterial = () => {
    if (!selectedMaterialId || !materialAmount) {
      toast({
        title: "Error",
        description: "Debes seleccionar un material y especificar la cantidad.",
        variant: "destructive",
      })
      return
    }

    const selectedMaterial = materials.find(m => m.id === selectedMaterialId)
    const newMaterial = {
      material_id: selectedMaterialId,
      amount: parseFloat(materialAmount),
      material_name: selectedMaterial?.name,
      unit_name: selectedMaterial?.unit?.name
    }
    
    setTaskMaterials(prev => [...prev, newMaterial])

    // Clear form
    setSelectedMaterialId('')
    setMaterialAmount('')
  }

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
          is_completed: false // Always false for analysis tasks
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
          organization_id: userData.organization.id, // SET TO ORGANIZATION ID for analysis tasks
          is_system: false, // SET TO FALSE for analysis tasks
          is_completed: false // Always false for analysis tasks
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

      // Save materials if any
      if (taskMaterials.length > 0 && taskId && userData?.organization?.id) {
        for (const material of taskMaterials) {
          if (!material.id) {
            const materialData = {
              task_id: taskId,
              material_id: material.material_id,
              amount: material.amount,
              organization_id: userData.organization.id
            };
            
            try {
              await createTaskMaterialMutation.mutateAsync(materialData);
            } catch (materialError: any) {
              console.error('❌ Error saving material:', materialError);
              throw materialError;
            }
          }
        }
      }
      
      // Invalidate queries to refresh the task list
      queryClient.invalidateQueries({ queryKey: ['generated-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task-view'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      
      toast({
        title: isEditingMode ? "Tarea actualizada" : "Tarea creada",
        description: `Tarea ${isEditingMode ? 'actualizada' : 'creada'} exitosamente: "${customName}" con ${taskMaterials.length} materiales.`,
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

  // Get material options for ComboBox
  const materialOptions = materials.map(material => ({
    value: material.id,
    label: material.name
  }))

  // Get selected material unit
  const selectedMaterial = materials.find(m => m.id === selectedMaterialId)
  const selectedMaterialUnit = selectedMaterial?.unit?.name || ''

  // ViewPanel - null for creation modal
  const viewPanel = null;

  // EditPanel - defer content until data is ready
  const stepContent = (
    <div className="space-y-6">
      {/* Task Form Fields */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="task-division" className="flex items-center gap-2 font-semibold">
            <Package className="h-4 w-4 text-blue-600" />
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
            placeholder={divisionsLoaded ? "🔍 Selecciona un rubro para tu tarea..." : "⏳ Cargando rubros disponibles..."}
            searchPlaceholder="Buscar rubro..."
            emptyMessage="No se encontraron rubros disponibles"
            disabled={!divisionsLoaded}
          />
        </div>
        
        <div>
          <Label htmlFor="unit-select" className="flex items-center gap-2 font-semibold">
            <Settings className="h-4 w-4 text-green-600" />
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
            placeholder={unitsLoaded ? "📏 Selecciona la unidad de medida..." : "⏳ Cargando unidades disponibles..."}
            searchPlaceholder="Buscar unidad..."
            emptyMessage="No se encontraron unidades disponibles"
            disabled={!unitsLoaded}
          />
        </div>
        
        <div>
          <Label htmlFor="custom-name" className="flex items-center gap-2 font-semibold">
            <FileText className="h-4 w-4 text-purple-600" />
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
      </div>
    </div>
  );
  
  const editPanel = isDataReady ? stepContent : (
    <div className="space-y-6">
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mx-auto"></div>
          <div>
            <h3 className="font-semibold text-lg">⚙️ Preparando tu espacio de trabajo</h3>
            <p className="text-muted-foreground mt-2">Cargando rubros, unidades y materiales disponibles...</p>
            <div className="flex items-center justify-center mt-3 space-x-2">
              <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
              <div className="h-2 w-2 bg-primary/60 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <div className="h-2 w-2 bg-primary/30 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Header content
  const headerContent = (
    <FormModalHeader 
      title={isEditingMode ? "✏️ Editar Tarea Personalizada" : "✨ Nueva Tarea Personalizada"}
      description={isEditingMode ? "Modifica y actualiza tu tarea personalizada con parámetros específicos y materiales necesarios" : "Crea una nueva tarea personalizada para tu proyecto con configuración específica, materiales y parámetros únicos"}
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
      showLoadingSpinner={isLoading}
      submitDisabled={!canSubmit}
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