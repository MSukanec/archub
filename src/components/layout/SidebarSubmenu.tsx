import { Link, useLocation } from "wouter"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SubmenuItem {
  label: string
  href: string
}

interface SidebarSubmenuProps {
  title: string
  items: SubmenuItem[]
  isVisible: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function SidebarSubmenu({ title, items, isVisible, onMouseEnter, onMouseLeave }: SidebarSubmenuProps) {
  const [location] = useLocation()

  if (!isVisible) return null

  return (
    <div 
      className="fixed top-0 left-10 h-full w-48 bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] z-40 flex flex-col"
      style={{ 
        backgroundColor: 'var(--sidebar-bg)',
        borderColor: 'var(--sidebar-border)'
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Header with group title */}
      <div className="h-10 flex items-center px-4 border-b border-[var(--sidebar-border)]">
        <h2 className="text-sm font-medium text-[var(--sidebar-fg)]">{title}</h2>
      </div>

      {/* Submenu items */}
      <nav className="flex-1">
        {items.map((item, index) => (
          <div key={item.href}>
            <Link href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-10 px-4 text-sm font-normal transition-colors rounded-none",
                  "hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-hover-fg)]",
                  location === item.href && "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-fg)]"
                )}
                style={{
                  backgroundColor: location === item.href ? 'var(--sidebar-active-bg)' : 'transparent',
                  color: location === item.href ? 'var(--sidebar-active-fg)' : 'var(--sidebar-fg)'
                }}
              >
                {item.label}
              </Button>
            </Link>
            {/* Add separator before "Gestión de Proyectos" if this is a projects list */}
            {item.label.includes('Gestión de Proyectos') && index === items.length - 1 && (
              <div className="border-t border-[var(--sidebar-border)] mx-4 my-2" />
            )}
          </div>
        ))}
      </nav>
    </div>
  )
}