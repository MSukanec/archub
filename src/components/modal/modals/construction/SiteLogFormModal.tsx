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
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { FileUploader } from "@/components/ui-custom/FileUploader";
import { EmptyState } from "@/components/ui-custom/EmptyState";

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

  const queryClient = useQueryClient();

  const form = useForm<SiteLogFormData>({
    resolver: zodResolver(siteLogSchema),
    defaultValues: {
      log_date: new Date().toISOString().split('T')[0],
      entry_type: 'avance_de_obra',
      weather: 'sunny',
      comments: '',
    }
  });

  const handleSubmit = (values: SiteLogFormData) => {
    console.log('Submitting:', values);
    toast({
      title: "Bitácora guardada",
      description: "La bitácora se ha guardado correctamente.",
    });
    closeModal();
  };

  // Subform de Personal - Temporalmente vacío para pruebas
  const personalSubform = (
    <div className="space-y-4">
      <div className="text-center py-8">
        <p className="text-muted-foreground">Subformulario de personal temporalmente deshabilitado</p>
      </div>
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

  // Panel de vista
  const viewPanel = (
    <div className="space-y-6">
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Vista de bitácora</p>
      </div>
    </div>
  );

  // Panel de edición principal
  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Fecha */}
        <FormField
          control={form.control}
          name="log_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de la bitácora</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tipo de entrada */}
        <FormField
          control={form.control}
          name="entry_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de entrada</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de entrada" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="avance_de_obra">Avance de obra</SelectItem>
                  <SelectItem value="decision">Decisión</SelectItem>
                  <SelectItem value="foto_diaria">Foto diaria</SelectItem>
                  <SelectItem value="inspeccion">Inspección</SelectItem>
                  <SelectItem value="nota_climatica">Nota climática</SelectItem>
                  <SelectItem value="pedido_material">Pedido material</SelectItem>
                  <SelectItem value="problema_detectado">Problema detectado</SelectItem>
                  <SelectItem value="visita_tecnica">Visita técnica</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Clima */}
        <FormField
          control={form.control}
          name="weather"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Condición climática</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el clima" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="sunny">Soleado</SelectItem>
                  <SelectItem value="partly_cloudy">Parcialmente nublado</SelectItem>
                  <SelectItem value="cloudy">Nublado</SelectItem>
                  <SelectItem value="rain">Lluvia</SelectItem>
                  <SelectItem value="storm">Tormenta</SelectItem>
                  <SelectItem value="snow">Nieve</SelectItem>
                  <SelectItem value="fog">Niebla</SelectItem>
                  <SelectItem value="windy">Ventoso</SelectItem>
                  <SelectItem value="hail">Granizo</SelectItem>
                  <SelectItem value="none">Sin especificar</SelectItem>
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
                  placeholder="Escribe los detalles de la bitácora..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* Personal */}
        <div className="space-y-4">
          <FormSubsectionButton
            icon={<Users />}
            title="Personal"
            description="Control de personal presente en obra"
            onClick={() => {
              setCurrentSubform('personal');
              setPanel('subform');
            }}
          />
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
        currentPanel === 'subform' ? null : (
          <FormModalFooter
            leftLabel="Cancelar"
            onLeftClick={closeModal}
            rightLabel={data ? "Guardar Cambios" : "Crear Bitácora"}
            onRightClick={form.handleSubmit(handleSubmit)}
            isRightLoading={false}
          />
        )
      }
    />
  );
}