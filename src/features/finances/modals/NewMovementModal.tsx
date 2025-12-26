import { useState, useRef, useMemo } from 'react'
import { DollarSign, Users, Package, CreditCard, TrendingUp, TrendingDown, Briefcase, ArrowRightLeft, Wallet } from 'lucide-react'
import { useLocation } from 'wouter'
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProjectContext } from '@/stores/projectContext'
import { useProjectsLite } from '@/features/projects'
import { cn } from '@/lib/utils'
import { ClientPaymentForm } from '@/features/clients/forms/ClientPaymentForm'
import { MaterialPaymentFormFields } from '@/features/materials/forms/MaterialPaymentFormFields'
import { PersonnelPaymentFormFields } from '@/features/personnel/forms/PersonnelPaymentForm'
import { PartnerContributionForm, PartnerWithdrawalForm } from '@/features/capital'
import { GeneralCostPaymentFormFields } from '@/features/general-costs/forms/GeneralCostPaymentForm'
import { WalletTransferFormFields } from '../forms/WalletTransferFormFields'
import { CurrencyExchangeFormFields } from '../forms/CurrencyExchangeFormFields'

type MovementType = 'client_payment' | 'material_payment' | 'personnel_payment' | 'partner_contribution' | 'partner_withdrawal' | 'general_cost_payment' | 'wallet_transfer' | 'currency_exchange'

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
  hasNavigation?: boolean
}

const MOVEMENT_TYPES: MovementTypeConfig[] = [
  {
    id: 'partner_contribution',
    label: 'Aporte de Socio',
    description: 'Registrar aporte de capital de un socio',
    icon: TrendingUp,
    color: 'text-[var(--positive)]',
    submitLabel: 'Registrar Aporte',
  },
  {
    id: 'client_payment',
    label: 'Pago de Cliente',
    description: 'Registrar cobro de un cliente',
    icon: CreditCard,
    color: 'text-[var(--positive)]',
    submitLabel: 'Registrar Pago de Cliente',
  },
  {
    id: 'general_cost_payment',
    label: 'Pago de Gasto General',
    description: 'Registrar pago de gastos generales',
    icon: Briefcase,
    color: 'text-[var(--negative)]',
    submitLabel: 'Registrar Pago',
  },
  {
    id: 'material_payment',
    label: 'Pago de Material',
    description: 'Registrar pago por compra de materiales',
    icon: Package,
    color: 'text-[var(--negative)]',
    submitLabel: 'Registrar Pago de Material',
  },
  {
    id: 'personnel_payment',
    label: 'Pago de Personal',
    description: 'Registrar pago a personal de obra',
    icon: Users,
    color: 'text-[var(--negative)]',
    submitLabel: 'Registrar Pago de Personal',
  },
  {
    id: 'partner_withdrawal',
    label: 'Retiro de Socio',
    description: 'Registrar retiro de capital de un socio',
    icon: TrendingDown,
    color: 'text-[var(--negative)]',
    submitLabel: 'Registrar Retiro',
  },
  {
    id: 'wallet_transfer',
    label: 'Transferencia entre Billeteras',
    description: 'Mover dinero de una billetera a otra',
    icon: Wallet,
    color: 'text-[var(--neutral)]',
    submitLabel: 'Registrar Transferencia',
    hasNavigation: false,
  },
  {
    id: 'currency_exchange',
    label: 'Cambio de Moneda',
    description: 'Convertir de una moneda a otra',
    icon: ArrowRightLeft,
    color: 'text-[var(--neutral)]',
    submitLabel: 'Registrar Cambio',
    hasNavigation: false,
  },
]

// Opciones jerárquicas para CascadingSelect
interface CascadingOption {
  value: string
  label: string
  children?: CascadingOption[]
}

// Mapeo de tipos de movimiento a sus navegaciones (solo para tipos con navegación)
const MOVEMENT_NAVIGATION: Partial<Record<MovementType, { label: string; path: (orgId: string) => string }>> = {
  client_payment: { label: 'Clientes', path: (orgId) => `/organization/${orgId}/clients?tab=payments` },
  material_payment: { label: 'Materiales', path: (orgId) => `/organization/${orgId}/materials?tab=payments` },
  personnel_payment: { label: 'Personal', path: (orgId) => `/organization/${orgId}/personnel?tab=payments` },
  partner_contribution: { label: 'Capital', path: (orgId) => `/organization/capital?tab=payments` },
  partner_withdrawal: { label: 'Capital', path: (orgId) => `/organization/capital?tab=payments` },
  general_cost_payment: { label: 'Gastos Generales', path: (orgId) => `/organization/${orgId}/general-costs?tab=payments` },
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
  const [, navigate] = useLocation()
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
        return <ClientPaymentForm {...commonProps} />
      case 'material_payment':
        return <MaterialPaymentFormFields {...commonProps} />
      case 'personnel_payment':
        return <PersonnelPaymentFormFields {...commonProps} />
      case 'partner_contribution':
        return <PartnerContributionForm {...commonProps} />
      case 'partner_withdrawal':
        return <PartnerWithdrawalForm {...commonProps} />
      case 'general_cost_payment':
        return <GeneralCostPaymentFormFields {...commonProps} />
      case 'wallet_transfer':
        return <WalletTransferFormFields {...commonProps} />
      case 'currency_exchange':
        return <CurrencyExchangeFormFields {...commonProps} />
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
          <Select
            value={selectedType || ''}
            onValueChange={(value) => setSelectedType(value as MovementType)}
          >
            <SelectTrigger data-testid="select-movement-type">
              <SelectValue placeholder="Selecciona un tipo de movimiento" />
            </SelectTrigger>
            <SelectContent>
              {MOVEMENT_TYPES.map((type) => {
                const nav = MOVEMENT_NAVIGATION[type.id as keyof typeof MOVEMENT_NAVIGATION];
                const hasNavigation = type.hasNavigation !== false && nav;
                const navigateUrl = hasNavigation && organizationId ? nav.path(organizationId) : '#';
                const IconComponent = type.icon;
                
                return (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center justify-between w-full gap-3">
                      <div className="flex items-center gap-2">
                        <IconComponent className={cn("w-4 h-4", type.color)} />
                        <span className={type.color}>{type.label}</span>
                      </div>
                      {hasNavigation && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(navigateUrl);
                            onClose();
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
                        >
                          Ir a {nav.label}
                        </button>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
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
