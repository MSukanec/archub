import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, Plus, Trash2, Calendar, Cloud, Users, Wrench } from "lucide-react";
import { FormModalLayout } from "../../form/FormModalLayout";
import { FormModalHeader } from "../../form/FormModalHeader";
import { FormModalFooter } from "../../form/FormModalFooter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useOrganizationMembers } from "@/hooks/use-organization-members";
import { useContacts } from "@/hooks/use-contacts";
import { useGlobalModalStore } from "../../form/useGlobalModalStore";
import { FileUploader } from "@/components/ui-custom/FileUploader";

// Schema basado en el modal original
const siteLogSchema = z.object({
  creator_id: z.string().min(1, "El creador es requerido"),
  log_date: z.string().min(1, "La fecha es requerida"),
  log_type: z.string().min(1, "El tipo de bitácora es requerido"),
  weather_condition: z.string().optional(),
  general_comments: z.string().optional(),
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
  const { data: members = [] } = useOrganizationMembers();
  const { data: contacts = [] } = useContacts();
  
  const [events, setEvents] = useState<any[]>([]);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const form = useForm<SiteLogFormData>({
    resolver: zodResolver(siteLogSchema),
    defaultValues: {
      creator_id: currentUser?.user?.id || "",
      log_date: new Date().toISOString().split('T')[0],
      log_type: "",
      weather_condition: "",
      general_comments: "",
      files: [],
      events: [],
      attendees: [],
      equipment: []
    }
  });

  useEffect(() => {
    if (data) {
      // Si estamos editando, cargar los datos existentes
      form.reset({
        creator_id: data.creator_id || currentUser?.user?.id || "",
        log_date: data.log_date || new Date().toISOString().split('T')[0],
        log_type: data.log_type || "",
        weather_condition: data.weather_condition || "",
        general_comments: data.general_comments || "",
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
  }, [data, currentUser, form]);

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
    try {
      const siteLogData = {
        ...formData,
        files: uploadedFiles,
        events,
        attendees,
        equipment
      };

      if (data?.id) {
        await updateMutation.mutateAsync({ id: data.id, ...siteLogData });
        toast({
          title: "Bitácora actualizada",
          description: "La bitácora se ha actualizado correctamente."
        });
      } else {
        await createMutation.mutateAsync(siteLogData);
        toast({
          title: "Bitácora creada",
          description: "La nueva bitácora se ha creado correctamente."
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al guardar la bitácora.",
        variant: "destructive"
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

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
            <p className="text-sm text-muted-foreground">{data.log_type}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Comentarios:</label>
            <p className="text-sm text-muted-foreground">{data.general_comments || "Sin comentarios"}</p>
          </div>
        </div>
      )}
    </div>
  );

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Accordion type="multiple" defaultValue={["basic", "files", "events", "personnel", "equipment"]} className="w-full">
          
          {/* Información Básica */}
          <AccordionItem value="basic">
            <AccordionTrigger className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Información Básica
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="creator_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Creado por</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar creador" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {members.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.full_name}
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
                  name="log_type"
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
                          <SelectItem value="daily">Diaria</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="inspection">Inspección</SelectItem>
                          <SelectItem value="incident">Incidente</SelectItem>
                          <SelectItem value="milestone">Hito</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weather_condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condición climática</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar clima" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sunny">Soleado</SelectItem>
                          <SelectItem value="cloudy">Nublado</SelectItem>
                          <SelectItem value="rainy">Lluvioso</SelectItem>
                          <SelectItem value="windy">Ventoso</SelectItem>
                          <SelectItem value="stormy">Tormentoso</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="general_comments"
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
            </AccordionContent>
          </AccordionItem>

          {/* Fotos y Videos */}
          <AccordionItem value="files">
            <AccordionTrigger className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Fotos y Videos
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <FileUploader
                onFilesUploaded={setUploadedFiles}
                initialFiles={uploadedFiles}
                bucketName="site-log-files"
                accept="image/*,video/*"
                multiple={true}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Eventos */}
          <AccordionItem value="events">
            <AccordionTrigger className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Eventos
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <Button type="button" onClick={addEvent} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Evento
              </Button>
              
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
            </AccordionContent>
          </AccordionItem>

          {/* Personal */}
          <AccordionItem value="personnel">
            <AccordionTrigger className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Personal
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
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
                          {contacts.map((contact) => (
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
                      placeholder="Notas adicionales..."
                    />
                  </div>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* Maquinaria */}
          <AccordionItem value="equipment">
            <AccordionTrigger className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Maquinaria
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <Button type="button" onClick={addEquipment} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Maquinaria
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
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </form>
    </Form>
  );

  const headerContent = {
    view: {
      title: "Bitácora de Obra",
      description: "Información detallada de la bitácora"
    },
    edit: {
      title: data ? "Editar Bitácora" : "Nueva Bitácora",
      description: data ? "Modifica la información de la bitácora" : "Crea una nueva bitácora de obra"
    }
  };

  const footerContent = {
    view: {
      cancelLabel: "Cerrar",
      submitLabel: "Editar",
      onSubmit: () => {
        // Switch to edit mode
      }
    },
    edit: {
      cancelLabel: "Cancelar",
      submitLabel: data ? "Guardar Cambios" : "Crear Bitácora",
      onSubmit: form.handleSubmit(onSubmit),
      isLoading
    }
  };

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={<FormModalHeader {...headerContent} />}
      footerContent={<FormModalFooter {...footerContent} />}
    />
  );
}