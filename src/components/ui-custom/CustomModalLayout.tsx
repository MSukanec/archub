import React, { useEffect } from 'react'

interface CustomModalLayoutProps {
  open: boolean
  onClose: () => void
  children: {
    header?: React.ReactNode
    body?: React.ReactNode
    footer?: React.ReactNode
  }
}

export function CustomModalLayout({ open, onClose, children }: CustomModalLayoutProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose()
      }
    }

    if (open) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end items-start overflow-hidden">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={onClose}
      />
      <div className="relative max-w-[420px] h-screen bg-white shadow-xl border-l border-border flex flex-col">
        {children?.header && children.header}
        
        {children?.body && (
          <div className="flex-1 overflow-y-auto">
            {children.body}
          </div>
        )}
        
        {children?.footer && children.footer}
      </div>
    </div>
  )
}
