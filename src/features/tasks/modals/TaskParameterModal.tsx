import { Settings, Eye, Edit } from 'lucide-react'
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal'
import { useGlobalModalStore } from '@/components/modal'
import { FormPanel, ViewPanel, useTaskParameterForm, type TaskParameterFormInput } from '../forms/TaskParameterForm'

interface TaskParameterModalProps {
  modalData?: {
    parameter?: TaskParameterFormInput
    onParameterCreated?: (parameterId: string) => void
  }
  onClose: () => void
  mode?: 'create' | 'edit' | 'view'
}

export function TaskParameterModal({ modalData, onClose, mode = 'create' }: TaskParameterModalProps) {
  const { openModal } = useGlobalModalStore()
  const { parameter, onParameterCreated } = modalData || {}

  const effectiveMode = mode || (parameter ? 'edit' : 'create')

  const handleSuccess = (parameterId?: string) => {
    if (onParameterCreated && parameterId) {
      onParameterCreated(parameterId)
    }
    onClose()
  }

  const {
    form,
    onSubmit,
    isSubmitting,
  } = useTaskParameterForm({
    parameter,
    mode: effectiveMode,
    onSuccess: handleSuccess,
  })

  const getHeader = () => {
    switch (effectiveMode) {
      case 'view':
        return {
          title: parameter?.label || 'Detalle de Parámetro',
          description: 'Información del parámetro de tarea',
        }
      case 'edit':
        return {
          title: 'Editar Parámetro',
          description: 'Modifica los datos del parámetro',
        }
      case 'create':
      default:
        return {
          title: 'Nuevo Parámetro',
          description: 'Crea un nuevo parámetro de plantilla',
        }
    }
  }

  const header = getHeader()

  if (effectiveMode === 'view' && !parameter) {
    return (
      <ModalLayout onClose={onClose} size="md">
        <ModalHeader title="Parámetro no encontrado" />
        <ModalBody>
          <p className="text-muted-foreground">No se pudo cargar el parámetro.</p>
        </ModalBody>
        <ModalFooter leftLabel="Cerrar" onLeftClick={onClose} />
      </ModalLayout>
    )
  }

  return (
    <ModalLayout onClose={onClose} size="md">
      <ModalHeader
        title={header.title}
        description={header.description}
        icon={effectiveMode === 'view' ? Eye : effectiveMode === 'edit' ? Edit : Settings}
      />

      <ModalBody>
        {effectiveMode === 'view' && parameter ? (
          <ViewPanel parameter={parameter} />
        ) : (
          <FormPanel form={form} isEditing={effectiveMode === 'edit'} />
        )}
      </ModalBody>

      {effectiveMode !== 'view' && (
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={onClose}
          submitText={effectiveMode === 'create' ? 'Guardar' : 'Actualizar'}
          onSubmit={form.handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
        />
      )}

      {effectiveMode === 'view' && parameter && (
        <ModalFooter
          leftLabel="Cerrar"
          onLeftClick={onClose}
          submitText="Editar"
          onSubmit={() => openModal('task-parameter', { parameter, mode: 'edit' })}
        />
      )}
    </ModalLayout>
  )
}

export const TaskParameterFormModal = TaskParameterModal
