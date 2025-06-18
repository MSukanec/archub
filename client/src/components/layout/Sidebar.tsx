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
      {isDark ? "Modo claro" : "Modo oscuro"}
    </SidebarButton>
  );
}

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

        {/* Bloque inferior (modo, settings, perfil) */}
        <div className="flex flex-col">
          <ThemeToggleButton isExpanded={isExpanded} />
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
              icon={() =>
                avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center">
                    {initials}
                  </div>
                )
              }
            >
              Ver perfil
            </SidebarButton>
          </Link>
        </div>
      </aside>
    </div>
  );
}
