import React, { useState } from 'react'
import { toast } from '@/hooks/use-toast'
import { useCreateGeneratedTask, useUpdateGeneratedTask } from '@/hooks/use-generated-tasks'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { ParametricTaskBuilder } from '@/components/ui-custom/ParametricTaskBuilder'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

import { Zap, Sparkles } from 'lucide-react'

interface ParametricTaskFormModalProps {
  modalData: {
    isEditing?: boolean
    task?: any
  }
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
  const [isLoading, setIsLoading] = useState(false)
  const [selections, setSelections] = useState<ParameterSelection[]>([])
  const [taskPreview, setTaskPreview] = useState<string>('')
  const [parameterOrder, setParameterOrder] = useState<string[]>([])
  const { task, isEditing, taskData } = modalData
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

  const handleSubmit = async () => {
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
      // Construir objeto JSON con los valores de parámetros usando optionLabel
      const paramValues: Record<string, string> = {}
      selections.forEach(selection => {
        paramValues[selection.parameterSlug] = selection.optionLabel
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
        
        toast({
          title: "Tarea actualizada",
          description: `Tarea actualizada: "${taskPreview}"`,
        })
      } else {
        // Create new task using the centralized SQL function
        const result = await createTaskMutation.mutateAsync({
          param_values: paramValues,
          param_order: parameterOrder
        })
        
        console.log('✅ Task created with code:', result.generated_code);
        
        toast({
          title: "Tarea generada",
          description: `Tarea creada con código ${result.generated_code}: "${taskPreview}"`,
        })
      }
      
      onClose()
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

  const viewPanel = (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Tarea generada</Label>
        <p className="text-sm text-muted-foreground mt-1">{task?.preview || 'Sin vista previa'}</p>
      </div>
      <div>
        <Label className="text-sm font-medium">Parámetros configurados</Label>
        <p className="text-sm text-muted-foreground mt-1">
          {Object.keys(task?.parameter_config || {}).length} parámetros seleccionados
        </p>
      </div>
    </div>
  )

  const editPanel = (
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

  const headerContent = (
    <FormModalHeader 
      title={actualTask ? "Editar Tarea Paramétrica" : "Nueva Tarea Paramétrica"}
      icon={Zap}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={actualTask ? "Actualizar Tarea" : "Crear Tarea"}
      onRightClick={handleSubmit}
      isLoading={isLoading}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
      isEditing={true}
    />
  )
}