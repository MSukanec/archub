import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CustomModalHeaderProps {
  title: string
  description?: string
  onClose: () => void
}

export function CustomModalHeader({
  title,
  description,
  onClose
}: CustomModalHeaderProps) {
  return (
    <div className="flex items-start justify-between p-6 border-b border-[var(--card-border)]">
      <div className="flex-1 pr-4">
        <h2 className="text-lg font-semibold text-[var(--card-fg)]">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {description}
          </p>
        )}
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="h-8 w-8 rounded-full"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}