import { useState } from 'react';
import { useProjectContext } from '@/stores/projectContext';
import { useGlobalModalStore } from '@/components/modal/state/globalModalStore';
import {
  ModalLayout,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/modal';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DollarSign, Users, Package, CreditCard } from 'lucide-react';

interface UnifiedPaymentFormProps {
  modalData?: any;
  onClose: () => void;
  mode?: 'create';
}

const PAYMENT_TYPES = [
  {
    id: 'client_payment',
    label: 'Pago de Cliente',
    description: 'Registrar cobro de un cliente',
    icon: CreditCard,
    modalType: 'client-payment',
    color: 'text-green-600',
  },
  {
    id: 'material_payment',
    label: 'Pago de Material',
    description: 'Registrar pago por compra de materiales',
    icon: Package,
    modalType: 'material-payment',
    color: 'text-orange-600',
  },
  {
    id: 'personnel_payment',
    label: 'Pago de Personal',
    description: 'Registrar pago a personal de obra',
    icon: Users,
    modalType: 'personnel-payment',
    color: 'text-blue-600',
  },
];

export default function UnifiedPaymentForm({ modalData, onClose }: UnifiedPaymentFormProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const { openModal } = useGlobalModalStore();
  const { selectedProjectId, currentOrganizationId } = useProjectContext();

  const handleContinue = () => {
    if (!selectedType) return;

    const paymentType = PAYMENT_TYPES.find((t) => t.id === selectedType);
    if (!paymentType) return;

    onClose();

    setTimeout(() => {
      openModal(paymentType.modalType, {
        mode: 'create',
        projectId: selectedProjectId,
        organizationId: currentOrganizationId,
        ...modalData,
      });
    }, 100);
  };

  return (
    <ModalLayout onClose={onClose} size="md">
      <ModalHeader
        icon={DollarSign}
        title="Nuevo Movimiento"
        description="Selecciona el tipo de movimiento financiero a registrar"
      />

      <ModalBody>
        <div className="space-y-4">
          <Label className="text-sm font-medium">Tipo de Movimiento</Label>
          
          <RadioGroup
            value={selectedType || ''}
            onValueChange={setSelectedType}
            className="space-y-3"
          >
            {PAYMENT_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <label
                  key={type.id}
                  htmlFor={type.id}
                  className={`
                    flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all
                    ${selectedType === type.id 
                      ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }
                  `}
                  data-testid={`payment-type-${type.id}`}
                >
                  <RadioGroupItem value={type.id} id={type.id} className="mt-1" />
                  <div className={`p-2 rounded-lg bg-muted ${type.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-muted-foreground">{type.description}</div>
                  </div>
                </label>
              );
            })}
          </RadioGroup>
        </div>
      </ModalBody>

      <ModalFooter
        cancelText="Cancelar"
        onLeftClick={onClose}
        submitText="Continuar"
        onSubmit={handleContinue}
        submitDisabled={!selectedType}
      />
    </ModalLayout>
  );
}
