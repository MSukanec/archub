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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useToast } from '@/hooks/use-toast'
import { Calendar, User, FileText, Cloud, MessageSquare, Star, Eye } from 'lucide-react'

// Schema con enums exactos de Supabase
const siteLogSchema = z.object({
  log_date: z.date(),
  created_by: z.string().min(1, 'Creador es requerido'),
  entry_type: z.enum([
    'avance_de_obra',
    'visita_tecnica', 
    'problema_detectado',
    'pedido_material',
    'nota_climatica',
    'decision',
    'inspeccion',
    'foto_diaria',
    'registro_general'
  ]),
  weather: z.enum(['sunny', 'cloudy', 'rainy', 'stormy', 'windy', 'snowy', 'hot', 'cold']).nullable(),
  comments: z.string().min(1, 'Comentarios son requeridos'),
  is_public: z.boolean().default(true),
  is_favorite: z.boolean().default(false)
})

type SiteLogForm = z.infer<typeof siteLogSchema>

// Definir tipos exactos basados en la base de datos
interface SiteLog {
  id: string
  log_date: string
  created_by: string
  entry_type: string
  weather: string | null
  comments: string
  is_public: boolean
  is_favorite: boolean
}

// Props del modal
interface NewSiteLogModalProps {
  open: boolean
  onClose: () => void
  editingSiteLog?: SiteLog | null
}

