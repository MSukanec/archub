import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'

interface ReplacementOption {
  label: string
  value: string
}

interface UseDeleteConfirmationOptions {
  mode?: 'simple' | 'replace'
  title: string
  description: string
  itemName?: string
  destructiveActionText?: string
  onConfirm?: () => void
  onDelete?: () => void
  onReplace?: (newId: string) => void
  replacementOptions?: ReplacementOption[]
  currentCategoryId?: string
  isLoading?: boolean
}

export function useDeleteConfirmation() {
  const { openModal, closeModal } = useGlobalModalStore()

  const showDeleteConfirmation = (options: UseDeleteConfirmationOptions) => {
    openModal('delete-confirmation', {
      mode: options.mode || 'simple',
      title: options.title,
      description: options.description,
      itemName: options.itemName,
      destructiveActionText: options.destructiveActionText || 'Eliminar',
      onConfirm: options.onConfirm,
      onDelete: options.onDelete,
      onReplace: options.onReplace,
      replacementOptions: options.replacementOptions || [],
      currentCategoryId: options.currentCategoryId,
      isLoading: options.isLoading || false
    })
  }

  return {
    showDeleteConfirmation,
    closeDeleteConfirmation: closeModal
  }
}