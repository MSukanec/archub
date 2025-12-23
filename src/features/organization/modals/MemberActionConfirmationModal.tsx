import { useState } from 'react'
import { useGlobalModalStore } from "@/components/modal"
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from "@/components/modal"
import { AlertTriangle, UserMinus, Mail, XCircle, CreditCard, Info } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

type ActionType = 'revoke_invitation' | 'remove_member'

interface BillingInfo {
  hasPaidForSeat?: boolean
  creditAvailable?: number
  currentPlanName?: string
  willReceiveCredit?: boolean
  creditAmount?: number
  nextBillingDate?: string
}

interface MemberActionConfirmationModalProps {
  modalData?: {
    actionType: ActionType
    memberName: string
    memberEmail: string
    memberRole?: string
    billingInfo?: BillingInfo
    onConfirm: () => void | Promise<void>
    isLoading?: boolean
  }
  onClose: () => void
}

function RevokeInvitationContent({
  memberName,
  memberEmail,
  memberRole,
  billingInfo,
}: {
  memberName: string
  memberEmail: string
  memberRole?: string
  billingInfo?: BillingInfo
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">{memberName || memberEmail}</p>
            {memberName && <p className="text-xs text-muted-foreground">{memberEmail}</p>}
            {memberRole && (
              <p className="text-xs text-muted-foreground mt-1">Rol: {memberRole}</p>
            )}
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span className="text-xs font-medium">Invitación pendiente</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              ¿Qué pasará al revocar?
            </p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-amber-500">•</span>
                <span>La invitación será cancelada y el usuario ya no podrá aceptarla</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500">•</span>
                <span>El usuario no recibirá ninguna notificación sobre la revocación</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500">•</span>
                <span>Podrás volver a invitarlo más adelante si lo deseas</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {billingInfo?.hasPaidForSeat && (
        <>
          <Separator />
          <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
            <div className="flex items-start gap-2">
              <CreditCard className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-primary">
                  Información de facturación
                </p>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <p>
                    Ya pagaste por este asiento en tu plan <span className="font-medium">{billingInfo.currentPlanName}</span>.
                  </p>
                  {billingInfo.willReceiveCredit && (
                    <div className="flex items-center gap-2 mt-2 p-2 rounded bg-green-500/10 border border-green-500/20">
                      <Info className="h-4 w-4 text-green-600" />
                      <p className="text-green-700 dark:text-green-400">
                        Recibirás un crédito de <span className="font-semibold">${billingInfo.creditAmount}</span> para usar en futuras invitaciones
                      </p>
                    </div>
                  )}
                  {!billingInfo.willReceiveCredit && (
                    <div className="flex items-center gap-2 mt-2 p-2 rounded bg-muted border border-border">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <p>
                        El asiento quedará disponible para invitar a otra persona sin costo adicional hasta el {billingInfo.nextBillingDate}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!billingInfo?.hasPaidForSeat && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Esta acción no tiene costo. Podrás volver a invitar a este usuario o a otra persona cuando lo desees.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

function RemoveMemberContent({
  memberName,
  memberEmail,
  memberRole,
  billingInfo,
}: {
  memberName: string
  memberEmail: string
  memberRole?: string
  billingInfo?: BillingInfo
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <UserMinus className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">{memberName || memberEmail}</p>
            {memberName && memberEmail !== memberName && (
              <p className="text-xs text-muted-foreground">{memberEmail}</p>
            )}
            {memberRole && (
              <p className="text-xs text-muted-foreground mt-1">Rol: {memberRole}</p>
            )}
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span className="text-xs font-medium">Miembro activo</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-destructive">
              ¿Qué pasará al eliminar este miembro?
            </p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-destructive">•</span>
                <span>Perderá acceso inmediato a la organización y todos sus proyectos</span>
              </li>
              <li className="flex gap-2">
                <span className="text-destructive">•</span>
                <span>Sus tareas asignadas quedarán sin asignar</span>
              </li>
              <li className="flex gap-2">
                <span className="text-destructive">•</span>
                <span>Su historial de actividad se conservará para auditoría</span>
              </li>
              <li className="flex gap-2">
                <span className="text-destructive">•</span>
                <span>Podrás volver a invitarlo más adelante si lo deseas</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {billingInfo?.hasPaidForSeat && (
        <>
          <Separator />
          <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
            <div className="flex items-start gap-2">
              <CreditCard className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-primary">
                  Información de facturación
                </p>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <p>
                    Este miembro ocupa un asiento de tu plan <span className="font-medium">{billingInfo.currentPlanName}</span>.
                  </p>
                  {billingInfo.willReceiveCredit && (
                    <div className="flex items-center gap-2 mt-2 p-2 rounded bg-green-500/10 border border-green-500/20">
                      <Info className="h-4 w-4 text-green-600" />
                      <p className="text-green-700 dark:text-green-400">
                        Se generará un crédito prorrateado de <span className="font-semibold">${billingInfo.creditAmount}</span> aplicable a tu próxima factura
                      </p>
                    </div>
                  )}
                  {!billingInfo.willReceiveCredit && (
                    <div className="flex items-center gap-2 mt-2 p-2 rounded bg-muted border border-border">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <p>
                        El asiento quedará libre para invitar a otra persona sin costo adicional hasta el próximo ciclo de facturación ({billingInfo.nextBillingDate})
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!billingInfo?.hasPaidForSeat && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Esta acción no tiene impacto en tu facturación. Podrás volver a invitar a este usuario o a otra persona cuando lo desees.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default function MemberActionConfirmationModal({
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
        {isRevoke ? (
          <RevokeInvitationContent
            memberName={memberName}
            memberEmail={memberEmail}
            memberRole={memberRole}
            billingInfo={billingInfo}
          />
        ) : (
          <RemoveMemberContent
            memberName={memberName}
            memberEmail={memberEmail}
            memberRole={memberRole}
            billingInfo={billingInfo}
          />
        )}
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
