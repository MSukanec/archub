import { useRef, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PartnerContributionFormFields } from '../forms/PartnerContributionFormFields'
import { PartnerWithdrawalFormFields } from '../forms/PartnerWithdrawalFormFields'

type TransactionType = 'contribution' | 'withdrawal' | null

interface CapitalTransactionModalProps {
  modalData?: {
    projectId?: string;
    organizationId?: string;
  };
  onClose: () => void;
}

export function CapitalTransactionModal({ modalData, onClose }: CapitalTransactionModalProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [selectedType, setSelectedType] = useState<TransactionType>(null)

  const getHeader = () => {
    if (selectedType === 'contribution') {
      return {
        title: 'Nuevo Aporte de Socio',
        description: 'Registra un nuevo aporte de capital de un socio',
        icon: TrendingUp,
      }
    }
    if (selectedType === 'withdrawal') {
      return {
        title: 'Nuevo Retiro de Socio',
        description: 'Registra un nuevo retiro de capital de un socio',
        icon: TrendingDown,
      }
    }
    return {
      title: 'Nueva Transacción de Capital',
      description: 'Selecciona el tipo de transacción a registrar',
      icon: undefined,
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
      size={selectedType ? 'lg' : 'md'}
      headerContent={
        <ModalHeader
          title={header.title}
          description={header.description}
          icon={header.icon}
        />
      }
      footerContent={
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={onClose}
          submitText={selectedType ? 'Registrar' : 'Seleccionar'}
          onSubmit={handleSubmit}
          submitDisabled={!selectedType}
        />
      }
    >
      <ModalBody>
        {!selectedType ? (
          <div className="space-y-4">
            <label className="text-sm font-medium text-foreground">
              Tipo de Transacción <span className="text-red-500">*</span>
            </label>
            <Select value={selectedType || ''} onValueChange={(value) => setSelectedType(value as TransactionType)}>
              <SelectTrigger data-testid="select-transaction-type">
                <SelectValue placeholder="Seleccionar tipo de transacción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contribution">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[var(--positive)]" />
                    <span>Nuevo Aporte</span>
                  </div>
                </SelectItem>
                <SelectItem value="withdrawal">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-[var(--negative)]" />
                    <span>Nuevo Retiro</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : selectedType === 'contribution' ? (
          <PartnerContributionFormFields
            projectId={modalData?.projectId}
            organizationId={modalData?.organizationId}
            mode="create"
            onSuccess={onClose}
            onCancel={onClose}
            hideActions={true}
            formRef={formRef}
          />
        ) : (
          <PartnerWithdrawalFormFields
            projectId={modalData?.projectId}
            organizationId={modalData?.organizationId}
            mode="create"
            onSuccess={onClose}
            onCancel={onClose}
            hideActions={true}
            formRef={formRef}
          />
        )}
      </ModalBody>
    </ModalLayout>
  )
}

export default CapitalTransactionModal
