import { User } from 'lucide-react'
import { FormModalHeader, FormModalFooter, FormModalLayout } from '@/components/modal'
import { FormPanel, ViewPanel, useUserForm } from '../forms/AdminUserForm'

interface UserModalProps {
  modalData?: {
    user?: any
    isEditing?: boolean
  }
  onClose: () => void
}

export function AdminUserModal({ modalData, onClose }: UserModalProps) {
  const { user } = modalData || {}

  const {
    form,
    onSubmit,
    isSubmitting,
  } = useUserForm({
    user,
    onSuccess: onClose,
  })

  const headerContent = (
    <FormModalHeader 
      title="Editar Usuario"
      icon={User}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel="Guardar Cambios"
      onRightClick={form.handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      viewPanel={<ViewPanel user={user} />}
      editPanel={<FormPanel form={form} />}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
      isEditing={true}
    />
  )
}
