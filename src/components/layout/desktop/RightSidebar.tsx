/**
 * 🔧 RightSidebar - Sidebar derecho con controles del usuario
 * 
 * Dimensiones y estructura IDÉNTICAS al sidebar izquierdo.
 * Botones del MainHeader integrados en el sidebar derecho.
 */

import { cn } from "@/lib/utils";
import { UserQuickAccess } from "@/components/ui-custom/layout/UserQuickAccess";
import { NotificationBellHeader } from "@/components/notifications/NotificationBellHeader";
import { Moon, Sun, HelpCircle, PanelRightClose } from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";
import { useCurrentUser } from "@/hooks/use-current-user";

export function RightSidebar() {
  const { isDark, toggleTheme } = useThemeStore();
  const { data: userData } = useCurrentUser();

  const handleToggleTheme = async () => {
    const userId = userData?.user?.id;
    const preferencesId = userData?.preferences?.id;
    await toggleTheme(userId, preferencesId);
  };

  return (
    <div className="flex flex-row h-screen">
      {/* SIDEBAR DERECHO - Dimensiones idénticas al izquierdo */}
      <div 
        className="bg-[var(--main-sidebar-bg)] text-[var(--main-sidebar-fg)] border-l border-[var(--main-sidebar-border)] transition-all duration-150 overflow-hidden relative h-screen"
        style={{
          width: '50px', // Ancho fijo igual al sidebar izquierdo colapsado
          zIndex: 10
        }}
      >
        <aside className="grid h-screen grid-rows-[1fr_auto] w-[50px]">
          {/* SECCIÓN SUPERIOR: Botones principales */}
          <div className="px-0 overflow-y-auto">
            <div className="flex flex-col gap-[2px] items-center">
              
              {/* Avatar del Usuario - Altura igual al logo del sidebar izquierdo */}
              <div className="h-[50px] w-8 flex items-center justify-center">
                <UserQuickAccess />
              </div>

              {/* Espacio después del avatar - igual al logo */}
              <div className="h-3"></div>

              {/* Notificaciones - altura h-10 como los botones del sidebar izquierdo */}
              <div className="h-10 w-8 flex items-center justify-center">
                <NotificationBellHeader />
              </div>

              {/* Divisor visual - igual al sidebar izquierdo */}
              <div className="my-3 h-[12px] flex items-center justify-center w-full">
                <div className="w-8 h-[1px] bg-[var(--main-sidebar-fg)] opacity-20" />
              </div>

              {/* Toggle de Tema (Dark/Light Mode) - h-10 como los demás botones */}
              <button
                onClick={handleToggleTheme}
                className={cn(
                  "h-10 w-8 rounded-md flex items-center justify-center transition-colors",
                  "hover:bg-[var(--main-sidebar-button-hover-bg)]",
                  "text-[var(--main-sidebar-fg)] hover:text-white"
                )}
                title={isDark ? "Modo claro" : "Modo oscuro"}
                data-testid="button-theme-toggle"
              >
                <div className="h-8 w-8 flex items-center justify-center">
                  {isDark ? (
                    <Sun className="h-[18px] w-[18px]" />
                  ) : (
                    <Moon className="h-[18px] w-[18px]" />
                  )}
                </div>
              </button>

              {/* Ayuda/Soporte - h-10 */}
              <button
                className={cn(
                  "h-10 w-8 rounded-md flex items-center justify-center transition-colors",
                  "hover:bg-[var(--main-sidebar-button-hover-bg)]",
                  "text-[var(--main-sidebar-fg)] hover:text-white"
                )}
                title="Ayuda y soporte"
                data-testid="button-help"
              >
                <div className="h-8 w-8 flex items-center justify-center">
                  <HelpCircle className="h-[18px] w-[18px]" />
                </div>
              </button>

            </div>
          </div>

          {/* SECCIÓN INFERIOR: Botón de Anclar - idéntico al sidebar izquierdo */}
          <div className="pt-3 pb-3 flex flex-col gap-[2px] items-center">
            {/* Botón de Anclar/Desanclar (sin función por ahora) */}
            <button
              className={cn(
                "h-10 w-8 rounded-md flex items-center justify-center transition-colors",
                "hover:bg-[var(--main-sidebar-button-hover-bg)]",
                "text-[var(--main-sidebar-fg)] hover:text-white"
              )}
              title="Anclar sidebar"
              data-testid="button-dock-right"
              onClick={() => {
                // Sin función por ahora
                console.log('Botón de anclar clickeado (sin función)');
              }}
            >
              <div className="h-8 w-8 flex items-center justify-center">
                <PanelRightClose className="w-[18px] h-[18px]" />
              </div>
            </button>
          </div>

        </aside>
      </div>
    </div>
  );
}