export function NewSiteLogModal({ open, onClose, editingSiteLog }: NewSiteLogModalProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { data: userData } = useCurrentUser()
  const { data: members } = useOrganizationMembers(userData?.preferences?.last_organization_id || '')
  
  const form = useForm<SiteLogForm>({
    resolver: zodResolver(siteLogSchema),
    defaultValues: {
      log_date: new Date(),
      created_by: '',
      entry_type: 'avance_de_obra',
      weather: null,
      comments: '',
      is_public: true,
      is_favorite: false
    }
  })

  // Efecto para pre-cargar datos de edición
  useEffect(() => {
    if (editingSiteLog) {
      form.reset({
        log_date: new Date(editingSiteLog.log_date),
        created_by: editingSiteLog.created_by,
        entry_type: editingSiteLog.entry_type as any,
        weather: editingSiteLog.weather as any,
        comments: editingSiteLog.comments,
        is_public: editingSiteLog.is_public,
        is_favorite: editingSiteLog.is_favorite
      })
    } else {
      // Seleccionar usuario actual por defecto en modo creación
      if (userData?.memberships?.[0]?.id) {
        form.setValue('created_by', userData.memberships[0].id)
      }
    }
  }, [editingSiteLog, userData, form])

  // Mutación para crear/editar site log
  const createSiteLogMutation = useMutation({
    mutationFn: async (data: SiteLogForm) => {
      if (!userData?.preferences?.last_project_id || !userData?.preferences?.last_organization_id) {
        throw new Error('No hay proyecto u organización seleccionada')
      }

      const siteLogData = {
        log_date: data.log_date.toISOString().split('T')[0],
        created_by: data.created_by,
        entry_type: data.entry_type,
        weather: data.weather,
        comments: data.comments,
        is_public: data.is_public,
        is_favorite: data.is_favorite,
        project_id: userData.preferences.last_project_id,
        organization_id: userData.preferences.last_organization_id
      }

      if (!supabase) {
        throw new Error('Error de conexión con la base de datos')
      }

      let result
      if (editingSiteLog) {
        result = await supabase
          .from('site_logs')
          .update(siteLogData)
          .eq('id', editingSiteLog.id)
          .select()
          .single()
      } else {
        result = await supabase
          .from('site_logs')
          .insert([siteLogData])
          .select()
          .single()
      }

      if (result.error) {
        console.error('Error saving site log:', result.error)
        throw new Error(result.error.message)
      }

      return result.data
    },
    onSuccess: () => {
      // Invalidación inmediata y forzada del cache
      queryClient.invalidateQueries({ queryKey: ['site-logs'] })
      queryClient.removeQueries({ queryKey: ['site-logs'] })
      queryClient.refetchQueries({ queryKey: ['site-logs'] })
      
      // Actualizar el estado local inmediatamente
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['site-logs'] })
      }, 100)
      
      toast({
        title: editingSiteLog ? 'Entrada actualizada' : 'Entrada creada',
        description: editingSiteLog ? 
          'La entrada de bitácora ha sido actualizada correctamente' : 
          'La nueva entrada de bitácora ha sido creada correctamente'
      })
      form.reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error en mutación:', error)
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar la entrada de bitácora',
        variant: 'destructive'
      })
    }
  })

  const onSubmit = (data: SiteLogForm) => {
    console.log('Submitting site log data:', data)
    createSiteLogMutation.mutate(data)
  }

  // Tipos de entrada con iconos
  const entryTypes = [
    { value: 'avance_de_obra', label: 'Avance de obra', icon: '🏗️' },
    { value: 'visita_tecnica', label: 'Visita técnica', icon: '👷' },
    { value: 'problema_detectado', label: 'Problema detectado', icon: '⚠️' },
    { value: 'pedido_material', label: 'Pedido material', icon: '📦' },
    { value: 'nota_climatica', label: 'Nota climática', icon: '🌤️' },
    { value: 'decision', label: 'Decisión', icon: '✅' },
    { value: 'inspeccion', label: 'Inspección', icon: '🔍' },
    { value: 'foto_diaria', label: 'Foto diaria', icon: '📷' },
    { value: 'registro_general', label: 'Registro general', icon: '📝' }
  ]

  // Opciones de clima con iconos
  const weatherOptions = [
    { value: 'sunny', label: 'Soleado', icon: '☀️' },
    { value: 'cloudy', label: 'Nublado', icon: '☁️' },
    { value: 'rainy', label: 'Lluvioso', icon: '🌧️' },
    { value: 'stormy', label: 'Tormentoso', icon: '⛈️' },
    { value: 'windy', label: 'Ventoso', icon: '💨' },
    { value: 'snowy', label: 'Nevado', icon: '❄️' },
    { value: 'hot', label: 'Caluroso', icon: '🌡️' },
    { value: 'cold', label: 'Frío', icon: '🥶' }
  ]

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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" id="site-log-form">
                <Accordion type="single" defaultValue="informacion-basica" collapsible>
                  {/* Sección 1: Información Básica */}
                  <AccordionItem value="informacion-basica">
                    <AccordionTrigger>
                      Información Básica
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
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
                                    <SelectValue placeholder="Seleccionar creador" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {members?.map((member: any) => (
                                    <SelectItem key={member.id} value={member.id}>
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                          <AvatarImage src={member.avatar_url} />
                                          <AvatarFallback>
                                            {member.full_name?.charAt(0) || member.email?.charAt(0) || '?'}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span>{member.full_name || member.email}</span>
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
                                      <div className="flex items-center gap-2">
                                        <span>{type.icon}</span>
                                        <span>{type.label}</span>
                                      </div>
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
                          name="weather"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Cloud className="w-4 h-4" />
                                Clima (opcional)
                              </FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(value === 'none' ? null : value)} 
                                value={field.value || 'none'}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar clima" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">Sin especificar</SelectItem>
                                  {weatherOptions.map((weather) => (
                                    <SelectItem key={weather.value} value={weather.value}>
                                      <div className="flex items-center gap-2">
                                        <span>{weather.icon}</span>
                                        <span>{weather.label}</span>
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
                    </AccordionContent>
                  </AccordionItem>

                  {/* Sección 2: Configuración de Entrada */}
                  <AccordionItem value="configuracion-entrada">
                    <AccordionTrigger>
                      Configuración de Entrada
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
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
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </form>
            </Form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={onClose}
            onSave={form.handleSubmit(onSubmit)}
            saveText={editingSiteLog ? 'Actualizar entrada' : 'Crear entrada'}
          />
        )
      }}
    </CustomModalLayout>
  )
}