import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { useContactTypes } from '@/hooks/use-contact-types'
import { useContacts } from '@/hooks/use-contacts'
import { supabase } from '@/lib/supabase'
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout'
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader'
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody'
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useToast } from '@/hooks/use-toast'
import { Calendar, User, FileText, Cloud, MessageSquare, Star, Eye, Calendar as CalendarIcon, Plus, X, Settings, Truck } from 'lucide-react'

// ContactOptions component for rendering contact options
interface ContactOptionsProps {
  organizationId?: string
  contactTypeId?: string
}

function ContactOptions({ organizationId, contactTypeId }: ContactOptionsProps) {
  const { data: contacts } = useContacts(organizationId, contactTypeId === 'all' ? undefined : contactTypeId)
  
  return (
    <>
      {contacts?.map((contact: any) => (
        <SelectItem key={contact.id} value={contact.id}>
          {contact.first_name} {contact.last_name}
        </SelectItem>
      ))}
    </>
  )
}

function ContactOptionsInner({ organizationId, contactTypeId }: ContactOptionsProps) {
  const { data: contacts } = useContacts(organizationId, contactTypeId === 'all' ? undefined : contactTypeId)
  
  return (
    <>
      {contacts?.map((contact: any) => (
        <SelectItem key={contact.id} value={contact.id}>
          {contact.first_name} {contact.last_name}
        </SelectItem>
      ))}
    </>
  )
}

// Schema para eventos
const siteLogEventSchema = z.object({
  event_type_id: z.string().min(1, 'Tipo de evento es requerido'),
  description: z.string().min(1, 'Descripción es requerida')
})

// Schema para personal
const siteLogAttendeeSchema = z.object({
  contact_type_id: z.string().min(1, 'Tipo de personal es requerido'),
  contact_id: z.string().min(1, 'Contacto es requerido'),
  attendance_type: z.enum(['full', 'half'], { required_error: 'Tipo de horario es requerido' }),
  description: z.string().optional()
})

// Schema para maquinaria
const siteLogEquipmentSchema = z.object({
  equipment_id: z.string().min(1, 'Equipo es requerido'),
  quantity: z.number().min(1, 'Cantidad debe ser mayor a 0').default(1),
  description: z.string().optional()
})

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
  weather: z.enum(['sunny', 'partly_cloudy', 'cloudy', 'rain', 'storm', 'snow', 'fog', 'windy', 'hail', 'none']).nullable(),
  comments: z.string().optional(),
  is_public: z.boolean().default(true),
  is_favorite: z.boolean().default(false),
  events: z.array(siteLogEventSchema).default([]),
  attendees: z.array(siteLogAttendeeSchema).default([]),
  equipment: z.array(siteLogEquipmentSchema).default([])
})

type SiteLogForm = z.infer<typeof siteLogSchema>
type SiteLogEventForm = z.infer<typeof siteLogEventSchema>
type SiteLogAttendeeForm = z.infer<typeof siteLogAttendeeSchema>
type SiteLogEquipmentForm = z.infer<typeof siteLogEquipmentSchema>

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

