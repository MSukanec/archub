import { Link, useLocation } from 'wouter'
import { Building, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigationStore } from '@/stores/navigationStore'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  Folder, 
  CheckSquare, 
  Users, 
  CreditCard, 
  BarChart3,
  X 
} from 'lucide-react'

const iconMap = {
  home: Home,
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
            className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent location={location} onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
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
      <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Building className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-slate-900 dark:text-white">Archub</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="lg:hidden"
          onClick={onNavigate}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigationItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap]
          const isActive = location === item.href

          return (
            <Link 
              key={item.id} 
              href={item.href}
              onClick={onNavigate}
            >
              <a
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5 mr-3",
                  isActive 
                    ? "text-primary" 
                    : "text-slate-400 group-hover:text-slate-500"
                )} />
                <span>{item.name}</span>
              </a>
            </Link>
          )
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <Link href="/settings">
          <a className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <Settings className="w-5 h-5 mr-3 text-slate-400 group-hover:text-slate-500" />
            <span>Settings</span>
          </a>
        </Link>
      </div>
    </>
  )
}
