/**
 * 🔧 RightSidebar - Sidebar derecho con controles del usuario
 * 
 * Sidebar expandible estilo Firebase:
 * - Hover sobre notificaciones expande el panel hacia la izquierda
 * - Panel de notificaciones integrado en el sidebar
 */

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { AIPanel } from "@/components/ai/AIPanel";
import { SidebarIconButton } from "../desktop/SidebarIconButton";
import { Sparkles, PanelLeftClose } from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";
import { useRightSidebarStore } from "@/stores/rightSidebarStore";
import { useCurrentUser } from "@/hooks/use-current-user";

export function RightSidebar() {
  const { isDark, toggleTheme } = useThemeStore();
  const { data: userData } = useCurrentUser();
  const userId = userData?.user?.id;
  const userFullName = userData?.user?.full_name || userData?.user?.first_name || 'Usuario';
  const userAvatarUrl = userData?.user?.avatar_url;
  
  // Estado para expansión del sidebar usando Zustand store
  const { activePanel, setActivePanel, togglePanel } = useRightSidebarStore();
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleToggleTheme = async () => {
    const userId = userData?.user?.id;
    const preferencesId = userData?.preferences?.id;
    await toggleTheme(userId, preferencesId);
  };

  const handlePanelClick = (panel: 'ai') => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    // Toggle: si ya está abierto, lo cierra; si está cerrado, lo abre
    togglePanel(panel);
  };

  const handleMouseLeave = () => {
    // Cerrar después de un pequeño delay al quitar el hover
    closeTimeoutRef.current = setTimeout(() => {
      setActivePanel(null);
    }, 100);
  };

  const handleMouseEnter = () => {
    // Cancelar el cierre si vuelves a entrar
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const isExpanded = activePanel !== null;

  return (
    <div className="flex flex-row h-full">
      {/* WRAPPER CON FRAME EFFECT */}
      <div className="h-full p-1 rounded-lg bg-[var(--content-bg)]">
        <div 
          className="flex flex-row h-full"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* PANEL EXPANDIBLE - Panel de IA (aparece a la izquierda) */}
          {isExpanded && userId && (
            <div className="w-[350px] h-full px-[9px] pt-6 pb-6 flex flex-col">
              {/* Título del panel con botón de cerrar */}
              <div className="mb-6 flex items-center justify-between px-2">
                <h2 className="text-lg font-semibold text-[var(--main-sidebar-fg)]">
                  Asistente IA
                </h2>
                {/* Botón de cerrar (equivalente al botón de anclar) */}
                <button
                  onClick={() => setActivePanel(null)}
                  className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-[var(--main-sidebar-button-hover-bg)] transition-colors"
                  title="Cerrar panel"
                  data-testid="button-close-panel"
                >
                  <PanelLeftClose className="w-4 h-4 text-[var(--main-sidebar-fg)]" />
                </button>
              </div>

              {/* Contenido del panel */}
              <div className="flex-1 overflow-hidden">
                <AIPanel
                  userId={userId}
                  userFullName={userFullName}
                  userAvatarUrl={userAvatarUrl}
                  onClose={() => setActivePanel(null)}
                />
              </div>
            </div>
          )}

          {/* SIDEBAR DERECHO - BOTONES (siempre visible, 50px, altura total) */}
          <div className="bg-[var(--main-sidebar-bg)] w-[50px] h-full rounded-lg flex flex-col">
            {/* SECCIÓN SUPERIOR: Botones principales */}
            <div className="px-0 pt-3 overflow-y-auto flex-1">
              <div className="flex flex-col gap-[2px] items-center">
                {/* Botón de IA - CON ICONO BRILLANTE */}
                <SidebarIconButton
                  icon={<Sparkles className="h-5 w-5 ai-icon-sparkle" />}
                  isActive={activePanel === 'ai'}
                  onClick={() => handlePanelClick('ai')}
                  title="Asistente IA"
                  testId="button-ai"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
