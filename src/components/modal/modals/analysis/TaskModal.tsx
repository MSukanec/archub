import React, { useState, useEffect } from 'react'
import { toast } from '@/hooks/use-toast'
import { useCreateGeneratedTask, useUpdateGeneratedTask, useTaskMaterials, useCreateTaskMaterial, useDeleteTaskMaterial, useGeneratedTasks, useCreateTaskLabor } from '@/hooks/use-generated-tasks'
import { useMaterials } from '@/hooks/use-materials'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useTaskCategories } from '@/hooks/use-task-categories'
import { useUnits } from '@/hooks/use-units'
import { useTaskLabor } from '@/hooks/use-task-labor'
import { supabase } from '@/lib/supabase'
import { useQueryClient, useQuery } from '@tanstack/react-query'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { ParametricTaskBuilder } from '@/components/ui-custom/admin/tasks/ParametricTaskBuilder'
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
  const createTaskLaborMutation = useCreateTaskLabor()
  
  // Current user data with success tracking
  const { data: userData, isSuccess: userLoaded } = useCurrentUser()
  
  // Query client for cache invalidation
  const queryClient = useQueryClient()
  
  // Materials data with success tracking
  const { data: materials = [], isSuccess: materialsLoaded } = useMaterials()
  const { data: existingTaskMaterials = [] } = useTaskMaterials(savedTaskId || actualTask?.id)
  
  // Get original task materials and labor for duplication with success tracking
  const { 
    data: originalTaskMaterials = [], 
    isSuccess: originalMaterialsLoaded,
    isLoading: originalMaterialsLoading 
  } = useTaskMaterials(isDuplicating && actualTask?.id ? actualTask.id : null)
  
  const { 
    data: originalTaskLabor = [], 
    isSuccess: originalLaborLoaded,
    isLoading: originalLaborLoading 
  } = useTaskLabor(isDuplicating && actualTask?.id ? actualTask.id : null)
  
  
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
  
  
  // Readiness guard - check if we have the essential data
  const isDataReady = divisionsLoaded && unitsLoaded && materialsLoaded
  
  // During duplication, also check if original costs are loaded
  const isDuplicationDataReady = isDuplicating ? 
    (originalMaterialsLoaded && originalLaborLoaded) : true
  
  // Basic form readiness - allows submit when essential form data is ready
  const isBasicFormReady = customName.trim() && taskDivisionId && unitId && isDataReady && userLoaded
  
  // Combined readiness check for submit button enablement
  // For duplication, we don't block submit on costs loading - they'll be copied after task creation
  const canSubmit = isBasicFormReady
  
  // Loading state for duplication costs
  const isDuplicationLoading = isDuplicating && (originalMaterialsLoading || originalLaborLoading)

  // Initialize existing parameter values (only for editing parametric tasks)
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

  // CRITICAL FIX: Initialize form data immediately when actualTask is available
  // This ensures duplication fields are populated instantly, not waiting for reference data
  React.useEffect(() => {
    if ((isEditingMode || isDuplicating) && actualTask) {
      console.log('🔧 DUPLICATION: Loading task data for editing/duplicating:', {
        taskId: actualTask.id,
        customName: actualTask.custom_name,
        taskDivisionId: actualTask.task_division_id,
        unitId: actualTask.unit_id,
        isDuplicating
      })
      
      // DUPLICATION FIX: Load custom_name with " - Copia" suffix for duplication
      if (actualTask.custom_name) {
        const baseName = actualTask.custom_name
        const duplicatedName = isDuplicating ? `${baseName} - Copia` : baseName
        setCustomName(duplicatedName)
        console.log('🔧 DUPLICATION: Set custom name:', duplicatedName)
      }
      
      // IMMEDIATE: Set task_division_id directly if available (don't wait for reference data)
      if (actualTask.task_division_id) {
        setTaskDivisionId(actualTask.task_division_id)
        console.log('🔧 DUPLICATION: Set division ID immediately:', actualTask.task_division_id)
      }
      
      // IMMEDIATE: Set unit_id directly if available (don't wait for reference data)
      if (actualTask.unit_id) {
        setUnitId(actualTask.unit_id)
        console.log('🔧 DUPLICATION: Set unit ID immediately:', actualTask.unit_id)
      }
    }
  }, [isEditingMode, isDuplicating, actualTask]) // Removed units and taskDivisions dependencies

  // FALLBACK: Secondary effect to resolve IDs from names when reference data becomes available
  // This runs after the immediate effect above, providing fallbacks if direct IDs weren't available
  React.useEffect(() => {
    if ((isEditingMode || isDuplicating) && actualTask && (units.length > 0 || taskDivisions.length > 0)) {
      console.log('🔧 FALLBACK: Resolving names to IDs with reference data')
      
      // Fallback: Find unit ID by name from tasks_view (only if not already set)
      if (!unitId && actualTask.unit && units.length > 0) {
        const foundUnit = units.find(unit => unit.name === actualTask.unit)
        if (foundUnit) {
          setUnitId(foundUnit.id)
          console.log('🔧 FALLBACK: Set unit ID from name lookup:', foundUnit.id, 'for unit name:', actualTask.unit)
        }
      }
      
      // Fallback: Find division ID by name (only if not already set)
      if (!taskDivisionId && actualTask.division && taskDivisions.length > 0) {
        const foundDivision = taskDivisions.find(div => div.name === actualTask.division)
        if (foundDivision) {
          setTaskDivisionId(foundDivision.id)
          console.log('🔧 FALLBACK: Set division ID from name lookup:', foundDivision.id, 'for division name:', actualTask.division)
        }
      }
    }
  }, [isEditingMode, isDuplicating, actualTask, units, taskDivisions, unitId, taskDivisionId]) // Added current state dependencies

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
          unit_id: unitId || null,
          task_division_id: taskDivisionId || null,
          is_completed: false
        }
        
        console.log('🔧 Updating task with data:', updateData)
        console.log('🔧 Current isCompleted value:', isCompleted)
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
          unit_id: unitId || null,
          task_division_id: taskDivisionId || null,
          organization_id: userData.organization.id,
          is_system: false,
          is_completed: false
        }
        
        console.log('🔧 Creating task with data:', newTask)
        console.log('🔧 Current isCompleted value:', isCompleted)
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
      
      // Copy original materials and labor if duplicating with improved error handling
      if (isDuplicating && actualTask && taskId && userData?.organization?.id) {
        const copiedMaterials: string[] = [];
        const copiedLabor: string[] = [];
        
        try {
          // Copy materials from original task
          for (const material of originalTaskMaterials) {
            const materialData = {
              task_id: taskId,
              material_id: material.material_id,
              amount: material.amount,
              organization_id: userData.organization.id
            };
            
            try {
              const result = await createTaskMaterialMutation.mutateAsync(materialData);
              copiedMaterials.push(result.id);
            } catch (materialError: any) {
              console.error('❌ Error copying material:', materialError);
              throw new Error(`Error copiando material: ${material.materials_view?.name || 'Material desconocido'}`);
            }
          }
          
          // Copy labor from original task using mutation
          for (const labor of originalTaskLabor) {
            const laborData = {
              task_id: taskId,
              labor_type_id: labor.labor_type_id,
              quantity: labor.quantity,
              organization_id: userData.organization.id
            };
            
            try {
              const result = await createTaskLaborMutation.mutateAsync(laborData);
              copiedLabor.push(result.id);
            } catch (laborError: any) {
              console.error('❌ Error copying labor:', laborError);
              throw new Error(`Error copiando mano de obra: ${labor.labor_view?.labor_type || 'Tipo de labor desconocido'}`);
            }
          }
        } catch (duplicationError: any) {
          // If duplication fails, show specific error
          console.error('❌ Duplication failed:', duplicationError);
          throw new Error(`Tarea creada pero fallo en duplicación: ${duplicationError.message}. Revisa la tarea y agrega los costos manualmente.`);
        }
      }
      
      // Invalidate queries with specific taskId for better cache management
      queryClient.invalidateQueries({ queryKey: ['tasks-view'] })
      queryClient.invalidateQueries({ queryKey: ['task-materials', taskId] })
      queryClient.invalidateQueries({ queryKey: ['task-labor', taskId] })
      queryClient.invalidateQueries({ queryKey: ['task-costs', taskId] })
      
      // Also invalidate general queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task-materials'] })
      queryClient.invalidateQueries({ queryKey: ['task-labor'] })
      queryClient.invalidateQueries({ queryKey: ['task-costs'] })
      
      const successTitle = isDuplicating ? "Tarea duplicada" : (isEditingMode ? "Tarea actualizada" : "Tarea creada")
      const materialCount = taskMaterials.length + (isDuplicating ? originalTaskMaterials.length : 0)
      const laborCount = isDuplicating ? originalTaskLabor.length : 0
      const costsMsg = materialCount > 0 || laborCount > 0 ? ` con ${materialCount} materiales y ${laborCount} tipos de mano de obra` : ''
      
      toast({
        title: successTitle,
        description: `Tarea ${isDuplicating ? 'duplicada' : (isEditingMode ? 'actualizada' : 'creada')} exitosamente: "${customName}"${costsMsg}.`,
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
          <Label htmlFor="task-division">Rubro</Label>
          <ComboBox
            value={taskDivisionId}
            onValueChange={setTaskDivisionId}
            options={taskDivisions.map(division => ({
              value: division.id,
              label: division.name
            }))}
            placeholder={divisionsLoaded ? "Seleccionar rubro..." : "Cargando rubros..."}
            searchPlaceholder="Buscar rubro..."
            emptyMessage="No se encontraron rubros"
            disabled={!divisionsLoaded}
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
            placeholder={unitsLoaded ? "Seleccionar unidad..." : "Cargando unidades..."}
            searchPlaceholder="Buscar unidad..."
            emptyMessage="No se encontraron unidades"
            disabled={!unitsLoaded}
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
      </div>
    </div>
  );
  
  const editPanel = isDataReady ? (
    isDuplicationLoading ? (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando costos originales para duplicación...</p>
            <p className="text-sm text-muted-foreground mt-2">
              {originalMaterialsLoading && "Cargando materiales..."}
              {originalLaborLoading && " Cargando mano de obra..."}
            </p>
          </div>
        </div>
      </div>
    ) : stepContent
  ) : (
    <div className="space-y-6">
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    </div>
  );

  // Header content with duplication state
  const headerContent = (
    <FormModalHeader 
      title={isDuplicating ? "Duplicar Tarea" : (isEditingMode ? "Editar Tarea" : "Nueva Tarea Personalizada")}
      description={isDuplicating ? "Duplicando tarea con todos sus costos de materiales y mano de obra" : (isEditingMode ? "Modifica los parámetros y materiales de la tarea existente" : "Crea una nueva tarea personalizada configurando parámetros y materiales")}
      icon={Zap}
    />
  );

  // Footer content
  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isDuplicating ? "Duplicar Tarea" : (isEditingMode ? "Actualizar Tarea" : "Crear Tarea")}
      onRightClick={handleSubmit}
      showLoadingSpinner={isLoading}
      submitDisabled={!canSubmit || isDuplicationLoading}
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