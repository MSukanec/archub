import { useGlobalModalStore } from './useGlobalModalStore';
import { FormModalLayout } from './FormModalLayout';
import { MemberFormModal } from '../modals/MemberFormModal';
import { GalleryFormModal } from '../modals/GalleryFormModal';
import { BoardFormModal } from '../modals/BoardFormModal';
import { CardFormModal } from '../modals/CardFormModal';

export function ModalFactory() {
  const { open, type, data, closeModal } = useGlobalModalStore();

  if (!open) return null;

  const getModalComponents = () => {
    switch (type) {
      case 'member':
        return {
          content: <MemberFormModal editingMember={data?.editingMember} />,
          header: undefined,
          footer: undefined
        };
      case 'gallery':
        return {
          content: <GalleryFormModal />,
          header: undefined,
          footer: undefined
        };
      case 'board':
        return {
          content: <BoardFormModal modalData={data} onClose={closeModal} />,
          header: undefined,
          footer: undefined
        };
      case 'card':
        return {
          content: <CardFormModal modalData={data} onClose={closeModal} />,
          header: undefined,
          footer: undefined
        };
      default:
        return { content: null, header: undefined, footer: undefined };
    }
  };

  const { content, header, footer } = getModalComponents();

  return (
    <FormModalLayout
      editPanel={content}
      headerContent={header}
      footerContent={footer}
      onClose={closeModal}
    />
  );
}