import { useGlobalModalStore } from "@/components/modal"
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from "@/components/modal"
import { CheckCircle, XCircle, Crown, ExternalLink } from 'lucide-react'
import { Button } from "@/components/ui/button"
interface PaymentFeedbackModalProps {
  modalData?: {
    type: 'success'| 'cancelled'
    title?: string
    description?: string
    planName?: string
    isFounder?: boolean
  }
  onClose: () => void
}
export default function PaymentFeedbackModal({ modalData, onClose }: PaymentFeedbackModalProps) {
  const { closeModal } = useGlobalModalStore()
  
  const type = modalData?.type || 'success'
  const isSuccess = type === 'success'
  const isFounder = modalData?.isFounder || false
  
  const defaultTitle = isSuccess 
    ? '¡Suscripción Activada!'
    : 'Pago Cancelado'
  
  const defaultDescription = isSuccess
    ? `Tu suscripción${modalData?.planName ? ` ${modalData.planName}` : ''} ha sido activada correctamente. Ya podés disfrutar de todas las funcionalidades.`
    : 'El proceso de pago fue cancelado. No se realizó ningún cargo a tu cuenta.'
  const title = modalData?.title || defaultTitle
  const description = modalData?.description || defaultDescription
  const handleClose = () => {
    closeModal()
    onClose?.()
  }
  return (
    <ModalLayout
      onClose={handleClose}
      size="sm"
    >
      <ModalHeader
        title={title}
        icon={isSuccess ? CheckCircle : XCircle}
      />
      
      <ModalBody>
        <div className="space-y-6">
          <div className={`rounded-lg p-6 text-center ${
            isSuccess 
              ? "border border-accent/30 bg-accent/10" 
              : "border border-muted bg-muted/30"
          }`}>
            <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
              isSuccess ? "bg-accent/20" : "bg-muted"
            }`}>
              {isSuccess ? (
                <CheckCircle className="h-10 w-10 text-accent" />
              ) : (
                <XCircle className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            
            <p className="text-sm text-[var(--text-muted)]">
              {description}
            </p>
          </div>
          {isSuccess && isFounder && (
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
              <div className="flex items-start gap-3">
                <Crown className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-accent">
                    ¡Bienvenido al Programa de Fundadores!
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Has obtenido beneficios exclusivos de por vida, incluyendo acceso al curso Master ArchiCAD.
                  </p>
                  <button
                    type="button"
                    onClick={() => window.open('/settings/founders', '_blank')}
                    className="mt-2 text-xs text-accent hover:underline font-medium inline-flex items-center gap-1"
                  >
                    Ver mis beneficios de Fundador
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </ModalBody>
      
      <ModalFooter
        rightLabel={isSuccess ? "Continuar" : "Cerrar"}
        onRightClick={handleClose}
      />
    </ModalLayout>
  )
}
