import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/stores/authStore'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { useModalPanelStore } from '@/components/modal/form/modalPanelStore'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

import { Bell } from 'lucide-react'
import type { GlobalAnnouncement } from '@shared/schema'

const announcementSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  message: z.string().min(1, 'El mensaje es requerido'),
  type: z.enum(['info', 'warning', 'error', 'success']),
  link_text: z.string().optional(),
  link_url: z.string().url('URL inválida').optional().or(z.literal('')),
  primary_button_text: z.string().optional(),
  primary_button_url: z.string().url('URL inválida').optional().or(z.literal('')),
  secondary_button_text: z.string().optional(),
  secondary_button_url: z.string().url('URL inválida').optional().or(z.literal('')),
  audience: z.enum(['all', 'free', 'pro', 'teams']),
  is_active: z.boolean().default(true),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
})

interface AnnouncementFormModalProps {
  modalData: {
    announcement?: GlobalAnnouncement | null
    isEditing?: boolean
  }
  onClose: () => void
}

export function AnnouncementFormModal({ modalData, onClose }: AnnouncementFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { setPanel } = useModalPanelStore()
  const { user } = useAuthStore()
  
  const { announcement, isEditing = false } = modalData

  useEffect(() => {
    setPanel('edit')
  }, [setPanel])

  const form = useForm<z.infer<typeof announcementSchema>>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
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
    },
  })

  useEffect(() => {
    if (isEditing && announcement) {
      const formData = {
        title: announcement.title || '',
        message: announcement.message || '',
        type: (announcement.type as 'info' | 'warning' | 'error' | 'success') || 'info',
        link_text: announcement.link_text || '',
        link_url: announcement.link_url || '',
        primary_button_text: announcement.primary_button_text || '',
        primary_button_url: announcement.primary_button_url || '',
        secondary_button_text: announcement.secondary_button_text || '',
        secondary_button_url: announcement.secondary_button_url || '',
        audience: (announcement.audience as 'all' | 'free' | 'pro' | 'teams') || 'all',
        is_active: announcement.is_active ?? true,
        starts_at: announcement.starts_at ? new Date(announcement.starts_at).toISOString().slice(0, 16) : '',
        ends_at: announcement.ends_at ? new Date(announcement.ends_at).toISOString().slice(0, 16) : '',
      }
      form.reset(formData)
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
  }, [isEditing, announcement, form])

  const onSubmit = async (data: z.infer<typeof announcementSchema>) => {
    setIsLoading(true)
    
    try {
      if (!supabase) {
        throw new Error('Supabase not initialized');
      }

      const announcementData = {
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
        created_by: user?.id || null,
      }

      if (isEditing && announcement) {
        const { error } = await supabase
          .from('global_announcements')
          .update(announcementData)
          .eq('id', announcement.id)

        if (error) throw error

        toast({
          title: 'Anuncio actualizado',
          description: 'El anuncio global ha sido actualizado exitosamente.',
        })
      } else {
        const { error } = await supabase
          .from('global_announcements')
          .insert([announcementData])

        if (error) throw error

        toast({
          title: 'Anuncio creado',
          description: 'El anuncio global ha sido creado exitosamente.',
        })
      }

      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      queryClient.invalidateQueries({ queryKey: ['global-announcements'] })
      onClose()
    } catch (error) {
      console.error('Error saving announcement:', error)
      toast({
        title: 'Error',
        description: isEditing 
          ? 'No se pudo actualizar el anuncio. Intenta de nuevo.'
          : 'No se pudo crear el anuncio. Intenta de nuevo.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormModalLayout onClose={onClose}>
      <FormModalHeader
        icon={Bell}
        title={isEditing ? 'Editar Anuncio Global' : 'Nuevo Anuncio Global'}
        description={isEditing 
          ? 'Actualiza la información del anuncio global'
          : 'Crea un nuevo anuncio que se mostrará a los usuarios'
        }
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Título del anuncio" data-testid="input-title" />
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
                  <Textarea {...field} placeholder="Mensaje del anuncio" rows={4} data-testid="input-message" />
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
                      <SelectTrigger data-testid="select-type">
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Advertencia</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="success">Éxito</SelectItem>
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
                      <SelectTrigger data-testid="select-audience">
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
                    data-testid="switch-active"
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
                    <Input type="datetime-local" {...field} data-testid="input-starts-at" />
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
                    <Input type="datetime-local" {...field} data-testid="input-ends-at" />
                  </FormControl>
                  <FormDescription>
                    Deja vacío para que no expire
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold">Enlace en el texto (opcional)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="link_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texto del Enlace</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ver más" data-testid="input-link-text" />
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
                      <Input {...field} placeholder="https://ejemplo.com" data-testid="input-link-url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold">Botón Primario (opcional)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="primary_button_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texto del Botón</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Aceptar" data-testid="input-primary-button-text" />
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
                      <Input {...field} placeholder="https://ejemplo.com" data-testid="input-primary-button-url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold">Botón Secundario (opcional)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="secondary_button_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texto del Botón</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Cancelar" data-testid="input-secondary-button-text" />
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
                      <Input {...field} placeholder="https://ejemplo.com" data-testid="input-secondary-button-url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

        </form>
      </Form>

      <FormModalFooter
        onCancel={onClose}
        onConfirm={form.handleSubmit(onSubmit)}
        confirmText={isEditing ? 'Actualizar' : 'Crear'}
        isLoading={isLoading}
      />
    </FormModalLayout>
  )
}
