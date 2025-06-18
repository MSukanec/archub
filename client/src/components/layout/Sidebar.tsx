import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useNavigationStore } from "@/stores/navigationStore";
import { SidebarButton } from "@/components/ui/sidebar-button";
import {
  Home,
  Building,
  Folder,
  CheckSquare,
  Users,
  CreditCard,
  BarChart3,
  Settings,
} from "lucide-react";
import {
  SIDEBAR_WIDTH,
  SIDEBAR_EXPANDED_WIDTH,
  BUTTON_SIZE,
  TRANSITION_DURATION,
} from "@/lib/constants/ui";

const iconMap = {
  home: Home,
  building: Building,
  folder: Folder,
  "check-square": CheckSquare,
  users: Users,
  "credit-card": CreditCard,
  "bar-chart-3": BarChart3,
};

export function Sidebar() {
  const [location] = useLocation();
  const { navigationItems } = useNavigationStore();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className="hidden lg:flex lg:flex-shrink-0"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <aside
        className="flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all"
        style={{
          width: isExpanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_WIDTH,
          transitionDuration: `${TRANSITION_DURATION}ms`,
        }}
      >
        {/* Logo */}
        <Link href="/">
          <SidebarButton
            icon={Building}
            isExpanded={isExpanded}
            isActive={location === "/"}
          >
            Archub
          </SidebarButton>
        </Link>

        {/* Navigation Items */}
        <nav className="flex flex-col flex-1">
          {navigationItems.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            const isActive = location === item.href;

            return (
              <Link key={item.id} href={item.href}>
                <SidebarButton
                  icon={Icon}
                  isExpanded={isExpanded}
                  isActive={isActive}
                >
                  {item.name}
                </SidebarButton>
              </Link>
            );
          })}
        </nav>

        {/* Footer: Settings */}
        <div className="border-t border-slate-200 dark:border-slate-700">
          <Link href="/settings">
            <SidebarButton
              icon={Settings}
              isExpanded={isExpanded}
              isActive={location === "/settings"}
            >
              Settings
            </SidebarButton>
          </Link>
        </div>
      </aside>
    </div>
  );
}
