import { Package } from 'lucide-react'
import { FormModalHeader, FormModalFooter, FormModalLayout } from '@/components/modal'
import { FormPanel, ViewPanel, usePlanForm, type Plan } from '../forms/PlanForm'
interface PlanModalProps {
  modalData?: {
    plan?: Plan
    isEditing?: boolean
  }
  onClose: () => void
}
export function PlanModal({ modalData, onClose }: PlanModalProps) {
  const { plan, isEditing = false } = modalData || {}
  const {
    form,
    onSubmit,
    isSubmitting,
  } = usePlanForm({
    plan,
    isEditing,
    onSuccess: onClose,
  })
  const handleClose = () => {
    form.reset()
    onClose()
  }
  const headerContent = (
    <FormModalHeader 
      title={isEditing ? 'Editar Plan': 'Nuevo Plan'}
      description={isEditing ? 'Modifica los detalles del plan de suscripción': 'Crea un nuevo plan de suscripción'}
      icon={Package}
    />
  )
  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={isEditing ? 'Guardar Cambios': 'Crear Plan'}
      onRightClick={form.handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
      submitDisabled={isSubmitting}
    />
  )
  return (
    <FormModalLayout
      columns={1}
      viewPanel={plan ? <ViewPanel plan={plan} /> : <div></div>}
      editPanel={<FormPanel form={form} isEditing={isEditing} />}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
      isEditing={true}
    />
  )
}
