import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';

import { useTaskParameterValues, useTaskParameterOptionGroupItems, useToggleTaskParameterOptionInGroup } from '@/hooks/use-task-parameters-admin';

interface TaskParameterGroupAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  group: any;
  parameterLabel: string;
}

export function TaskParameterGroupAssignmentModal({
  open,
  onClose,
  group,
  parameterLabel
}: TaskParameterGroupAssignmentModalProps) {
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

  return (
    <CustomModalLayout
      open={open}
      onClose={onClose}
      children={{
        header: (
          <CustomModalHeader
            title={`Gestionar Grupo: ${group.name}`}
            description={`Asignar opciones del parámetro "${parameterLabel}" al grupo`}
            onClose={onClose}
          />
        ),
        body: (
          <CustomModalBody columns={1}>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Opciones seleccionadas</span>
                <Badge variant="secondary">{selectedCount} de {optionsCount}</Badge>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {isLoadingValues || isLoadingItems ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Cargando opciones...
                  </div>
                ) : parameterValues && parameterValues.length > 0 ? (
                  parameterValues.map((option) => (
                    <div key={option.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                      <Checkbox
                        id={option.id}
                        checked={selectedOptions.has(option.id)}
                        onCheckedChange={(checked) => handleOptionToggle(option.id, !!checked)}
                      />
                      <label htmlFor={option.id} className="flex-1 text-sm font-medium cursor-pointer">
                        {option.label}
                      </label>
                      {option.name && (
                        <span className="text-xs text-muted-foreground">({option.name})</span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay opciones disponibles
                  </div>
                )}
              </div>
            </div>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={onClose}
            saveText="Guardar"
            showSave={true}
            onSave={handleSave}
            isLoading={isLoading}
          />
        ),
      }}
    />
  );
}