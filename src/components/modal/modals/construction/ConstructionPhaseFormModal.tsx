import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Layers } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCreateConstructionPhase, useCreateProjectPhase, useConstructionPhases } from "@/hooks/use-construction-phases";
import { useModalPanelStore } from "@/components/modal/form/modalPanelStore";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

const phaseSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional(),
  // Campos para agregar al proyecto
  start_date: z.string().optional(),
  duration_in_days: z.number().min(1, "La duración debe ser al menos 1 día").optional(),
  use_existing_phase: z.boolean().optional(),
  existing_phase_id: z.string().optional(),
});

type PhaseFormData = z.infer<typeof phaseSchema>;

interface ConstructionPhaseFormModalProps {
  modalData: {
    projectId: string;
    organizationId: string;
    userId?: string;
    editingPhase?: any;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function ConstructionPhaseFormModal({ 
  modalData, 
  onClose 
}: ConstructionPhaseFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useExisting, setUseExisting] = useState(false);
  
  const { data: userData } = useCurrentUser();
  const { setPanel } = useModalPanelStore();
  const queryClient = useQueryClient();

  // Get current user's member_id
  const { data: currentMember } = useQuery({
    queryKey: ['current-member', modalData.organizationId, userData?.user?.id],
    queryFn: async () => {
      if (!userData?.user?.id || !modalData.organizationId) return null;
      
      if (!supabase) return null;
      
      const { data, error } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', modalData.organizationId)
        .eq('user_id', userData.user.id)
        .single();

      if (error) {
        console.error('Error fetching member:', error);
        return null;
      }

      return data;
    },
    enabled: !!userData?.user?.id && !!modalData.organizationId
  });

  // Get existing phases for selection
  const { data: existingPhases = [] } = useConstructionPhases(modalData.organizationId);

  // Force edit mode on modal open
  useEffect(() => {
    setPanel("edit");
  }, [setPanel]);

  const form = useForm<PhaseFormData>({
    resolver: zodResolver(phaseSchema),
    defaultValues: {
      name: modalData.isEditing ? modalData.editingPhase?.phase?.name || "" : "",
      description: modalData.isEditing ? modalData.editingPhase?.phase?.description || "" : "",
      start_date: modalData.isEditing ? modalData.editingPhase?.start_date || "" : "",
      duration_in_days: modalData.isEditing ? modalData.editingPhase?.duration_in_days || undefined : undefined,
      use_existing_phase: false,
      existing_phase_id: "",
    }
  });

  const { handleSubmit, setValue, watch, register, formState: { errors } } = form;

  const createPhase = useCreateConstructionPhase();
  const createProjectPhase = useCreateProjectPhase();

  const watchUseExisting = watch('use_existing_phase');
  
  useEffect(() => {
    setUseExisting(watchUseExisting || false);
  }, [watchUseExisting]);

  const onSubmit = async (data: PhaseFormData) => {
    if (!userData?.user?.id || !currentMember?.id) {
      toast({
        title: "Error",
        description: "No se pudo identificar el usuario",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (modalData.isEditing && modalData.editingPhase) {
        // Modo edición: actualizar fase existente
        if (!supabase) throw new Error("Supabase not initialized");

        // Actualizar la información de la fase base
        const { error: phaseError } = await supabase
          .from("construction_phases")
          .update({
            name: data.name,
            description: data.description,
          })
          .eq("id", modalData.editingPhase.phase_id);

        if (phaseError) {
          console.error("Error updating phase:", phaseError);
          throw phaseError;
        }

        // Actualizar la información del proyecto_fase
        const updateData: any = {
          start_date: data.start_date || null,
          duration_in_days: data.duration_in_days || null,
        };

        const { error: projectPhaseError } = await supabase
          .from("construction_project_phases")
          .update(updateData)
          .eq("id", modalData.editingPhase.id);

        if (projectPhaseError) {
          console.error("Error updating project phase:", projectPhaseError);
          throw projectPhaseError;
        }

        // Invalidar cache para refrescar el Gantt
        queryClient.invalidateQueries({ queryKey: ["project-phases", modalData.projectId] });
        queryClient.invalidateQueries({ queryKey: ["construction-phases", modalData.organizationId] });

        toast({
          title: "Fase actualizada exitosamente",
          description: "Los cambios han sido guardados correctamente",
        });

      } else {
        // Modo creación: crear nueva fase
        let phaseId = data.existing_phase_id;

        // If creating new phase, create it first
        if (!useExisting) {
          const newPhase = await createPhase.mutateAsync({
            name: data.name,
            description: data.description,
            organization_id: modalData.organizationId,
            is_system: false, // Las fases creadas por usuarios nunca son del sistema
          });
          phaseId = newPhase.id;
        }

        if (!phaseId) {
          toast({
            title: "Error",
            description: "Debe seleccionar o crear una fase",
            variant: "destructive",
          });
          return;
        }

        // Add phase to project
        await createProjectPhase.mutateAsync({
          project_id: modalData.projectId,
          phase_id: phaseId,
          start_date: data.start_date || undefined,
          duration_in_days: data.duration_in_days || undefined,
          created_by: currentMember.id,
        });

        toast({
          title: "Fase creada exitosamente",
          description: useExisting ? "La fase existente se agregó al proyecto" : "Nueva fase creada y agregada al proyecto",
        });
      }

      onClose();
    } catch (error) {
      console.error('Error with phase operation:', error);
      toast({
        title: modalData.isEditing ? "Error al actualizar la fase" : "Error al crear la fase",
        description: modalData.isEditing ? "No se pudieron guardar los cambios. Por favor, intente de nuevo." : "No se pudo crear la fase. Por favor, intente de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewPanel = null; // No view mode for this modal

  const editPanel = (
    <div className="space-y-6">
      {/* Option to use existing or create new */}
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="use_existing" 
          checked={useExisting}
          onCheckedChange={(checked) => {
            setValue('use_existing_phase', checked === true);
            setUseExisting(checked === true);
          }}
        />
        <Label htmlFor="use_existing" className="text-sm font-medium">
          Usar fase existente
        </Label>
      </div>

      {useExisting ? (
        // Existing phase selection
        <div className="space-y-2">
          <Label htmlFor="existing_phase_id">Fase Existente *</Label>
          <Select 
            value={watch('existing_phase_id') || ''} 
            onValueChange={(value) => setValue('existing_phase_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar fase..." />
            </SelectTrigger>
            <SelectContent>
              {existingPhases.map((phase) => (
                <SelectItem key={phase.id} value={phase.id}>
                  {phase.name} {phase.default_duration ? `(${phase.default_duration} días)` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.existing_phase_id && (
            <p className="text-sm text-red-500">{errors.existing_phase_id.message}</p>
          )}
        </div>
      ) : (
        // New phase creation fields
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Fase *</Label>
            <Input
              id="name"
              placeholder="Ej: Cimentación, Estructura, Acabados..."
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Descripción de las actividades de esta fase..."
              {...register('description')}
              rows={3}
            />
          </div>


        </div>
      )}

      {/* Project-specific fields */}
      <div className="border-t pt-6">
        <h4 className="text-sm font-medium mb-4">Configuración en el Proyecto</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start_date">Fecha de Inicio</Label>
            <Input
              id="start_date"
              type="date"
              {...register('start_date')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration_in_days">Duración (días)</Label>
            <Input
              id="duration_in_days"
              type="number"
              min="1"
              placeholder="30"
              {...register('duration_in_days', { valueAsNumber: true })}
            />
          </div>
        </div>


      </div>
    </div>
  );

  const headerContent = (
    <FormModalHeader 
      title={modalData.isEditing ? "Editar Fase" : "Agregar Fase de Construcción"}
      icon={Layers}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={modalData.isEditing ? "Guardar Cambios" : "Crear Fase"}
      onRightClick={handleSubmit(onSubmit)}
      loading={isSubmitting}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
    />
  );
}