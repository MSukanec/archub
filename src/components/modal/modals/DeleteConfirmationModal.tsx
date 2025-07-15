import { useGlobalModalStore } from "@/components/modal/form/useGlobalModalStore"
import { FormModalLayout } from "@/components/modal/form/FormModalLayout"
import FormModalBody from "@/components/modal/form/FormModalBody"
import { FormModalFooter } from "@/components/modal/form/FormModalFooter"
import { FormModalHeader } from "@/components/modal/form/FormModalHeader"
import { AlertTriangle } from 'lucide-react'

interface DeleteConfirmationModalProps {
  title: string
  description: string
  itemName?: string
  destructiveActionText?: string
  onConfirm: () => void
  isLoading?: boolean
}

export default function DeleteConfirmationModal({
  title,
  description,
  itemName,
  destructiveActionText = "Eliminar",
  onConfirm,
  isLoading = false
}: DeleteConfirmationModalProps) {
  const { closeModal } = useGlobalModalStore()

  const handleSubmit = () => {
    onConfirm()
  }

  const handleCancel = () => {
    closeModal()
  }

  const editPanel = (
    <FormModalBody>
      <div className="space-y-6">
        {/* Warning section */}
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="text-base text-foreground leading-relaxed">
              {description}
            </p>
            {itemName && (
              <p className="text-sm text-muted-foreground mt-2">
                Elemento: <span className="font-medium text-foreground">{itemName}</span>
              </p>
            )}
          </div>
        </div>

        {/* Warning message */}
        <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive font-medium">
              Esta acción no se puede deshacer
            </p>
          </div>
        </div>
      </div>
    </FormModalBody>
  )

  const headerContent = (
    <FormModalHeader 
      title={title}
      icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
    />
  )

  const footerContent = (
    <FormModalFooter
      cancelText="Cancelar"
      submitText={isLoading ? 'Eliminando...' : destructiveActionText}
      onLeftClick={handleCancel}
      onSubmit={handleSubmit}
      submitVariant="destructive"
      submitDisabled={isLoading}
      showLoadingSpinner={isLoading}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={closeModal}
    />
  )
}