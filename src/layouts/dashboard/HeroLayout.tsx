import { useEffect, useState } from "react";
import { LeftSidebar } from "./components/Sidebar/LeftSidebar";
import { RightSidebar } from "./components/Sidebar/RightSidebar";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useUserMode } from "@/hooks/use-user-mode";
import {
  useSidebarStore,
  useSecondarySidebarStore,
} from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { ActionBarMobile, useActionBarMobile, HeaderMobile } from '@/layouts';
import { useMobile } from "@/hooks/use-mobile";
import { useProjectAccentColor } from "@/features/projects";
import { useContentBackground } from "@/hooks/use-content-background";
import { FloatingAIChat } from "@/components/ui-custom/layout/FloatingAIChat";
import { FloatingCourseLessons } from "@/features/learning";
import { InvitationModal } from "@/features/users/modals/InvitationModal";
import { OrganizationRemovedModal } from "@/features/organization/modals/OrganizationRemovedModal";
import { usePendingInvitations } from "@/hooks/use-pending-invitations";
import { useLocation } from "wouter";

interface HeroLayoutProps {
  children?: React.ReactNode;
  heroContent?: React.ReactNode;
  mainContent?: React.ReactNode;
  hideAIChat?: boolean;
}

/**
 * HeroLayout - Specialized layout for pages with hero section (Type B pages)
 * - Hero section: fullwidth, no padding, no header
 * - Main content: with sidebar padding, scrollable
 * - Used for: Learning Dashboard, etc.
 */
export function HeroLayout({ children, heroContent, mainContent, hideAIChat = false }: HeroLayoutProps) {
  const { isDark, setTheme } = useThemeStore();
  const { data } = useCurrentUser();
  const userMode = useUserMode();
  const { showActionBar } = useActionBarMobile();
  const isMobile = useMobile();
  const { isDocked } = useSidebarStore();
  const { sidebarLevel } = useNavigationStore();
  const [location] = useLocation();

  // Hook para color dinámico del accent basado en el proyecto activo
  useProjectAccentColor();
  
  // Hook para determinar el fondo del contenido (sólido vs degradado)
  const contentBackground = useContentBackground();
  
  // Determinar si debería mostrarse el FloatingAIChat
  const shouldShowAIChat = !hideAIChat && (() => {
    const workRoutes = [
      '/home', '/dashboard', '/organization', '/contacts', '/notifications',
      '/finances', '/calendar', '/projects', '/project', '/clients', '/media',
      '/budgets', '/professional', '/construction', '/analysis', '/movements',
      '/admin', '/providers', '/proveedor', '/learning'
    ];
    return workRoutes.some(route => location.startsWith(route));
  })();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  useEffect(() => {
    if (data?.preferences?.theme) {
      const dbTheme = data.preferences.theme;
      const shouldBeDark = dbTheme === "dark";
      if (shouldBeDark !== isDark) {
        setTheme(shouldBeDark);
      }
    }
  }, [data?.preferences?.theme]);

  return (
    <HeroLayoutContent 
      children={children}
      heroContent={heroContent}
      mainContent={mainContent}
      isMobile={isMobile}
      isDark={isDark}
      showActionBar={showActionBar}
      isDocked={isDocked}
      shouldShowAIChat={shouldShowAIChat}
      contentBackground={contentBackground}
      userMode={userMode}
    />
  );
}

function HeroLayoutContent({
  children,
  heroContent,
  mainContent,
  isMobile,
  isDark,
  showActionBar,
  isDocked,
  shouldShowAIChat,
  contentBackground,
  userMode,
}: any) {
  const [hasShownInvitationsModal, setHasShownInvitationsModal] = useState(false);
  const { data: pendingInvitations, isLoading: isLoadingInvitations } = usePendingInvitations();
  
  const hasPendingInvitations = !isLoadingInvitations && pendingInvitations && pendingInvitations.length > 0;
  const shouldShowInvitationsModal = hasPendingInvitations && !hasShownInvitationsModal;

  const handleCloseInvitationsModal = () => {
    setHasShownInvitationsModal(true);
  };

  return (
    <>
      <div 
        className={isMobile ? "min-h-screen flex flex-col" : "h-screen flex flex-col overflow-hidden"}
      >
        <div
          className={isMobile ? "flex flex-col" : "flex-1 flex flex-col min-h-0"}
          style={{
            backgroundColor: isMobile ? "var(--layout-mobile-bg)" : "var(--layout-bg)",
          }}
        >
          {isMobile ? (
            // Mobile View
            <HeaderMobile>
              {/* Hero Section in Mobile */}
              {heroContent && (
                <div className="w-full">
                  {heroContent}
                </div>
              )}
              
              {/* Main Content in Mobile */}
              <main
                className={`transition-all duration-300 ease-in-out px-4 py-3 pb-12 pt-5 ${isMobile && showActionBar ? "pb-20" : "pb-8"}`}
                style={{ background: contentBackground }}
              >
                {mainContent || children}
              </main>
            </HeaderMobile>
          ) : (
            // Desktop View
            <div className="flex-1 flex min-h-0">
              {/* Left Sidebar */}
              <div className="flex-shrink-0 p-1">
                <LeftSidebar />
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* Hero Section - Fullwidth, no padding */}
                {heroContent && (
                  <div className="flex-shrink-0">
                    {heroContent}
                  </div>
                )}

                {/* Content Section - With padding */}
                <div className={`flex-1 flex min-h-0 relative ${isDocked ? 'gap-3' : ''}`}>
                  <div className="flex-1 py-1 overflow-x-hidden">
                    <main
                      className={`h-full flex flex-col rounded-lg overflow-hidden ${!isDocked ? 'w-full' : ''}`}
                      style={{ background: contentBackground }}
                    >
                      <div className="flex-1 overflow-y-auto px-24 py-12">
                        {mainContent || children}
                      </div>
                    </main>
                  </div>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="flex-shrink-0 p-1">
                <RightSidebar />
              </div>
            </div>
          )}

          {/* Floating AI Chat */}
          {shouldShowAIChat && <FloatingAIChat />}

          {/* Mobile Action Bar */}
          {isMobile && <ActionBarMobile />}
          
          {/* Floating Course Lessons */}
          {isMobile && <FloatingCourseLessons />}

          {/* Modals */}
          {shouldShowInvitationsModal && (
            <InvitationModal
              invitations={pendingInvitations || []}
              open={shouldShowInvitationsModal}
              onClose={handleCloseInvitationsModal}
            />
          )}

          <OrganizationRemovedModal />
        </div>
      </div>
    </>
  );
}
