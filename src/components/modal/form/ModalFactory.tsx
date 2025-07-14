import { useGlobalModalStore } from './useGlobalModalStore';
import { FormModalLayout } from './FormModalLayout';
import { MemberFormModal } from '../modals/MemberFormModal';
import { GalleryFormModal } from '../modals/GalleryFormModal';
import { BoardFormModal } from '../modals/BoardFormModal';
import { CardFormModal } from '../modals/CardFormModal';

export function ModalFactory() {
  const { open, type, data, closeModal } = useGlobalModalStore();

  if (!open) return null;

  // Modales que usan FormModalLayout directamente (legacy)
  if (type === 'gallery') {
    return <GalleryFormModal open={open} onClose={closeModal} />;
  }
  
  if (type === 'board') {
    return <BoardFormModal modalData={data} onClose={closeModal} />;
  }

  // Modales que usan la nueva estructura (member, card)
  const getModalData = () => {
    switch (type) {
      case 'member':
        return <MemberFormModal editingMember={data?.editingMember} />;
      case 'card':
        return <CardFormModal modalData={data} onClose={closeModal} />;
      default:
        return null;
    }
  };

  const modalData = getModalData();
  
  if (!modalData || !modalData.editPanel) {
    return null;
  }

  return (
    <FormModalLayout
      editPanel={modalData.editPanel}
      headerContent={modalData.headerContent}
      footerContent={modalData.footerContent}
      onClose={closeModal}
    />
  );
}