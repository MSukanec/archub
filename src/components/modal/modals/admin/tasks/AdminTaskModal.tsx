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
import { ComboBox } from '@/components/ui-custom/ComboBoxWrite'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'

import { Zap, Plus, Trash2, FileText, Settings, Package, Edit2 } from 'lucide-react'

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
  
  // Current user data
  const { data: userData } = useCurrentUser()
  
  // Query client for cache invalidation
  const queryClient = useQueryClient()
  
  // Materials data
  const { data: materials = [] } = useMaterials()
  const { data: existingTaskMaterials = [] } = useTaskMaterials(savedTaskId || actualTask?.id)
  
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
      // Load existing custom_name, task_template_id, category_id, and is_completed
      if (actualTask.custom_name) {
        setCustomName(actualTask.custom_name)
      }
      if (actualTask.task_template_id) {
        setTaskTemplateId(actualTask.task_template_id)
      }
      
      // Find category ID by name from TASKS_VIEW
      if (actualTask.category && categories.length > 0) {
        const foundCategory = categories.find(cat => cat.name === actualTask.category)
        if (foundCategory) {
          setCategoryId(foundCategory.id)
        }
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
      
      // Load task_division_id if exists
      if (actualTask.task_division_id) {
        setTaskDivisionId(actualTask.task_division_id)
      }
    }
  }, [isEditingMode, actualTask, categories, units])

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
          category_id: categoryId || null,
          unit_id: unitId || null,
          task_template_id: taskTemplateId || null,
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
          unit_id: unitId, // Direct assignment without || null
          category_id: categoryId, // Direct assignment without || null
          task_template_id: taskTemplateId || null,
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
        
        // Update unit_id and category_id in a separate operation if they exist
        if (unitId || categoryId) {
          console.log('🔄 Updating unit_id and category_id separately...')
          const updateData: any = {}
          if (unitId) updateData.unit_id = unitId
          if (categoryId) updateData.category_id = categoryId
          
          const { error: updateError } = await supabase
            .from('tasks')
            .update(updateData)
            .eq('id', taskId)
          
          if (updateError) {
            console.error('Error updating unit_id/category_id:', updateError)
          } else {
            console.log('✅ Successfully updated unit_id and category_id')
          }
        }
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
      queryClient.invalidateQueries({ queryKey: ['task-view'] })
      
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

  // EditPanel - all form content
  const editPanel = (
    <div className="space-y-6">
      {/* Tarea Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-medium">Información de la Tarea</h3>
        </div>
        <div className="space-y-4 pl-6">
          <div>
            <Label htmlFor="task-template">Plantilla</Label>
            <ComboBox
              value={taskTemplateId}
              onValueChange={setTaskTemplateId}
              options={taskTemplates.map(template => ({
                value: template.id,
                label: template.name
              }))}
              placeholder="Seleccionar plantilla..."
              searchPlaceholder="Buscar plantilla..."
              emptyMessage="No se encontraron plantillas"
            />
          </div>
          
          <div>
            <Label htmlFor="task-division">División</Label>
            <ComboBox
              value={taskDivisionId}
              onValueChange={setTaskDivisionId}
              options={taskDivisions.map(division => ({
                value: division.id,
                label: division.name
              }))}
              placeholder="Seleccionar división..."
              searchPlaceholder="Buscar división..."
              emptyMessage="No se encontraron divisiones"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="task-category">Rubro</Label>
              <ComboBox
                value={categoryId}
                onValueChange={setCategoryId}
                options={(categories || []).map(category => ({
                  value: category.id,
                  label: category.name
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
          
          {/* Task Completion Status - moved here before materials */}
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



      {/* Materials Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-medium">Materiales</h3>
        </div>
        
        <div className="pl-6 space-y-4">
          {/* Add Material Form */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label htmlFor="material-select">Material</Label>
              <ComboBox
                options={materialOptions}
                value={selectedMaterialId}
                onValueChange={setSelectedMaterialId}
                placeholder="Buscar material..."
              />
            </div>
            
            <div className="col-span-1">
              <Label htmlFor="material-amount">Cantidad</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="material-amount"
                  type="number"
                  value={materialAmount}
                  onChange={(e) => setMaterialAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
                {selectedMaterialUnit && (
                  <Badge variant="outline" className="text-xs">
                    {selectedMaterialUnit}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button 
              onClick={handleAddMaterial}
              disabled={!selectedMaterialId || !materialAmount || isLoading}
              variant="default"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Material
            </Button>
          </div>
          
          {/* Materials List */}
          {taskMaterials.length > 0 && (
            <div className="divide-y divide-border">
              {taskMaterials.map((material, index) => (
                <MaterialEditRow
                  key={index}
                  material={material}
                  index={index}
                  onEdit={(updatedMaterial) => handleEditMaterial(index, updatedMaterial)}
                  onRemove={() => {
                    if (material.id) {
                      deleteTaskMaterialMutation.mutateAsync(material.id).catch(console.error);
                    }
                    setTaskMaterials(prev => prev.filter((_, i) => i !== index));
                  }}
                  disabled={isLoading}
                />
              ))}
            </div>
          )}
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