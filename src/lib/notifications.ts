import { supabase } from '@/lib/supabase';

export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: any;
  created_at: string;
}

export interface UserNotificationRow {
  id: string;
  user_id: string;
  notification_id: string;
  delivered_at: string;
  read_at: string | null;
  clicked_at: string | null;
  notifications: NotificationRow | null;
}

export async function getUnreadCount(userId: string): Promise<number> {
  if (!supabase) throw new Error('Supabase not initialized');

  const { count, error } = await supabase
    .from('user_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) {
    return 0;
  }

  return count || 0;
}

export async function fetchNotifications(
  userId: string,
  limit: number = 30,
  offset: number = 0
): Promise<UserNotificationRow[]> {
  if (!supabase) throw new Error('Supabase not initialized');

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
    .order('delivered_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return (data as any[]) || [];
}

export async function markAsRead(deliveryId: string, userId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not initialized');

  const { error } = await supabase
    .from('user_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', deliveryId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}

export async function markAllAsRead(userId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not initialized');

  const { error } = await supabase
    .from('user_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) {
    throw error;
  }
}

export function subscribeUserNotifications(
  userId: string,
  callback: () => void
): () => void {
  if (!supabase) {
    return () => {};
  }

  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_notifications',
        filter: `user_id=eq.${userId}`,
      },
      () => {
        callback();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function resolveNotificationHref(n: UserNotificationRow): string {
  const d = n.notifications?.data || {};
  
  if (d.route) return String(d.route);
  if (d.course_slug) return `/cursos/${d.course_slug}`;
  if (d.payment_id) return `/admin/payments/${d.payment_id}`;
  if (d.organization_id) return `/organization/${d.organization_id}`;
  if (d.project_id) return `/projects/${d.project_id}`;
  
  return '/notifications';
}
