import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'

interface UseDeleteConfirmationOptions {
  title: string
  description: string
  itemName?: string
  destructiveActionText?: string
  onConfirm: () => void
  isLoading?: boolean
}

export function useDeleteConfirmation() {
  const { openModal, closeModal } = useGlobalModalStore()

  const showDeleteConfirmation = (options: UseDeleteConfirmationOptions) => {
    openModal('delete-confirmation', {
      title: options.title,
      description: options.description,
      itemName: options.itemName,
      destructiveActionText: options.destructiveActionText || 'Eliminar',
      onConfirm: () => {
        options.onConfirm()
        closeModal()
      },
      isLoading: options.isLoading || false
    })
  }

  return {
    showDeleteConfirmation,
    closeDeleteConfirmation: closeModal
  }
}