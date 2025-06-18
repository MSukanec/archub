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

// Botón de perfil de usuario
function ProfileAvatarButton({ isExpanded }: { isExpanded: boolean }) {
  const [location] = useLocation();
  const { data } = useCurrentUser();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarUrl = data?.user?.avatar_url;
  const fullName = data?.user?.full_name || data?.user?.email || 'Usuario';
  const initials = getInitials(fullName);

  if (isExpanded) {
    return (
      <Link href="/perfil">
        <div className="flex items-center gap-3 px-3 py-2 mx-2 rounded-lg hover:bg-[var(--sidebar-hover-bg)] transition-colors cursor-pointer">
          <div className="flex-shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="h-8 w-8 rounded-full object-cover border border-[var(--sidebar-border)]"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-medium">
                {initials}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[var(--sidebar-text)] truncate">
              {fullName}
            </div>
            <div className="text-xs text-[var(--sidebar-text-muted)] truncate">
              Ver perfil
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href="/perfil">
      <div className="flex items-center justify-center p-2 mx-2 rounded-lg hover:bg-[var(--sidebar-hover-bg)] transition-colors cursor-pointer">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="h-8 w-8 rounded-full object-cover border border-[var(--sidebar-border)]"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-medium">
            {initials}
          </div>
        )}
      </div>
    </Link>
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

        {/* Navigation */}
        <nav className="flex flex-col flex-1 gap-1">
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

        {/* Footer: Perfil + Tema + Configuración */}
        <div className="border-t border-[var(--sidebar-border)] flex flex-col gap-1">
          <ProfileAvatarButton isExpanded={isExpanded} />
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
        </div>
      </aside>
    </div>
  );
}
