import React, { useState } from 'react'
import { toast } from '@/hooks/use-toast'
import { useCreateGeneratedTask, useUpdateGeneratedTask, useTaskMaterials, useCreateTaskMaterial } from '@/hooks/use-generated-tasks'
import { useMaterials } from '@/hooks/use-materials'
import { useCurrentUser } from '@/hooks/use-current-user'

import { FormModalStepFooter } from '@/components/modal/form/FormModalStepFooter'
import { FormModalStepHeader } from '@/components/modal/form/FormModalStepHeader'
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
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [selections, setSelections] = useState<ParameterSelection[]>([])
  const [taskPreview, setTaskPreview] = useState<string>('')
  const [parameterOrder, setParameterOrder] = useState<string[]>([])
  const [savedTaskId, setSavedTaskId] = useState<string | null>(null)
  const [taskMaterials, setTaskMaterials] = useState<Array<{id?: string, material_id: string, amount: number, material_name?: string, unit_name?: string}>>([])
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('')
  const [materialAmount, setMaterialAmount] = useState<string>('')
  
  const { task, isEditing, taskData } = modalData || {}
  const actualTask = task || taskData
  
  console.log('🔍 Modal data received:', modalData);
  console.log('📝 Task data:', actualTask);
  console.log('✏️ Is editing:', isEditing);
  console.log('📊 param_order from task:', actualTask?.param_order);
  console.log('📊 param_values from task:', actualTask?.param_values);
  
  // Parse existing param_values if editing
  const existingParamValues = React.useMemo(() => {
    if (!actualTask?.param_values) return null;
    
    try {
      // Si param_values es string, parsearlo como JSON
      if (typeof actualTask.param_values === 'string') {
        const parsed = JSON.parse(actualTask.param_values);
        console.log('🔄 Parsed param_values from string:', parsed);
        return parsed;
      } else {
        console.log('🔄 Using param_values as object:', actualTask.param_values);
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

  console.log('📊 Processed param_values:', existingParamValues);
  console.log('📊 Processed param_order:', existingParamOrder);

  // Use the new hooks for creating and updating tasks
  const createTaskMutation = useCreateGeneratedTask()
  const updateTaskMutation = useUpdateGeneratedTask()
  const createTaskMaterialMutation = useCreateTaskMaterial()
  
  // Data hooks
  const { userData } = useCurrentUser()
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
        console.log('🔄 Starting with existing param values:', existingParamValues)
      }
      
      // Aplicar las nuevas selecciones (esto sobrescribe los valores existentes si hay cambios)
      selections.forEach(selection => {
        paramValues[selection.parameterSlug] = selection.optionId
      })
      
      console.log('💾 Saving param values:', paramValues);
      console.log('📊 Parameter order:', parameterOrder);
      console.log('🔧 Creating parametric task:', {
        selections,
        preview: taskPreview,
        paramValues,
        paramOrder: parameterOrder
      })
      
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
        
        console.log('✅ Task created with code:', result.generated_code);
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

  // Step 2: Add material to task
  const handleAddMaterial = async () => {
    if (!selectedMaterialId || !materialAmount || !savedTaskId || !userData?.organization?.id) {
      toast({
        title: "Error",
        description: "Debes seleccionar un material y especificar la cantidad.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      
      await createTaskMaterialMutation.mutateAsync({
        task_id: savedTaskId,
        material_id: selectedMaterialId,
        amount: parseFloat(materialAmount),
        organization_id: userData.organization.id
      })

      // Add to local state for immediate UI update
      const selectedMaterial = materials.find(m => m.id === selectedMaterialId)
      setTaskMaterials(prev => [...prev, {
        material_id: selectedMaterialId,
        amount: parseFloat(materialAmount),
        material_name: selectedMaterial?.name,
        unit_name: selectedMaterial?.unit?.name
      }])

      // Clear form
      setSelectedMaterialId('')
      setMaterialAmount('')
      
      toast({
        title: "Material agregado",
        description: "El material se agregó correctamente a la tarea.",
      })
    } catch (error) {
      console.error('Error adding material:', error)
      toast({
        title: "Error",
        description: "Error al agregar el material.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Final step: Complete and close
  const handleComplete = () => {
    toast({
      title: "Tarea completada",
      description: `Tarea guardada con ${taskMaterials.length} materiales.`,
    })
    onClose()
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
            <div>
              <Label className="text-sm font-medium text-muted-foreground">PASO 1 DE 2</Label>
              <h3 className="text-lg font-medium mt-1">Configurar Parámetros de Tarea</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Selecciona los parámetros para generar la tarea paramétrica.
              </p>
            </div>
            
            <Separator />
            
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
            <div>
              <Label className="text-sm font-medium text-muted-foreground">PASO 2 DE 2</Label>
              <h3 className="text-lg font-medium mt-1">Agregar Materiales</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Agrega materiales necesarios para esta tarea. La tarea ya fue guardada exitosamente.
              </p>
            </div>
            
            <Separator />
            
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
                          onClick={() => {
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

  // Header content
  const headerContent = (
    <FormModalStepHeader 
      title="Editar Tarea para Métrica"
      icon={Zap}
      currentStep={currentStep}
      totalSteps={2}
      stepDescription={currentStep === 1 ? "Configurar parámetros de la tarea" : "Agregar materiales a la tarea"}
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
        previousAction: currentStep > 1 ? {
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