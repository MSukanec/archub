import { useGlobalModalStore } from './useGlobalModalStore';
import { FormModalLayout } from './FormModalLayout';
import { MemberFormModal } from '../modals/MemberFormModal';
import { GalleryFormModal } from '../modals/GalleryFormModal';
import { BoardFormModal } from '../modals/BoardFormModal';
import { CardFormModal } from '../modals/CardFormModal';

export function ModalFactory() {
  const { open, type, data, closeModal } = useGlobalModalStore();

  if (!open) return null;

  const getModalData = () => {
    switch (type) {
      case 'member':
        return MemberFormModal({ editingMember: data?.editingMember, onClose: closeModal });
      case 'gallery':
        return GalleryFormModal({ modalData: data, onClose: closeModal });
      case 'board':
        return BoardFormModal({ modalData: data, onClose: closeModal });
      case 'card':
        return CardFormModal({ modalData: data, onClose: closeModal });
      default:
        return null;
    }
  };

  const modalData = getModalData();

  if (!modalData || !modalData.editPanel) return null;

  return (
    <FormModalLayout
      viewPanel={modalData.viewPanel}
      editPanel={modalData.editPanel}
      headerContent={modalData.headerContent}
      footerContent={modalData.footerContent}
      onClose={closeModal}
    />
  );
}