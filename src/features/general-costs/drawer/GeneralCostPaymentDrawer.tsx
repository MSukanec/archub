import { DollarSign } from 'lucide-react'
import { GeneralCostPaymentFormFields } from '../forms/GeneralCostPaymentFormFields'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'

interface GeneralCostPaymentDrawerProps {
  modalData?: any
  organizationId?: string
  paymentId?: string
  mode?: 'create' | 'edit'
  onClose: () => void
}

export default function GeneralCostPaymentDrawer({ 
  modalData, 
  organizationId: orgIdProp, 
  paymentId: paymentIdProp, 
  mode: modeProp, 
  onClose 
}: GeneralCostPaymentDrawerProps) {
  const formRef = useRef<HTMLFormElement>(null)
  
  const organizationId = orgIdProp || modalData?.organizationId
  const paymentId = paymentIdProp || modalData?.paymentId
  const mode = modeProp || modalData?.mode || (paymentId ? 'edit' : 'create')

  const handleSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4">
        <GeneralCostPaymentFormFields
          organizationId={organizationId}
          paymentId={paymentId}
          mode={mode}
          onSuccess={onClose}
          onCancel={onClose}
          hideActions={true}
          formRef={formRef}
        />
      </div>
      <div className="border-t border-border p-4 flex gap-2 justify-end shrink-0 bg-background">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
        >
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
        >
          {mode === 'edit' ? 'Actualizar Pago' : 'Guardar Pago'}
        </Button>
      </div>
    </div>
  )
}
