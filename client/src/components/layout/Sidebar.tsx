import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { cn } from '@/lib/utils'
import { useNavigationStore } from '@/stores/navigationStore'
import { SidebarButton } from '@/components/ui/sidebar-button'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  Building,
  Folder, 
  CheckSquare, 
  Users, 
  CreditCard, 
  BarChart3,
  Settings,
  X 
} from 'lucide-react'
import { 
  SIDEBAR_WIDTH, 
  SIDEBAR_EXPANDED_WIDTH, 
  BUTTON_SIZE,
  ICON_SIZE,
  PADDING_SM,
  PADDING_MD,
  TRANSITION_DURATION 
} from '@/lib/constants/ui'

const iconMap = {
  home: Home,
  building: Building,
  folder: Folder,
  'check-square': CheckSquare,
  users: Users,
  'credit-card': CreditCard,
  'bar-chart-3': BarChart3,
}

export function Sidebar() {
  const [location] = useLocation()
  const { navigationItems, sidebarOpen, setSidebarOpen } = useNavigationStore()
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div 
            className="fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-800 shadow-xl"
            style={{ width: `${SIDEBAR_EXPANDED_WIDTH}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent location={location} isExpanded={true} onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div 
          className="flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all"
          style={{
            width: isExpanded ? `${SIDEBAR_EXPANDED_WIDTH}px` : `${SIDEBAR_WIDTH}px`,
            transitionDuration: `${TRANSITION_DURATION}ms`,
          }}
          onMouseEnter={() => setIsExpanded(true)}
          onMouseLeave={() => setIsExpanded(false)}
        >
          <SidebarContent location={location} isExpanded={isExpanded} />
        </div>
      </div>
    </>
  )
}

interface SidebarContentProps {
  location: string
  isExpanded: boolean
  onNavigate?: () => void
}

function SidebarContent({ location, isExpanded, onNavigate }: SidebarContentProps) {
  const { navigationItems } = useNavigationStore()

  return (
    <div className="flex flex-col h-full">
      {/* Sidebar Header - Logo */}
      <div 
        className="flex items-center justify-center border-b border-slate-200 dark:border-slate-700"
        style={{ 
          height: `${BUTTON_SIZE + PADDING_SM * 2}px`,
          padding: `${PADDING_SM}px`
        }}
      >
        <SidebarButton 
          icon={Building}
          isExpanded={isExpanded}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Archub
        </SidebarButton>
        
        {/* Mobile close button */}
        {onNavigate && (
          <Button 
            variant="ghost" 
            className="lg:hidden ml-auto flex items-center justify-center"
            onClick={onNavigate}
            style={{
              width: `${BUTTON_SIZE}px`,
              height: `${BUTTON_SIZE}px`,
            }}
          >
            <X style={{ width: `${ICON_SIZE}px`, height: `${ICON_SIZE}px` }} />
          </Button>
        )}
      </div>

      {/* Navigation Items */}
      <div 
        className="flex-1 flex flex-col"
        style={{ padding: `${PADDING_SM}px` }}
      >
        {navigationItems.map((item, index) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap]
          const isActive = location === item.href

          return (
            <div
              key={item.id}
              style={{ 
                marginBottom: index < navigationItems.length - 1 ? `${PADDING_SM}px` : '0'
              }}
            >
              <Link href={item.href} onClick={onNavigate}>
                <SidebarButton 
                  icon={Icon}
                  isActive={isActive}
                  isExpanded={isExpanded}
                >
                  {item.name}
                </SidebarButton>
              </Link>
            </div>
          )
        })}
      </div>

      {/* Settings Footer */}
      <div 
        className="border-t border-slate-200 dark:border-slate-700"
        style={{ padding: `${PADDING_SM}px` }}
      >
        <Link href="/settings">
          <SidebarButton 
            icon={Settings} 
            isExpanded={isExpanded}
          >
            Settings
          </SidebarButton>
        </Link>
      </div>
    </div>
  )
}
