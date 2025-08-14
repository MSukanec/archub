import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, Plus, Trash2, Calendar, Cloud, Users, Wrench, Camera, ArrowLeft, X } from "lucide-react";
import { FormModalLayout } from "../../form/FormModalLayout";
import { FormModalHeader } from "../../form/FormModalHeader";
import { FormModalFooter } from "../../form/FormModalFooter";
import { FormSubsectionButton } from "../../form/FormSubsectionButton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useOrganizationMembers } from "@/hooks/use-organization-members";
import { useContacts } from "@/hooks/use-contacts";
import { useGlobalModalStore } from "../../form/useGlobalModalStore";
import { useModalPanelStore } from "../../form/modalPanelStore";
import { supabase } from "@/lib/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileUploader } from "@/components/ui-custom/FileUploader";

// Schema basado en el modal original con valores exactos del enum
const siteLogSchema = z.object({
  log_date: z.string().min(1, "La fecha es requerida"),
  entry_type: z.enum([
    'avance_de_obra',
    'decision',
    'foto_diaria',
    'inspeccion',
    'nota_climatica',
    'pedido_material',
    'problema_detectado',
    'visita_tecnica'
  ]),
  weather: z.enum(['sunny', 'partly_cloudy', 'cloudy', 'rain', 'storm', 'snow', 'fog', 'windy', 'hail', 'none']).nullable(),
  comments: z.string().optional(),
  files: z.array(z.string()).optional().default([]),
  events: z.array(z.object({
    id: z.string(),
    description: z.string(),
    time: z.string(),
    responsible: z.string().optional()
  })).optional().default([]),
  attendees: z.array(z.object({
    id: z.string(),
    contact_id: z.string(),
    contact_type: z.string(),
    arrival_time: z.string().optional(),
    departure_time: z.string().optional(),
    notes: z.string().optional()
  })).optional().default([]),
  equipment: z.array(z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number(),
    condition: z.string().optional(),
    operator: z.string().optional(),
    notes: z.string().optional()
  })).optional().default([])
});

type SiteLogFormData = z.infer<typeof siteLogSchema>;

interface SiteLogFormModalProps {
  data?: any;
}

