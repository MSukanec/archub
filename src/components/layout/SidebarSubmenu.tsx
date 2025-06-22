import { Link, useLocation } from "wouter"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SubmenuItem {
  label: string
  href: string
  onClick?: () => void
  isActive?: boolean
  isDivider?: boolean
}

interface MenuGroup {
  id: string
  label: string
  icon: any
  items: SubmenuItem[]
}

interface SidebarSubmenuProps {
  group: MenuGroup
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function SidebarSubmenu({ group, onMouseEnter, onMouseLeave }: SidebarSubmenuProps) {
  const [location] = useLocation()
  
  console.log('SidebarSubmenu rendering with group:', group);

  return (
    <div 
      data-submenu
      className="fixed top-0 left-10 h-full w-48 bg-[var(--sidebar-secondary-bg)] border-r border-[var(--sidebar-secondary-border)] z-40 flex flex-col"
      style={{ 
        backgroundColor: 'var(--sidebar-secondary-bg)',
        borderColor: 'var(--sidebar-secondary-border)'
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Header with group title */}
      <div className="h-10 flex items-center px-4 border-b border-[var(--sidebar-secondary-border)]">
        <h2 className="text-sm font-medium text-[var(--sidebar-secondary-fg)]">{group.label}</h2>
      </div>

      {/* Submenu items */}
      <nav className="flex-1">
        {group.items.map((item, index) => (
          <div key={`${item.href || item.label}-${index}`}>

            
            {item.onClick ? (
              // Clickable item without navigation
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-10 px-4 text-sm font-normal transition-colors rounded-none",
                  "hover:bg-[var(--sidebar-secondary-hover-bg)]",
                  item.isActive && "bg-[var(--sidebar-secondary-active-bg)]"
                )}
                style={{
                  backgroundColor: item.isActive ? 'var(--sidebar-secondary-active-bg)' : 'transparent',
                  color: item.isActive ? 'var(--sidebar-secondary-active-fg)' : 'var(--sidebar-secondary-fg)'
                }}
                onClick={item.onClick}
              >
                {item.label}
              </Button>
            ) : (
              // Regular navigation item
              <Link href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-10 px-4 text-sm font-normal transition-colors rounded-none",
                    "hover:bg-[var(--sidebar-secondary-hover-bg)]",
                    location === item.href && "bg-[var(--sidebar-secondary-active-bg)]"
                  )}
                  style={{
                    backgroundColor: location === item.href ? 'var(--sidebar-secondary-active-bg)' : 'transparent',
                    color: location === item.href ? 'var(--sidebar-secondary-active-fg)' : 'var(--sidebar-secondary-fg)'
                  }}
                >
                  {item.label}
                </Button>
              </Link>
            )}
          </div>
        ))}
      </nav>
    </div>
  )
}