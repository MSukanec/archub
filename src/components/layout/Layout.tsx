import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useSidebarStore } from "@/stores/sidebarStore";
import { MobileActionBar } from "@/components/ui-custom/mobile/MobileActionBar";
import { useMobileActionBar } from "@/contexts/MobileActionBarContext";
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
  const { isDocked, isHovered } = useSidebarStore();
  const { createActions, otherActions } = useMobileActionBar();
  const isMobile = useMobile();

  const isExpanded = isDocked || isHovered;

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
      <Header {...headerProps} />
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <main
        className={`transition-all duration-300 ease-in-out flex-1 overflow-auto p-3 mt-1 ${
          isExpanded ? "md:ml-[240px]" : "md:ml-[40px]"
        } ml-0 ${isMobile ? "pb-20" : ""}`}
      >
        <div className={wide ? "" : "max-w-[1440px] mx-auto"}>{children}</div>
      </main>
      
      {/* Mobile Action Bar - Solo visible en mobile */}
      {isMobile && (
        <MobileActionBar 
          createActions={createActions}
          otherActions={otherActions}
        />
      )}
    </div>
  );
}
