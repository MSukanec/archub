import { useGlobalModalStore } from '../state/globalModalStore';
import { getModal } from './registry';
import { initializeModalRegistry } from './registerModals';
import { ModalType, ModalData } from './types';
import { ContactModalView } from '@/features/contacts';

initializeModalRegistry();

/**
 * Modales que usan `data` en lugar de `modalData` como prop
 */
const DATA_PROP_MODALS: ModalType[] = ['site-log', 'personnel'];

/**
 * Modales que NO reciben onClose porque manejan su propio cierre internamente
 * o usan useGlobalModalStore directamente
 */
const NO_ONCLOSE_MODALS: ModalType[] = [
  'delete-confirmation',
  'task-parameter-option',
  'parameter-visibility-config',
  'add-parameter-to-canvas',
];

/**
 * Genera las props correctas para cada tipo de modal.
 * Este mapeo asegura que cada modal reciba exactamente las props que espera.
 */
function getModalProps(
  type: ModalType,
  data: ModalData | null,
  onClose: () => void
): Record<string, any> {
  const baseData = data || {};
  
  switch (type) {
    // Organization modals with specific props
    case 'member':
      return { editingMember: baseData.editingMember, onClose };
    
    case 'partner':
      return { editingPartner: baseData.editingPartner, onClose };
    
    // Delete confirmation has many custom props
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
    
    // Payment modals with specific props
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
    
    // Parameter modals that don't need onClose
    case 'task-parameter-option':
      return { modalType: 'task-parameter-option' };
    
    case 'parameter-visibility-config':
    case 'add-parameter-to-canvas':
      return {};
    
    // Subcontract uses modalData (typed as any) - needs onClose for success/cancel handlers
    case 'subcontract':
      return { modalData: baseData, onClose };
    
    // Site log and personnel use `data` prop instead of `modalData`
    case 'site-log':
    case 'personnel':
      return { data: baseData, onClose };
    
    // Default: most modals use modalData + onClose
    default:
      if (NO_ONCLOSE_MODALS.includes(type)) {
        return { modalData: baseData };
      }
      return { modalData: baseData, onClose };
  }
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
