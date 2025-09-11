import { useEffect } from "react";
// import { SecondarySidebar } from "./SecondarySidebar"; // COMMENTED FOR TESTING
// import { PrimarySidebar } from "./PrimarySidebar"; // COMMENTED FOR TESTING
import { Sidebar } from "./Sidebar";
// import { SidebarSubmenu } from "./SidebarSubmenu"; // Commented out - using accordion sidebar instead
import { Header } from "./Header";
import { PageLayout } from "./PageLayout";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  useSidebarStore,
  useSecondarySidebarStore,
} from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { ActionBarMobile } from "@/components/layout/mobile/ActionBarMobile";
import { useActionBarMobile } from "@/components/layout/mobile/ActionBarMobileContext";
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
    pageTitle?: string;
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
    // Header system props
    showHeaderSearch?: boolean;
    headerSearchValue?: string;
    onHeaderSearchChange?: (value: string) => void;
    action?: {
      icon?: React.ComponentType<any>;
      label: string;
      onClick: () => void;
    };
    actionButton?: {
      label: string;
      icon?: React.ComponentType<any>;
      onClick: () => void;
    };
    breadcrumb?: { name: string; href: string }[];
    showCurrencySelector?: boolean;
    currencyView?: "discriminado" | "pesificado" | "dolarizado";
    onCurrencyViewChange?: (
      view: "discriminado" | "pesificado" | "dolarizado",
    ) => void;
    // Back button props for view pages
    showBackButton?: boolean;
    onBackClick?: () => void;
    backButtonText?: string;
    isViewMode?: boolean;
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
  const { showActionBar } = useActionBarMobile();
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
      {/* Primary Sidebar - hidden on mobile */}
      {/* <div className="hidden md:block">
        <PrimarySidebar />
      </div> */}

      {/* Secondary Sidebar - hidden on mobile */}
      {/* <div className="hidden md:block">
        <SecondarySidebar />
      </div> */}

      {/* New Combined Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Header Mobile - Only visible on mobile */}
      {isMobile ? (
        <HeaderMobile {...headerProps}>
          <main
            className={`transition-all duration-300 ease-in-out flex-1 overflow-auto px-4 py-3 pb-12 pt-5 ${isMobile && showActionBar ? "pb-20" : "pb-8"}`}
          >
            {children}
          </main>
        </HeaderMobile>
      ) : (
        <>
          {/* Header Desktop - Disabled (using primary sidebar instead) */}
          {/* <div className="hidden md:block">
            <Header {...headerProps} />
          </div> */}

          <main
            className={`transition-all duration-300 ease-in-out flex-1 overflow-hidden ${
              // No header padding needed now
              "md:pt-0"
            } ${
              // Calculate margin based on new combined sidebar (264px)
              "md:ml-[264px]" // Combined sidebar fixed width
            } ml-0 pt-0 ${isMobile && showActionBar ? "pb-20" : "pb-8"}`}
          >
            {headerProps ? (
              <PageLayout
                icon={headerProps.icon}
                title={headerProps.title}
                tabs={headerProps.tabs?.map(tab => ({
                  id: tab.id,
                  label: tab.label,
                  isActive: tab.isActive,
                  onClick: () => headerProps.onTabChange?.(tab.id)
                }))}
                onTabChange={headerProps.onTabChange}
                showHeaderSearch={headerProps.showHeaderSearch}
                headerSearchValue={headerProps.headerSearchValue}
                onHeaderSearchChange={headerProps.onHeaderSearchChange}
                showCurrencySelector={headerProps.showCurrencySelector}
                currencyView={headerProps.currencyView}
                onCurrencyViewChange={headerProps.onCurrencyViewChange}
                actionButton={headerProps.actionButton}
                actions={headerProps.actions}
                showBackButton={headerProps.showBackButton}
                onBackClick={headerProps.onBackClick}
                backButtonText={headerProps.backButtonText}
                isViewMode={headerProps.isViewMode}
              >
                <div className={`${wide ? "" : "max-w-[1440px] mx-auto"} p-6 pb-32 h-full overflow-auto`}>
                  {children}
                </div>
              </PageLayout>
            ) : (
              <div className={`${wide ? "" : "max-w-[1440px] mx-auto"} px-4 py-3 md:px-12 md:py-6 pb-32`}>
                {children}
              </div>
            )}
          </main>
        </>
      )}

      {/* Mobile Action Bar - Only visible on mobile when enabled */}
      {isMobile && <ActionBarMobile />}
    </div>
  );
}
