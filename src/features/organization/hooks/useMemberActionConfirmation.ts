import { useGlobalModalStore } from '@/components/modal'

interface BillingInfo {
  hasPaidForSeat?: boolean
  creditAvailable?: number
  currentPlanName?: string
  willReceiveCredit?: boolean
  creditAmount?: number
  nextBillingDate?: string
}

interface RevokeInvitationOptions {
  memberName: string
  memberEmail: string
  memberRole?: string
  billingInfo?: BillingInfo
  onConfirm: () => void | Promise<void>
  isLoading?: boolean
}

interface RemoveMemberOptions {
  memberName: string
  memberEmail: string
  memberRole?: string
  billingInfo?: BillingInfo
  onConfirm: () => void | Promise<void>
  isLoading?: boolean
}

export function useMemberActionConfirmation() {
  const { openModal, popModal } = useGlobalModalStore()

  const showRevokeInvitationConfirmation = (options: RevokeInvitationOptions) => {
    openModal('member-action-confirmation', {
      actionType: 'revoke_invitation',
      memberName: options.memberName,
      memberEmail: options.memberEmail,
      memberRole: options.memberRole,
      billingInfo: options.billingInfo,
      onConfirm: options.onConfirm,
      isLoading: options.isLoading || false,
    })
  }

  const showRemoveMemberConfirmation = (options: RemoveMemberOptions) => {
    openModal('member-action-confirmation', {
      actionType: 'remove_member',
      memberName: options.memberName,
      memberEmail: options.memberEmail,
      memberRole: options.memberRole,
      billingInfo: options.billingInfo,
      onConfirm: options.onConfirm,
      isLoading: options.isLoading || false,
    })
  }

  return {
    showRevokeInvitationConfirmation,
    showRemoveMemberConfirmation,
    closeConfirmation: popModal,
  }
}
