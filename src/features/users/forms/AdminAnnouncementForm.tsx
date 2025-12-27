import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/features/users/hooks'

export const announcementSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  message: z.string().min(1, 'El mensaje es requerido'),
  type: z.enum(['info', 'warning', 'error', 'success'], {
    required_error: 'El tipo es requerido'
  }),
  link_text: z.string().optional(),
  link_url: z.string().url('URL inválida').optional().or(z.literal('')),
  primary_button_text: z.string().optional(),
  primary_button_url: z.string().url('URL inválida').optional().or(z.literal('')),
  secondary_button_text: z.string().optional(),
  secondary_button_url: z.string().url('URL inválida').optional().or(z.literal('')),
  audience: z.enum(['all', 'free', 'pro', 'teams'], {
    required_error: 'La audiencia es requerida'
  }),
  is_active: z.boolean().default(true),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
})

export type AnnouncementFormData = z.infer<typeof announcementSchema>

export interface Announcement {
  id: string
  title: string
  message: string
  type: string
  link_text: string | null
  link_url: string | null
  primary_button_text: string | null
  primary_button_url: string | null
  secondary_button_text: string | null
  secondary_button_url: string | null
  audience: string | null
  is_active: boolean | null
  starts_at: string | null
  ends_at: string | null
  created_at: string | null
  created_by: string | null
}

interface FormPanelProps {
  form: ReturnType<typeof useForm<AnnouncementFormData>>
}

export function FormPanel({ form }: FormPanelProps) {
  return (
    <Form {...form}>
      <form className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Título del anuncio" {...field} data-testid="input-announcement-title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mensaje</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Mensaje del anuncio"
                  className="min-h-[100px]"
                  {...field}
                  data-testid="input-announcement-message"
                />
              </FormControl>
              <FormDescription>
                Puedes incluir enlaces con mailto:, https://, tel: o wa.me/
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-announcement-type">
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="info">ℹ️ Info</SelectItem>
                    <SelectItem value="warning">⚠️ Advertencia</SelectItem>
                    <SelectItem value="error">❌ Error</SelectItem>
                    <SelectItem value="success">✅ Éxito</SelectItem>
                  </SelectContent>
                </Select>
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
                    <SelectTrigger data-testid="select-announcement-audience">
                      <SelectValue placeholder="Selecciona la audiencia" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="teams">Teams</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Anuncio Activo</FormLabel>
                <FormDescription>
                  Si está activo, se mostrará a los usuarios según las fechas configuradas
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="switch-announcement-active"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="starts_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Inicio</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} data-testid="input-announcement-starts-at" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ends_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Fin (Opcional)</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} data-testid="input-announcement-ends-at" />
                </FormControl>
                <FormDescription>
                  Deja vacío para que no expire
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Enlace en el texto (opcional)</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="link_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texto del Enlace</FormLabel>
                  <FormControl>
                    <Input placeholder="Ver más" {...field} data-testid="input-announcement-link-text" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="link_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL del Enlace</FormLabel>
                  <FormControl>
                    <Input placeholder="https://ejemplo.com" {...field} data-testid="input-announcement-link-url" />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Ejemplos: <code className="text-xs bg-muted px-1 rounded">https://...</code>, <code className="text-xs bg-muted px-1 rounded">mailto:email@ejemplo.com</code>, <code className="text-xs bg-muted px-1 rounded">https://wa.me/5491112345678</code>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Botón Primario (opcional)</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="primary_button_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texto del Botón</FormLabel>
                  <FormControl>
                    <Input placeholder="Aceptar" {...field} data-testid="input-announcement-primary-btn-text" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="primary_button_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL del Botón</FormLabel>
                  <FormControl>
                    <Input placeholder="https://ejemplo.com" {...field} data-testid="input-announcement-primary-btn-url" />
                  </FormControl>
                  <FormDescription className="text-xs">
                    WhatsApp: <code className="text-xs bg-muted px-1 rounded">https://wa.me/5491112345678</code> | Email: <code className="text-xs bg-muted px-1 rounded">mailto:hola@ejemplo.com</code>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Botón Secundario (opcional)</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="secondary_button_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texto del Botón</FormLabel>
                  <FormControl>
                    <Input placeholder="Cancelar" {...field} data-testid="input-announcement-secondary-btn-text" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="secondary_button_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL del Botón</FormLabel>
                  <FormControl>
                    <Input placeholder="https://ejemplo.com" {...field} data-testid="input-announcement-secondary-btn-url" />
                  </FormControl>
                  <FormDescription className="text-xs">
                    WhatsApp: <code className="text-xs bg-muted px-1 rounded">https://wa.me/5491112345678</code> | Email: <code className="text-xs bg-muted px-1 rounded">mailto:hola@ejemplo.com</code>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </form>
    </Form>
  )
}

