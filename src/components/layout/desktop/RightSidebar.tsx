/**
 * 🔧 RightSidebar - Sidebar derecho con controles del usuario
 * 
 * Sidebar expandible estilo Firebase:
 * - Hover sobre notificaciones expande el panel hacia la izquierda
 * - Panel de notificaciones integrado en el sidebar
 */

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { UserQuickAccess } from "@/components/ui-custom/layout/UserQuickAccess";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Moon, Sun, HelpCircle, PanelRightClose } from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getUnreadCount, subscribeUserNotifications } from '@/lib/notifications';
import { useEffect } from 'react';

export function RightSidebar() {
  const { isDark, toggleTheme } = useThemeStore();
  const { data: userData } = useCurrentUser();
  const userId = userData?.user?.id;
  
  // Estado para expansión del sidebar
  const [isExpanded, setIsExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleToggleTheme = async () => {
    const userId = userData?.user?.id;
    const preferencesId = userData?.preferences?.id;
    await toggleTheme(userId, preferencesId);
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!userId) return;
    
    try {
      const count = await getUnreadCount(userId);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    if (!userId) return;

    fetchUnreadCount();

    const unsubscribe = subscribeUserNotifications(userId, () => {
      fetchUnreadCount();
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 100);
  };

  return (
    <div 
      className="bg-[var(--main-sidebar-bg)] text-[var(--main-sidebar-fg)] border-l border-[var(--main-sidebar-border)] transition-all duration-200 ease-in-out h-screen flex flex-row justify-end"
      style={{
        width: isExpanded ? '400px' : '50px'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* PANEL DE NOTIFICACIONES - Aparece cuando está expandido */}
      {isExpanded && userId && (
        <div className="w-[350px] border-r border-[var(--main-sidebar-border)] h-screen overflow-hidden">
          <NotificationDropdown
            userId={userId}
            onRefresh={fetchUnreadCount}
            onClose={() => setIsExpanded(false)}
          />
        </div>
      )}

      {/* COLUMNA DE BOTONES - Siempre visible, 50px, pegada a la derecha */}
      <div className="w-[50px] h-screen flex-shrink-0">
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

              {/* Botón de Notificaciones - altura h-10 - CON HOVER */}
              <button
                className={cn(
                  "relative h-10 w-8 rounded-md flex items-center justify-center transition-colors",
                  "hover:bg-[var(--main-sidebar-button-hover-bg)]",
                  "text-[var(--main-sidebar-fg)] hover:text-white"
                )}
                title="Notificaciones"
                data-testid="button-notifications"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <div className="h-8 w-8 flex items-center justify-center">
                  <Bell className="h-[18px] w-[18px]" />
                  {unreadCount > 0 && (
                    <Badge
                      className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center bg-accent text-accent-foreground border-0"
                      data-testid="badge-unread-count"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </div>
              </button>

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
