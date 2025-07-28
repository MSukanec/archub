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
import { useConstructionProjectPhases } from "@/hooks/use-construction-phases";
import { useModalPanelStore } from "@/components/modal/form/modalPanelStore";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

const phaseSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional(),
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
  const { data: existingPhases = [] } = useConstructionProjectPhases(modalData.projectId);

  // Force edit mode on modal open
  useEffect(() => {
    setPanel("edit");
  }, [setPanel]);

  const form = useForm<PhaseFormData>({
    resolver: zodResolver(phaseSchema),
    defaultValues: {
      name: modalData.isEditing ? modalData.editingPhase?.phase?.name || "" : "",
      description: modalData.isEditing ? modalData.editingPhase?.phase?.description || "" : "",
      use_existing_phase: false,
      existing_phase_id: "",
    }
  });

  const { handleSubmit, setValue, watch, register, formState: { errors } } = form;

  // TODO: Implement phase creation hooks
  // const createPhase = useCreateConstructionPhase();
  // const createProjectPhase = useCreateProjectPhase();

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

        // Las fechas se calculan automáticamente, no necesitamos actualizar construction_project_phases

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

        // TODO: Implement phase creation functionality
        toast({
          title: "Funcionalidad en desarrollo",
          description: "La creación de fases estará disponible próximamente",
          variant: "destructive",
        });
        return;
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

  // Handle Enter key submit
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTextarea = target.tagName === 'TEXTAREA';
      
      // Allow Enter submit if not in textarea, or Ctrl/Cmd+Enter anywhere
      if (event.key === 'Enter' && (!isTextarea || event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        handleSubmit(onSubmit)();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSubmit, onSubmit]);

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
                  {phase.name}
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
      rightLoading={isSubmitting}
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