import { useEffect } from "react";
// import { SecondarySidebar } from "./SecondarySidebar";
import { MainSidebar } from "./MainSidebar";
import { Header } from "./Header";
// import { PrimarySidebar } from "./PrimarySidebar";
// import { SidebarSubmenu } from "./SidebarSubmenu"; // Commented out - using accordion sidebar instead
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
  const { showActionBar } = useActionBarMobile();
  const isMobile = useMobile();
  const { isDocked, isHovered } = useSidebarStore();

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
      style={{
        backgroundColor: isMobile
          ? "var(--layout-mobile-bg)"
          : "var(--layout-bg)",
      }}
    >
      {/* Mobile View - Unchanged */}
      {isMobile ? (
        <HeaderMobile {...(headerProps ?? {})}>
          <main
            className={`transition-all duration-300 ease-in-out flex-1 overflow-auto px-4 py-3 pb-12 pt-5 ${isMobile && showActionBar ? "pb-20" : "pb-8"}`}
          >
            {children}
          </main>
        </HeaderMobile>
      ) : (
        /* Desktop View - New Frame Layout with Global Header */
        <div className="h-screen flex flex-col">
          {/* Global Header - Above everything */}
          <Header />
          
          {/* Main Layout Frame */}
          <div
            className="flex-1 flex overflow-hidden relative"
            style={{ borderColor: "var(--main-sidebar-bg)" }}
          >
            {/* Tertiary Sidebar - Conditional layout based on docked state */}
            {isDocked ? (
              // When docked: Take up space and push content
              <div className="flex-shrink-0">
                <MainSidebar />
              </div>
            ) : (
              // When not docked: Overlay on top of content starting below header
              <div className="absolute left-0 z-50" style={{ top: 0, bottom: 0, height: '100%' }}>
                <MainSidebar />
              </div>
            )}

            {/* Main Content Area with rounded corners and inset appearance */}
            <main
              className={`flex-1 flex flex-col overflow-hidden ${!isDocked ? 'w-full' : ''}`}
              style={{ 
                backgroundColor: "hsl(0, 0%, 95%)",
                marginLeft: isDocked ? '0' : '0' // No margin when not docked since sidebar is absolute
              }}
            >
              {headerProps ? (
                <PageLayout
                  icon={headerProps.icon}
                  title={headerProps.title}
                  tabs={headerProps.tabs?.map((tab) => ({
                    id: tab.id,
                    label: tab.label,
                    isActive: tab.isActive,
                    onClick: () => headerProps.onTabChange?.(tab.id),
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
                  wide={wide}
                >
                  <div
                    className={`${wide ? "" : "max-w-[1440px] mx-auto"} py-6 pb-32 h-full overflow-auto ${
                      isDocked ? 'pl-[72px] pr-[72px]' : 'px-[72px]'
                    }`}
                  >
                    {children}
                  </div>
                </PageLayout>
              ) : (
                <div
                  className={`${wide ? "" : "max-w-[1440px] mx-auto"} px-4 py-3 md:py-6 pb-32 h-full overflow-auto ${
                    isDocked ? 'md:pl-[72px] md:pr-[72px]' : 'md:px-[72px]'
                  }`}
                >
                  {children}
                </div>
              )}
            </main>

          </div>
        </div>
      )}

      {/* Mobile Action Bar - Only visible on mobile when enabled */}
      {isMobile && <ActionBarMobile />}
    </div>
  );
}
