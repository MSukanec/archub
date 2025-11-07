import { useEffect, useState } from "react";
// import { SecondarySidebar } from "./SecondarySidebar";
import { Sidebar } from "./Sidebar";
import { RightSidebar } from "./RightSidebar";
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
import { useProjectAccentColor } from "@/hooks/use-project-accent-color";
import { FloatingAIChat } from "@/components/ui-custom/layout/FloatingAIChat";
import { FloatingCourseLessons } from "@/components/ui-custom/layout/FloatingCourseLessons";
import { InvitationModal } from "@/components/invitations/InvitationModal";
import { usePendingInvitations } from "@/hooks/use-pending-invitations";
// TEMPORALMENTE DESHABILITADO - GlobalAnnouncement no se usa por ahora
// import { GlobalAnnouncement, useAnnouncementBanner, ANNOUNCEMENT_HEIGHT, AnnouncementProvider } from "@/components/ui-custom/layout/GlobalAnnouncement";
import { useLocation } from "wouter";

interface Tab {
  id: string;
  label: string;
  isActive: boolean;
  badgeCount?: number; // Opcional: contador para mostrar en la tab
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
    // Members display
    organizationId?: string;
    showMembers?: boolean;
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

  return (
    // TEMPORALMENTE DESHABILITADO - AnnouncementProvider wrapper
    <LayoutContent 
      children={children}
      wide={wide}
      headerProps={headerProps}
      isMobile={isMobile}
      isDark={isDark}
      showActionBar={showActionBar}
      isDocked={isDocked}
      isCourseSidebarVisible={isCourseSidebarVisible}
      modules={modules}
      lessons={lessons}
      currentLessonId={currentLessonId}
      shouldShowAIChat={shouldShowAIChat}
    />
  );
}

// Componente interno que lee el contexto
function LayoutContent({ 
  children, 
  wide, 
  headerProps, 
  isMobile, 
  isDark, 
  showActionBar,
  isDocked,
  isCourseSidebarVisible,
  modules,
  lessons,
  currentLessonId,
  shouldShowAIChat
}: any) {
  // TEMPORALMENTE DESHABILITADO - GlobalAnnouncement
  // const { hasActiveAnnouncement } = useAnnouncementBanner();

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
      {/* TEMPORALMENTE DESHABILITADO - Global Announcements Banner */}
      {/* <GlobalAnnouncement /> */}
      
      <div 
        className={isMobile ? "min-h-screen flex flex-col" : "h-screen flex flex-col overflow-hidden"}
        // TEMPORALMENTE DESHABILITADO - Padding dinámico del announcement
        // style={{
        //   paddingTop: hasActiveAnnouncement ? `${ANNOUNCEMENT_HEIGHT}px` : '0',
        //   transition: 'padding-top 0.2s ease-out'
        // }}
      >
        <div
          className={isMobile ? "flex flex-col" : "flex-1 flex flex-col min-h-0"}
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
            className={`transition-all duration-300 ease-in-out px-4 py-3 pb-12 pt-5 ${isMobile && showActionBar ? "pb-20" : "pb-8"}`}
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
        /* Desktop View - Sidebar + MainHeader + Content + RightSidebar */
        <div className="flex-1 flex min-h-0">
          {/* Sidebar - Full height */}
          <div className="flex-shrink-0">
            <Sidebar />
          </div>

          {/* Main Content Area - MainHeader + Page Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Main Header for Desktop - COMENTADO PARA TESTING */}
            {/* <MainHeader icon={headerProps?.icon} title={headerProps?.title} /> */}

            {/* Page Content with rounded corners and framing effect */}
            <div className={`flex-1 flex min-h-0 relative ${isDocked ? 'gap-3' : ''}`}>
              <div className={`flex-1 ${isCourseSidebarVisible ? '' : ''} pt-3 pb-3 overflow-x-hidden`}>
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
                    organizationId={headerProps.organizationId}
                    showMembers={headerProps.showMembers}
                    tabs={headerProps.tabs?.map((tab: Tab) => ({
                      id: tab.id,
                      label: tab.label,
                      isActive: tab.isActive,
                      onClick: () => headerProps.onTabChange?.(tab.id),
                      badgeCount: tab.badgeCount, // ✅ Agregar badge count a las tabs
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
                    {/* PageLayout maneja el padding internamente, no aplicar padding aquí */}
                    {children}
                  </PageLayout>
                ) : (
                  <div
                    className={`${wide ? "" : "max-w-[1440px] mx-auto"} ${wide ? "px-24" : "px-20"} pt-3 pb-6 min-h-0`}
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

          {/* Right Sidebar - Fixed width, always visible */}
          <div className="flex-shrink-0">
            <RightSidebar />
          </div>

          {/* Floating AI Chat - Desktop y Mobile en rutas de trabajo */}
          {shouldShowAIChat && <FloatingAIChat />}
        </div>
      )}

      {/* Mobile Action Bar - Only visible on mobile when enabled */}
      {isMobile && <ActionBarMobile />}
      
      {/* Floating Course Lessons - Mobile cuando hay curso activo */}
      {isMobile && isCourseSidebarVisible && modules.length > 0 && (
        <FloatingCourseLessons 
          modules={modules}
          lessons={lessons}
          currentLessonId={currentLessonId}
          courseId={modules[0]?.course_id}
        />
      )}

      {/* Pending Invitations Modal - Shows once per session when user has pending invitations */}
      {shouldShowInvitationsModal && (
        <InvitationModal
          invitations={pendingInvitations || []}
          open={shouldShowInvitationsModal}
          onClose={handleCloseInvitationsModal}
        />
      )}
        </div>
      </div>
    </>
  );
}
