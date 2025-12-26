import { Bell } from 'lucide-react'
import { FormModalHeader, FormModalFooter, FormModalLayout } from '@/components/modal'
import { FormPanel, ViewPanel, useNotificationForm, Notification } from '../forms/AdminNotificationForm'
interface NotificationModalProps {
  modalData?: {
    notification?: Notification
    isEditing?: boolean
  }
  onClose: () => void
}
export function AdminNotificationModal({ modalData, onClose }: NotificationModalProps) {
  const { notification } = modalData || {}
  const {
    form,
    onSubmit,
    isSubmitting,
    isEditing,
  } = useNotificationForm({
    notification,
    onSuccess: onClose,
  })
  const headerContent = (
    <FormModalHeader 
      title={isEditing ? 'Editar Notificación': 'Nueva Notificación'}
      icon={Bell}
    />
  )
  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isEditing ? 'Actualizar': 'Crear Notificación'}
      onRightClick={form.handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
    />
  )
  return (
    <FormModalLayout
      columns={1}
      viewPanel={<ViewPanel notification={notification} />}
      editPanel={<FormPanel form={form} />}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
      isEditing={true}
    />
  )
}
