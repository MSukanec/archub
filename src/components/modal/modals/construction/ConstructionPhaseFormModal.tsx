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

import { Layers } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCreateConstructionPhase } from "@/hooks/use-construction-phases";
import { useModalPanelStore } from "@/components/modal/form/modalPanelStore";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

const phaseSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional(),
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



  // Force edit mode on modal open
  useEffect(() => {
    setPanel("edit");
  }, [setPanel]);

  const form = useForm<PhaseFormData>({
    resolver: zodResolver(phaseSchema),
    defaultValues: {
      name: modalData.isEditing ? modalData.editingPhase?.phase?.name || "" : "",
      description: modalData.isEditing ? modalData.editingPhase?.phase?.description || "" : "",
    }
  });

  const { handleSubmit, setValue, watch, register, formState: { errors } } = form;

  const createPhase = useCreateConstructionPhase();



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
        await createPhase.mutateAsync({
          projectId: modalData.projectId,
          organizationId: modalData.organizationId,
          name: data.name,
          description: data.description,
          createdBy: currentMember.id,
          useExisting: false
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
      isRightLoading={isSubmitting}
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