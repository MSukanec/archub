import { useState, useRef, useMemo } from 'react'
import { DollarSign, Users, Package, CreditCard, TrendingUp, TrendingDown, Briefcase } from 'lucide-react'
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CascadingSelect } from '@/components/ui-custom/fields/CascadingSelectField'
import { useProjectContext } from '@/stores/projectContext'
import { useProjectsLite } from '@/features/projects'
import { ClientPaymentFormFields } from '@/features/clients/forms/ClientPaymentFormFields'
import { MaterialPaymentFormFields } from '@/features/materials/forms/MaterialPaymentFormFields'
import { PersonnelPaymentFormFields } from '@/features/personnel/forms/PersonnelPaymentFormFields'
import { PartnerContributionFormFields, PartnerWithdrawalFormFields } from '@/features/capital'
import { GeneralCostPaymentFormFields } from '@/features/general-costs/forms/GeneralCostPaymentFormFields'

type MovementType = 'client_payment' | 'material_payment' | 'personnel_payment' | 'partner_contribution' | 'partner_withdrawal' | 'general_cost_payment'

const MOVEMENT_TYPES_REQUIRING_PROJECT: MovementType[] = [
  'client_payment',
  'material_payment',
  'personnel_payment',
]

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
  {
    id: 'partner_contribution',
    label: 'Aporte de Socio',
    description: 'Registrar aporte de capital de un socio',
    icon: TrendingUp,
    color: 'text-emerald-600',
    submitLabel: 'Registrar Aporte',
  },
  {
    id: 'partner_withdrawal',
    label: 'Retiro de Socio',
    description: 'Registrar retiro de capital de un socio',
    icon: TrendingDown,
    color: 'text-rose-600',
    submitLabel: 'Registrar Retiro',
  },
  {
    id: 'general_cost_payment',
    label: 'Pago de Gasto General',
    description: 'Registrar pago de gastos generales',
    icon: Briefcase,
    color: 'text-red-600',
    submitLabel: 'Registrar Pago',
  },
]

// Opciones jerárquicas para CascadingSelect
interface CascadingOption {
  value: string
  label: string
  children?: CascadingOption[]
}

const CASCADING_MOVEMENT_OPTIONS: CascadingOption[] = [
  {
    value: 'ingresos',
    label: 'Ingresos',
    children: [
      {
        value: 'client_payment',
        label: 'Pago de Cliente',
      },
      {
        value: 'partner_contribution',
        label: 'Aporte de Socio',
      },
    ],
  },
  {
    value: 'egresos',
    label: 'Egresos',
    children: [
      {
        value: 'material_payment',
        label: 'Pago de Material',
      },
      {
        value: 'personnel_payment',
        label: 'Pago de Personal',
      },
      {
        value: 'partner_withdrawal',
        label: 'Retiro de Socio',
      },
      {
        value: 'general_cost_payment',
        label: 'Pago de Gasto General',
      },
    ],
  },
]

interface NewMovementModalProps {
  modalData?: {
    projectId?: string
    organizationId?: string
    isProjectContext?: boolean
  }
  onClose: () => void
}

export function NewMovementModal({ modalData, onClose }: NewMovementModalProps) {
  const [selectedType, setSelectedType] = useState<MovementType | null>(null)
  const [selectedProjectIdForMovement, setSelectedProjectIdForMovement] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const { selectedProjectId, currentOrganizationId } = useProjectContext()
  const { data: projects = [] } = useProjectsLite()

  const isProjectContext = modalData?.isProjectContext ?? false
  const contextProjectId = modalData?.projectId || (isProjectContext ? selectedProjectId : null) || undefined
  const organizationId = modalData?.organizationId || currentOrganizationId || undefined

  const requiresProjectSelector = useMemo(() => {
    if (!selectedType) return false
    if (isProjectContext || contextProjectId) return false
    return MOVEMENT_TYPES_REQUIRING_PROJECT.includes(selectedType)
  }, [selectedType, isProjectContext, contextProjectId])

  const effectiveProjectId = contextProjectId || selectedProjectIdForMovement || undefined

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
      projectId: effectiveProjectId,
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
      case 'partner_contribution':
        return <PartnerContributionFormFields {...commonProps} />
      case 'partner_withdrawal':
        return <PartnerWithdrawalFormFields {...commonProps} />
      case 'general_cost_payment':
        return <GeneralCostPaymentFormFields {...commonProps} />
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
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Tipo de Movimiento</Label>
          <CascadingSelect
            options={CASCADING_MOVEMENT_OPTIONS}
            value={selectedType ? [selectedType] : []}
            onValueChange={(value) => {
              // El último valor en la ruta es el tipo de movimiento final
              if (value.length > 0) {
                setSelectedType(value[value.length - 1] as MovementType)
              }
            }}
            placeholder="Selecciona un tipo de movimiento"
            data-testid="select-movement-type"
          />
        </div>

        {requiresProjectSelector && (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Proyecto</Label>
            <Select
              value={selectedProjectIdForMovement || ''}
              onValueChange={(value) => setSelectedProjectIdForMovement(value)}
            >
              <SelectTrigger data-testid="select-project">
                <SelectValue placeholder="Selecciona un proyecto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem 
                    key={project.id} 
                    value={project.id}
                    data-testid={`option-project-${project.id}`}
                  >
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

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
