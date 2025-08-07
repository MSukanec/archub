import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { SidebarSubmenu } from "./SidebarSubmenu";
import { HeaderDesktop } from "./HeaderDesktop";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  useSidebarStore,
  useSecondarySidebarStore,
} from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { MobileActionBar } from "@/components/layout/mobile/MobileActionBar";
import { useMobileActionBar } from "@/components/layout/mobile/MobileActionBarContext";
import { useMobile } from "@/hooks/use-mobile";
import { HeaderMobile } from "@/components/layout/mobile/HeaderMobile";

interface Tab {
  id: string;
  label: string;
  isActive: boolean;
}

interface LayoutProps {
  children: React.ReactNode;
  wide?: boolean;
  headerProps?: {
    icon?: React.ComponentType<any>;
    title?: string;
    showSearch?: boolean;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    showFilters?: boolean;
    filters?: { label: string; onClick: () => void }[];
    customFilters?: React.ReactNode;
    onClearFilters?: () => void;
    actions?: React.ReactNode[];
    tabs?: Tab[];
    onTabChange?: (tabId: string) => void;
    actionButton?: {
      label: string;
      icon?: React.ComponentType<any>;
      onClick: () => void;
    };
  };
}

export function Layout({ children, wide = false, headerProps }: LayoutProps) {
  const { isDark, setTheme } = useThemeStore();
  const { data } = useCurrentUser();
  const { isDocked: isMainDocked, isHovered: isMainHovered } =
    useSidebarStore();
  const { isDocked: isSecondaryDocked, isHovered: isSecondaryHovered } =
    useSecondarySidebarStore();
  const { activeSidebarSection } = useNavigationStore();
  const { showActionBar } = useMobileActionBar();
  const isMobile = useMobile();

  const isSecondaryExpanded =
    isSecondaryDocked || isSecondaryHovered || isMainHovered;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  // Sincronizar tema desde la base de datos cuando se carga el usuario (solo una vez)
  useEffect(() => {
    if (data?.preferences?.theme) {
      const dbTheme = data.preferences.theme;
      const shouldBeDark = dbTheme === "dark";

      // Solo actualizar si es diferente al estado actual
      if (shouldBeDark !== isDark) {
        setTheme(shouldBeDark);
      }
    }
  }, [data?.preferences?.theme]);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--layout-bg)" }}
    >
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
        <SidebarSubmenu />
      </div>

      {/* Header Mobile - Only visible on mobile */}
      <HeaderMobile {...headerProps} />

      {/* Header Desktop - Hidden on mobile */}
      <div className="hidden md:block">
        <HeaderDesktop {...headerProps} />
      </div>

      <main
        className={`transition-all duration-300 ease-in-out flex-1 overflow-auto p-3 md:p-6 pb-12 ${
          headerProps?.tabs?.length ? "md:pt-20" : "md:pt-12"
        } ${
          // Calculate margin based on fixed main sidebar (40px) and variable secondary sidebar
          isSecondaryExpanded
            ? "md:ml-[304px]" // 40px main + 264px secondary
            : "md:ml-[80px]" // 40px main + 40px secondary
        } ml-0 pt-1 ${isMobile && showActionBar ? "pb-20" : "pb-8"}`}
      >
        <div className={(wide ? "" : "max-w-[1440px] mx-auto") + " pb-32"}>
          {children}
        </div>
      </main>

      {/* Mobile Action Bar - Solo visible en mobile */}
      <MobileActionBar />
    </div>
  );
}
