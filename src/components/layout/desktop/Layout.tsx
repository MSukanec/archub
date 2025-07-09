import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { SidebarSubmenu } from "./SidebarSubmenu";
import { Header } from "./Header";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useSidebarStore, useSecondarySidebarStore } from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { MobileActionBar } from "@/components/ui-custom/mobile/MobileActionBar";
import { useMobileActionBar } from "@/components/layout/mobile/MobileActionBarContext";
import { useMobile } from "@/hooks/use-mobile";

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
  };
}

export function Layout({ children, wide = false, headerProps }: LayoutProps) {
  const { isDark, setTheme } = useThemeStore();
  const { data } = useCurrentUser();
  const { isDocked: isSecondaryDocked, isHovered: isSecondaryHovered } = useSecondarySidebarStore();
  const { activeSidebarSection } = useNavigationStore();
  const { showActionBar } = useMobileActionBar();
  const isMobile = useMobile();

  const isSecondaryExpanded = isSecondaryDocked || isSecondaryHovered;

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
    <div className="min-h-screen bg-background">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
        <SidebarSubmenu />
      </div>
      
      {/* Header starts after sidebars */}
      <div 
        className={`transition-all duration-300 ease-in-out ${
          isSecondaryExpanded 
            ? "md:ml-[314px]" // 50px main + 264px secondary
            : "md:ml-[100px]"  // 50px main + 50px secondary
        } ml-0`}
      >
        <Header {...headerProps} />
      </div>

      <main
        className={`transition-all duration-300 ease-in-out flex-1 overflow-auto p-3 mt-1 ${
          // Calculate margin based on fixed main sidebar (50px) and variable secondary sidebar
          isSecondaryExpanded 
            ? "md:ml-[314px]" // 50px main + 264px secondary
            : "md:ml-[100px]"  // 50px main + 50px secondary
        } ml-0 ${isMobile && showActionBar ? "pb-20" : ""}`}
      >
        <div className={wide ? "" : "max-w-[1440px] mx-auto"}>{children}</div>
      </main>
      
      {/* Mobile Action Bar - Solo visible en mobile */}
      <MobileActionBar />
    </div>
  );
}
