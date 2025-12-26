import { useEffect, useState } from "react";
// import { SecondarySidebar } from "./SecondarySidebar";
import { LeftSidebar } from "./components/Sidebar/LeftSidebar";
// Header removed - now handled by sidebar
// import { PrimarySidebar } from "./PrimarySidebar";
// import { SidebarSubmenu } from "./SidebarSubmenu"; // Commented out - using accordion sidebar instead
import { PageLayout } from "./PageLayout";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useUserMode } from "@/hooks/use-user-mode";
import {
  useSidebarStore,
  useSecondarySidebarStore,
} from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { ActionBarMobile, useActionBarMobile } from './components/MobileActionBar';
import { HeaderMobile } from './components/MobileMenu';
import { useMobile } from "@/hooks/use-mobile";
import { useProjectAccentColor } from "@/features/projects";
import { useContentBackground } from "@/hooks/use-content-background";
import { FloatingAIChat } from "@/features/ai/components/FloatingAIChat";
import { FloatingCourseLessons, CoursePlayerDrawerHost } from "@/features/learning";
import { InvitationModal } from "@/features/organization";
import { OrganizationRemovedModal } from "@/features/organization/modals";
import { usePendingInvitations } from "@/hooks/use-pending-invitations";
import { useProjectReadOnly } from "@/hooks/use-project-readonly";
import { ProjectReadOnlyProvider } from "@/contexts/ProjectReadOnlyContext";
import { GlobalAnnouncementBanner, useAnnouncementBanner, ANNOUNCEMENT_HEIGHT, ANNOUNCEMENT_HEIGHT_MOBILE, AnnouncementProvider } from "@/features/users/components/GlobalAnnouncementBanner";
import { useLocation } from "wouter";
import { type WidthProp, resolveWidthMode, getContainerClasses, getContentPaddingClasses } from "./layoutWidth";

interface Tab {
  id: string;
  label: string;
  isActive: boolean;
  badgeCount?: number;
  badge?: string;
  disabled?: boolean;
}

