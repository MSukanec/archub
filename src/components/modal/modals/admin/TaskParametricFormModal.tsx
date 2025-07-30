import React, { useState, useEffect } from 'react'
import { toast } from '@/hooks/use-toast'
import { useCreateGeneratedTask, useUpdateGeneratedTask, useTaskMaterials, useCreateTaskMaterial, useDeleteTaskMaterial, useGeneratedTasks } from '@/hooks/use-generated-tasks'
import { useMaterials } from '@/hooks/use-materials'
import { useCurrentUser } from '@/hooks/use-current-user'

import { FormModalStepFooter } from '@/components/modal/form/FormModalStepFooter'
import { FormModalStepHeader } from '@/components/modal/form/FormModalStepHeader'
import { StepModalConfig } from '@/components/modal/form/types'
import { ParametricTaskBuilder } from '@/components/ui-custom/ParametricTaskBuilder'
import { ComboBox } from '@/components/ui-custom/ComboBoxWrite'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { Zap, Package, Plus, Trash2 } from 'lucide-react'

interface ParametricTaskFormModalProps {
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

export function ParametricTaskFormModal({ modalData, onClose }: ParametricTaskFormModalProps) {
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
  
  // If editing existing task, start at step 2 (materials), otherwise step 1 (parameters)
  const [currentStep, setCurrentStep] = useState(isEditingMode ? 2 : 1)
  const [isLoading, setIsLoading] = useState(false)
  const [selections, setSelections] = useState<ParameterSelection[]>([])
  const [taskPreview, setTaskPreview] = useState<string>('')
  const [parameterOrder, setParameterOrder] = useState<string[]>([])
  const [savedTaskId, setSavedTaskId] = useState<string | null>(null)
  const [taskMaterials, setTaskMaterials] = useState<Array<{id?: string, material_id: string, amount: number, material_name?: string, unit_name?: string}>>([])
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('')
  const [materialAmount, setMaterialAmount] = useState<string>('')
  
  // Debug logs removed
  
  // Parse existing param_values if editing
  const existingParamValues = React.useMemo(() => {
    if (!actualTask?.param_values) return null;
    
    try {
      // Si param_values es string, parsearlo como JSON
      if (typeof actualTask.param_values === 'string') {
        const parsed = JSON.parse(actualTask.param_values);
        // Debug logs removed
        return parsed;
      } else {
        // Debug logs removed
        return actualTask.param_values;
      }
    } catch (e) {
      console.error('❌ Error parsing param_values:', e);
      return null;
    }
  }, [actualTask?.param_values]);

  const existingParamOrder = React.useMemo(() => {
    if (!actualTask?.param_order) return null;
    
    // Si param_order es string, parsearlo como JSON, si no, usarlo como array
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

  // Debug logs removed

  // Effect to load existing task data when editing
  useEffect(() => {
    if (isEditingMode && actualTask && existingParamValues) {
      // Load existing selections for display as chips
      const loadedSelections: ParameterSelection[] = []
      
      if (existingParamValues && typeof existingParamValues === 'object') {
        Object.entries(existingParamValues).forEach(([parameterSlug, optionSlug]) => {
          if (typeof optionSlug === 'string') {
            loadedSelections.push({
              parameterId: '', // Will be filled when parameters load
              optionId: '', // Will be filled when options load
              parameterSlug,
              parameterLabel: parameterSlug, // Will be updated when parameters load
              optionName: optionSlug,
              optionLabel: optionSlug // Will be updated when options load
            })
          }
        })
      }
      
      setSelections(loadedSelections)
      
      // Set saved task ID for materials loading
      setSavedTaskId(actualTask.id)
      
      // Debug logs removed
    }
  }, [isEditingMode, actualTask, existingParamValues])

  // Use the new hooks for creating and updating tasks
  const createTaskMutation = useCreateGeneratedTask()
  const updateTaskMutation = useUpdateGeneratedTask()
  const createTaskMaterialMutation = useCreateTaskMaterial()
  const deleteTaskMaterialMutation = useDeleteTaskMaterial()
  
  // Data hooks
  const { data: userData } = useCurrentUser()
  const { data: materials = [] } = useMaterials()
  const { data: existingTaskMaterials = [] } = useTaskMaterials(savedTaskId || actualTask?.id)

  // Initialize task materials when editing
  React.useEffect(() => {
    if (isEditing && actualTask?.id) {
      setSavedTaskId(actualTask.id)
    }
  }, [isEditing, actualTask?.id])

  React.useEffect(() => {
    if (existingTaskMaterials.length > 0) {
      setTaskMaterials(existingTaskMaterials.map(tm => ({
        id: tm.id,
        material_id: tm.material_id,
        amount: tm.amount,
        material_name: tm.materials?.name,
        unit_name: tm.materials?.units?.name
      })))
    }
  }, [existingTaskMaterials])

  // Step 1: Save task (existing functionality)
  const handleStep1Submit = async () => {
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
      // Construir objeto JSON con los valores de parámetros usando slugs como claves y UUIDs como valores
      const paramValues: Record<string, string> = {}
      
      // Si estamos editando una tarea existente, empezar con los valores existentes
      if (isEditing && actualTask && existingParamValues) {
        Object.assign(paramValues, existingParamValues)
        // Debug logs removed
      }
      
      // Aplicar las nuevas selecciones (esto sobrescribe los valores existentes si hay cambios)
      selections.forEach(selection => {
        paramValues[selection.parameterSlug] = selection.optionId
      })
      
      // Debug logs removed
      const taskData = {
        selections,
        preview: taskPreview,
        paramValues,
        paramOrder: parameterOrder
      }
      
      if (isEditing && actualTask) {
        // Update existing task
        await updateTaskMutation.mutateAsync({
          task_id: actualTask.id,
          input_param_values: paramValues,
          param_order: parameterOrder
        })
        
        setSavedTaskId(actualTask.id)
        toast({
          title: "Tarea actualizada",
          description: `Tarea actualizada: "${taskPreview}". Ahora puedes agregar materiales.`,
        })
      } else {
        // Create new task using the centralized SQL function
        const result = await createTaskMutation.mutateAsync({
          param_values: paramValues,
          param_order: parameterOrder
        })
        
        // Debug logs removed
        setSavedTaskId(result.new_task?.id)
        
        toast({
          title: "Tarea generada",
          description: `Tarea creada con código ${result.generated_code}: "${taskPreview}". Ahora puedes agregar materiales.`,
        })
      }
      
      // Move to step 2
      setCurrentStep(2)
    } catch (error) {
      console.error('Error processing task:', error)
      toast({
        title: "Error",
        description: "Hubo un error al procesar la tarea.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Add material to local state only
  const handleAddMaterial = () => {
    if (!selectedMaterialId || !materialAmount) {
      toast({
        title: "Error",
        description: "Debes seleccionar un material y especificar la cantidad.",
        variant: "destructive",
      })
      return
    }

    // Add to local state only (no database save yet)
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

  // Final step: Complete and close
  const handleComplete = async () => {
    if (!savedTaskId || !userData?.organization?.id) {
      toast({
        title: "Error",
        description: "No se puede completar la tarea sin ID válido.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      
      // Save all materials to database
      // Debug logs removed
      
      if (taskMaterials.length > 0) {
        // Debug logs removed
        
        for (const material of taskMaterials) {
          // Skip materials that already have an ID (already saved)
          if (!material.id) {
            const materialData = {
              task_id: savedTaskId,
              material_id: material.material_id,
              amount: material.amount,
              organization_id: userData.organization.id
            };
            // Debug logs removed
            
            try {
              const result = await createTaskMaterialMutation.mutateAsync(materialData);
              // Debug logs removed
            } catch (materialError: any) {
              console.error('❌ Error saving individual material:', materialError);
              console.error('❌ Error details:', {
                message: materialError.message,
                code: materialError.code,
                details: materialError.details,
                hint: materialError.hint
              });
              throw materialError;
            }
          } else {
            // Debug logs removed
          }
        }
      } else {
        // Debug logs removed
      }
      
      toast({
        title: "Tarea completada",
        description: `Tarea guardada exitosamente con ${taskMaterials.length} materiales.`,
      })
      
      onClose()
    } catch (error: any) {
      console.error('Error completing task:', error)
      toast({
        title: "Error",
        description: error.message || "Error al finalizar la tarea.",
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

  // Step panel content
  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Componente constructor de parámetros */}
            <ParametricTaskBuilder 
              onSelectionChange={setSelections}
              onPreviewChange={setTaskPreview}
              onOrderChange={setParameterOrder}
              initialParameters={existingParamValues ? JSON.stringify(existingParamValues) : null}
              initialParameterOrder={existingParamOrder || null}
            />
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-6">
            {/* Agregar material */}
            <div className="space-y-4">
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
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Material
              </Button>
            </div>
            
            {/* Lista de materiales agregados */}
            {taskMaterials.length > 0 && (
              <>
                <Separator />
                <div>
                  <Label className="text-sm font-medium">Materiales Agregados</Label>
                  <div className="mt-2 space-y-2">
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
                            // If material has ID, delete from database
                            if (material.id) {
                              try {
                                // Debug logs removed
                                await deleteTaskMaterialMutation.mutateAsync(material.id);
                                // Debug logs removed
                              } catch (error) {
                                console.error('❌ Error deleting material from database:', error);
                                return; // Don't remove from local state if database deletion fails
                              }
                            }
                            // Remove from local state
                            setTaskMaterials(prev => prev.filter((_, i) => i !== index))
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )
      
      default:
        return null
    }
  }

  // Step configuration
  const stepConfig: StepModalConfig = {
    currentStep: isEditingMode ? 2 : currentStep,
    totalSteps: 2,
    stepTitle: currentStep === 1 ? 'Configurar Parámetros' : 'Agregar Materiales'
  }

  // Header content
  const headerContent = (
    <FormModalStepHeader 
      title={isEditingMode ? "Editar Tarea" : "Crear Tarea Personalizada"}
      icon={Zap}
      stepConfig={stepConfig}
    />
  )

  // Footer content
  const footerContent = (
    <FormModalStepFooter
      config={{
        cancelAction: {
          label: "Cancelar",
          onClick: onClose
        },
        previousAction: (currentStep > 1 && !isEditingMode) ? {
          label: "Atrás",
          onClick: () => setCurrentStep(1)
        } : undefined,
        submitAction: {
          label: currentStep === 1 ? "Guardar y Continuar" : "Finalizar",
          onClick: currentStep === 1 ? handleStep1Submit : handleComplete,
          loading: isLoading
        }
      }}
    />
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {headerContent}
        
        <div className="flex-1 overflow-y-auto p-6">
          {getStepContent()}
        </div>
        
        {footerContent}
      </div>
    </div>
  )
}