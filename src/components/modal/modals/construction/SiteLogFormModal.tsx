import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, Plus, Trash2, Calendar, Cloud, Users, Wrench, Camera } from "lucide-react";
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
import { supabase } from "@/lib/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileUploader } from "@/components/ui-custom/FileUploader";
import UserSelector from "@/components/ui-custom/UserSelector";

// Schema basado en el modal original con valores exactos del enum
const siteLogSchema = z.object({
  created_by: z.string().min(1, "El creador es requerido"),
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

      const siteLogData = {
        log_date: formData.log_date,
        created_by: formData.created_by, // Este ya es el organization_member.id correcto
        entry_type: formData.entry_type,
        weather: formData.weather,
        comments: formData.comments,
        is_public: true,
        is_favorite: false,
        project_id: currentUser?.preferences?.last_project_id || '',
        organization_id: currentUser?.organization?.id || ''
      };

      let siteLogResult;
      
      if (data?.id) {
        // Actualizando bitácora existente
        siteLogResult = await supabase
          .from('site_logs')
          .update(siteLogData)
          .eq('id', data.id)
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
        console.error('Error saving site log:', siteLogResult.error);
        throw new Error(siteLogResult.error.message);
      }

      return siteLogResult.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-logs'] });
      toast({
        title: data?.id ? "Bitácora actualizada" : "Bitácora creada",
        description: data?.id ? "La bitácora se ha actualizado correctamente." : "La nueva bitácora se ha creado correctamente."
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
      created_by: "", // Será seteado en useEffect cuando se carguen los members
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

  // Setear el miembro de organización actual como creador cuando se carguen los datos (solo si no hay data para editar)
  useEffect(() => {
    if (!data && members && members.length > 0 && currentUser?.user?.id && !form.watch('created_by')) {
      const currentMember = members.find((m: any) => m.user_id === currentUser.user.id);
      if (currentMember) {
        form.setValue('created_by', currentMember.id);
      }
    }
  }, [data, members, currentUser, form]);

  useEffect(() => {
    if (data) {
      console.log('📝 Cargando datos para edición:', data);
      // Si estamos editando, cargar los datos existentes
      form.reset({
        created_by: data.created_by || "", // Este ya es el organization_member.id correcto
        log_date: data.log_date || new Date().toISOString().split('T')[0],
        entry_type: data.entry_type || "avance_de_obra",
        weather: data.weather || null,
        comments: data.comments || "",
        files: data.files || [],
        events: data.events || [],
        attendees: data.attendees || [],
        equipment: data.equipment || []
      });
      setEvents(data.events || []);
      setAttendees(data.attendees || []);
      setEquipment(data.equipment || []);
      setUploadedFiles(data.files || []);
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
    console.log("Guardando bitácora:", formData);
    siteLogMutation.mutate(formData);
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
            <p className="text-sm text-muted-foreground">{data.log_date}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Tipo:</label>
            <p className="text-sm text-muted-foreground">{data.entry_type}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Comentarios:</label>
            <p className="text-sm text-muted-foreground">{data.comments || "Sin comentarios"}</p>
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
        {/* Información Básica */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-accent/10 rounded-lg">
              <Calendar className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">Información Básica</h3>
              <p className="text-xs text-muted-foreground">Datos principales de la entrada de bitácora</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="created_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Creado por</FormLabel>
                  <FormControl>
                    <UserSelector
                      users={members || []}
                      value={form.watch('created_by')}
                      onChange={(value) => form.setValue('created_by', value)}
                      placeholder="Seleccionar creador"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="log_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de bitácora</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="entry_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de bitácora</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            <FormField
              control={form.control}
              name="weather"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condición climática</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
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

          <FormField
            control={form.control}
            name="comments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comentarios generales</FormLabel>
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
        <Separator className="my-6" />
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-accent/10 rounded-lg">
              <Camera className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">Fotos y Videos</h3>
              <p className="text-xs text-muted-foreground">Adjunta archivos multimedia al registro</p>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Camera className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <p className="text-sm text-gray-600">Subir fotos y videos</p>
              <p className="text-xs text-gray-500">Arrastra archivos aquí o haz clic para seleccionar</p>
            </div>
          </div>
        </div>

        {/* Eventos con FormSubsectionButton */}
        <Separator className="my-6" />
        <div className="space-y-4">
          <FormSubsectionButton
            icon={<Plus />}
            title="Eventos"
            description="Registra eventos importantes del día"
            onClick={addEvent}
          />
          
          {events.map((event, index) => (
            <div key={event.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-start">
                <Badge variant="secondary">Evento {index + 1}</Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEvent(event.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Descripción</label>
                  <Input
                    value={event.description}
                    onChange={(e) => updateEvent(event.id, 'description', e.target.value)}
                    placeholder="Descripción del evento"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Hora</label>
                  <Input
                    type="time"
                    value={event.time}
                    onChange={(e) => updateEvent(event.id, 'time', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Responsable</label>
                <Input
                  value={event.responsible}
                  onChange={(e) => updateEvent(event.id, 'responsible', e.target.value)}
                  placeholder="Nombre del responsable"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Personal */}
        <Separator className="my-6" />
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-accent/10 rounded-lg">
              <Users className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">Personal</h3>
              <p className="text-xs text-muted-foreground">Control de asistencia y personal en obra</p>
            </div>
          </div>

          <Button type="button" onClick={addAttendee} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Asistente
          </Button>
          
          {attendees.map((attendee, index) => (
            <div key={attendee.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-start">
                <Badge variant="secondary">Asistente {index + 1}</Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttendee(attendee.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Contacto</label>
                  <Select
                    value={attendee.contact_id}
                    onValueChange={(value) => updateAttendee(attendee.id, 'contact_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar contacto" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((contact: any) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <Select
                    value={attendee.contact_type}
                    onValueChange={(value) => updateAttendee(attendee.id, 'contact_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de contacto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="worker">Trabajador</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="engineer">Ingeniero</SelectItem>
                      <SelectItem value="architect">Arquitecto</SelectItem>
                      <SelectItem value="client">Cliente</SelectItem>
                      <SelectItem value="supplier">Proveedor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Hora llegada</label>
                  <Input
                    type="time"
                    value={attendee.arrival_time}
                    onChange={(e) => updateAttendee(attendee.id, 'arrival_time', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Hora salida</label>
                  <Input
                    type="time"
                    value={attendee.departure_time}
                    onChange={(e) => updateAttendee(attendee.id, 'departure_time', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Notas</label>
                <Textarea
                  value={attendee.notes}
                  onChange={(e) => updateAttendee(attendee.id, 'notes', e.target.value)}
                  placeholder="Notas sobre la asistencia..."
                />
              </div>
            </div>
          ))}
        </div>

        {/* Maquinaria */}
        <Separator className="my-6" />
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-accent/10 rounded-lg">
              <Wrench className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">Maquinaria</h3>
              <p className="text-xs text-muted-foreground">Control de equipos y maquinaria utilizada</p>
            </div>
          </div>

          <Button type="button" onClick={addEquipment} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Equipo
          </Button>
          
          {equipment.map((item, index) => (
            <div key={item.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-start">
                <Badge variant="secondary">Equipo {index + 1}</Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEquipment(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nombre</label>
                  <Input
                    value={item.name}
                    onChange={(e) => updateEquipmentItem(item.id, 'name', e.target.value)}
                    placeholder="Nombre del equipo"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Cantidad</label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateEquipmentItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Condición</label>
                  <Select
                    value={item.condition}
                    onValueChange={(value) => updateEquipmentItem(item.id, 'condition', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Condición" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excelente</SelectItem>
                      <SelectItem value="good">Buena</SelectItem>
                      <SelectItem value="fair">Regular</SelectItem>
                      <SelectItem value="poor">Mala</SelectItem>
                      <SelectItem value="broken">Averiada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Operador</label>
                  <Input
                    value={item.operator}
                    onChange={(e) => updateEquipmentItem(item.id, 'operator', e.target.value)}
                    placeholder="Nombre del operador"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Notas</label>
                <Textarea
                  value={item.notes}
                  onChange={(e) => updateEquipmentItem(item.id, 'notes', e.target.value)}
                  placeholder="Notas sobre el equipo..."
                />
              </div>
            </div>
          ))}
        </div>
      </form>
    </Form>
  );

  return (
    <FormModalLayout
      columns={1}
      onClose={closeModal}
      viewPanel={viewPanel}
      editPanel={editPanel}
      isEditing={true}
      headerContent={
        <FormModalHeader
          title={data ? "Editar Bitácora" : "Nueva Bitácora"}
          description={data ? "Modifica la información de la bitácora" : "Crea una nueva bitácora de obra"}
          icon={FileText}
        />
      }
      footerContent={
        <FormModalFooter
          leftLabel="Cancelar"
          onLeftClick={closeModal}
          rightLabel={data ? "Guardar Cambios" : "Crear Bitácora"}
          onRightClick={form.handleSubmit(onSubmit)}
          showLoadingSpinner={isLoading}
        />
      }
    />
  );
}