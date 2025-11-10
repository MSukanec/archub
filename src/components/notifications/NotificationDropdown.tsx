import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CheckCheck, X } from 'lucide-react';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  resolveNotificationHref,
  type UserNotificationRow,
} from '@/lib/notifications';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface NotificationDropdownProps {
  userId: string;
  onRefresh: () => void;
  onClose: () => void;
}

export function NotificationDropdown({ userId, onRefresh, onClose }: NotificationDropdownProps) {
  const [, navigate] = useLocation();
  const [notifications, setNotifications] = useState<UserNotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications(userId, 30, 0);
      setNotifications(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  const handleNotificationClick = async (notification: UserNotificationRow) => {
    try {
      if (!notification.read_at) {
        await markAsRead(notification.id, userId);
        onRefresh();
        await loadNotifications();
      }

      const href = resolveNotificationHref(notification);
      navigate(href);
      onClose();
    } catch (error) {
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead(userId);
      onRefresh();
      await loadNotifications();
    } catch (error) {
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read_at);
  const displayNotifications = notifications.slice(0, 5);
  const hasNotifications = notifications.length > 0;

  return (
    <div className="flex flex-col">
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm !text-white">Notificaciones</h3>
        </div>
        {unreadNotifications.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="h-8 text-xs w-full"
            data-testid="button-mark-all-read"
          >
            <CheckCheck className="h-3 w-3 mr-1" />
            Marcar todas como leídas
          </Button>
        )}
      </div>
      
      <Separator className="bg-[var(--main-sidebar-fg)] opacity-20" />

      <div className={cn(!hasNotifications && "max-h-32", hasNotifications && "max-h-[280px]")}>
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Cargando notificaciones...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No tienes notificaciones
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="divide-y divide-[var(--main-sidebar-fg)]/20">
              {displayNotifications.map((notification) => {
                const isUnread = !notification.read_at;
                const timeAgo = notification.notifications?.created_at
                  ? formatDistanceToNow(new Date(notification.notifications.created_at), {
                      addSuffix: true,
                      locale: es,
                    })
                  : '';

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'w-full text-left p-3 transition-colors',
                      isUnread && 'bg-primary/5',
                      'hover:text-white'
                    )}
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className="flex items-start gap-2">
                      {isUnread && (
                        <div className="h-2 w-2 rounded-full bg-primary mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">
                          {notification.notifications?.title}
                        </p>
                        {notification.notifications?.body && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {notification.notifications.body}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Botón "Ver todas" al final */}
      {hasNotifications && (
        <>
          <Separator className="bg-[var(--main-sidebar-fg)] opacity-20" />
          <div className="p-3">
            <button
              onClick={() => {
                navigate('/notifications');
                onClose();
              }}
              className="w-full text-center text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
              data-testid="button-view-all"
            >
              Ver todas
            </button>
          </div>
        </>
      )}
    </div>
  );
}
