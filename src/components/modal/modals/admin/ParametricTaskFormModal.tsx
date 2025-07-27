import { useState } from 'react'
import { toast } from '@/hooks/use-toast'

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
  const { task } = modalData
  const isEditing = !task // Si no hay task, es creación (modo edición)

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
      console.log('🔧 Creando tarea paramétrica:', {
        selections,
        preview: taskPreview,
        parameterConfig: selections.reduce((acc, sel) => {
          acc[sel.parameterSlug] = sel.optionId
          return acc
        }, {} as Record<string, string>)
      })
      
      // Aquí iría la lógica para crear la tarea paramétrica en task_parametric
      // Guardar selections y taskPreview en la base de datos
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Tarea paramétrica creada",
        description: `Tarea creada: "${taskPreview}"`,
      })
      
      onClose()
    } catch (error) {
      console.error('Error creando tarea paramétrica:', error)
      toast({
        title: "Error",
        description: "Hubo un error al crear la tarea paramétrica.",
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
      />
    </div>
  )

  const headerContent = (
    <FormModalHeader 
      title={isEditing ? "Nueva Tarea Paramétrica" : "Ver Tarea Paramétrica"}
      icon={Zap}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isEditing ? "Crear Tarea" : "Cerrar"}
      onRightClick={isEditing ? handleSubmit : onClose}
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
      isEditing={isEditing}
    />
  )
}