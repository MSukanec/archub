import { Package2, Eye, Edit } from 'lucide-react'
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal'
import { FormPanel, ViewPanel, useTaskCategoryForm } from '../forms/TaskCategoryForm'
import { TaskCategoryAdmin } from '@/features/tasks'

interface TaskCategoryModalProps {
  modalData?: {
    editingCategory?: TaskCategoryAdmin
    isEditing?: boolean
    mode?: 'create' | 'edit' | 'view'
  }
  onClose: () => void
  mode?: 'create' | 'edit' | 'view'
}

export function TaskCategoryModal({ modalData, onClose, mode: propMode }: TaskCategoryModalProps) {
  const { editingCategory, isEditing = false } = modalData || {}
  
  const mode = propMode || modalData?.mode || (editingCategory ? 'edit' : 'create')

  const {
    form,
    onSubmit,
    categories,
    isSubmitting,
  } = useTaskCategoryForm({
    editingCategory,
    mode,
    onSuccess: onClose,
  })

  const getHeader = () => {
    switch (mode) {
      case 'view':
        return {
          title: editingCategory?.name || 'Detalle de Categoría',
          description: 'Información de la categoría de tareas',
        }
      case 'edit':
        return {
          title: 'Editar Categoría',
          description: 'Modifica los datos de la categoría',
        }
      case 'create':
      default:
        return {
          title: 'Nueva Categoría',
          description: 'Agrega una nueva categoría de tareas',
        }
    }
  }

  const header = getHeader()

  if (mode === 'view' && !editingCategory) {
    return (
      <ModalLayout onClose={onClose} size="md">
        <ModalHeader title="Categoría no encontrada" />
        <ModalBody>
          <p className="text-muted-foreground">No se pudo cargar la categoría.</p>
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
        icon={mode === 'view' ? Eye : mode === 'edit' ? Edit : Package2}
      />

      <ModalBody>
        {mode === 'view' && editingCategory ? (
          <ViewPanel category={editingCategory} />
        ) : (
          <FormPanel form={form} categories={categories} />
        )}
      </ModalBody>

      {mode !== 'view' && (
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={onClose}
          submitText={mode === 'create' ? 'Crear Categoría' : 'Guardar Cambios'}
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

export const TaskCategoryFormModal = TaskCategoryModal