export function SiteLogFormModal({ data }: SiteLogFormModalProps) {
  const { toast } = useToast();
  const { closeModal } = useGlobalModalStore();
  const { currentPanel, setPanel, currentSubform, setCurrentSubform } = useModalPanelStore();
  const { data: currentUser } = useCurrentUser();
  const { data: members = [] } = useOrganizationMembers(currentUser?.organization?.id);
  const { data: contacts = [] } = useContacts();
  
  const [events, setEvents] = useState<any[]>([]);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const queryClient = useQueryClient();

  // Mutación para crear/actualizar bitácoras
  const siteLogMutation = useMutation({
    mutationFn: async (formData: SiteLogFormData) => {
      if (!currentUser?.organization?.id || !currentUser?.preferences?.last_project_id) {
        throw new Error('No hay proyecto u organización seleccionada');
      }

      if (!supabase) {
        throw new Error('Error de conexión con la base de datos');
      }

      // Obtener el organization_member.id del usuario actual
      const currentMember = members.find((m: any) => m.user_id === currentUser.user.id);
      if (!currentMember) {
        throw new Error('No se encontró el miembro de la organización para el usuario actual');
      }

      const siteLogData = {
        log_date: formData.log_date,
        created_by: currentMember.id, // Usar automáticamente el current user
        entry_type: formData.entry_type,
        weather: formData.weather,
        comments: formData.comments,
        is_public: true,
        is_favorite: false,
        project_id: currentUser?.preferences?.last_project_id || '',
        organization_id: currentUser?.organization?.id || ''
      };



      let siteLogResult;
      
      const siteLogId = data?.data?.id || data?.id;
      if (siteLogId) {
        // Actualizando bitácora existente
        siteLogResult = await supabase
          .from('site_logs')
          .update(siteLogData)
          .eq('id', siteLogId)
          .select()
          .single();
      } else {
        // Creando nueva bitácora
        siteLogResult = await supabase
          .from('site_logs')
          .insert([siteLogData])
          .select()
          .single();
      }

      if (siteLogResult.error) {

        throw new Error(siteLogResult.error.message);
      }

      const savedSiteLog = siteLogResult.data;


      // Ahora guardar los attendees si existen
      if (formData.attendees && formData.attendees.length > 0) {

        
        // Primero eliminar attendees existentes si estamos actualizando
        if (siteLogId) {
          await supabase
            .from('attendees')
            .delete()
            .eq('site_log_id', savedSiteLog.id);
        }

        // Insertar nuevos attendees en tabla ATTENDEES
        const attendeesToInsert = formData.attendees.map((attendee: any) => ({
          site_log_id: savedSiteLog.id,
          personnel_id: attendee.personnel_id,
          attendance_type: attendee.attendance_type || 'full',
          hours_worked: attendee.hours_worked || 8,
          description: attendee.description || attendee.notes || '',
          created_by: currentMember.id,
          project_id: currentUser?.preferences?.last_project_id || ''
        }));

        const { error: attendeesError } = await supabase
          .from('attendees')
          .insert(attendeesToInsert);

        if (attendeesError) {
          // No throw aquí para no fallar todo el proceso
        }
      }

      return savedSiteLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-logs'] });
      const siteLogId = data?.data?.id || data?.id;
      toast({
        title: siteLogId ? "Bitácora actualizada" : "Bitácora creada",
        description: siteLogId ? "La bitácora se ha actualizado correctamente." : "La nueva bitácora se ha creado correctamente."
      });
      closeModal();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Ha ocurrido un error al guardar la bitácora.",
        variant: "destructive"
      });
    }
  });

  const form = useForm<SiteLogFormData>({
    resolver: zodResolver(siteLogSchema),
    defaultValues: {
      log_date: new Date().toISOString().split('T')[0],
      entry_type: "avance_de_obra",
      weather: null,
      comments: "",
      files: [],
      events: [],
      attendees: [],
      equipment: []
    }
  });



  useEffect(() => {
    if (data) {
      // Los datos pueden venir anidados en data.data, normalizar
      const siteLogData = data.data || data;
      
      // Si estamos editando, cargar los datos existentes
      const resetValues = {
        log_date: siteLogData.log_date || new Date().toISOString().split('T')[0],
        entry_type: siteLogData.entry_type || "avance_de_obra",
        weather: siteLogData.weather || null,
        comments: siteLogData.comments || "",
        files: siteLogData.files || [],
        events: siteLogData.events || [],
        attendees: siteLogData.attendees || [],
        equipment: siteLogData.equipment || []
      };
      form.reset(resetValues);
      setEvents(siteLogData.events || []);
      setAttendees(siteLogData.attendees || []);
      setEquipment(siteLogData.equipment || []);
      setUploadedFiles(siteLogData.files || []);
    }
  }, [data, form]);

  // Funciones para eventos
  const addEvent = () => {
    const newEvent = {
      id: Date.now().toString(),
      description: "",
      time: "",
      responsible: ""
    };
    setEvents([...events, newEvent]);
  };

  const updateEvent = (id: string, field: string, value: string) => {
    setEvents(events.map(event => 
      event.id === id ? { ...event, [field]: value } : event
    ));
  };

  const removeEvent = (id: string) => {
    setEvents(events.filter(event => event.id !== id));
  };

  // Funciones para asistentes
  const addAttendee = () => {
    const newAttendee = {
      id: Date.now().toString(),
      contact_id: "",
      contact_type: "",
      arrival_time: "",
      departure_time: "",
      notes: ""
    };
    setAttendees([...attendees, newAttendee]);
  };

  const updateAttendee = (id: string, field: string, value: string) => {
    setAttendees(attendees.map(attendee => 
      attendee.id === id ? { ...attendee, [field]: value } : attendee
    ));
  };

  const removeAttendee = (id: string) => {
    setAttendees(attendees.filter(attendee => attendee.id !== id));
  };

  // Funciones para maquinaria
  const addEquipment = () => {
    const newEquipment = {
      id: Date.now().toString(),
      name: "",
      quantity: 1,
      condition: "",
      operator: "",
      notes: ""
    };
    setEquipment([...equipment, newEquipment]);
  };

  const updateEquipmentItem = (id: string, field: string, value: any) => {
    setEquipment(equipment.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeEquipment = (id: string) => {
    setEquipment(equipment.filter(item => item.id !== id));
  };

  const onSubmit = async (formData: SiteLogFormData) => {
    // Agregar los datos adicionales al formulario
    const completeFormData = {
      ...formData,
      events: events,
      attendees: attendees,
      equipment: equipment
    };
    
    siteLogMutation.mutate(completeFormData);
  };

  const isLoading = siteLogMutation.isPending;

  const viewPanel = (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Bitácora de Obra</h3>
        <p className="text-sm text-muted-foreground mt-2">
          {data ? "Visualizar información de la bitácora" : "No hay datos para mostrar"}
        </p>
      </div>
      {data && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Fecha:</label>
            <p className="text-sm text-muted-foreground">{(data.data || data).log_date}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Tipo:</label>
            <p className="text-sm text-muted-foreground">{(data.data || data).entry_type}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Comentarios:</label>
            <p className="text-sm text-muted-foreground">{(data.data || data).comments || "Sin comentarios"}</p>
          </div>
        </div>
      )}
    </div>
  );

  const editPanel = (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)} 
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            form.handleSubmit(onSubmit)();
          }
        }}
        className="space-y-6"
      >
        <div className="space-y-4">
          {/* Fecha - Condición */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="log_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weather"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condición</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar clima" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sunny">Soleado</SelectItem>
                      <SelectItem value="partly_cloudy">Parcialmente Nublado</SelectItem>
                      <SelectItem value="cloudy">Nublado</SelectItem>
                      <SelectItem value="rain">Lluvia</SelectItem>
                      <SelectItem value="storm">Tormenta</SelectItem>
                      <SelectItem value="snow">Nieve</SelectItem>
                      <SelectItem value="fog">Niebla</SelectItem>
                      <SelectItem value="windy">Ventoso</SelectItem>
                      <SelectItem value="hail">Granizo</SelectItem>
                      <SelectItem value="none">Sin Especificar</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Tipo */}
          <FormField
            control={form.control}
            name="entry_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="avance_de_obra">Avance de Obra</SelectItem>
                    <SelectItem value="decision">Decisión</SelectItem>
                    <SelectItem value="foto_diaria">Foto Diaria</SelectItem>
                    <SelectItem value="inspeccion">Inspección</SelectItem>
                    <SelectItem value="nota_climatica">Nota Climática</SelectItem>
                    <SelectItem value="pedido_material">Pedido Material</SelectItem>
                    <SelectItem value="problema_detectado">Problema Detectado</SelectItem>
                    <SelectItem value="visita_tecnica">Visita Técnica</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Comentarios */}
          <FormField
            control={form.control}
            name="comments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comentarios</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Descripción general de las actividades del día..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Fotos y Videos */}
        <div className="space-y-4">
          <FormSubsectionButton
            icon={<Camera />}
            title="Fotos y Videos"
            description="Adjunta archivos multimedia al registro"
            onClick={() => {
              setCurrentSubform('files');
              setPanel('subform');
            }}
          />
          
          {/* Lista de archivos agregados */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="text-sm">{file}</span>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Eventos */}
        <div className="space-y-4">
          <FormSubsectionButton
            icon={<Calendar />}
            title="Eventos"
            description="Registra eventos importantes del día"
            onClick={() => {
              setCurrentSubform('events');
              setPanel('subform');
            }}
          />
          
          {/* Lista de eventos agregados */}
          {events.length > 0 && (
            <div className="space-y-2">
              {events.map((event, index) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.time} {event.responsible && `- ${event.responsible}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">Editar</Button>
                    <Button variant="ghost" size="sm" onClick={() => removeEvent(event.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Personal */}
        <div className="space-y-4">
          <FormSubsectionButton
            icon={<Users />}
            title="Personal"
            description="Control de asistencia y personal en obra"
            onClick={() => {
              setCurrentSubform('personal');
              setPanel('subform');
            }}
          />
          
          {/* Lista de personal agregado */}
          {attendees.length > 0 && (
            <div className="space-y-2">
              {attendees.map((attendee, index) => {
                const contact = contacts.find(c => c.id === attendee.contact_id);
                const contactName = contact ? `${contact.first_name} ${contact.last_name}`.trim() : 'Sin contacto';
                const attendanceText = attendee.attendance_type === 'full' ? 'Jornada Completa' : 'Media Jornada';
                
                return (
                  <div key={attendee.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{contactName}</p>
                      <p className="text-xs text-muted-foreground">{attendanceText}</p>
                      {attendee.description && (
                        <p className="text-xs text-muted-foreground">{attendee.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          const newAttendees = attendees.filter((_, i) => i !== index);
                          setAttendees(newAttendees);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Maquinaria */}
        <div className="space-y-4">
          <FormSubsectionButton
            icon={<Wrench />}
            title="Maquinaria"
            description="Control de equipos y maquinaria utilizada"
            onClick={() => {
              setCurrentSubform('equipment');
              setPanel('subform');
            }}
          />
          
          {/* Lista de equipos agregados */}
          {equipment.length > 0 && (
            <div className="space-y-2">
              {equipment.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Cantidad: {item.quantity} {item.condition && `- ${item.condition}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">Editar</Button>
                    <Button variant="ghost" size="sm" onClick={() => removeEquipment(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </Form>
  );

  // Subform de Personal
  const personalSubform = (
    <div className="space-y-4">
      {/* Header */}
      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
        <div className="col-span-1">✓</div>
        <div className="col-span-4">Personal</div>
        <div className="col-span-3">Horario</div>
        <div className="col-span-4">Descripción</div>
      </div>

      {/* Lista completa de contactos */}
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {contacts?.map((contact: any) => {
          const isPresent = attendees.some(a => a.contact_id === contact.id);
          const attendeeData = attendees.find(a => a.contact_id === contact.id);
          
          return (
            <div key={contact.id} className="grid grid-cols-12 gap-1 items-center py-1 border-b border-muted/20">
              {/* Checkbox */}
              <div className="col-span-1">
                <input
                  type="checkbox"
                  checked={isPresent}
                  onChange={(e) => {
                    if (e.target.checked) {
                      // Agregar personal
                      setAttendees([...attendees, {
                        id: Date.now().toString(),
                        contact_id: contact.id,
                        contact_type: '',
                        attendance_type: 'full',
                        hours_worked: 8,
                        description: '',
                        // Campos legacy para compatibilidad
                        arrival_time: '',
                        departure_time: '',
                        notes: ''
                      }]);
                    } else {
                      // Quitar personal
                      setAttendees(attendees.filter(a => a.contact_id !== contact.id));
                    }
                  }}
                  className="h-4 w-4 rounded checkbox-accent"
                />
              </div>

              {/* Nombre del contacto */}
              <div className="col-span-4">
                <span className={`text-sm ${isPresent ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                  {contact.first_name} {contact.last_name}
                </span>
              </div>

              {/* Selector de horario */}
              <div className="col-span-3">
                <Select
                  value={attendeeData?.attendance_type || 'full'}
                  onValueChange={(value) => {
                    if (isPresent) {
                      const newAttendees = attendees.map((a: any) => 
                        a.contact_id === contact.id 
                          ? { ...a, attendance_type: value as 'full' | 'half' }
                          : a
                      );
                      setAttendees(newAttendees);
                    }
                  }}
                  disabled={!isPresent}
                >
                  <SelectTrigger className={`h-8 text-xs ${!isPresent ? 'opacity-50' : ''}`}>
                    <SelectValue placeholder="Horario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Jornada Completa</SelectItem>
                    <SelectItem value="half">Media Jornada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campo de descripción */}
              <div className="col-span-4">
                <Input
                  placeholder="Notas adicionales..."
                  value={attendeeData?.description || ''}
                  onChange={(e) => {
                    if (isPresent) {
                      const newAttendees = attendees.map((a: any) => 
                        a.contact_id === contact.id 
                          ? { ...a, description: e.target.value }
                          : a
                      );
                      setAttendees(newAttendees);
                    }
                  }}
                  disabled={!isPresent}
                  className={`h-8 text-xs ${!isPresent ? 'opacity-50' : ''}`}
                />  
              </div>
            </div>
          );
        })}
      </div>

      {/* Contador de personal presente */}
      {attendees.length > 0 && (
        <div className="text-sm text-muted-foreground text-center pt-2 border-t">
          Personal presente: {attendees.length}
        </div>
      )}

      {/* Empty state si no hay contactos */}
      {!contacts || contacts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay contactos disponibles</p>
          <p className="text-xs">Agrega contactos en la sección de Contactos</p>
        </div>
      )}
    </div>
  );

  // Subform de Eventos
  const eventsSubform = (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay eventos registrados</p>
          <p className="text-xs">Agrega eventos importantes del día</p>
        </div>
      </div>
    </div>
  );

  // Subform de Archivos
  const filesSubform = (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="text-center py-8 text-muted-foreground">
          <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay archivos adjuntos</p>
          <p className="text-xs">Sube fotos y videos del progreso</p>
        </div>
      </div>
    </div>
  );

  // Subform de Equipos
  const equipmentSubform = (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="text-center py-8 text-muted-foreground">
          <Wrench className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay equipos registrados</p>
          <p className="text-xs">Agrega maquinaria y equipos utilizados</p>
        </div>
      </div>
    </div>
  );

  // Determinar qué subform mostrar
  const getSubform = () => {
    switch (currentSubform) {
      case 'personal':
        return personalSubform;
      case 'events':
        return eventsSubform;
      case 'files':
        return filesSubform;
      case 'equipment':
        return equipmentSubform;
      default:
        return null;
    }
  };

  return (
    <FormModalLayout
      columns={1}
      onClose={closeModal}
      viewPanel={viewPanel}
      editPanel={editPanel}
      subformPanel={getSubform()}
      isEditing={true}
      headerContent={
        currentPanel === 'subform' ? (
          <FormModalHeader
            title={
              currentSubform === 'personal' ? "Personal" :
              currentSubform === 'events' ? "Eventos" :
              currentSubform === 'files' ? "Fotos y Videos" :
              currentSubform === 'equipment' ? "Maquinaria" : "Bitácora"
            }
            description={
              currentSubform === 'personal' ? "Gestiona el personal presente en obra" :
              currentSubform === 'events' ? "Registra eventos importantes del día" :
              currentSubform === 'files' ? "Sube archivos multimedia al registro" :
              currentSubform === 'equipment' ? "Gestiona maquinaria y equipos utilizados" : "Bitácora de obra"
            }
            icon={
              currentSubform === 'personal' ? Users :
              currentSubform === 'events' ? Calendar :
              currentSubform === 'files' ? Camera :
              currentSubform === 'equipment' ? Wrench : FileText
            }
            leftActions={
              <Button
                variant="ghost"
                onClick={() => setPanel('edit')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
            }
          />
        ) : (
          <FormModalHeader
            title={data ? "Editar Bitácora" : "Nueva Bitácora"}
            description={data ? "Modifica la información de la bitácora" : "Crea una nueva bitácora de obra"}
            icon={FileText}
          />
        )
      }
      footerContent={
        currentPanel === 'subform' ? (
          <FormModalFooter
            leftLabel="Cancelar"
            onLeftClick={closeModal}
            rightLabel={
              currentSubform === 'personal' ? "Confirmar Asistencia" :
              currentSubform === 'events' ? "Agregar Evento" :
              currentSubform === 'files' ? "Agregar Fotos y Videos" :
              currentSubform === 'equipment' ? "Agregar Maquinaria" : "Confirmar"
            }
            onRightClick={() => {
              // Agregar personal si hay datos válidos
              if (currentSubform === 'personal' && attendees.length > 0) {
                // Los datos ya están en attendees, solo regresamos al panel principal
                setPanel('edit');
              } else {
                setPanel('edit');
              }
            }}
            showLoadingSpinner={false}
          />
        ) : (
          <FormModalFooter
            leftLabel="Cancelar"
            onLeftClick={closeModal}
            rightLabel={data ? "Guardar Cambios" : "Crear Bitácora"}
            onRightClick={form.handleSubmit(onSubmit)}
            showLoadingSpinner={isLoading}
          />
        )
      }
    />
  );
}