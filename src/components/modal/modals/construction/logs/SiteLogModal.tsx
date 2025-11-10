import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, Plus, Trash2, Calendar, Cloud, Users, Wrench, Camera, ArrowLeft, X } from "lucide-react";
import { FormModalLayout } from "../../../form/FormModalLayout";
import { FormModalHeader } from "../../../form/FormModalHeader";
import { FormModalFooter } from "../../../form/FormModalFooter";
import { FormSubsectionButton } from "../../../form/FormSubsectionButton";
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
import { useGlobalModalStore } from "../../../form/useGlobalModalStore";
import { useModalPanelStore } from "../../../form/modalPanelStore";
import { supabase } from "@/lib/supabase";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { FileUploader } from "@/components/ui-custom/FileUploader";
import { EmptyState } from "@/components/ui-custom/security/EmptyState";
import { uploadSiteLogFiles, type SiteLogFileInput } from "@/utils/uploadSiteLogFiles";
import { PersonnelForm } from "./forms/PersonnelForm";
import { MediaForm } from "./forms/MediaForm";

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

interface SiteLogModalProps {
  data?: any;
}

export function SiteLogModal({ data }: SiteLogModalProps) {
  const { toast } = useToast();
  const { closeModal } = useGlobalModalStore();
  const { currentPanel, setPanel, currentSubform, setCurrentSubform } = useModalPanelStore();
  const { data: currentUser } = useCurrentUser();
  const { data: members = [] } = useOrganizationMembers(currentUser?.organization?.id);
  const { data: contacts = [] } = useContacts();
  
  // Get project personnel only
  const { data: projectPersonnel = [], isLoading: personnelLoading } = useQuery({
    queryKey: ['project-personnel', currentUser?.preferences?.last_project_id],
    queryFn: async () => {
      const projectId = currentUser?.preferences?.last_project_id;
      if (!projectId || !supabase) return [];
      
      const { data, error } = await supabase
        .from('project_personnel')
        .select(`
          id,
          contact_id,
          contacts (
            id,
            first_name,
            last_name
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUser?.preferences?.last_project_id
  })
  
  const [events, setEvents] = useState<any[]>([]);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [filesToUpload, setFilesToUpload] = useState<SiteLogFileInput[]>([]);
  const [existingSiteLogFiles, setExistingSiteLogFiles] = useState<any[]>([]);

  const queryClient = useQueryClient();

  // Inicializar el panel correcto según si es creación o edición
  useEffect(() => {
    const siteLogId = data?.data?.id || data?.id;
    const isCreating = !siteLogId;
    
    if (isCreating) {
      // Si es creación, abrir en modo edición
      setPanel('edit');
    } else {
      // Si es edición, abrir en modo visualización
      setPanel('view');
    }
  }, [data, setPanel]);

  // Query para obtener archivos existentes de la bitácora
  const { data: siteLogFiles = [], isLoading: filesLoading } = useQuery({
    queryKey: ['site-log-files', data?.id || data?.data?.id],
    queryFn: async () => {
      const siteLogId = data?.id || data?.data?.id;
      if (!siteLogId || !supabase) return [];
      
      const { data: files, error } = await supabase
        .from('project_media')
        .select('*')
        .eq('site_log_id', siteLogId);

      if (error) {
        return [];
      }
      
      return files || [];
    },
    enabled: !!(data?.id || data?.data?.id) && !!supabase
  });

  // Mutación para subir archivos de bitácora
  const uploadFilesMutation = useMutation({
    mutationFn: async ({ files, siteLogId }: { files: SiteLogFileInput[], siteLogId: string }) => {
      if (!currentUser?.organization?.id || !currentUser?.preferences?.last_project_id) {
        throw new Error('No hay proyecto u organización seleccionada');
      }

      const currentMember = members.find((m: any) => m.user_id === currentUser.user.id);
      if (!currentMember) {
        throw new Error('No se encontró el miembro de la organización para el usuario actual');
      }

      await uploadSiteLogFiles(
        files,
        siteLogId,
        currentUser.preferences.last_project_id,
        currentUser.organization.id,
        currentMember.id
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-log-files'] });
      queryClient.invalidateQueries({ queryKey: ['galleryFiles'] });
      setFilesToUpload([]);
      toast({
        title: "Archivos subidos",
        description: "Los archivos se han subido correctamente a la bitácora."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudieron subir los archivos.",
        variant: "destructive"
      });
    }
  });

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
            .from('personnel_attendees')
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
          project_id: currentUser?.preferences?.last_project_id || '',
          organization_id: currentUser?.organization?.id || ''
        }));

        const { error: attendeesError } = await supabase
          .from('personnel_attendees')
          .insert(attendeesToInsert);

        if (attendeesError) {
          // No throw aquí para no fallar todo el proceso
        }
      }

      return savedSiteLog;
    },
    onSuccess: async (savedSiteLog) => {
      queryClient.invalidateQueries({ queryKey: ['site-logs'] });
      
      // Si hay archivos para subir, subirlos después de guardar la bitácora
      if (filesToUpload.length > 0) {
        try {
          await uploadFilesMutation.mutateAsync({ 
            files: filesToUpload, 
            siteLogId: savedSiteLog.id 
          });
        } catch (error) {
          // No hacer throw aquí para no fallar todo el proceso
        }
      }
      
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
          
          {/* Mini-galería de imágenes */}
          {(() => {
            // Filtrar solo imágenes de ambas fuentes
            const existingImages = siteLogFiles.filter(file => file.file_type === 'image');
            const newImages = filesToUpload.filter(fileInput => fileInput.file.type.startsWith('image/'));
            const totalImages = existingImages.length + newImages.length;
            
            if (totalImages === 0) return null;
            
            return (
              <div className="grid grid-cols-5 gap-2">
                {/* Imágenes existentes */}
                {existingImages.map((file) => (
                  <div key={`existing-${file.id}`} className="aspect-square rounded overflow-hidden">
                    <img
                      src={file.file_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                
                {/* Imágenes nuevas para subir */}
                {newImages.map((fileInput, index) => (
                  <div key={`new-${index}`} className="aspect-square rounded overflow-hidden">
                    <img
                      src={URL.createObjectURL(fileInput.file)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            );
          })()}
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
                    <Button variant="ghost" size="icon-sm" onClick={() => removeEvent(event.id)}>
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
              {attendees.map((attendee, index) => (
                <div key={attendee.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {(contacts as any[]).find((c: any) => c.id === attendee.contact_id)?.first_name} {(contacts as any[]).find((c: any) => c.id === attendee.contact_id)?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {attendee.arrival_time} - {attendee.departure_time}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">Editar</Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => removeAttendee(attendee.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Maquinaria */}
        <div className="space-y-4">
          <FormSubsectionButton
            icon={<Wrench />}
            title="Maquinaria"
            description="Registro de equipos utilizados"
            onClick={() => {
              setCurrentSubform('equipment');
              setPanel('subform');
            }}
          />
          
          {/* Lista de maquinaria agregada */}
          {equipment.length > 0 && (
            <div className="space-y-2">
              {equipment.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name} (x{item.quantity})</p>
                    <p className="text-xs text-muted-foreground">
                      {item.condition} {item.operator && `- Operador: ${item.operator}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">Editar</Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => removeEquipment(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botón submit oculto */}
        <button type="submit" style={{ display: 'none' }} />
      </form>
    </Form>
  );

  const personnelSubform = (
    <PersonnelForm
      attendees={attendees}
      setAttendees={setAttendees}
      projectPersonnel={projectPersonnel}
    />
  );

  const mediaSubform = (
    <MediaForm 
      filesToUpload={filesToUpload}
      setFilesToUpload={setFilesToUpload}
      siteLogFiles={siteLogFiles}
    />
  );

  // Configuración de eventos subform
  const eventsSubform = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Eventos del Día</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Registra actividades importantes ocurridas durante la jornada
          </p>
        </div>
        <Button onClick={addEvent} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Evento
        </Button>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-12 h-12 text-muted-foreground" />}
          title="Sin eventos registrados"
          description="Comienza agregando el primer evento del día"
        />
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-sm">Evento #{events.indexOf(event) + 1}</h4>
                <Button 
                  variant="ghost" 
                  size="icon-sm" 
                  onClick={() => removeEvent(event.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium">Descripción</label>
                  <Textarea
                    placeholder="¿Qué ocurrió?"
                    value={event.description}
                    onChange={(e) => updateEvent(event.id, 'description', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Hora</label>
                    <Input
                      type="time"
                      value={event.time}
                      onChange={(e) => updateEvent(event.id, 'time', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Responsable</label>
                    <Input
                      placeholder="¿Quién fue responsable?"
                      value={event.responsible}
                      onChange={(e) => updateEvent(event.id, 'responsible', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Configuración de maquinaria subform
  const equipmentSubform = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Maquinaria y Equipos</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Registra los equipos utilizados durante la jornada
          </p>
        </div>
        <Button onClick={addEquipment} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Equipo
        </Button>
      </div>

      {equipment.length === 0 ? (
        <EmptyState
          icon={<Wrench className="w-12 h-12 text-muted-foreground" />}
          title="Sin equipos registrados"
          description="Comienza agregando el primer equipo utilizado"
        />
      ) : (
        <div className="space-y-4">
          {equipment.map((item) => (
            <div key={item.id} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-sm">Equipo #{equipment.indexOf(item) + 1}</h4>
                <Button 
                  variant="ghost" 
                  size="icon-sm" 
                  onClick={() => removeEquipment(item.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Nombre del Equipo</label>
                    <Input
                      placeholder="Ej: Excavadora Caterpillar 320D"
                      value={item.name}
                      onChange={(e) => updateEquipmentItem(item.id, 'name', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Cantidad</label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateEquipmentItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Estado/Condición</label>
                    <Input
                      placeholder="Ej: Operativo, En reparación"
                      value={item.condition}
                      onChange={(e) => updateEquipmentItem(item.id, 'condition', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Operador</label>
                    <Input
                      placeholder="Nombre del operador"
                      value={item.operator}
                      onChange={(e) => updateEquipmentItem(item.id, 'operator', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Observaciones</label>
                  <Textarea
                    placeholder="Notas adicionales sobre el equipo..."
                    value={item.notes}
                    onChange={(e) => updateEquipmentItem(item.id, 'notes', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const handleSubmit = () => {
    form.handleSubmit(onSubmit)();
  };

  const handleEditClick = () => {
    setPanel('edit');
  };

  const siteLogId = data?.data?.id || data?.id;

  // Configurar botones del footer según el panel actual
  const getFooterConfig = () => {
    if (currentPanel === 'view') {
      return {
        cancelText: "Cerrar",
        onLeftClick: closeModal,
        submitText: "Editar",
        onSubmit: handleEditClick,
        showLoadingSpinner: false
      };
    } else {
      return {
        cancelText: "Cancelar",
        onLeftClick: closeModal,
        submitText: siteLogId ? "Actualizar" : "Crear",
        onSubmit: handleSubmit,
        showLoadingSpinner: isLoading
      };
    }
  };

  const footerConfig = getFooterConfig();

  return (
    <FormModalLayout 
      onClose={closeModal}
      viewPanel={viewPanel}
      editPanel={editPanel}
      subformPanel={
        currentSubform === 'personal' ? personnelSubform :
        currentSubform === 'files' ? mediaSubform :
        currentSubform === 'events' ? eventsSubform :
        currentSubform === 'equipment' ? equipmentSubform :
        null
      }
      headerContent={
        <FormModalHeader
          icon={FileText}
          title={siteLogId ? "Editar Bitácora" : "Nueva Bitácora"}
          description={siteLogId ? "Actualizar información de la bitácora de obra" : "Crear una nueva entrada en la bitácora de obra"}
        />
      }
      footerContent={
        <FormModalFooter
          cancelText={footerConfig.cancelText}
          onLeftClick={footerConfig.onLeftClick}
          onSubmit={footerConfig.onSubmit}
          showLoadingSpinner={footerConfig.showLoadingSpinner}
          submitText={footerConfig.submitText}
        />
      }
      isEditing={false}
    />
  );
}