interface LayoutProps {
  children: React.ReactNode;
  wide?: WidthProp;
  hideHeader?: boolean;
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
    // Members display
    organizationId?: string;
    showMembers?: boolean;
    showProjectSelector?: boolean;
    action?: {
      icon?: React.ComponentType<any>;
      label: string;
      onClick: () => void;
    };
    actionButton?: {
      label: string;
      icon?: React.ComponentType<any>;
      onClick: () => void;
      additionalButton?: {
        label: string;
        icon?: React.ComponentType<any>;
        onClick: () => void;
        variant?: "ghost" | "default" | "secondary";
      };
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

export function Layout({ children, wide = false, hideHeader = false, headerProps }: LayoutProps) {
  const { isDark, setTheme } = useThemeStore();
  const { data } = useCurrentUser();
  const userMode = useUserMode();
  const { showActionBar } = useActionBarMobile();
  const isMobile = useMobile();
  const { isDocked, isHovered } = useSidebarStore();
  const { sidebarLevel } = useNavigationStore();
  const [location] = useLocation();


  // Hook para color dinámico del accent basado en el proyecto activo
  useProjectAccentColor();
  
  // Hook para determinar el fondo del contenido (sólido vs degradado)
  const contentBackground = useContentBackground();
  
  // Determinar si debería mostrarse el FloatingAIChat
  // ALLOWLIST approach - funciona en DESKTOP y MOBILE
  const shouldShowAIChat = (() => {
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

  return (
    <AnnouncementProvider>
      <LayoutContent 
        children={children}
        wide={wide}
        hideHeader={hideHeader}
        headerProps={headerProps}
        isMobile={isMobile}
        isDark={isDark}
        showActionBar={showActionBar}
        isDocked={isDocked}
        shouldShowAIChat={shouldShowAIChat}
        contentBackground={contentBackground}
        userMode={userMode}
      />
    </AnnouncementProvider>
  );
}

// Componente interno que lee el contexto
function LayoutContent({ 
  children, 
  wide, 
  hideHeader,
  headerProps, 
  isMobile, 
  isDark, 
  showActionBar,
  isDocked,
  shouldShowAIChat,
  contentBackground,
  userMode
}: any) {
  const { hasActiveAnnouncement } = useAnnouncementBanner();

  // Project read-only state for soft-locked projects
  const { isReadOnly: isProjectReadOnly, project } = useProjectReadOnly();

  // Pending invitations modal state
  const [hasShownInvitationsModal, setHasShownInvitationsModal] = useState(false);
  const { data: pendingInvitations, isLoading: isLoadingInvitations } = usePendingInvitations();
  
  const hasPendingInvitations = !isLoadingInvitations && pendingInvitations && pendingInvitations.length > 0;
  const shouldShowInvitationsModal = hasPendingInvitations && !hasShownInvitationsModal;

  const handleCloseInvitationsModal = () => {
    setHasShownInvitationsModal(true);
  };

  return (
    <>
      {/* Global Announcements Banner - Fixed at top */}
      <GlobalAnnouncementBanner />
      
      <div 
        className={isMobile ? "min-h-screen flex flex-col" : "flex flex-col min-h-screen"}
        style={{
          paddingTop: hasActiveAnnouncement 
            ? `${isMobile ? ANNOUNCEMENT_HEIGHT_MOBILE : ANNOUNCEMENT_HEIGHT}px` 
            : '0',
          transition: 'padding-top 0.2s ease-out'
        }}
      >
        <div
          className={isMobile ? "flex flex-col" : "flex-1 flex flex-col min-h-0"}
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
            className={`transition-all duration-300 ease-in-out px-4 py-3 pb-12 pt-5 ${isMobile && showActionBar ? "pb-20" : "pb-8"}`}
            style={{
              background: contentBackground
            }}
          >
            {children}
          </main>
        </HeaderMobile>
      ) : (
        /* Desktop View - Sidebar + MainHeader + Content */
        <div className="flex-1 flex min-h-0">
          {/* Sidebar - Full height with padding, sticky to stay visible on scroll */}
          <div className="flex-shrink-0 p-1 sticky top-0 h-screen overflow-hidden">
            <LeftSidebar />
          </div>

          {/* Main Content Area - MainHeader + Page Content */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            {/* Main Header for Desktop - COMENTADO PARA TESTING */}
            {/* <MainHeader icon={headerProps?.icon} title={headerProps?.title} /> */}

            {/* Page Content with rounded corners and framing effect */}
            <div className={`flex-1 flex min-h-0 min-w-0 relative ${isDocked ? 'gap-3' : ''}`}>
              <div className="flex-1 py-1 min-w-0">
                <main
                  className={`h-full flex flex-col rounded-lg min-w-0 ${!isDocked ? 'w-full' : ''}`}
                  style={{
                    background: contentBackground
                  }}
                >
                <ProjectReadOnlyProvider isReadOnly={isProjectReadOnly} projectName={project?.name}>
                  {headerProps && !hideHeader ? (
                    <PageLayout
                      icon={headerProps.icon}
                      title={headerProps.title}
                      description={headerProps.description}
                      organizationId={headerProps.organizationId}
                      showMembers={headerProps.showMembers}
                      showProjectSelector={headerProps.showProjectSelector}
                      tabs={headerProps.tabs?.map((tab: Tab) => ({
                        id: tab.id,
                        label: tab.label,
                        isActive: tab.isActive,
                        onClick: () => headerProps.onTabChange?.(tab.id),
                        badgeCount: tab.badgeCount,
                        badge: tab.badge,
                        isDisabled: tab.disabled,
                      }))}
                      onTabChange={headerProps.onTabChange}
                      showHeaderSearch={headerProps.showHeaderSearch}
                      headerSearchValue={headerProps.headerSearchValue}
                      onHeaderSearchChange={headerProps.onHeaderSearchChange}
                      showCurrencySelector={headerProps.showCurrencySelector}
                      currencyView={headerProps.currencyView}
                      onCurrencyViewChange={headerProps.onCurrencyViewChange}
                      actionButton={isProjectReadOnly ? undefined : headerProps.actionButton}
                      actions={isProjectReadOnly ? undefined : headerProps.actions}
                      showBackButton={headerProps.showBackButton}
                      onBackClick={headerProps.onBackClick}
                      backButtonText={headerProps.backButtonText}
                      isViewMode={headerProps.isViewMode}
                      wide={wide}
                      showReadOnlyBanner={isProjectReadOnly}
                      readOnlyProjectName={project?.name}
                    >
                      {children}
                    </PageLayout>
                  ) : (
                    <div className="h-full w-full">
                      {children}
                    </div>
                  )}
                </ProjectReadOnlyProvider>
              </main>
              </div>

            </div>
          </div>

          {/* Course Player Drawer Host */}
          <div className="flex-shrink-0 p-1">
            <CoursePlayerDrawerHost />
          </div>
        </div>
      )}

      {/* Floating AI Chat - Desktop y Mobile en rutas de trabajo */}
      {shouldShowAIChat && <FloatingAIChat />}

      {/* Mobile Action Bar - Only visible on mobile when enabled */}
      {isMobile && <ActionBarMobile />}
      
      {/* Floating Course Lessons - Mobile cuando hay curso activo */}
      {isMobile && <FloatingCourseLessons />}

      {/* Pending Invitations Modal - Shows once per session when user has pending invitations */}
      {shouldShowInvitationsModal && (
        <InvitationModal
          invitations={pendingInvitations || []}
          open={shouldShowInvitationsModal}
          onClose={handleCloseInvitationsModal}
        />
      )}

      {/* Organization Removed Modal - Shows when user no longer belongs to current organization */}
      <OrganizationRemovedModal />
        </div>
      </div>
    </>
  );
}
