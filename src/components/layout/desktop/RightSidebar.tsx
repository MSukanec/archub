/**
 * 🔧 RightSidebar - Sidebar derecho con controles del usuario
 * 
 * Estéticamente idéntico al sidebar izquierdo, pero sin expansión.
 * Contiene los botones que estaban en el MainHeader:
 * - Avatar del usuario (UserQuickAccess)
 * - Notificaciones (NotificationBellHeader)
 * - Theme toggle (modo oscuro)
 * - Ayuda/Soporte
 */

import { cn } from "@/lib/utils";
import { UserQuickAccess } from "@/components/ui-custom/layout/UserQuickAccess";
import { NotificationBellHeader } from "@/components/notifications/NotificationBellHeader";
import { Moon, Sun, HelpCircle } from "lucide-react";
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
    <div className="relative h-full">
      {/* Sidebar derecho - estético idéntico al izquierdo */}
      <aside
        className="h-full flex flex-col items-center border-l"
        style={{
          backgroundColor: "var(--main-sidebar-bg)",
          borderLeftColor: "var(--main-sidebar-border)",
          width: "50px" // Fijo, sin expansión
        }}
      >
        {/* Contenedor principal centrado verticalmente */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-6">
          
          {/* Avatar del Usuario */}
          <div className="flex items-center justify-center">
            <UserQuickAccess />
          </div>

          {/* Notificaciones */}
          <div className="flex items-center justify-center">
            <NotificationBellHeader />
          </div>

          {/* Divisor visual */}
          <div className="w-8 h-[1px] bg-[var(--main-sidebar-fg)] opacity-20 my-2" />

          {/* Toggle de Tema (Dark/Light Mode) */}
          <button
            onClick={handleToggleTheme}
            className={cn(
              "h-8 w-8 rounded-md flex items-center justify-center transition-colors",
              "hover:bg-[var(--main-sidebar-button-hover-bg)]",
              "text-[var(--main-sidebar-fg)] hover:text-white"
            )}
            title={isDark ? "Modo claro" : "Modo oscuro"}
            data-testid="button-theme-toggle"
          >
            {isDark ? (
              <Sun className="h-[18px] w-[18px]" />
            ) : (
              <Moon className="h-[18px] w-[18px]" />
            )}
          </button>

          {/* Ayuda/Soporte */}
          <button
            className={cn(
              "h-8 w-8 rounded-md flex items-center justify-center transition-colors",
              "hover:bg-[var(--main-sidebar-button-hover-bg)]",
              "text-[var(--main-sidebar-fg)] hover:text-white"
            )}
            title="Ayuda y soporte"
            data-testid="button-help"
          >
            <HelpCircle className="h-[18px] w-[18px]" />
          </button>

        </div>

        {/* Sección inferior (opcional - fecha/hora como en Firebase) */}
        <div className="pb-3 flex flex-col items-center gap-1">
          <div className="text-[10px] text-[var(--main-sidebar-fg)] opacity-60 leading-tight text-center">
            {new Date().toLocaleDateString('es-ES', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric' 
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}
