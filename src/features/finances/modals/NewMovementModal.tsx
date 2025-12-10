import { useState, useRef } from 'react'
import { DollarSign, Users, Package, CreditCard } from 'lucide-react'
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProjectContext } from '@/stores/projectContext'
import { ClientPaymentFormFields } from '@/features/clients/forms/ClientPaymentFormFields'
import { MaterialPaymentFormFields } from '@/features/materials/forms/MaterialPaymentFormFields'
import { PersonnelPaymentFormFields } from '@/features/personnel/forms/PersonnelPaymentFormFields'

type MovementType = 'client_payment' | 'material_payment' | 'personnel_payment'

interface MovementTypeConfig {
  id: MovementType
  label: string
  description: string
  icon: typeof CreditCard
  color: string
  submitLabel: string
}

const MOVEMENT_TYPES: MovementTypeConfig[] = [
  {
    id: 'client_payment',
    label: 'Pago de Cliente',
    description: 'Registrar cobro de un cliente',
    icon: CreditCard,
    color: 'text-green-600',
    submitLabel: 'Registrar Pago de Cliente',
  },
  {
    id: 'material_payment',
    label: 'Pago de Material',
    description: 'Registrar pago por compra de materiales',
    icon: Package,
    color: 'text-orange-600',
    submitLabel: 'Registrar Pago de Material',
  },
  {
    id: 'personnel_payment',
    label: 'Pago de Personal',
    description: 'Registrar pago a personal de obra',
    icon: Users,
    color: 'text-blue-600',
    submitLabel: 'Registrar Pago de Personal',
  },
]

interface NewMovementModalProps {
  modalData?: {
    projectId?: string
    organizationId?: string
  }
  onClose: () => void
}

export function NewMovementModal({ modalData, onClose }: NewMovementModalProps) {
  const [selectedType, setSelectedType] = useState<MovementType | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const { selectedProjectId, currentOrganizationId } = useProjectContext()

  const projectId = modalData?.projectId || selectedProjectId || undefined
  const organizationId = modalData?.organizationId || currentOrganizationId || undefined

  const selectedConfig = selectedType 
    ? MOVEMENT_TYPES.find(t => t.id === selectedType) 
    : null

  const handleSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit()
    }
  }

  const renderFormFields = () => {
    if (!selectedType) return null

    const commonProps = {
      projectId,
      organizationId,
      mode: 'create' as const,
      onSuccess: onClose,
      onCancel: onClose,
      hideActions: true,
      formRef,
    }

    switch (selectedType) {
      case 'client_payment':
        return <ClientPaymentFormFields {...commonProps} />
      case 'material_payment':
        return <MaterialPaymentFormFields {...commonProps} />
      case 'personnel_payment':
        return <PersonnelPaymentFormFields {...commonProps} />
      default:
        return null
    }
  }

  return (
    <ModalLayout 
      onClose={onClose} 
      size={selectedType ? 'lg' : 'md'}
      headerContent={
        <ModalHeader
          icon={selectedConfig?.icon || DollarSign}
          title={selectedConfig?.label || 'Nuevo Movimiento'}
          description={selectedConfig?.description || 'Selecciona el tipo de movimiento financiero a registrar'}
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
        <div className="space-y-2">
          <Label className="text-sm font-medium">Tipo de Movimiento</Label>
          <Select
            value={selectedType || ''}
            onValueChange={(value) => setSelectedType(value as MovementType)}
          >
            <SelectTrigger data-testid="select-movement-type">
              <SelectValue placeholder="Selecciona un tipo de movimiento" />
            </SelectTrigger>
            <SelectContent>
              {MOVEMENT_TYPES.map((type) => {
                const Icon = type.icon
                return (
                  <SelectItem 
                    key={type.id} 
                    value={type.id}
                    data-testid={`option-movement-type-${type.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${type.color}`} />
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                )
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

export default NewMovementModal
