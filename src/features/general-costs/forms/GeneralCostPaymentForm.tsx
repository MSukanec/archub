import { useRef } from 'react'
import { DollarSign } from 'lucide-react'
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal'
import { GeneralCostPaymentFormFields } from './GeneralCostPaymentFormFields'

interface GeneralCostPaymentFormProps {
  modalData?: any
  organizationId?: string
  paymentId?: string
  mode?: 'create' | 'edit'
  onClose: () => void
}

export default function GeneralCostPaymentForm({ 
  modalData, 
  organizationId: orgIdProp, 
  paymentId: paymentIdProp, 
  mode: modeProp, 
  onClose 
}: GeneralCostPaymentFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  
  const organizationId = orgIdProp || modalData?.organizationId
  const paymentId = paymentIdProp || modalData?.paymentId
  const mode = modeProp || modalData?.mode || (paymentId ? 'edit' : 'create')

  const getHeader = () => {
    if (mode === 'edit') {
      return {
        title: 'Editar Pago de Gastos Generales',
        description: 'Actualiza los detalles del pago',
      }
    }
    return {
      title: 'Nuevo Pago de Gastos Generales',
      description: 'Registra un nuevo pago de gastos generales',
    }
  }

  const handleSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit()
    }
  }

  const header = getHeader()

  return (
    <ModalLayout 
      onClose={onClose} 
      size="lg"
      headerContent={
        <ModalHeader
          title={header.title}
          description={header.description}
          icon={DollarSign}
        />
      }
      footerContent={
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={onClose}
          submitText={mode === 'edit' ? 'Actualizar Pago' : 'Guardar Pago'}
          onSubmit={handleSubmit}
        />
      }
    >
      <ModalBody>
        <GeneralCostPaymentFormFields
          organizationId={organizationId}
          paymentId={paymentId}
          mode={mode}
          onSuccess={onClose}
          onCancel={onClose}
          hideActions={true}
          formRef={formRef}
        />
      </ModalBody>
    </ModalLayout>
  )
}
