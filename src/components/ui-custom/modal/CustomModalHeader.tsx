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
    <div className="flex items-center justify-between p-2 border-b border-[var(--card-border)]">
      <div className="flex-1 pr-2">
        <h2 className="text-sm font-medium text-[var(--card-fg)]">
          {title}
        </h2>
        {description && (
          <p className="text-xs text-[var(--text-muted)] leading-tight">
            {description}
          </p>
        )}
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="h-6 w-6 rounded-full"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}