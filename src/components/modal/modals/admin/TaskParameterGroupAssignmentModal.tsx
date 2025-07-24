import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

import { FormModalLayout } from '@/components/modal/form/FormModalLayout';
import { FormModalHeader } from '@/components/modal/form/FormModalHeader';
import { FormModalFooter } from '@/components/modal/form/FormModalFooter';

import { useTaskParameterValues, useTaskParameterOptionGroupItems, useToggleTaskParameterOptionInGroup } from '@/hooks/use-task-parameters-admin';

interface TaskParameterGroupAssignmentModalProps {
  modalData?: {
    group: any;
    parameterLabel: string;
  };
  onClose: () => void;
}

export function TaskParameterGroupAssignmentModal({ modalData, onClose }: TaskParameterGroupAssignmentModalProps) {
  const { group, parameterLabel } = modalData || {};
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const { data: parameterValues, isLoading: isLoadingValues } = useTaskParameterValues(group?.parameter_id || '');
  const { data: groupItems, isLoading: isLoadingItems } = useTaskParameterOptionGroupItems(group?.id || '');
  const toggleMutation = useToggleTaskParameterOptionInGroup();

  // Initialize selected options when group items load
  useEffect(() => {
    if (groupItems && groupItems.length > 0) {
      const initialSelections = new Set(groupItems.map(item => item.parameter_value_id));
      setSelectedOptions(initialSelections);
    } else {
      setSelectedOptions(new Set());
    }
  }, [groupItems]);
  
  const handleOptionToggle = (optionId: string, isChecked: boolean) => {
    const newSelection = new Set(selectedOptions);
    
    if (isChecked) {
      newSelection.add(optionId);
    } else {
      newSelection.delete(optionId);
    }
    
    setSelectedOptions(newSelection);
  };

  const handleSave = async () => {
    if (!group?.id) {
      toast({
        title: "Error",
        description: "No se pudo identificar el grupo",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Get current selections from database
      const currentSelections = new Set(groupItems?.map(item => item.parameter_value_id) || []);
      
      // Find additions and removals
      const additions = Array.from(selectedOptions).filter(id => !currentSelections.has(id));
      const removals = Array.from(currentSelections).filter(id => !selectedOptions.has(id));
      
      // Process all changes
      const promises = [
        ...additions.map(parameterValueId => 
          toggleMutation.mutateAsync({
            groupId: group.id,
            parameterValueId,
            action: 'add'
          })
        ),
        ...removals.map(parameterValueId => 
          toggleMutation.mutateAsync({
            groupId: group.id,
            parameterValueId,
            action: 'remove'
          })
        )
      ];
      
      await Promise.all(promises);
      
      toast({
        title: "Opciones actualizadas",
        description: `Se asignaron ${selectedOptions.size} opciones al grupo "${group.name}"`
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving group assignments:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron actualizar las asignaciones",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!group) return null;

  const optionsCount = parameterValues?.length || 0;
  const selectedCount = selectedOptions.size;

  const viewPanel = null; // No view mode needed for this modal
  
  const editPanel = (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Opciones seleccionadas</span>
        <Badge variant="secondary">{selectedCount} de {optionsCount}</Badge>
      </div>
      
      {isLoadingValues ? (
        <div className="text-center py-4 text-muted-foreground">
          Cargando opciones...
        </div>
      ) : parameterValues && parameterValues.length > 0 ? (
        <div className="space-y-3">
          {parameterValues.map((option) => {
            const isSelected = selectedOptions.has(option.id);
            return (
              <div key={option.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleOptionToggle(option.id, !!checked)}
                  />
                  <span className="font-medium">{option.label}</span>
                </div>
                <span className="text-sm text-muted-foreground">({option.name})</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No hay opciones disponibles para este parámetro
        </div>
      )}
    </div>
  );

  const headerContent = (
    <FormModalHeader 
      title={`Gestionar Grupo: ${group?.name || ''}`}
      description={`Asignar opciones del parámetro "${parameterLabel}" al grupo`}
      icon={Settings}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel="Guardar"
      onRightClick={handleSave}
      rightLoading={isLoading}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      isEditing={true}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
    />
  );
}