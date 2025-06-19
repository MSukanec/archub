import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CustomModalLayoutProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function CustomModalLayout({
  open,
  onClose,
  children,
  className
}: CustomModalLayoutProps) {
  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity duration-300 ease-in-out"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className={cn(
        "relative bg-[var(--card-bg)] shadow-2xl transition-all duration-300 ease-in-out",
        // Desktop: right-anchored with max width
        "hidden md:flex md:h-full md:max-w-xl md:w-full md:flex-col",
        // Mobile: full screen
        "flex h-full w-full flex-col md:hidden",
        className
      )}>
        {children}
      </div>
    </div>
  )
}