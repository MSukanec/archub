import { FileText } from 'lucide-react'
import { FormModalHeader, FormModalFooter, FormModalLayout } from '@/components/modal'
import { FormPanel, ViewPanel, useChangelogForm, ChangelogEntry } from '../forms/ChangelogForm'

interface ChangelogModalProps {
  modalData?: {
    entry?: ChangelogEntry
    isEditing?: boolean
  }
  onClose: () => void
}

export function ChangelogModal({ modalData, onClose }: ChangelogModalProps) {
  const { entry } = modalData || {}

  const {
    form,
    onSubmit,
    isSubmitting,
  } = useChangelogForm({
    entry,
    onSuccess: onClose,
  })

  const headerContent = (
    <FormModalHeader 
      title={entry ? 'Editar Entrada del Changelog' : 'Nueva Entrada del Changelog'}
      icon={FileText}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={entry ? 'Actualizar' : 'Crear Entrada'}
      onRightClick={form.handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      viewPanel={<ViewPanel entry={entry} />}
      editPanel={<FormPanel form={form} />}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
      isEditing={true}
    />
  )
}
