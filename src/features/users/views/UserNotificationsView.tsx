import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/shared/trees/Table';
import { Bell, CheckCircle, Circle, CheckCheck } from 'lucide-react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { EmptyState } from '@/components/shared/EmptyState';
import { markAsRead, markAllAsRead, resolveNotificationHref, type UserNotificationRow } from '@/lib/notifications';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';
import { useCurrentUser } from '@/features/users/hooks';
import { usersKeys } from '@/core/query-keys';

export function UserNotificationsView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const userId = userData?.user?.id;

  const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: usersKeys.notifications(userId || ''),
    queryFn: async () => {
      if (!supabase || !userId) {
        throw new Error('No user available');
      }

      const { data, error } = await supabase
        .from('user_notifications')
        .select(`
          id,
          user_id,
          notification_id,
          delivered_at,
          read_at,
          clicked_at,
          notifications (
            id,
            type,
            title,
            body,
            data,
            created_at
          )
        `)
        .eq('user_id', userId)
        .order('delivered_at', { ascending: false });

      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!userId
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!userId) throw new Error('No user available');
      await markAsRead(notificationId, userId);
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: usersKeys.notifications(userId) });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo marcar la notificación como leída",
        variant: "destructive"
      });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('No user available');
      await markAllAsRead(userId);
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: usersKeys.notifications(userId) });
      }
      toast({
        title: "Listo",
        description: "Todas las notificaciones han sido marcadas como leídas"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron marcar las notificaciones como leídas",
        variant: "destructive"
      });
    }
  });

  const handleNotificationClick = async (notification: UserNotificationRow) => {
    try {
      if (!notification.read_at) {
        await markAsReadMutation.mutateAsync(notification.id);
      }

      const href = resolveNotificationHref(notification);
      navigate(href);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const getTypeBadge = (type: string) => {
    const typeMap: Record<string, { label: string; variant: 'info' | 'success' | 'neutral' | 'pending' | 'warning' }> = {
      'task_assigned': { label: 'Tarea', variant: 'info' },
      'task_completed': { label: 'Tarea', variant: 'success' },
      'comment_added': { label: 'Comentario', variant: 'neutral' },
      'mention': { label: 'Mención', variant: 'info' },
      'system': { label: 'Sistema', variant: 'neutral' },
    };

    const config = typeMap[type] || { label: type, variant: 'neutral' };
    
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const columns = [
    {
      key: "type" as const,
      label: "Tipo",
      sortable: false,
      width: "100px",
      render: (notification: UserNotificationRow) => (
        <div className="flex items-center gap-2" onClick={() => handleNotificationClick(notification)}>
          {!notification.read_at && (
            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
          )}
          {getTypeBadge(notification.notifications?.type || 'system')}
        </div>
      )
    },
    {
      key: "title" as const,
      label: "Título",
      sortable: false,
      width: "250px",
      render: (notification: UserNotificationRow) => (
        <div className="font-medium text-sm cursor-pointer" onClick={() => handleNotificationClick(notification)}>
          {notification.notifications?.title}
        </div>
      )
    },
    {
      key: "body" as const,
      label: "Mensaje",
      sortable: false,
      render: (notification: UserNotificationRow) => (
        <div className="text-sm text-muted-foreground line-clamp-2 cursor-pointer" onClick={() => handleNotificationClick(notification)}>
          {notification.notifications?.body || '—'}
        </div>
      )
    },
    {
      key: "delivered_at" as const,
      label: "Fecha",
      sortable: true,
      width: "150px",
      render: (notification: UserNotificationRow) => (
        <div className="text-sm text-muted-foreground cursor-pointer" onClick={() => handleNotificationClick(notification)}>
          {notification.delivered_at 
            ? format(new Date(notification.delivered_at), "dd/MM/yyyy HH:mm", { locale: es })
            : '—'}
        </div>
      )
    },
    {
      key: "status" as const,
      label: "Estado",
      sortable: false,
      width: "100px",
      render: (notification: UserNotificationRow) => (
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNotificationClick(notification)}>
          {notification.read_at ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Leída</span>
            </>
          ) : (
            <>
              <Circle className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">No leída</span>
            </>
          )}
        </div>
      )
    }
  ];

  if (notificationsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const unreadNotifications = notifications.filter(n => !n.read_at);

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={<Bell className="w-8 h-8 text-muted-foreground" />}
        title="No tienes notificaciones"
        description="Cuando recibas notificaciones, aparecerán aquí"
        data-testid="empty-notifications-state"
      />
    );
  }

  return (
    <div className="space-y-4">
      {unreadNotifications.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            variant="outline"
            className="h-8 px-3 text-xs"
            data-testid="button-mark-all-read"
          >
            <CheckCheck className="w-4 h-4 mr-1" />
            Marcar todas como leídas
          </Button>
        </div>
      )}
      <Table
        data={notifications}
        columns={columns}
      />
    </div>
  );
}
