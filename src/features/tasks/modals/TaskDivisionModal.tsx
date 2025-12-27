import { Package2, Eye, Edit } from 'lucide-react'
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal'
import { FormPanel, ViewPanel, useTaskDivisionForm } from '../forms/TaskDivisionForm'
import type { TaskDivisionAdmin } from '@/features/tasks'

interface TaskDivisionModalProps {
  modalData?: {
    editingDivision?: TaskDivisionAdmin
    isEditing?: boolean
    divisionId?: string
  }
  onClose: () => void
}

export function TaskDivisionModal({ modalData, onClose }: TaskDivisionModalProps) {
  const { editingDivision, isEditing = false } = modalData || {}
  const mode = editingDivision ? 'edit' : 'create'

  const {
    form,
    onSubmit,
    allDivisions,
    isSubmitting,
  } = useTaskDivisionForm({
    editingDivision,
    onSuccess: onClose,
  })

  const getHeader = () => {
    switch (mode) {
      case 'edit':
        return {
          title: 'Editar División',
          description: 'Modifica los datos de la división',
        }
      case 'create':
      default:
        return {
          title: 'Nueva División',
          description: 'Crea una nueva división de tareas',
        }
    }
  }

  const header = getHeader()

  return (
    <ModalLayout onClose={onClose} size="md">
      <ModalHeader
        title={header.title}
        description={header.description}
        icon={mode === 'edit' ? Edit : Package2}
      />

      <ModalBody>
        <FormPanel 
          form={form} 
          allDivisions={allDivisions}
          editingDivisionId={editingDivision?.id}
        />
      </ModalBody>

      <ModalFooter
        leftLabel="Cancelar"
        onLeftClick={onClose}
        submitText={mode === 'create' ? 'Crear' : 'Actualizar'}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={isSubmitting}
      />
    </ModalLayout>
  )
}

export { TaskDivisionModal as TaskDivisionFormModal }
