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
import { useProjectAccentColor } from "@/hooks/use-project-accent-color";
import { FloatingAIChat } from "@/components/ui-custom/layout/FloatingAIChat";
import { GlobalAnnouncement } from "@/components/ui-custom/layout/GlobalAnnouncement";
import { useLocation } from "wouter";

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
  const [location] = useLocation();

  // Hook para color dinámico del accent basado en el proyecto activo
  useProjectAccentColor();
  
  // Determinar si debería mostrarse el FloatingAIChat
  // SOLO en rutas de trabajo (organización/proyectos) - ALLOWLIST approach
  const shouldShowAIChat = !isMobile && (() => {
    // Rutas de trabajo donde SÍ debería aparecer (allowlist completo basado en App.tsx)
    const workRoutes = [
      '/home',                // Home page (AI assistant)
      '/dashboard',           // Organization Dashboard
      '/organization',        // Organization routes
      '/contacts',            // Contacts
      '/notifications',       // Notifications
      '/finances',            // Finances
      '/calendar',            // Calendar
      '/projects',            // Projects list
      '/project',             // Project details/data
      '/clients',             // Clients
      '/media',               // Media
      '/budgets',             // Budgets
      '/professional',        // Professional routes
      '/construction',        // Construction module
      '/analysis',            // Analysis
      '/movements',           // Movements
      '/admin',               // Admin panel
      '/providers',           // Providers (English)
      '/proveedor'            // Providers (Spanish)
    ];
    
    // Verificar si la ruta actual coincide con alguna ruta de trabajo
    return workRoutes.some(route => location.startsWith(route));
  })();

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
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Global Announcements Banner - Por encima de TODO */}
      <GlobalAnnouncement />
      
      <div
        className="flex-1 flex flex-col min-h-0"
        style={{
          backgroundColor: isMobile
            ? "var(--layout-mobile-bg)"
            : "var(--main-sidebar-bg)",
        }}
      >
        {/* Mobile View - Unchanged */}
        {isMobile ? (
        <HeaderMobile {...(headerProps ?? {})}>
          <main
            className={`transition-all duration-300 ease-in-out flex-1 overflow-auto px-4 py-3 pb-12 pt-5 ${isMobile && showActionBar ? "pb-20" : "pb-8"}`}
            style={{
              background: isDark 
                ? 'linear-gradient(to bottom, var(--gradient-from-dark), var(--gradient-to-dark))'
                : 'linear-gradient(to bottom, var(--gradient-from-light), var(--gradient-to-light))'
            }}
          >
            {children}
          </main>
        </HeaderMobile>
      ) : (
        /* Desktop View - Sidebar + MainHeader + Content */
        <div className="flex-1 flex min-h-0">
          {/* Sidebar - Full height */}
          <div className="flex-shrink-0">
            <Sidebar />
          </div>

          {/* Main Content Area - MainHeader + Page Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Main Header for Desktop */}
            <MainHeader icon={headerProps?.icon} title={headerProps?.title} />

            {/* Page Content with rounded corners and framing effect */}
            <div className={`flex-1 flex min-h-0 relative ${isDocked ? 'gap-3' : ''}`}>
              <div className={`flex-1 ${isCourseSidebarVisible ? '' : 'pr-3'} pb-3 overflow-x-hidden`}>
                <main
                  className={`h-full flex flex-col rounded-2xl overflow-hidden ${!isDocked ? 'w-full' : ''}`}
                  style={{
                    background: isDark 
                      ? 'linear-gradient(to bottom, var(--gradient-from-dark), var(--gradient-to-dark))'
                      : 'linear-gradient(to bottom, var(--gradient-from-light), var(--gradient-to-light))'
                  }}
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
                      className={`${wide ? "" : "max-w-[1440px] mx-auto"} px-16 pt-6 pb-6 min-h-0`}
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

          {/* Floating AI Chat - Solo en Desktop y rutas de trabajo */}
          {shouldShowAIChat && <FloatingAIChat />}
        </div>
      )}

      {/* Mobile Action Bar - Only visible on mobile when enabled */}
      {isMobile && <ActionBarMobile />}
    </div>
    </div>
  );
}
