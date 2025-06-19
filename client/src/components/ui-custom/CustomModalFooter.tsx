import { Button } from '@/components/ui/button'

interface CustomModalFooterProps {
  onCancel: () => void
  onSubmit: () => void
  cancelText?: string
  submitText?: string
  isSubmitting?: boolean
  submitDisabled?: boolean
}

export function CustomModalFooter({
  onCancel,
  onSubmit,
  cancelText = 'Cancelar',
  submitText = 'Guardar',
  isSubmitting = false,
  submitDisabled = false
}: CustomModalFooterProps) {
  return (
    <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--card-border)]">
      <div className="flex w-full gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 max-w-[25%]"
        >
          {cancelText}
        </Button>
        
        <Button
          variant="default"
          onClick={onSubmit}
          disabled={submitDisabled || isSubmitting}
          className="flex-1 max-w-[75%]"
        >
          {isSubmitting ? 'Guardando...' : submitText}
        </Button>
      </div>
    </div>
  )
}