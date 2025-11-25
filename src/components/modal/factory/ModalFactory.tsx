import { useGlobalModalStore } from '../state/globalModalStore';
import { getModal } from './registry';
import { initializeModalRegistry } from './registerModals';
import { ModalType, ModalData } from './types';
import { ContactModalView } from '@/features/contacts';

initializeModalRegistry();

const DATA_PROP_MODALS: ModalType[] = ['site-log', 'personnel'];

const NO_ONCLOSE_MODALS: ModalType[] = [
  'delete-confirmation',
  'task-parameter-option',
  'parameter-visibility-config',
  'add-parameter-to-canvas',
  'subcontract',
];

function getModalProps(
  type: ModalType,
  data: ModalData | null,
  onClose: () => void
): Record<string, any> {
  const baseData = data || {};
  
  switch (type) {
    case 'member':
      return { editingMember: baseData.editingMember, onClose };
    
    case 'partner':
      return { editingPartner: baseData.editingPartner, onClose };
    
    case 'delete-confirmation':
      return {
        mode: baseData.mode || 'dangerous',
        title: baseData.title || 'Eliminar elemento',
        description: baseData.message || baseData.description || '¿Estás seguro de que deseas eliminar este elemento?',
        itemName: baseData.itemName,
        destructiveActionText: baseData.destructiveActionText,
        onConfirm: baseData.onConfirm,
        onDelete: baseData.onDelete,
        onReplace: baseData.onReplace,
        replacementOptions: baseData.replacementOptions || [],
        currentCategoryId: baseData.currentCategoryId,
        isLoading: baseData.isLoading || false,
      };
    
    case 'payment-method':
      return {
        courseSlug: baseData.courseSlug || '',
        currency: baseData.currency || 'ARS',
      };
    
    case 'bank-transfer-receipt':
      return {
        receiptUrl: baseData.receiptUrl || null,
        paymentId: baseData.paymentId || '',
      };
    
    case 'task-parameter-option':
      return { modalType: 'task-parameter-option' };
    
    case 'parameter-visibility-config':
    case 'add-parameter-to-canvas':
      return {};
  }
  
  if (DATA_PROP_MODALS.includes(type)) {
    return { data: baseData };
  }
  
  if (NO_ONCLOSE_MODALS.includes(type)) {
    return { modalData: baseData };
  }
  
  return { modalData: baseData, onClose };
}

function getSpecialComponent(
  type: ModalType,
  data: ModalData | null
): React.ComponentType<any> | null {
  if (type === 'contact' && data?.viewingContact) {
    return ContactModalView;
  }
  return null;
}

export function ModalFactory() {
  const { stack, closeModal, popModal } = useGlobalModalStore();

  if (stack.length === 0) return null;

  return (
    <>
      {stack.map((modal, index) => {
        const isTopModal = index === stack.length - 1;
        const onClose = isTopModal ? popModal : closeModal;
        
        const specialComponent = getSpecialComponent(modal.type, modal.data);
        
        let ModalComponent: React.ComponentType<any>;
        
        if (specialComponent) {
          ModalComponent = specialComponent;
        } else {
          const modalEntry = getModal(modal.type);
          if (!modalEntry) return null;
          ModalComponent = modalEntry.component;
        }
        
        const props = getModalProps(modal.type, modal.data, onClose);
        const zIndex = 50 + index * 10;
        
        return (
          <div key={modal.id} style={{ zIndex, position: 'relative' }}>
            <ModalComponent {...props} />
          </div>
        );
      })}
    </>
  );
}
