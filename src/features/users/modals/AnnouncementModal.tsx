import { Bell } from 'lucide-react'
import { FormModalHeader, FormModalFooter, FormModalLayout } from '@/components/modal'
import { FormPanel, useAnnouncementForm, type Announcement } from '../forms/AnnouncementForm'

interface AnnouncementModalProps {
  modalData?: {
    announcement?: Announcement
    isEditing?: boolean
  }
  onClose: () => void
}

export function AnnouncementModal({ modalData, onClose }: AnnouncementModalProps) {
  const { announcement } = modalData || {}

  const {
    form,
    onSubmit,
    isSubmitting,
  } = useAnnouncementForm({
    announcement,
    onSuccess: onClose,
  })

  const headerContent = (
    <FormModalHeader 
      title={announcement ? 'Editar Anuncio' : 'Nuevo Anuncio'}
      description={announcement ? 'Actualiza la información del anuncio global' : 'Crea un nuevo anuncio que aparecerá en todo el sistema'}
      icon={Bell}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={announcement ? 'Actualizar' : 'Crear Anuncio'}
      onRightClick={form.handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      viewPanel={<div></div>}
      editPanel={<FormPanel form={form} />}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
      isEditing={true}
    />
  )
}
