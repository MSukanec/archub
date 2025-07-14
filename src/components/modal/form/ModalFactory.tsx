import { useGlobalModalStore } from './useGlobalModalStore';
import { FormModalLayout } from './FormModalLayout';
import { MemberFormModal } from '../modals/MemberFormModal';
import { GalleryFormModal } from '../modals/GalleryFormModal';
import { BoardFormModal } from '../modals/BoardFormModal';
import { CardFormModal } from '../modals/CardFormModal';
import { ListFormModal } from '../modals/ListFormModal';
import { ContactFormModal } from '../modals/ContactFormModal';

export function ModalFactory() {
  const { open, type, data, closeModal } = useGlobalModalStore();

  if (!open) return null;

  let modalConfig;

  switch (type) {
    case 'member':
      modalConfig = MemberFormModal({ editingMember: data?.editingMember, onClose: closeModal });
      break;
    case 'gallery':
      modalConfig = GalleryFormModal({ modalData: data, onClose: closeModal });
      break;
    case 'board':
      modalConfig = BoardFormModal({ modalData: data, onClose: closeModal });
      break;
    case 'card':
      modalConfig = CardFormModal({ modalData: data, onClose: closeModal });
      break;
    case 'list':
      modalConfig = ListFormModal({ modalData: data, onClose: closeModal });
      break;
    case 'contact':
      modalConfig = ContactFormModal({ modalData: data, onClose: closeModal });
      break;
    default:
      return null;
  }

  if (!modalConfig) return null;

  return (
    <FormModalLayout
      viewPanel={modalConfig.viewPanel}
      editPanel={modalConfig.editPanel}
      headerContent={modalConfig.headerContent}
      footerContent={modalConfig.footerContent}
      onClose={closeModal}
    />
  );
}