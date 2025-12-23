import { useState } from 'react'
import { useGlobalModalStore } from "@/components/modal"
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from "@/components/modal"
import { XCircle, UserMinus } from 'lucide-react'
import { MemberActionConfirmationForm, type BillingInfo } from '../forms/MemberActionConfirmationForm'

interface MemberActionConfirmationModalProps {
  modalData?: {
    actionType: 'revoke_invitation' | 'remove_member'
    memberName: string
    memberEmail: string
    memberRole?: string
    billingInfo?: BillingInfo
    onConfirm: () => void | Promise<void>
    isLoading?: boolean
  }
  onClose: () => void
}

export function MemberActionConfirmationModal({
  modalData,
}: MemberActionConfirmationModalProps) {
  const { popModal } = useGlobalModalStore()
  const [isLoading, setIsLoading] = useState(false)

  const actionType = modalData?.actionType || 'revoke_invitation'
  const memberName = modalData?.memberName || ''
  const memberEmail = modalData?.memberEmail || ''
  const memberRole = modalData?.memberRole
  const billingInfo = modalData?.billingInfo
  const onConfirm = modalData?.onConfirm
  const externalIsLoading = modalData?.isLoading || false

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm?.()
      popModal()
    } finally {
      setIsLoading(false)
    }
  }

  const isRevoke = actionType === 'revoke_invitation'
  const title = isRevoke ? 'Revocar invitación' : 'Eliminar miembro'
  const icon = isRevoke ? XCircle : UserMinus
  const submitText = isRevoke ? 'Revocar invitación' : 'Eliminar miembro'
  const loadingText = isRevoke ? 'Revocando...' : 'Eliminando...'

  return (
    <ModalLayout onClose={popModal} size="md">
      <ModalHeader 
        title={title}
        description={isRevoke 
          ? "Confirma que deseas revocar esta invitación pendiente"
          : "Confirma que deseas eliminar este miembro de la organización"
        }
        icon={icon}
      />
      
      <ModalBody>
        <MemberActionConfirmationForm
          actionType={actionType}
          memberName={memberName}
          memberEmail={memberEmail}
          memberRole={memberRole}
          billingInfo={billingInfo}
        />
      </ModalBody>

      <ModalFooter
        leftLabel="Cancelar"
        onLeftClick={popModal}
        submitText={isLoading || externalIsLoading ? loadingText : submitText}
        onSubmit={handleConfirm}
        submitVariant="destructive"
        isSubmitting={isLoading || externalIsLoading}
      />
    </ModalLayout>
  )
}
