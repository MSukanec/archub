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
            <SidebarContent location={location} onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div 
          className="flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all group"
          style={{
            width: `${SIDEBAR_WIDTH}px`,
            transitionDuration: `${TRANSITION_DURATION}ms`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.width = `${SIDEBAR_EXPANDED_WIDTH}px`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.width = `${SIDEBAR_WIDTH}px`
          }}
        >
          <SidebarContent location={location} />
        </div>
      </div>
    </>
  )
}

interface SidebarContentProps {
  location: string
  onNavigate?: () => void
}

function SidebarContent({ location, onNavigate }: SidebarContentProps) {
  const { navigationItems } = useNavigationStore()

  return (
    <>
      {/* Sidebar Header */}
      <div 
        className="flex items-center justify-center border-b border-slate-200 dark:border-slate-700"
        style={{ 
          height: `${BUTTON_SIZE + PADDING_MD * 2}px`,
          padding: `${PADDING_MD}px`
        }}
      >
        <div className="flex items-center space-x-3 min-w-0">
          <SidebarButton 
            icon={Building}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          />
          <span 
            className="text-xl font-bold text-slate-900 dark:text-white opacity-0 group-hover:opacity-100 whitespace-nowrap overflow-hidden"
            style={{ transitionDuration: `${TRANSITION_DURATION}ms` }}
          >
            Archub
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="lg:hidden ml-auto"
          onClick={onNavigate}
        >
          <X style={{ width: `${ICON_SIZE}px`, height: `${ICON_SIZE}px` }} />
        </Button>
      </div>

      {/* Navigation */}
      <nav 
        className="flex-1 space-y-1"
        style={{ padding: `${PADDING_MD}px` }}
      >
        {navigationItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap]
          const isActive = location === item.href

          return (
            <div key={item.id} className="group flex items-center">
              <Link href={item.href} onClick={onNavigate}>
                <SidebarButton 
                  icon={Icon}
                  isActive={isActive}
                />
              </Link>
              <span 
                className="ml-3 text-sm font-medium opacity-0 group-hover:opacity-100 whitespace-nowrap overflow-hidden text-slate-700 dark:text-slate-300"
                style={{ transitionDuration: `${TRANSITION_DURATION}ms` }}
              >
                {item.name}
              </span>
            </div>
          )
        })}
      </nav>

      {/* Sidebar Footer */}
      <div 
        className="border-t border-slate-200 dark:border-slate-700"
        style={{ padding: `${PADDING_MD}px` }}
      >
        <div className="group flex items-center">
          <Link href="/settings">
            <SidebarButton icon={Settings} />
          </Link>
          <span 
            className="ml-3 text-sm font-medium opacity-0 group-hover:opacity-100 whitespace-nowrap overflow-hidden text-slate-700 dark:text-slate-300"
            style={{ transitionDuration: `${TRANSITION_DURATION}ms` }}
          >
            Settings
          </span>
        </div>
      </div>
    </>
  )
}
