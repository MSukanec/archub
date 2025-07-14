import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useGlobalModalStore } from './useGlobalModalStore';
import { MemberModal } from './MemberModal';

export function ModalFactory() {
  const { open, type, data, closeModal } = useGlobalModalStore();

  const renderModal = () => {
    switch (type) {
      case 'member':
        return <MemberModal editingMember={data?.editingMember} />;
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