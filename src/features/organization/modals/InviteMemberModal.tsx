import { useRef, useState } from 'react';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { InviteMemberForm } from '../forms/InviteMemberForm';
import { Users, UserPlus } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
interface InviteMemberModalProps {
  modalData?: {
    organizationId?: string;
    editingMember?: any;
    defaultEmail?: string;
    mode?: 'create'| 'edit';
  };
  onClose: () => void;
}
export function InviteMemberModal({ modalData, onClose }: InviteMemberModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const { data: userData } = useCurrentUser();
  const [isLoading, setIsLoading] = useState(false);
  const [pricingData, setPricingData] = useState<any>(null);
  const editingMember = modalData?.editingMember;
  const defaultEmail = modalData?.defaultEmail;
  const isReinvite = !!defaultEmail;
  const isEditing = !!editingMember;
  const mode = modalData?.mode || (isEditing ? 'edit': 'create');
  const organizationId = modalData?.organizationId || userData?.preferences?.last_organization_id;
  const isPayPal = pricingData?.subscription?.paymentProvider === 'paypal';
  const needsPayment = pricingData?.pricing && (isPayPal 
    ? pricingData.pricing.proratedAmountUSD > 0 
    : pricingData.pricing.proratedAmountARS > 0
  );
  const getHeader = () => {
    if (isEditing) {
      return { 
        title: 'Editar Miembro', 
        description: 'Actualiza el rol y permisos del miembro en tu organización.',
        icon: Users
      };
    }
    if (isReinvite) {
      return { 
        title: 'Reinvitar Miembro', 
        description: 'Selecciona el rol para reinvitar a este miembro anterior.',
        icon: UserPlus
      };
    }
    return { 
      title: 'Invitar Miembro', 
      description: 'Ingresa el email del nuevo miembro. Si no tiene cuenta, recibirá una invitación por correo.',
      icon: UserPlus
    };
  };
  const getSubmitText = () => {
    if (isLoading) {
      return needsPayment ? 'Redirigiendo...': 'Procesando...';
    }
    if (isEditing) return 'Actualizar';
    if (needsPayment) return 'Proceder al Pago';
    return isReinvite ? 'Reinvitar': 'Invitar';
  };
  const handleSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };
  const header = getHeader();
  return (
    <ModalLayout 
      onClose={onClose} 
      size="md"
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
          submitText={getSubmitText()}
          onSubmit={handleSubmit}
          submitDisabled={isLoading}
        />
      }
    >
      <ModalBody>
        <InviteMemberForm
          organizationId={organizationId}
          editingMember={editingMember}
          defaultEmail={defaultEmail}
          mode={mode}
          onSuccess={onClose}
          onCancel={onClose}
          hideActions={true}
          formRef={formRef}
          onPricingChange={setPricingData}
          onLoadingChange={setIsLoading}
        />
      </ModalBody>
    </ModalLayout>
  );
}
