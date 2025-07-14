import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useGlobalModalStore } from './useGlobalModalStore';
import { MemberFormModal } from '../modals/MemberFormModal';
import { GalleryFormModal } from '../modals/GalleryFormModal';

export function ModalFactory() {
  const { open, type, data, closeModal } = useGlobalModalStore();

  const renderModal = () => {
    switch (type) {
      case 'member':
        return <MemberFormModal editingMember={data?.editingMember} />;
      case 'gallery':
        return <GalleryFormModal />;
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