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

const phaseSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional(),
  // Campos para agregar al proyecto
  start_date: z.string().optional(),
  duration_in_days: z.number().min(1, "La duración debe ser al menos 1 día").optional(),
  end_date: z.string().optional(),
  use_existing_phase: z.boolean().optional(),
  existing_phase_id: z.string().optional(),
});

type PhaseFormData = z.infer<typeof phaseSchema>;

interface ConstructionPhaseFormModalProps {
  modalData: {
    projectId: string;
    organizationId: string;
    userId?: string;
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
      name: "",
      description: "",
      start_date: "",
      duration_in_days: undefined,
      end_date: "",
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

      // Calculate end_date if start_date and duration_in_days are provided
      let endDate = data.end_date;
      if (data.start_date && data.start_date.trim() !== '' && data.duration_in_days && data.duration_in_days > 0 && (!data.end_date || data.end_date.trim() === '')) {
        const startDate = new Date(data.start_date);
        startDate.setDate(startDate.getDate() + data.duration_in_days);
        endDate = startDate.toISOString().split('T')[0];
      }

      // Add phase to project
      await createProjectPhase.mutateAsync({
        project_id: modalData.projectId,
        phase_id: phaseId,
        start_date: data.start_date || undefined,
        duration_in_days: data.duration_in_days || undefined,
        end_date: endDate || undefined,
        created_by: currentMember.id,
      });

      toast({
        title: "Fase creada exitosamente",
        description: useExisting ? "La fase existente se agregó al proyecto" : "Nueva fase creada y agregada al proyecto",
      });

      onClose();
    } catch (error) {
      console.error('Error creating phase:', error);
      toast({
        title: "Error al crear la fase",
        description: "No se pudo crear la fase. Por favor, intente de nuevo.",
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

        <div className="space-y-2 mt-4">
          <Label htmlFor="end_date">Fecha de Finalización (opcional si hay duración)</Label>
          <Input
            id="end_date"
            type="date"
            {...register('end_date')}
          />
        </div>
      </div>
    </div>
  );

  const headerContent = (
    <FormModalHeader 
      title="Agregar Fase de Construcción"
      icon={Layers}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel="Crear Fase"
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