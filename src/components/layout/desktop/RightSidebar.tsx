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
import { AIPanel } from "@/components/ai/AIPanel";
import { SupportPanel } from "@/components/support/SupportPanel";
import { Bell, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Moon, Sun, Headphones, PanelRightClose, MessageCircle } from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { getUnreadCount, subscribeUserNotifications } from '@/lib/notifications';
import { useUnreadSupportMessages } from '@/hooks/use-unread-support-messages';
import { useUnreadUserSupportMessages } from '@/hooks/use-unread-user-support-messages';
import { useEffect } from 'react';

export function RightSidebar() {
  const { isDark, toggleTheme } = useThemeStore();
  const { data: userData } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const userId = userData?.user?.id;
  const userFullName = userData?.user?.full_name || userData?.user?.first_name || 'Usuario';
  const userAvatarUrl = userData?.user?.avatar_url;
  
  // Estado para expansión del sidebar - separado para notificaciones, AI y soporte
  const [activePanel, setActivePanel] = useState<'notifications' | 'ai' | 'support' | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Contador de mensajes sin leer
  // Para admins: cuenta mensajes de usuarios sin leer
  const { data: unreadSupportCountAdmin = 0 } = useUnreadSupportMessages();
  // Para usuarios: cuenta mensajes de admin sin leer
  const { data: unreadSupportCountUser = 0 } = useUnreadUserSupportMessages(userId);
  
  // Usar el contador apropiado según el rol
  const unreadSupportCount = isAdmin ? unreadSupportCountAdmin : unreadSupportCountUser;

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

  const handlePanelClick = (panel: 'notifications' | 'ai' | 'support') => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    // Toggle: si ya está abierto, lo cierra; si está cerrado, lo abre
    setActivePanel(activePanel === panel ? null : panel);
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
    <div 
      className="bg-[var(--main-sidebar-bg)] text-[var(--main-sidebar-fg)] border-l border-[var(--main-sidebar-border)] transition-all duration-200 ease-in-out h-screen flex flex-row justify-end"
      style={{
        width: isExpanded ? '400px' : '50px'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* PANEL EXPANDIBLE - Cambia según el panel activo */}
      {isExpanded && userId && (
        <div className="w-[350px] border-r border-[var(--main-sidebar-border)] h-screen overflow-hidden">
          {activePanel === 'notifications' && (
            <div className="px-3 h-full">
              <NotificationDropdown
                userId={userId}
                onRefresh={fetchUnreadCount}
                onClose={() => setActivePanel(null)}
              />
            </div>
          )}
          
          {activePanel === 'ai' && (
            <div className="px-3 h-full">
              <AIPanel
                userId={userId}
                userFullName={userFullName}
                userAvatarUrl={userAvatarUrl}
                onClose={() => setActivePanel(null)}
              />
            </div>
          )}
          
          {activePanel === 'support' && (
            <div className="px-3 h-full">
              <SupportPanel
                userId={userId}
                userFullName={userFullName}
                userAvatarUrl={userAvatarUrl}
                onClose={() => setActivePanel(null)}
              />
            </div>
          )}
        </div>
      )}

      {/* COLUMNA DE BOTONES - Siempre visible, 50px, pegada a la derecha */}
      <div className="w-[50px] h-screen flex-shrink-0">
        <aside className="grid h-screen grid-rows-[1fr_auto] w-[50px]">
          {/* SECCIÓN SUPERIOR: Botones principales */}
          <div className="px-0 pt-6 overflow-y-auto">
            <div className="flex flex-col gap-[2px] items-center">
              
              {/* Avatar del Usuario - Altura igual al logo del sidebar izquierdo */}
              <div className="h-[50px] w-8 flex items-center justify-center">
                <UserQuickAccess />
              </div>

              {/* Espacio después del avatar - igual al logo */}
              <div className="h-3"></div>

              {/* Botón de Notificaciones - altura h-10 - CON CLICK */}
              <button
                className={cn(
                  "relative h-10 w-8 rounded-md flex items-center justify-center transition-colors",
                  "hover:bg-[var(--main-sidebar-button-hover-bg)]",
                  "text-[var(--main-sidebar-fg)] hover:text-white",
                  activePanel === 'notifications' && "bg-[var(--main-sidebar-button-hover-bg)] text-white"
                )}
                title="Notificaciones"
                data-testid="button-notifications"
                onClick={() => handlePanelClick('notifications')}
              >
                <div className="h-8 w-8 flex items-center justify-center relative">
                  <Bell className="h-[18px] w-[18px]" />
                  {unreadCount > 0 && (
                    <span 
                      className="absolute top-0 right-0 h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white border-0"
                      style={{ backgroundColor: 'var(--accent)', transform: 'translate(25%, -25%)' }}
                      data-testid="badge-unread-count"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
              </button>

              {/* Botón de IA - altura h-10 - CON CLICK - CON ICONO BRILLANTE */}
              <button
                className={cn(
                  "relative h-10 w-8 rounded-md flex items-center justify-center transition-all duration-600",
                  "hover:bg-[var(--main-sidebar-button-hover-bg)]",
                  activePanel === 'ai' && "bg-[var(--main-sidebar-button-hover-bg)]"
                )}
                title="Asistente IA"
                data-testid="button-ai"
                onClick={() => handlePanelClick('ai')}
              >
                <Sparkles 
                  className="h-[18px] w-[18px] ai-icon-sparkle"
                  style={{ color: 'var(--accent)' }}
                />
              </button>

            </div>
          </div>

          {/* SECCIÓN INFERIOR: Botones de Ayuda, Discord y Anclar */}
          <div className="pt-6 pb-6 flex flex-col gap-[2px] items-center">
            {/* Ayuda/Soporte - CON CLICK */}
            <button
              className={cn(
                "h-10 w-8 rounded-md flex items-center justify-center transition-colors",
                "hover:bg-[var(--main-sidebar-button-hover-bg)]",
                "text-[var(--main-sidebar-fg)] hover:text-white",
                activePanel === 'support' && "bg-[var(--main-sidebar-button-hover-bg)] text-white"
              )}
              title="Ayuda y soporte"
              data-testid="button-help"
              onClick={() => handlePanelClick('support')}
            >
              <div className="h-8 w-8 flex items-center justify-center relative">
                <Headphones className="h-[18px] w-[18px]" />
                {unreadSupportCount > 0 && (
                  <span 
                    className="absolute top-0 right-0 h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white border-0"
                    style={{ backgroundColor: 'var(--accent)', transform: 'translate(25%, -25%)' }}
                    data-testid="badge-unread-support"
                  >
                    {unreadSupportCount > 99 ? '99+' : unreadSupportCount}
                  </span>
                )}
              </div>
            </button>

            {/* Comunidad Discord */}
            <button
              className={cn(
                "h-10 w-8 rounded-md flex items-center justify-center transition-colors",
                "hover:bg-[var(--main-sidebar-button-hover-bg)]",
                "text-[var(--main-sidebar-fg)] hover:text-white"
              )}
              title="Comunidad Discord"
              data-testid="button-discord"
              onClick={() => {
                window.open('https://discord.com/channels/868615664070443008', '_blank');
              }}
            >
              <div className="h-8 w-8 flex items-center justify-center">
                <MessageCircle className="h-[18px] w-[18px]" />
              </div>
            </button>

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
