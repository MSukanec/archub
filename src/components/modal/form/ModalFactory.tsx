import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useGlobalModalStore } from './useGlobalModalStore';
import { MemberFormModal } from '../modals/MemberFormModal';
import { GalleryFormModal } from '../modals/GalleryFormModal';
import { BoardFormModal } from '../modals/BoardFormModal';
import { CardFormModal } from '../modals/CardFormModal';

export function ModalFactory() {
  const { open, type, data, closeModal } = useGlobalModalStore();

  const renderModal = () => {
    switch (type) {
      case 'member':
        return <MemberFormModal editingMember={data?.editingMember} />;
      case 'gallery':
        return <GalleryFormModal />;
      case 'board':
        return <BoardFormModal modalData={data} onClose={closeModal} />;
      case 'card':
        return <CardFormModal modalData={data} onClose={closeModal} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={closeModal}>
      <DialogContent className="max-w-2xl p-0">
        {renderModal()}
      </DialogContent>
    </Dialog>
  );
}