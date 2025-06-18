import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useNavigationStore } from "@/stores/navigationStore";
import { useThemeStore } from "@/stores/themeStore";
import { useCurrentUser } from "@/hooks/use-current-user";
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
  Moon,
  Sun,
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

// Botón de cambio de tema
function ThemeToggleButton({ isExpanded }: { isExpanded: boolean }) {
  const { isDark, toggleTheme } = useThemeStore();
  const { data } = useCurrentUser();

  const handleToggleTheme = async () => {
    const userId = data?.user?.id;
    const preferencesId = data?.preferences?.id;

    try {
      await toggleTheme(userId, preferencesId);
    } catch (error) {
      console.error("Error toggling theme:", error);
    }
  };

  return (
    <SidebarButton
      icon={isDark ? Sun : Moon}
      isExpanded={isExpanded}
      onClick={handleToggleTheme}
    >
      Tema
    </SidebarButton>
  );
}

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

        {/* Navigation */}
        <nav 
          className="flex flex-col flex-1 gap-1"
          style={{ padding: `8px` }}
        >
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

        {/* Footer: Tema + Settings */}
        <div 
          className="border-t border-slate-200 dark:border-slate-700 flex flex-col gap-1"
          style={{ padding: `8px` }}
        >
          <ThemeToggleButton isExpanded={isExpanded} />
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
