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
  DollarSign,
  Settings,
  User,
} from "lucide-react";
import {
  SIDEBAR_WIDTH,
  SIDEBAR_EXPANDED_WIDTH,
  TRANSITION_DURATION,
} from "@/lib/constants/ui";

const iconMap = {
  home: Home,
  building: Building,
  folder: Folder,
  "dollar-sign": DollarSign,
  "check-square": CheckSquare,
  users: Users,
  "credit-card": CreditCard,
  "bar-chart-3": BarChart3,
};



export function Sidebar() {
  const [location] = useLocation();
  const { navigationItems } = useNavigationStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const { data } = useCurrentUser();

  const avatarUrl = data?.user?.avatar_url;
  const fullName = data?.user?.full_name || data?.user?.email || "Usuario";

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const initials = getInitials(fullName);

  return (
    <div
      className="hidden lg:flex lg:flex-shrink-0"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <aside
        className="flex flex-col bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] transition-all"
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

        {/* Navegación */}
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

        {/* Bloque inferior (settings, perfil) */}
        <div className="flex flex-col">
          <Link href="/settings">
            <SidebarButton
              icon={Settings}
              isExpanded={isExpanded}
              isActive={location === "/settings"}
            >
              Configuración
            </SidebarButton>
          </Link>
          <Link href="/perfil">
            <SidebarButton
              isExpanded={isExpanded}
              icon={User}
            >
              Ver perfil
            </SidebarButton>
          </Link>
        </div>
      </aside>
    </div>
  );
}
