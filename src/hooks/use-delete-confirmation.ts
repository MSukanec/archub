import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

interface DeleteConfirmationOptions {
  title: string;
  description: string;
  itemName?: string;
  mode?: 'simple' | 'dangerous';
  onConfirm: () => void;
}

export function useDeleteConfirmation() {
  const { openModal } = useGlobalModalStore();

  const showDeleteConfirmation = ({
    title,
    description,
    itemName,
    mode = 'simple',
    onConfirm
  }: DeleteConfirmationOptions) => {
    openModal('delete-confirmation', {
      title,
      description,
      itemName,
      mode,
      onConfirm
    });
  };

  return { showDeleteConfirmation };
}