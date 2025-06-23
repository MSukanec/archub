import { ReactNode } from 'react'
import clsx from 'clsx'

interface SidebarButtonProps {
  icon: ReactNode
  label: string
  isActive: boolean
  isExpanded: boolean
  onClick?: () => void
  avatarUrl?: string
}

export default function SidebarButton({
  icon,
  label,
  isActive,
  isExpanded,
  onClick,
  avatarUrl
}: SidebarButtonProps) {
  return (
    <button
      className={clsx(
        'w-full h-8 rounded-xl px-2 py-1.5 transition-colors',
        isActive 
          ? 'bg-[var(--menues-active-bg)] text-[var(--menues-active-fg)]'
          : 'text-[var(--menues-fg)] hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]'
      )}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className="w-10 h-10 flex items-center justify-center shrink-0">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt="Avatar" 
              className="w-[18px] h-[18px] rounded-full"
            />
          ) : (
            <div className="w-[18px] h-[18px] flex items-center justify-center">
              {icon}
            </div>
          )}
        </div>
        
        <span
          className={clsx(
            'ml-2 text-sm truncate font-medium transition-opacity',
            isExpanded ? 'opacity-100' : 'opacity-0 sr-only'
          )}
        >
          {label}
        </span>
      </div>
    </button>
  )
}