// Hook para obtener tipos de eventos
function useEventTypes() {
  return useQuery({
    queryKey: ['event-types'],
    queryFn: async () => {
      if (!supabase) {
        return [];
      }

      const { data, error } = await supabase
        .from('event_types')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching event types:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!supabase
  });
}

// Hook para obtener equipos
function useEquipment() {
  return useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      if (!supabase) {
        return [];
      }

      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching equipment:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!supabase
  });
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
  const { data: eventTypes } = useEventTypes()
  const { data: contactTypes } = useContactTypes()
  const { data: equipmentData } = useEquipment()
  
  const [events, setEvents] = useState<SiteLogEventForm[]>([])
  const [attendees, setAttendees] = useState<SiteLogAttendeeForm[]>([])
  const [equipmentList, setEquipmentList] = useState<SiteLogEquipmentForm[]>([])
  const [accordionValue, setAccordionValue] = useState<string>("informacion-basica")
  
  const form = useForm<SiteLogForm>({
    resolver: zodResolver(siteLogSchema),
    defaultValues: {
      log_date: new Date(),
      created_by: '',
      entry_type: 'avance_de_obra',
      weather: null,
      comments: '',
      is_public: true,
      is_favorite: false,
      events: [],
      attendees: [],
      equipment: []
    }
  })

  // Efecto para pre-cargar datos de edición
  useEffect(() => {
    if (editingSiteLog) {
      // Find the organization member that corresponds to the creator user
      const creatorMember = members?.find((member: any) => member.users.id === editingSiteLog.created_by);
      
      form.reset({
        log_date: new Date(editingSiteLog.log_date),
        created_by: creatorMember?.id || '',
        entry_type: editingSiteLog.entry_type as any,
        weather: editingSiteLog.weather as any,
        comments: editingSiteLog.comments,
        is_public: editingSiteLog.is_public,
        is_favorite: editingSiteLog.is_favorite
      })
      
      // Load events and attendees for editing
      loadSiteLogData(editingSiteLog.id)
    } else {
      // Reset events and attendees for new entries
      setEvents([])
      setAttendees([])
      
      // Seleccionar usuario actual por defecto en modo creación
      const currentUserMember = members?.find((member: any) => member.users.id === userData?.user?.id);
      if (currentUserMember?.id) {
        form.setValue('created_by', currentUserMember.id)
      }
    }
  }, [editingSiteLog, userData, members, form])

  // Function to load site log events and attendees
  const loadSiteLogData = async (siteLogId: string) => {
    if (!supabase) return

    try {
      // Load events
      const { data: eventsData } = await supabase
        .from('site_log_events')
        .select('*')
        .eq('site_log_id', siteLogId)

      if (eventsData) {
        setEvents(eventsData.map(event => ({
          event_type_id: event.event_type_id,
          description: event.description || ''
        })))
      }

      // Load attendees
      const { data: attendeesData } = await supabase
        .from('site_log_attendees')
        .select('*')
        .eq('site_log_id', siteLogId)

      if (attendeesData) {
        setAttendees(attendeesData.map(attendee => ({
          contact_type_id: 'all',
          contact_id: attendee.contact_id,
          attendance_type: attendee.attendance_type,
          description: attendee.description || ''
        })))
      }

      // Load equipment
      const { data: equipmentData } = await supabase
        .from('site_log_equipment')
        .select('*')
        .eq('site_log_id', siteLogId)

      if (equipmentData) {
        setEquipmentList(equipmentData.map(equip => ({
          equipment_id: equip.equipment_id,
          quantity: equip.quantity,
          description: equip.description || ''
        })))
      }
    } catch (error) {
      console.error('Error loading site log data:', error)
    }
  }

  // Mutación para crear/editar site log
  const createSiteLogMutation = useMutation({
    mutationFn: async (data: SiteLogForm) => {
      if (!userData?.preferences?.last_project_id || !userData?.preferences?.last_organization_id) {
        throw new Error('No hay proyecto u organización seleccionada')
      }

      // Get the user_id from the selected organization member
      const selectedMember = members?.find(m => m.id === data.created_by);
      
      const siteLogData = {
        log_date: data.log_date.toISOString().split('T')[0],
        created_by: selectedMember?.user_id || userData.user.id,
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

      let siteLogResult
      if (editingSiteLog) {
        siteLogResult = await supabase
          .from('site_logs')
          .update(siteLogData)
          .eq('id', editingSiteLog.id)
          .select()
          .single()
      } else {
        siteLogResult = await supabase
          .from('site_logs')
          .insert([siteLogData])
          .select()
          .single()
      }

      if (siteLogResult.error) {
        console.error('Error saving site log:', siteLogResult.error)
        throw new Error(siteLogResult.error.message)
      }

      // Handle site log events
      if (siteLogResult.data) {
        // If editing, delete existing events first
        if (editingSiteLog) {
          await supabase
            .from('site_log_events')
            .delete()
            .eq('site_log_id', siteLogResult.data.id)
        }

        // Create new events if any
        if (events.length > 0) {
          const eventsData = events.map(event => ({
            site_log_id: siteLogResult.data.id,
            event_type_id: event.event_type_id,
            description: event.description
          }))

          const eventsResult = await supabase
            .from('site_log_events')
            .insert(eventsData)

          if (eventsResult.error) {
            console.error('Error saving site log events:', eventsResult.error)
          }
        }
      }

      // Handle site log attendees
      if (siteLogResult.data) {
        // If editing, delete existing attendees first
        if (editingSiteLog) {
          await supabase
            .from('site_log_attendees')
            .delete()
            .eq('site_log_id', siteLogResult.data.id)
        }

        // Create new attendees if any
        if (attendees.length > 0) {
          const attendeesData = attendees.map(attendee => ({
            site_log_id: siteLogResult.data.id,
            contact_id: attendee.contact_id,
            attendance_type: attendee.attendance_type,
            description: attendee.description || null
          }))

          const attendeesResult = await supabase
            .from('site_log_attendees')
            .insert(attendeesData)

          if (attendeesResult.error) {
            console.error('Error saving site log attendees:', attendeesResult.error)
          }
        }
      }

      // Handle site log equipment
      if (siteLogResult.data) {
        // If editing, delete existing equipment first
        if (editingSiteLog) {
          await supabase
            .from('site_log_equipment')
            .delete()
            .eq('site_log_id', siteLogResult.data.id)
        }

        // Create new equipment if any
        if (equipmentList.length > 0) {
          const equipmentData = equipmentList.map(equip => ({
            site_log_id: siteLogResult.data.id,
            equipment_id: equip.equipment_id,
            quantity: equip.quantity,
            description: equip.description || null
          }))

          const equipmentResult = await supabase
            .from('site_log_equipment')
            .insert(equipmentData)

          if (equipmentResult.error) {
            console.error('Error saving site log equipment:', equipmentResult.error)
          }
        }
      }

      return siteLogResult.data
    },
    onSuccess: () => {
      // Invalidación inmediata y forzada del cache
      queryClient.invalidateQueries({ queryKey: ['site-logs'] })
      queryClient.removeQueries({ queryKey: ['site-logs'] })
      queryClient.refetchQueries({ queryKey: ['site-logs'] })
      
      // CRÍTICO: Invalidar también el cache de personnel attendance para actualizar timeline
      queryClient.invalidateQueries({ queryKey: ['personnel-attendance'] })
      queryClient.removeQueries({ queryKey: ['personnel-attendance'] })
      queryClient.refetchQueries({ queryKey: ['personnel-attendance'] })
      
      // Actualizar el estado local inmediatamente
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['site-logs'] })
        queryClient.invalidateQueries({ queryKey: ['personnel-attendance'] })
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

  // Opciones de clima con iconos (basado en enum de la base de datos)
  const weatherOptions = [
    { value: 'sunny', label: 'Soleado', icon: '☀️' },
    { value: 'partly_cloudy', label: 'Parcialmente nublado', icon: '⛅' },
    { value: 'cloudy', label: 'Nublado', icon: '☁️' },
    { value: 'rain', label: 'Lluvia', icon: '🌧️' },
    { value: 'storm', label: 'Tormenta', icon: '⛈️' },
    { value: 'snow', label: 'Nieve', icon: '❄️' },
    { value: 'fog', label: 'Niebla', icon: '🌫️' },
    { value: 'windy', label: 'Ventoso', icon: '💨' },
    { value: 'hail', label: 'Granizo', icon: '🧊' }
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
          <CustomModalBody padding="md" columns={1}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="site-log-form">
                <Accordion type="single" defaultValue="informacion-basica" collapsible>
                  {/* Sección 1: Información Básica */}
                  <AccordionItem value="informacion-basica">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Información Básica
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-3">
                      {/* Primera fila: Entrada Pública y Favorito */}
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="is_public"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel className="text-sm font-medium">
                                  Entrada Pública
                                </FormLabel>
                              </div>
                              <FormControl>
                                <Switch
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
                                <FormLabel className="text-sm font-medium">
                                  Marcar como favorito
                                </FormLabel>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Segunda fila: Fecha y Creador */}
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="log_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
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
                              <FormLabel>
                                Creador
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar creador" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {members?.map((member: any) => {
                                    const user = member.users;
                                    const displayName = user?.full_name || user?.email || 'Usuario sin nombre';
                                    const avatarFallback = user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U';
                                    
                                    return (
                                      <SelectItem key={member.id} value={member.id}>
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-6 w-6">
                                            <AvatarImage src={user?.avatar_url} />
                                            <AvatarFallback>
                                              {avatarFallback}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span>{displayName}</span>
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Tipo de entrada y Clima */}
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="entry_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
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
                              <FormLabel>
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
                            <FormLabel>
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

                  {/* Sección 2: Eventos */}
                  <AccordionItem value="eventos">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        Eventos ({events.length})
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-3">
                      {/* Lista de eventos */}
                      {events.map((event, index) => (
                        <div key={index} className="border rounded-lg p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">Evento {index + 1}</h4>
                            <button
                              type="button"
                              className="h-6 w-6 rounded-md hover:bg-gray-100 flex items-center justify-center"
                              onClick={() => {
                                const newEvents = events.filter((_, i) => i !== index);
                                setEvents(newEvents);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Tipo de evento</label>
                            <Select 
                              value={event.event_type_id} 
                              onValueChange={(value) => {
                                const newEvents = [...events];
                                newEvents[index].event_type_id = value;
                                setEvents(newEvents);
                              }}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Seleccionar tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                {eventTypes?.map((eventType: any) => (
                                  <SelectItem key={eventType.id} value={eventType.id}>
                                    {eventType.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Descripción</label>
                            <Textarea
                              className="min-h-[60px] text-sm"
                              placeholder="Describe el evento..."
                              value={event.description}
                              onChange={(e) => {
                                const newEvents = [...events];
                                newEvents[index].description = e.target.value;
                                setEvents(newEvents);
                              }}
                            />
                          </div>
                        </div>
                      ))}

                      {/* Botón para agregar evento */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEvents([...events, {
                            event_type_id: '',
                            description: ''
                          }]);
                        }}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Evento
                      </Button>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Sección 3: Personal */}
                  <AccordionItem value="personal">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Personal ({attendees.length})
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-3">
                      {/* Lista de personal agregado */}
                      {attendees.map((attendee, index) => (
                        <div key={index} className="border rounded-lg p-3 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Personal #{index + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newAttendees = attendees.filter((_, i) => i !== index);
                                setAttendees(newAttendees);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Contacto</label>
                              <Select
                                value={attendee.contact_id}
                                onValueChange={(value) => {
                                  const newAttendees = [...attendees];
                                  newAttendees[index].contact_id = value;
                                  setAttendees(newAttendees);
                                }}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Seleccionar contacto" />
                                </SelectTrigger>
                                <SelectContent>
                                  <ContactOptions contactTypeId="all" organizationId={userData?.organization?.id} />
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Horario</label>
                              <Select
                                value={attendee.attendance_type}
                                onValueChange={(value) => {
                                  const newAttendees = [...attendees];
                                  newAttendees[index].attendance_type = value as 'full' | 'half';
                                  setAttendees(newAttendees);
                                }}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Seleccionar horario" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="full">Jornada Completa</SelectItem>
                                  <SelectItem value="half">Media Jornada</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Descripción</label>
                            <Textarea
                              className="min-h-[60px] text-sm"
                              placeholder="Notas adicionales..."
                              value={attendee.description || ''}
                              onChange={(e) => {
                                const newAttendees = [...attendees];
                                newAttendees[index].description = e.target.value;
                                setAttendees(newAttendees);
                              }}
                            />
                          </div>
                        </div>
                      ))}

                      {/* Botón para agregar personal */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAttendees([...attendees, {
                            contact_type_id: 'all',
                            contact_id: '',
                            attendance_type: 'full',
                            description: ''
                          }]);
                        }}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Personal
                      </Button>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Sección 4: Maquinaria */}
                  <AccordionItem value="maquinaria">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Maquinaria ({equipmentList.length})
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-3">
                      {/* Lista de maquinaria */}
                      {equipmentList.map((equipmentItem, index) => (
                        <div key={index} className="p-3 border border-border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Equipo #{index + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newEquipmentList = equipmentList.filter((_, i) => i !== index);
                                setEquipmentList(newEquipmentList);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Equipo</label>
                              <Select
                                value={equipmentItem.equipment_id}
                                onValueChange={(value) => {
                                  const newEquipmentList = [...equipmentList];
                                  newEquipmentList[index].equipment_id = value;
                                  setEquipmentList(newEquipmentList);
                                }}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Seleccionar equipo" />
                                </SelectTrigger>
                                <SelectContent>
                                  {equipmentData?.map((equip: any) => (
                                    <SelectItem key={equip.id} value={equip.id}>
                                      {equip.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Cantidad</label>
                              <Input
                                type="number"
                                min="1"
                                className="h-8 text-sm"
                                value={equipmentItem.quantity}
                                onChange={(e) => {
                                  const newEquipmentList = [...equipmentList];
                                  newEquipmentList[index].quantity = parseInt(e.target.value) || 1;
                                  setEquipmentList(newEquipmentList);
                                }}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Descripción</label>
                            <Textarea
                              className="min-h-[60px] text-sm"
                              placeholder="Notas adicionales sobre el equipo..."
                              value={equipmentItem.description || ''}
                              onChange={(e) => {
                                const newEquipmentList = [...equipmentList];
                                newEquipmentList[index].description = e.target.value;
                                setEquipmentList(newEquipmentList);
                              }}
                            />
                          </div>
                        </div>
                      ))}

                      {/* Botón para agregar maquinaria */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEquipmentList([...equipmentList, {
                            equipment_id: '',
                            quantity: 1,
                            description: ''
                          }]);
                        }}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Maquinaria
                      </Button>
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
            onSave={() => {}}
            saveText={editingSiteLog ? 'Actualizar entrada' : 'Crear entrada'}
            saveProps={{
              form: "site-log-form",
              type: "submit",
              disabled: createSiteLogMutation.isPending
            }}
          />
        )
      }}
    </CustomModalLayout>
  )
}