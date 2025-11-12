import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Bell, CheckCircle, Circle, CheckCheck } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { supabase } from '@/lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { markAsRead, markAllAsRead, resolveNotificationHref, type UserNotificationRow } from '@/lib/notifications'
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner'

export default function Notifications() {
  const { data: userData, isLoading } = useCurrentUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [, navigate] = useLocation()

  // Query para obtener notificaciones
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications', userData?.user?.id],
    queryFn: async () => {
      if (!supabase || !userData?.user?.id) {
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
        .eq('user_id', userData.user.id)
        .order('delivered_at', { ascending: false })

      if (error) throw error
      return (data as any[]) || []
    },
    enabled: !!userData?.user?.id
  })

  // Mutación para marcar como leída
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!userData?.user?.id) throw new Error('No user available')
      await markAsRead(notificationId, userData.user.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo marcar la notificación como leída",
        variant: "destructive"
      })
    }
  })

  // Mutación para marcar todas como leídas
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!userData?.user?.id) throw new Error('No user available')
      await markAllAsRead(userData.user.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast({
        title: "Listo",
        description: "Todas las notificaciones han sido marcadas como leídas"
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudieron marcar las notificaciones como leídas",
        variant: "destructive"
      })
    }
  })

  // Manejar click en fila
  const handleNotificationClick = async (notification: UserNotificationRow) => {
    try {
      // Marcar como leída si no lo está
      if (!notification.read_at) {
        await markAsReadMutation.mutateAsync(notification.id)
      }

      // Navegar a la URL correspondiente
      const href = resolveNotificationHref(notification)
      navigate(href)
    } catch (error) {
      console.error('Error handling notification click:', error)
    }
  }

  // Obtener badge de tipo
  const getTypeBadge = (type: string) => {
    const typeMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'task_assigned': { label: 'Tarea', variant: 'default' },
      'task_completed': { label: 'Tarea', variant: 'secondary' },
      'comment_added': { label: 'Comentario', variant: 'outline' },
      'mention': { label: 'Mención', variant: 'default' },
      'system': { label: 'Sistema', variant: 'secondary' },
    }

    const config = typeMap[type] || { label: type, variant: 'outline' as const }
    
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    )
  }

  // Columnas de la tabla
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
  ]

  if (isLoading || notificationsLoading) {
    return <LoadingSpinner fullScreen size="lg" />
  }

  const unreadNotifications = notifications.filter(n => !n.read_at)

  const headerProps = {
    icon: Bell,
    title: "Notificaciones",
    pageTitle: "Notificaciones",
    subtitle: "Centro de Notificaciones",
    description: "Consulta todas tus notificaciones y mantente al día con las actualizaciones importantes.",
    actions: unreadNotifications.length > 0 ? [
      <Button
        key="mark-all-read"
        onClick={() => markAllAsReadMutation.mutate()}
        disabled={markAllAsReadMutation.isPending}
        className="h-8 px-3 text-xs"
        data-testid="button-mark-all-read"
      >
        <CheckCheck className="w-4 h-4 mr-1" />
        Marcar todas como leídas
      </Button>
    ] : []
  }

  if (notifications.length === 0) {
    return (
      <Layout headerProps={headerProps}>
        <EmptyState
          icon={<Bell className="w-8 h-8 text-muted-foreground" />}
          title="No tienes notificaciones"
          description="Cuando recibas notificaciones, aparecerán aquí"
        />
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps}>
      <Table
        data={notifications}
        columns={columns}
      />
    </Layout>
  )
}
