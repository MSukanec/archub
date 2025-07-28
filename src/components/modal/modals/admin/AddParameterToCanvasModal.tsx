import { useState } from 'react';
import { FormModalLayout } from '../../form/FormModalLayout';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { useGlobalModalStore } from '../../form/useGlobalModalStore';
import { Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Parameter {
  id: string;
  name: string;
  slug: string;
}

export function AddParameterToCanvasModal() {
  const { data: modalData, type: modalType, open, closeModal } = useGlobalModalStore();
  const [selectedParameterId, setSelectedParameterId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Obtener todos los parámetros disponibles
  const { data: parameters = [], isLoading: parametersLoading } = useQuery({
    queryKey: ['all-parameters'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not available');
      
      const { data, error } = await supabase
        .from('task_parameters')
        .select('id, name, slug')
        .order('name');
      
      if (error) throw error;
      return data as Parameter[];
    }
  });

  // Obtener parámetros que ya están en el canvas
  const { data: existingPositions = [] } = useQuery({
    queryKey: ['parameter-positions'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not available');
      
      const { data, error } = await supabase
        .from('task_parameter_positions')
        .select('parameter_id');
      
      if (error) throw error;
      return data;
    }
  });

  // Filtrar parámetros que aún no están en el canvas
  const availableParameters = parameters.filter(param => 
    !existingPositions.some(pos => pos.parameter_id === param.id)
  );

  const handleAdd = async () => {
    if (!selectedParameterId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un parámetro",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (!supabase) throw new Error('Supabase client not available');
      
      // Crear una nueva posición para el parámetro en el canvas
      // Posición inicial: centro del viewport
      const { error } = await supabase
        .from('task_parameter_positions')
        .insert({
          parameter_id: selectedParameterId,
          x: 0,
          y: 0,
          visible_options: [] // Sin opciones visibles inicialmente
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Parámetro agregado al canvas"
      });

      // Notificar al callback del padre si existe
      if (modalData?.onAdd) {
        modalData.onAdd(selectedParameterId);
      }

      closeModal();
    } catch (error) {
      console.error('Error adding parameter to canvas:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el parámetro al canvas",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewPanel = null;

  const editPanel = (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="parameter-select">Seleccionar Parámetro</Label>
        <Select
          value={selectedParameterId}
          onValueChange={setSelectedParameterId}
          disabled={parametersLoading || availableParameters.length === 0}
        >
          <SelectTrigger>
            <SelectValue 
              placeholder={
                parametersLoading 
                  ? "Cargando parámetros..." 
                  : availableParameters.length === 0
                    ? "No hay parámetros disponibles"
                    : "Selecciona un parámetro"
              } 
            />
          </SelectTrigger>
          <SelectContent>
            {availableParameters.map((parameter) => (
              <SelectItem key={parameter.id} value={parameter.id}>
                {parameter.name} ({parameter.slug})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {availableParameters.length === 0 && !parametersLoading && (
        <div className="text-sm text-muted-foreground">
          Todos los parámetros ya están en el canvas o no hay parámetros disponibles.
        </div>
      )}
    </div>
  );

  const headerContent = (
    <FormModalHeader 
      title="Agregar Parámetro al Canvas"
      icon={Plus}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={closeModal}
      rightLabel={isSubmitting ? 'Agregando...' : 'Agregar Parámetro'}
      onRightClick={handleAdd}
      rightDisabled={isSubmitting || !selectedParameterId || availableParameters.length === 0}
    />
  );

  if (!open || modalType !== 'add-parameter-to-canvas') return null;

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={closeModal}
      onSubmit={handleAdd}
      isEditing={true}
    />
  );
}