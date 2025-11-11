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
import { SidebarIconButton } from "../desktop/SidebarIconButton";
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
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';

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

  // 🔥 SUPABASE REALTIME - Suscripción para mensajes de soporte
  useEffect(() => {
    if (!supabase || !userId) return;

    let channel: any = null;

    const setupRealtimeSubscription = async () => {
      // Obtener el user_id de la tabla users
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', userId)
        .single();

      if (!userData) return;

      const dbUserId = userData.id;

      // Crear canal único para este usuario/admin
      const channelName = isAdmin ? 'admin_support_badge' : `user_support_badge_${dbUserId}`;
      
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'support_messages',
            ...(isAdmin ? {} : { filter: `user_id=eq.${dbUserId}` }) // Admin escucha todo, usuario solo sus mensajes
          },
          (payload) => {
            console.log('🔥 Support badge Realtime update:', payload);
            
            if (isAdmin) {
              // Admin: invalidar contador Y conversaciones
              queryClient.invalidateQueries({ queryKey: ['unread-support-messages-count'] });
              queryClient.invalidateQueries({ queryKey: ['admin-support-conversations'] });
            } else {
              // Usuario: invalidar contador Y mensajes
              queryClient.invalidateQueries({ queryKey: ['unread-user-support-messages-count', userId] });
              queryClient.invalidateQueries({ queryKey: ['support-messages', userId] });
            }
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, isAdmin]);

  const handlePanelClick = (panel: 'notifications' | 'ai' | 'support') => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    // Toggle: si ya está abierto, lo cierra; si está cerrado, lo abre
    setActivePanel(activePanel === panel ? null : panel);
    
    // Si se abre el panel de soporte, invalidar inmediatamente el contador
    if (panel === 'support' && activePanel !== 'support') {
      // Forzar actualización inmediata del contador de mensajes no leídos
      queryClient.invalidateQueries({ queryKey: ['unread-user-support-messages-count', userId] });
      queryClient.invalidateQueries({ queryKey: ['unread-support-messages-count'] });
    }
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
      className="bg-[var(--main-sidebar-bg)] text-[var(--main-sidebar-fg)] border-l border-[var(--main-sidebar-border)] transition-all duration-200 ease-in-out h-full flex flex-row justify-end rounded-lg overflow-hidden"
      style={{
        width: isExpanded ? '400px' : '50px'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* PANEL EXPANDIBLE - Cambia según el panel activo */}
      {isExpanded && userId && (
        <div className="w-[350px] border-r border-[var(--main-sidebar-border)] h-full overflow-hidden">
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
      <div className="w-[50px] h-full flex-shrink-0">
        <aside className="grid h-full grid-rows-[1fr_auto] w-[50px]">
          {/* SECCIÓN SUPERIOR: Botones principales */}
          <div className="px-0 pt-6 overflow-y-auto">
            <div className="flex flex-col gap-[2px] items-center">
              
              {/* Avatar del Usuario - Altura igual al logo del sidebar izquierdo */}
              <div className="h-[50px] w-8 flex items-center justify-center">
                <UserQuickAccess />
              </div>

              {/* Espacio después del avatar - igual al logo */}
              <div className="h-3"></div>

              {/* Botón de Notificaciones */}
              <SidebarIconButton
                icon={<Bell className="h-5 w-5" />}
                isActive={activePanel === 'notifications'}
                onClick={() => handlePanelClick('notifications')}
                badge={unreadCount}
                title="Notificaciones"
                testId="button-notifications"
              />

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

          {/* SECCIÓN INFERIOR: Botones de Ayuda, Discord y Anclar */}
          <div className="pt-6 pb-6 flex flex-col gap-[2px] items-center">
            {/* Ayuda/Soporte */}
            <SidebarIconButton
              icon={<Headphones className="h-5 w-5" />}
              isActive={activePanel === 'support'}
              onClick={() => handlePanelClick('support')}
              badge={unreadSupportCount}
              title="Ayuda y soporte"
              testId="button-help"
            />

            {/* Comunidad Discord */}
            <SidebarIconButton
              icon={<MessageCircle className="h-5 w-5" />}
              onClick={() => window.open('https://discord.com/channels/868615664070443008', '_blank')}
              title="Comunidad Discord"
              testId="button-discord"
            />

            {/* Botón de Anclar/Desanclar (sin función por ahora) */}
            <SidebarIconButton
              icon={<PanelRightClose className="h-5 w-5" />}
              onClick={() => console.log('Botón de anclar clickeado (sin función)')}
              title="Anclar sidebar"
              testId="button-dock-right"
            />
          </div>

        </aside>
      </div>
    </div>
  );
}
