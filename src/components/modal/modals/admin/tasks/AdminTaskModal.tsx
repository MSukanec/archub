import React, { useState, useEffect } from 'react'
import { toast } from '@/hooks/use-toast'
import { useCreateGeneratedTask, useUpdateGeneratedTask, useTaskMaterials, useCreateTaskMaterial, useDeleteTaskMaterial, useGeneratedTasks } from '@/hooks/use-generated-tasks'
import { useMaterials } from '@/hooks/use-materials'
import { useCurrentUser } from '@/hooks/use-current-user'

import { ParametricTaskBuilder } from '@/components/ui-custom/ParametricTaskBuilder'
import { ComboBox } from '@/components/ui-custom/ComboBoxWrite'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { Zap, Package, Plus, Trash2, X } from 'lucide-react'

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
  const [taskMaterials, setTaskMaterials] = useState<Array<{id?: string, material_id: string, amount: number, material_name?: string, unit_name?: string}>>([])
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('')
  const [materialAmount, setMaterialAmount] = useState<string>('')
  
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
  
  // Materials data
  const { data: materials = [] } = useMaterials()
  const { data: existingTaskMaterials = [] } = useTaskMaterials(savedTaskId || actualTask?.id)

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
  const handleComplete = async () => {
    if (selections.length === 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar al menos un parámetro para crear la tarea.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      let taskId = savedTaskId;
      
      // First, save or update the task
      const paramValues: Record<string, string> = {}
      
      if (isEditingMode && actualTask && existingParamValues) {
        Object.assign(paramValues, existingParamValues)
      }
      
      selections.forEach(selection => {
        paramValues[selection.parameterSlug] = selection.optionId
      })
      
      if (isEditingMode && actualTask) {
        // Update existing task
        await updateTaskMutation.mutateAsync({
          task_id: actualTask.id,
          input_param_values: paramValues,
          param_order: parameterOrder
        })
        taskId = actualTask.id
      } else {
        // Create new task
        const result = await createTaskMutation.mutateAsync({
          param_values: paramValues,
          param_order: parameterOrder
        })
        taskId = result.new_task?.id
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
      
      toast({
        title: isEditingMode ? "Tarea actualizada" : "Tarea creada",
        description: `Tarea ${isEditingMode ? 'actualizada' : 'creada'} exitosamente: "${taskPreview}" con ${taskMaterials.length} materiales.`,
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent rounded-lg">
              <Zap className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {isEditingMode ? "Editar Tarea" : "Crear Tarea Personalizada"}
              </h2>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Task Parameters */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent" />
              <h3 className="font-medium">Configuración de Parámetros</h3>
            </div>
            <ParametricTaskBuilder 
              onSelectionChange={setSelections}
              onPreviewChange={setTaskPreview}
              onOrderChange={setParameterOrder}
              initialParameters={existingParamValues ? JSON.stringify(existingParamValues) : null}
              initialParameterOrder={existingParamOrder || null}
            />
          </div>

          <Separator />

          {/* Materials Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-accent" />
              <h3 className="font-medium">Materiales (Opcional)</h3>
            </div>
            
            {/* Add Material Form */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="material-select" className="text-xs font-medium">Material</Label>
                    <ComboBox
                      options={materialOptions}
                      value={selectedMaterialId}
                      onValueChange={setSelectedMaterialId}
                      placeholder="Buscar material..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="material-amount" className="text-xs font-medium">Cantidad</Label>
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
                
                <Button 
                  onClick={handleAddMaterial}
                  disabled={!selectedMaterialId || !materialAmount || isLoading}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Material
                </Button>
              </CardContent>
            </Card>
            
            {/* Materials List */}
            {taskMaterials.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Materiales Agregados</Label>
                <div className="space-y-2">
                  {taskMaterials.map((material, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{material.material_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {material.amount} {material.unit_name}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (material.id) {
                            try {
                              await deleteTaskMaterialMutation.mutateAsync(material.id);
                            } catch (error) {
                              console.error('❌ Error deleting material:', error);
                              return;
                            }
                          }
                          setTaskMaterials(prev => prev.filter((_, i) => i !== index))
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleComplete}
            disabled={isLoading || selections.length === 0}
          >
            {isLoading ? "Guardando..." : (isEditingMode ? "Actualizar Tarea" : "Crear Tarea")}
          </Button>
        </div>
      </div>
    </div>
  )
}