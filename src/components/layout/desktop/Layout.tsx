import { useEffect } from "react";
// import { SecondarySidebar } from "./SecondarySidebar";
import { MainHeader } from "./MainHeader";
import { Sidebar } from "./Sidebar";
// Header removed - now handled by sidebar
// import { PrimarySidebar } from "./PrimarySidebar";
// import { SidebarSubmenu } from "./SidebarSubmenu"; // Commented out - using accordion sidebar instead
import { PageLayout } from "./PageLayout";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  useSidebarStore,
  useSecondarySidebarStore,
  useCourseSidebarStore,
} from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { ActionBarMobile } from "@/components/layout/mobile/ActionBarMobile";
import { useActionBarMobile } from "@/components/layout/mobile/ActionBarMobileContext";
import { useMobile } from "@/hooks/use-mobile";
import { HeaderMobile } from "@/components/layout/mobile/HeaderMobile";
import { CourseSidebar } from "@/components/layout/CourseSidebar";
import { ProjectSelectorButton } from "./ProjectSelectorButton";
import { OrganizationSelectorButton } from "./OrganizationSelectorButton";

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
    description?: string;
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
  const { sidebarLevel } = useNavigationStore();
  const { isVisible: isCourseSidebarVisible, modules, lessons, currentLessonId } = useCourseSidebarStore();

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

  // Determinar qué selector mostrar según el contexto
  let selectorComponent: React.ReactNode = null;
  if (sidebarLevel === 'project') {
    selectorComponent = <ProjectSelectorButton />;
  } else if (sidebarLevel === 'organization') {
    selectorComponent = <OrganizationSelectorButton />;
  }

  return (
    <div
      className="h-screen flex flex-col"
      style={{
        backgroundColor: isMobile
          ? "var(--layout-mobile-bg)"
          : "var(--main-sidebar-bg)",
      }}
    >
      {/* Main Header for Desktop - Only shown on desktop */}
      {!isMobile && <MainHeader />}
      
      {/* Mobile View - Unchanged */}
      {isMobile ? (
        <HeaderMobile {...(headerProps ?? {})}>
          <main
            className={`transition-all duration-300 ease-in-out flex-1 overflow-auto px-4 py-3 pb-12 pt-5 bg-gradient-to-b from-[hsl(0,0%,96%)] to-[hsl(76,40%,94%)] dark:from-[hsl(0,0%,20%)] dark:to-[hsl(76,30%,15%)] ${isMobile && showActionBar ? "pb-20" : "pb-8"}`}
          >
            {children}
          </main>
        </HeaderMobile>
      ) : (
        /* Desktop View - Frame Layout without Header */
        <div className="flex-1 flex min-h-0">
          {/* Main Layout Frame - Full height */}
          <div
            className={`flex-1 flex min-h-0 relative ${isDocked ? 'gap-3' : ''}`}
            style={{ borderColor: "var(--main-sidebar-bg)" }}
          >
            {/* Tertiary Sidebar - Always pushes content to the side */}
            <div className="flex-shrink-0">
              <Sidebar />
            </div>

            {/* Main Content Area with rounded corners and framing effect */}
            <div className={`flex-1 ${isCourseSidebarVisible ? '' : 'pr-3'} pt-3 pb-3 overflow-x-hidden`}>
              <main
                className={`h-full flex flex-col rounded-2xl overflow-hidden bg-gradient-to-b from-[hsl(0,0%,96%)] to-[hsl(76,40%,94%)] dark:from-[hsl(0,0%,20%)] dark:to-[hsl(76,30%,15%)] ${!isDocked ? 'w-full' : ''}`}
              >
                {headerProps ? (
                  <PageLayout
                    icon={headerProps.icon}
                    title={headerProps.title}
                    description={headerProps.description}
                    selector={selectorComponent}
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
                      className={`${wide ? "" : "max-w-[1440px] mx-auto"} pt-6 pb-6 min-h-0`}
                    >
                      {children}
                    </div>
                  </PageLayout>
                ) : (
                  <div
                    className={`${wide ? "" : "max-w-[1440px] mx-auto"} px-4 pt-3 md:pt-6 pb-3 md:pb-6 min-h-0`}
                  >
                    {children}
                  </div>
                )}
              </main>
            </div>

            {/* Course Sidebar - Right side, only visible when activated */}
            {isCourseSidebarVisible && !isMobile && (
              <div className="flex-shrink-0 pr-3 pb-3">
                <div className="h-full rounded-2xl overflow-hidden">
                  <CourseSidebar
                    modules={modules}
                    lessons={lessons}
                    currentLessonId={currentLessonId}
                  />
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Mobile Action Bar - Only visible on mobile when enabled */}
      {isMobile && <ActionBarMobile />}
    </div>
  );
}
