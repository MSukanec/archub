import { useRef, useState } from 'react'
import { TrendingUp, TrendingDown, Wallet, Receipt } from 'lucide-react'
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { PartnerContributionForm } from '../forms/PartnerContributionForm'
import { PartnerWithdrawalForm } from '../forms/PartnerWithdrawalForm'
import { CapitalAdjustmentForm } from '../forms/CapitalAdjustmentForm'

type TransactionType = 'contribution' | 'withdrawal' | 'adjustment'

interface TransactionTypeConfig {
  id: TransactionType
  label: string
  description: string
  icon: typeof TrendingUp
  color: string
  submitLabel: string
}

const TRANSACTION_TYPES: TransactionTypeConfig[] = [
  {
    id: 'contribution',
    label: 'Aporte de Socio',
    description: 'Registrar aporte de capital de un socio',
    icon: TrendingUp,
    color: 'text-[var(--positive)]',
    submitLabel: 'Registrar Aporte',
  },
  {
    id: 'withdrawal',
    label: 'Retiro de Socio',
    description: 'Registrar retiro de capital de un socio',
    icon: TrendingDown,
    color: 'text-[var(--negative)]',
    submitLabel: 'Registrar Retiro',
  },
  {
    id: 'adjustment',
    label: 'Ajuste de Capital',
    description: 'Registrar ajuste positivo o negativo',
    icon: Receipt,
    color: 'text-[var(--neutral)]',
    submitLabel: 'Registrar Ajuste',
  },
]

interface CapitalTransactionModalProps {
  modalData?: {
    projectId?: string;
    organizationId?: string;
  };
  onClose: () => void;
}

export function CapitalTransactionModal({ modalData, onClose }: CapitalTransactionModalProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [selectedType, setSelectedType] = useState<TransactionType | null>(null)

  const selectedConfig = selectedType 
    ? TRANSACTION_TYPES.find(t => t.id === selectedType) 
    : null

  const handleSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit()
    }
  }

  const renderFormFields = () => {
    if (!selectedType) return null

    const commonProps = {
      projectId: modalData?.projectId,
      organizationId: modalData?.organizationId,
      mode: 'create' as const,
      onSuccess: onClose,
      onCancel: onClose,
      hideActions: true,
      formRef,
    }

    switch (selectedType) {
      case 'contribution':
        return <PartnerContributionForm {...commonProps} />
      case 'withdrawal':
        return <PartnerWithdrawalForm {...commonProps} />
      case 'adjustment':
        return <CapitalAdjustmentForm {...commonProps} />
      default:
        return null
    }
  }

  return (
    <ModalLayout 
      onClose={onClose} 
      size="lg"
      headerContent={
        <ModalHeader
          icon={selectedConfig?.icon || Wallet}
          title={selectedConfig?.label || 'Nueva Transacción'}
          description={selectedConfig?.description || 'Selecciona el tipo de transacción a registrar'}
        />
      }
      footerContent={
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={onClose}
          submitText={selectedConfig?.submitLabel || 'Continuar'}
          onSubmit={handleSubmit}
          submitDisabled={!selectedType}
        />
      }
    >
      <ModalBody>
        <div className="space-y-1.5 w-full">
          <Label className="text-xs font-medium text-muted-foreground">Tipo de Transacción</Label>
          <Select
            value={selectedType || ''}
            onValueChange={(value) => setSelectedType(value as TransactionType)}
          >
            <SelectTrigger data-testid="select-transaction-type">
              <SelectValue placeholder="Selecciona un tipo de transacción" />
            </SelectTrigger>
            <SelectContent>
              {TRANSACTION_TYPES.map((type) => {
                const IconComponent = type.icon;
                
                return (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      <IconComponent className={cn("w-4 h-4", type.color)} />
                      <span className={type.color}>{type.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {selectedType && (
          <div className="pt-4 border-t">
            {renderFormFields()}
          </div>
        )}
      </ModalBody>
    </ModalLayout>
  )
}

export default CapitalTransactionModal
