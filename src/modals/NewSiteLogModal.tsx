import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { supabase } from '@/lib/supabase'
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout'
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader'
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody'
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Calendar, User, FileText, Cloud, MessageSquare, Star, Eye } from 'lucide-react'

// Schema con enums exactos de Supabase
const siteLogSchema = z.object({
  log_date: z.date(),
  created_by: z.string().min(1, 'Creador es requerido'),
  entry_type: z.enum(['avance_de_obra', 'incidente', 'reunion', 'inspeccion', 'entrega', 'otro'], {
    required_error: 'Tipo de entrada es requerido'
  }),
  weather_enum: z.enum(['sunny', 'partly_cloudy', 'cloudy', 'rainy', 'stormy', 'snowy', 'foggy', 'windy'], {
    required_error: 'Clima es requerido'
  }),
  comments: z.string().min(1, 'Comentarios son requeridos'),
  is_public: z.boolean().default(false),
  is_favorite: z.boolean().default(false)
})

type SiteLogForm = z.infer<typeof siteLogSchema>

interface SiteLog {
  id: string
  log_date: string
  created_by: string
  entry_type: string
  weather_enum: string
  comments: string
  is_public: boolean
  is_favorite: boolean
}

interface NewSiteLogModalProps {
  open: boolean
  onClose: () => void
  editingSiteLog?: SiteLog | null
}

// Mapeo de tipos de entrada con iconos
const entryTypes = [
  { value: 'avance_de_obra', label: '📝 Avance de obra', icon: '📝' },
  { value: 'incidente', label: '⚠️ Incidente', icon: '⚠️' },
  { value: 'reunion', label: '🤝 Reunión', icon: '🤝' },
  { value: 'inspeccion', label: '🔍 Inspección', icon: '🔍' },
  { value: 'entrega', label: '📦 Entrega', icon: '📦' },
  { value: 'otro', label: '📋 Otro', icon: '📋' }
]

// Mapeo de clima con iconos
const weatherOptions = [
  { value: 'sunny', label: '☀️ Soleado', icon: '☀️' },
  { value: 'partly_cloudy', label: '🌤️ Parcialmente nublado', icon: '🌤️' },
  { value: 'cloudy', label: '☁️ Nublado', icon: '☁️' },
  { value: 'rainy', label: '🌧️ Lluvioso', icon: '🌧️' },
  { value: 'stormy', label: '⛈️ Tormenta', icon: '⛈️' },
  { value: 'snowy', label: '❄️ Nieve', icon: '❄️' },
  { value: 'foggy', label: '🌫️ Niebla', icon: '🌫️' },
  { value: 'windy', label: '💨 Viento', icon: '💨' }
]

export function NewSiteLogModal({ open, onClose, editingSiteLog }: NewSiteLogModalProps) {
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const organizationId = userData?.preferences?.last_organization_id
  const projectId = userData?.preferences?.last_project_id

  const { data: members = [] } = useOrganizationMembers(organizationId)

  const form = useForm<SiteLogForm>({
    resolver: zodResolver(siteLogSchema),
    defaultValues: {
      log_date: new Date(),
      created_by: '',
      entry_type: 'avance_de_obra',
      weather_enum: 'sunny',
      comments: '',
      is_public: false,
      is_favorite: false
    }
  })

  // Inicializar formulario cuando el modal se abre
  useEffect(() => {
    if (open && userData && members.length > 0) {
      // Establecer usuario actual como creador por defecto
      const currentUserMembership = members.find(member => 
        member.users?.id === userData.user?.id
      )
      if (currentUserMembership) {
        form.setValue('created_by', currentUserMembership.id)
      }

      // Si es edición, cargar datos
      if (editingSiteLog) {
        form.setValue('log_date', new Date(editingSiteLog.log_date))
        form.setValue('created_by', editingSiteLog.created_by)
        form.setValue('entry_type', editingSiteLog.entry_type as any)
        form.setValue('weather_enum', editingSiteLog.weather_enum as any)
        form.setValue('comments', editingSiteLog.comments)
        form.setValue('is_public', editingSiteLog.is_public)
        form.setValue('is_favorite', editingSiteLog.is_favorite)
      }
    }
  }, [open, userData, members, editingSiteLog, form])

  const createSiteLogMutation = useMutation({
    mutationFn: async (data: SiteLogForm) => {
      if (!supabase) throw new Error('Supabase no disponible')
      
      const siteLogData = {
        project_id: projectId,
        log_date: data.log_date.toISOString().split('T')[0], // Solo fecha, sin hora
        created_by: data.created_by,
        entry_type: data.entry_type,
        weather_enum: data.weather_enum,
        comments: data.comments,
        is_public: data.is_public,
        is_favorite: data.is_favorite
      }

      if (editingSiteLog) {
        const { error } = await supabase
          .from('site_logs')
          .update(siteLogData)
          .eq('id', editingSiteLog.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('site_logs')
          .insert([siteLogData])
        
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-logs'] })
      toast({
        title: editingSiteLog ? 'Entrada actualizada' : 'Entrada creada',
        description: 'La entrada de bitácora se guardó exitosamente'
      })
      onClose()
      form.reset()
    },
    onError: (error) => {
      console.error('Error al guardar entrada de bitácora:', error)
      toast({
        title: 'Error',
        description: 'No se pudo guardar la entrada de bitácora',
        variant: 'destructive'
      })
    }
  })

  const onSubmit = (data: SiteLogForm) => {
    createSiteLogMutation.mutate(data)
  }

  const selectedCreator = members.find(m => m.id === form.watch('created_by'))

  if (!open) return null

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      {{
        header: (
          <CustomModalHeader
            title={editingSiteLog ? 'Editar Entrada de Bitácora' : 'Nueva Entrada de Bitácora'}
            description="Registra el progreso y eventos del proyecto"
            onClose={onClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Primera fila: Fecha y Creador */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="log_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Fecha del log
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value ? field.value.toISOString().split('T')[0] : ''}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="created_by"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Creador
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar creador">
                                {selectedCreator && (
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6">
                                      <AvatarImage src={selectedCreator.users?.avatar_url} />
                                      <AvatarFallback>
                                        {selectedCreator.users?.full_name?.charAt(0) || 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{selectedCreator.users?.full_name || selectedCreator.users?.email}</span>
                                  </div>
                                )}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {members.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage src={member.users?.avatar_url} />
                                    <AvatarFallback>
                                      {member.users?.full_name?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{member.users?.full_name || member.users?.email}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Segunda fila: Tipo de entrada y Clima */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="entry_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Tipo de entrada
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {entryTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <span>{type.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weather_enum"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Cloud className="w-4 h-4" />
                          Clima
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar clima" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {weatherOptions.map((weather) => (
                              <SelectItem key={weather.value} value={weather.value}>
                                <span>{weather.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Tercera fila: Comentarios */}
                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Comentarios
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe el avance, incidente o evento..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cuarta fila: Checkboxes */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="is_public"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            Entrada pública
                          </FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Visible para todos los miembros
                          </div>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_favorite"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="flex items-center gap-2">
                            <Star className="w-4 h-4" />
                            Marcar como favorito
                          </FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Destacar esta entrada
                          </div>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={onClose}
            onSave={form.handleSubmit(onSubmit)}
            saveText={editingSiteLog ? 'Actualizar' : 'Guardar'}
            disabled={createSiteLogMutation.isPending}
          />
        )
      }}
    </CustomModalLayout>
  )
}