interface ViewPanelProps {
  announcement?: Announcement
}

export function ViewPanel({ announcement }: ViewPanelProps) {
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      info: 'Información',
      warning: 'Advertencia',
      error: 'Error',
      success: 'Éxito'
    }
    return labels[type] || type
  }

  const getAudienceLabel = (audience: string) => {
    const labels: Record<string, string> = {
      all: 'Todos los usuarios',
      free: 'Solo plan Free',
      pro: 'Solo plan Pro',
      teams: 'Solo plan Teams'
    }
    return labels[audience] || audience
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground mb-1">Título</p>
        <p className="font-medium" data-testid="text-announcement-title">
          {announcement?.title || 'Sin título'}
        </p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1">Mensaje</p>
        <p className="text-sm whitespace-pre-wrap" data-testid="text-announcement-message">
          {announcement?.message || 'Sin mensaje'}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Tipo</p>
          <p className="text-sm" data-testid="text-announcement-type">
            {getTypeLabel(announcement?.type || 'info')}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Audiencia</p>
          <p className="text-sm" data-testid="text-announcement-audience">
            {getAudienceLabel(announcement?.audience || 'all')}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Estado</p>
          <p className="text-sm" data-testid="text-announcement-status">
            {announcement?.is_active ? 'Activo' : 'Inactivo'}
          </p>
        </div>
      </div>
      {(announcement?.starts_at || announcement?.ends_at) && (
        <div className="grid grid-cols-2 gap-4">
          {announcement.starts_at && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Inicia</p>
              <p className="text-sm" data-testid="text-announcement-starts">
                {new Date(announcement.starts_at).toLocaleDateString()}
              </p>
            </div>
          )}
          {announcement.ends_at && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Termina</p>
              <p className="text-sm" data-testid="text-announcement-ends">
                {new Date(announcement.ends_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface UseAnnouncementFormOptions {
  announcement?: Announcement
  onSuccess: () => void
}

export function useAnnouncementForm({ announcement, onSuccess }: UseAnnouncementFormOptions) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { data: userData } = useCurrentUser()

  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: announcement?.title || '',
      message: announcement?.message || '',
      type: (announcement?.type as any) || 'info',
      link_text: announcement?.link_text || '',
      link_url: announcement?.link_url || '',
      primary_button_text: announcement?.primary_button_text || '',
      primary_button_url: announcement?.primary_button_url || '',
      secondary_button_text: announcement?.secondary_button_text || '',
      secondary_button_url: announcement?.secondary_button_url || '',
      audience: (announcement?.audience as any) || 'all',
      is_active: announcement?.is_active ?? true,
      starts_at: announcement?.starts_at ? new Date(announcement.starts_at).toISOString().slice(0, 16) : '',
      ends_at: announcement?.ends_at ? new Date(announcement.ends_at).toISOString().slice(0, 16) : '',
    }
  })

  useEffect(() => {
    if (announcement) {
      form.reset({
        title: announcement.title || '',
        message: announcement.message || '',
        type: (announcement.type as any) || 'info',
        link_text: announcement.link_text || '',
        link_url: announcement.link_url || '',
        primary_button_text: announcement.primary_button_text || '',
        primary_button_url: announcement.primary_button_url || '',
        secondary_button_text: announcement.secondary_button_text || '',
        secondary_button_url: announcement.secondary_button_url || '',
        audience: (announcement.audience as any) || 'all',
        is_active: announcement.is_active ?? true,
        starts_at: announcement.starts_at ? new Date(announcement.starts_at).toISOString().slice(0, 16) : '',
        ends_at: announcement.ends_at ? new Date(announcement.ends_at).toISOString().slice(0, 16) : '',
      })
    } else {
      form.reset({
        title: '',
        message: '',
        type: 'info',
        link_text: '',
        link_url: '',
        primary_button_text: '',
        primary_button_url: '',
        secondary_button_text: '',
        secondary_button_url: '',
        audience: 'all',
        is_active: true,
        starts_at: '',
        ends_at: '',
      })
    }
  }, [announcement, form])

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: AnnouncementFormData) => {
      if (!supabase || !userData?.user?.id) throw new Error('Supabase not initialized or user not found')
      
      const { error } = await supabase
        .from('global_announcements')
        .insert({
          title: data.title,
          message: data.message,
          type: data.type,
          link_text: data.link_text || null,
          link_url: data.link_url || null,
          primary_button_text: data.primary_button_text || null,
          primary_button_url: data.primary_button_url || null,
          secondary_button_text: data.secondary_button_text || null,
          secondary_button_url: data.secondary_button_url || null,
          audience: data.audience,
          is_active: data.is_active,
          starts_at: data.starts_at ? new Date(data.starts_at).toISOString() : new Date().toISOString(),
          ends_at: data.ends_at ? new Date(data.ends_at).toISOString() : null,
          created_by: userData.user.id
        })
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      queryClient.invalidateQueries({ queryKey: ['global-announcements'] })
      toast({
        title: 'Anuncio creado',
        description: 'El anuncio global se creó correctamente.'
      })
      onSuccess()
    },
    onError: (error) => {
      console.error('Error creating announcement:', error)
      toast({
        title: 'Error',
        description: 'No se pudo crear el anuncio. Inténtalo de nuevo.',
        variant: 'destructive'
      })
    }
  })

  const updateAnnouncementMutation = useMutation({
    mutationFn: async (data: AnnouncementFormData) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { error } = await supabase
        .from('global_announcements')
        .update({
          title: data.title,
          message: data.message,
          type: data.type,
          link_text: data.link_text || null,
          link_url: data.link_url || null,
          primary_button_text: data.primary_button_text || null,
          primary_button_url: data.primary_button_url || null,
          secondary_button_text: data.secondary_button_text || null,
          secondary_button_url: data.secondary_button_url || null,
          audience: data.audience,
          is_active: data.is_active,
          starts_at: data.starts_at ? new Date(data.starts_at).toISOString() : null,
          ends_at: data.ends_at ? new Date(data.ends_at).toISOString() : null,
        })
        .eq('id', announcement!.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      queryClient.invalidateQueries({ queryKey: ['global-announcements'] })
      toast({
        title: 'Anuncio actualizado',
        description: 'Los cambios se guardaron correctamente.'
      })
      onSuccess()
    },
    onError: (error) => {
      console.error('Error updating announcement:', error)
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el anuncio. Inténtalo de nuevo.',
        variant: 'destructive'
      })
    }
  })

  const onSubmit = async (data: AnnouncementFormData) => {
    if (announcement) {
      await updateAnnouncementMutation.mutateAsync(data)
    } else {
      await createAnnouncementMutation.mutateAsync(data)
    }
  }

  return {
    form,
    onSubmit,
    announcement,
    isSubmitting: createAnnouncementMutation.isPending || updateAnnouncementMutation.isPending,
  }
}
