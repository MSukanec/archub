import { Plus, Eye, Edit } from 'lucide-react'
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal'
import { FormPanel, ViewPanel, useTaskParameterOptionForm } from '../forms/TaskParameterOptionForm'
import type { TaskParameterOption } from '@/features/tasks'

interface TaskParameterOptionModalProps {
  modalData?: {
    parameterId?: string
    parameterLabel?: string
    option?: TaskParameterOption
    mode?: 'create' | 'edit' | 'view'
  }
  onClose: () => void
}

export function TaskParameterOptionModal({ 
  modalData,
  onClose,
}: TaskParameterOptionModalProps) {
  const { parameterId, parameterLabel, option, mode: dataMode } = modalData || {}
  const mode = dataMode || (option ? 'edit' : 'create')

  const {
    form,
    onSubmit,
    categories,
    units,
    isTipoTareaParameter,
    isSubmitting,
    isEditing,
  } = useTaskParameterOptionForm({
    parameterId,
    option,
    onSuccess: onClose,
  })

  const getHeader = () => {
    switch (mode) {
      case 'view':
        return {
          title: option?.label || 'Detalle de Opción',
          description: parameterLabel ? `Opción del parámetro "${parameterLabel}"` : 'Información de la opción',
        }
      case 'edit':
        return {
          title: 'Editar Opción',
          description: parameterLabel ? `Modificar opción del parámetro "${parameterLabel}"` : 'Modificar datos de la opción',
        }
      case 'create':
      default:
        return {
          title: 'Nueva Opción',
          description: parameterLabel ? `Agregar opción al parámetro "${parameterLabel}"` : 'Agregar nueva opción',
        }
    }
  }

  const header = getHeader()

  return (
    <ModalLayout onClose={onClose} size="md">
      <ModalHeader
        title={header.title}
        description={header.description}
        icon={mode === 'view' ? Eye : mode === 'edit' ? Edit : Plus}
      />

      <ModalBody>
        {mode === 'view' && option ? (
          <ViewPanel 
            option={option} 
            categories={categories} 
            units={units} 
            isTipoTareaParameter={isTipoTareaParameter} 
          />
        ) : (
          <FormPanel 
            form={form} 
            categories={categories} 
            units={units} 
            isTipoTareaParameter={isTipoTareaParameter} 
          />
        )}
      </ModalBody>

      {mode !== 'view' && (
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={onClose}
          submitText={isEditing ? 'Guardar Cambios' : 'Crear Opción'}
          onSubmit={form.handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
        />
      )}

      {mode === 'view' && (
        <ModalFooter
          leftLabel="Cerrar"
          onLeftClick={onClose}
        />
      )}
    </ModalLayout>
  )
}

export const TaskParameterOptionFormModal = TaskParameterOptionModal
