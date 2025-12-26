import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/use-current-user'

export const notificationSchema = z.object({
  type: z.string().min(1, 'El tipo es requerido'),
  title: z.string().min(1, 'El título es requerido'),
  body: z.string().optional(),
  audience: z.enum(['direct', 'all', 'role', 'organization'], {
    required_error: 'La audiencia es requerida'
  }),
  data_route: z.string().optional(),
  data_course_slug: z.string().optional(),
})

export type NotificationFormData = z.infer<typeof notificationSchema>

export interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  data: any
  audience: string
  created_at: string
  created_by: string
}

interface FormPanelProps {
  form: ReturnType<typeof useForm<NotificationFormData>>
}

export function FormPanel({ form }: FormPanelProps) {
  return (
    <Form {...form}>
      <form className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-notification-type">
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="info">ℹ️ Información</SelectItem>
                  <SelectItem value="success">✅ Éxito</SelectItem>
                  <SelectItem value="warning">⚠️ Advertencia</SelectItem>
                  <SelectItem value="error">❌ Error</SelectItem>
                  <SelectItem value="course">📚 Curso</SelectItem>
                  <SelectItem value="payment">💰 Pago</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Título de la notificación" 
                  {...field} 
                  data-testid="input-notification-title"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mensaje (opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Mensaje detallado de la notificación"
                  className="min-h-[100px]"
                  {...field} 
                  data-testid="input-notification-body"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="audience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Audiencia</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-notification-audience">
                    <SelectValue placeholder="Selecciona la audiencia" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="all">Todos los usuarios</SelectItem>
                  <SelectItem value="direct">Directo (manual)</SelectItem>
                  <SelectItem value="role">Por rol</SelectItem>
                  <SelectItem value="organization">Por organización</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Datos de Navegación (opcional)</h4>
          
          <FormField
            control={form.control}
            name="data_route"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ruta (URL)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="/cursos/master-archicad" 
                    {...field} 
                    data-testid="input-notification-route"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="data_course_slug"
            render={({ field }) => (
              <FormItem className="mt-3">
                <FormLabel>Slug del Curso</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="master-archicad" 
                    {...field} 
                    data-testid="input-notification-course-slug"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  )
}

interface ViewPanelProps {
  notification?: Notification
}

export function ViewPanel({ notification }: ViewPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Tipo</label>
        <p className="text-sm text-muted-foreground mt-1" data-testid="text-notification-type">
          {notification?.type}
        </p>
      </div>
      <div>
        <label className="text-sm font-medium">Título</label>
        <p className="text-sm text-muted-foreground mt-1" data-testid="text-notification-title">
          {notification?.title}
        </p>
      </div>
      <div>
        <label className="text-sm font-medium">Mensaje</label>
        <p className="text-sm text-muted-foreground mt-1" data-testid="text-notification-body">
          {notification?.body || 'Sin mensaje'}
        </p>
      </div>
      <div>
        <label className="text-sm font-medium">Audiencia</label>
        <p className="text-sm text-muted-foreground mt-1" data-testid="text-notification-audience">
          {notification?.audience}
        </p>
      </div>
    </div>
  )
}

interface UseNotificationFormOptions {
  notification?: Notification
  onSuccess: () => void
}

export function useNotificationForm({ notification, onSuccess }: UseNotificationFormOptions) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { data: userData } = useCurrentUser()

  const form = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      type: notification?.type || 'info',
      title: notification?.title || '',
      body: notification?.body || '',
      audience: (notification?.audience as any) || 'all',
      data_route: notification?.data?.route || '',
      data_course_slug: notification?.data?.course_slug || '',
    }
  })

  useEffect(() => {
    if (notification) {
      form.reset({
        type: notification.type || 'info',
        title: notification.title || '',
        body: notification.body || '',
        audience: (notification.audience as any) || 'all',
        data_route: notification.data?.route || '',
        data_course_slug: notification.data?.course_slug || '',
      })
    } else {
      form.reset({
        type: 'info',
        title: '',
        body: '',
        audience: 'all',
        data_route: '',
        data_course_slug: '',
      })
    }
  }, [notification, form])

  const createNotificationMutation = useMutation({
    mutationFn: async (data: NotificationFormData) => {
      if (!supabase || !userData?.user?.id) throw new Error('Supabase not initialized or user not found')
      
      const notificationData: any = {}
      if (data.data_route) notificationData.route = data.data_route
      if (data.data_course_slug) notificationData.course_slug = data.data_course_slug
      
      const { data: newNotification, error } = await supabase
        .from('notifications')
        .insert({
          type: data.type,
          title: data.title,
          body: data.body || null,
          data: Object.keys(notificationData).length > 0 ? notificationData : null,
          audience: data.audience,
          created_by: userData.user.id
        })
        .select()
        .single()
      
      if (error) throw error

      if (data.audience === 'all') {
        const { data: users } = await supabase
          .from('users')
          .select('id')
        
        if (users && users.length > 0) {
          const deliveries = users.map(user => ({
            user_id: user.id,
            notification_id: newNotification.id
          }))
          
          const { error: deliveryError } = await supabase
            .from('user_notifications')
            .insert(deliveries)
          
          if (deliveryError) throw deliveryError
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
      toast({
        title: 'Notificación creada',
        description: 'La notificación se creó correctamente.'
      })
      onSuccess()
    },
    onError: (error) => {
      console.error('Error creating notification:', error)
      toast({
        title: 'Error',
        description: 'No se pudo crear la notificación. Inténtalo de nuevo.',
        variant: 'destructive'
      })
    }
  })

  const updateNotificationMutation = useMutation({
    mutationFn: async (data: NotificationFormData) => {
      if (!supabase || !notification?.id) throw new Error('Supabase not initialized or notification not found')
      
      const notificationData: any = {}
      if (data.data_route) notificationData.route = data.data_route
      if (data.data_course_slug) notificationData.course_slug = data.data_course_slug
      
      const { error } = await supabase
        .from('notifications')
        .update({
          type: data.type,
          title: data.title,
          body: data.body || null,
          data: Object.keys(notificationData).length > 0 ? notificationData : null,
          audience: data.audience
        })
        .eq('id', notification.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
      toast({
        title: 'Notificación actualizada',
        description: 'Los cambios se guardaron correctamente.'
      })
      onSuccess()
    },
    onError: (error) => {
      console.error('Error updating notification:', error)
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la notificación. Inténtalo de nuevo.',
        variant: 'destructive'
      })
    }
  })

  const onSubmit = async (data: NotificationFormData) => {
    if (notification) {
      await updateNotificationMutation.mutateAsync(data)
    } else {
      await createNotificationMutation.mutateAsync(data)
    }
  }

  return {
    form,
    onSubmit,
    notification,
    isSubmitting: createNotificationMutation.isPending || updateNotificationMutation.isPending,
    isEditing: !!notification,
  }
}
