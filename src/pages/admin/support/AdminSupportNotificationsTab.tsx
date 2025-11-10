import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Edit, Trash2, Bell } from 'lucide-react'
import { formatDateCompact } from '@/lib/date-utils'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: any;
  audience: string;
  created_at: string;
  created_by: string;
  creator?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  } | null;
  delivery_count?: number;
  read_count?: number;
}

const AdminSupportNotificationsTab = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { openModal } = useGlobalModalStore()

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          type,
          title,
          body,
          data,
          audience,
          created_at,
          created_by
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Obtener los usuarios creadores
      const creatorIds = Array.from(new Set(data.map(n => n.created_by).filter(Boolean)));
      
      const usersResult = creatorIds.length > 0 ? await supabase!
        .from('users')
        .select('id, full_name, email, avatar_url')
        .in('id', creatorIds) : { data: [], error: null };

      // Obtener conteos de entregas y lecturas para cada notificación
      const notificationsWithStats = await Promise.all(
        data.map(async (notification) => {
          const [deliveryResult, readResult] = await Promise.all([
            supabase!
              .from('user_notifications')
              .select('id', { count: 'exact', head: true })
              .eq('notification_id', notification.id),
            supabase!
              .from('user_notifications')
              .select('id', { count: 'exact', head: true })
              .eq('notification_id', notification.id)
              .not('read_at', 'is', null)
          ]);

          return {
            ...notification,
            creator: usersResult.data?.find(user => user.id === notification.created_by) || null,
            delivery_count: deliveryResult.count || 0,
            read_count: readResult.count || 0
          };
        })
      );

      return notificationsWithStats;
    }
  })

  const handleEdit = (notification: Notification) => {
    openModal('notification', { notification, isEditing: true });
  };

  const handleDelete = (notification: Notification) => {
    openModal('delete-confirmation', {
      title: 'Eliminar notificación',
      description: '¿Estás seguro de que deseas eliminar esta notificación? También se eliminarán todas las entregas asociadas.',
      itemName: notification.title,
      destructiveActionText: 'Eliminar',
      onConfirm: async () => {
        if (!supabase) return;
        
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', notification.id);
        
        if (error) {
          toast({
            title: 'Error',
            description: 'No se pudo eliminar la notificación.',
            variant: 'destructive'
          });
        } else {
          queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
          toast({
            title: 'Notificación eliminada',
            description: 'La notificación se eliminó correctamente.'
          });
        }
      }
    });
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'success':
        return 'default';
      case 'info':
        return 'secondary';
      case 'warning':
        return 'outline';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case 'all':
        return 'Todos';
      case 'direct':
        return 'Directo';
      case 'role':
        return 'Por rol';
      case 'organization':
        return 'Por organización';
      default:
        return audience;
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Título',
      width: '30%',
      render: (notification: Notification) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{notification.title}</span>
          <span className="text-xs text-muted-foreground line-clamp-1">
            {notification.body || 'Sin mensaje'}
          </span>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Tipo',
      width: '12%',
      render: (notification: Notification) => (
        <Badge variant={getTypeBadgeVariant(notification.type)} className="text-xs">
          {notification.type}
        </Badge>
      )
    },
    {
      key: 'audience',
      label: 'Audiencia',
      width: '12%',
      render: (notification: Notification) => (
        <span className="text-xs text-muted-foreground">
          {getAudienceLabel(notification.audience)}
        </span>
      )
    },
    {
      key: 'stats',
      label: 'Entregas / Leídas',
      width: '15%',
      render: (notification: Notification) => (
        <span className="text-xs text-muted-foreground">
          {notification.delivery_count} / {notification.read_count}
        </span>
      )
    },
    {
      key: 'creator',
      label: 'Creado por',
      width: '15%',
      render: (notification: Notification) => (
        <span className="text-xs text-muted-foreground">
          {notification.creator?.full_name || 'Desconocido'}
        </span>
      )
    },
    {
      key: 'created_at',
      label: 'Fecha',
      width: '12%',
      render: (notification: Notification) => (
        <span className="text-xs text-muted-foreground">
          {formatDateCompact(notification.created_at)}
        </span>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Notifications Table */}
      <Table
        data={notifications}
        columns={columns}
        isLoading={isLoading}
        rowActions={(notification) => [
          {
            icon: Edit,
            label: 'Editar',
            onClick: () => handleEdit(notification)
          },
          {
            icon: Trash2,
            label: 'Eliminar',
            onClick: () => handleDelete(notification),
            variant: 'destructive' as const
          }
        ]}
        emptyState={
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">No se encontraron notificaciones</p>
            <p className="text-xs">No hay notificaciones creadas.</p>
          </div>
        }
      />
    </div>
  )
}

export default AdminSupportNotificationsTab
