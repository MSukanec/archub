import { useState, useEffect } from 'react';
import { Eye, CheckCircle, Circle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';

import { 
  TaskParameterOptionGroup, 
  TaskParameterOptionGroupItem,
  useTaskParameterValues,
  useTaskParameterOptionGroupItems,
  useToggleTaskParameterOptionInGroup 
} from '@/hooks/use-task-parameters-admin';

// Las interfaces se importan desde el hook

interface TaskParameterGroupAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  group: TaskParameterOptionGroup;
  parameterLabel: string;
}

export function TaskParameterGroupAssignmentModal({ 
  open, 
  onClose, 
  group,
  parameterLabel
}: TaskParameterGroupAssignmentModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // Real hooks for data fetching
  const { data: parameterOptions, isLoading: isLoadingOptions } = useTaskParameterValues(group.parameter_id);
  const { data: groupItems, isLoading: isLoadingItems } = useTaskParameterOptionGroupItems(group.id);
  const toggleMutation = useToggleTaskParameterOptionInGroup();

  // Update selected options when group items load
  useEffect(() => {
    if (groupItems) {
      setSelectedOptions(groupItems.map(item => item.parameter_value_id));
    }
  }, [groupItems]);

  const handleOptionToggle = async (optionId: string, checked: boolean) => {
    // Optimistic update
    if (checked) {
      setSelectedOptions(prev => [...prev, optionId]);
    } else {
      setSelectedOptions(prev => prev.filter(id => id !== optionId));
    }

    // Real API call
    try {
      await toggleMutation.mutateAsync({
        groupId: group.id,
        parameterValueId: optionId,
        action: checked ? 'add' : 'remove'
      });
    } catch (error) {
      // Revert on error
      if (checked) {
        setSelectedOptions(prev => prev.filter(id => id !== optionId));
      } else {
        setSelectedOptions(prev => [...prev, optionId]);
      }
    }
  };

  return (
    <CustomModalLayout
      open={open}
      onOpenChange={onClose}
      content={{
        header: (
          <CustomModalHeader 
            title={`Asignar Opciones a Grupo: ${group.label}`}
            subtitle={`Parámetro: ${parameterLabel}`}
          />
        ),
        body: (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Opciones disponibles</p>
                <p className="text-xs text-muted-foreground">
                  Selecciona las opciones que pertenecen a este grupo
                </p>
              </div>
              <Badge variant="outline">
                {selectedOptions.length} seleccionadas
              </Badge>
            </div>

            {isLoadingOptions || isLoadingItems ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg animate-pulse">
                    <div className="w-4 h-4 bg-muted rounded"></div>
                    <div className="flex-1">
                      <div className="w-24 h-4 bg-muted rounded mb-1"></div>
                      <div className="w-32 h-3 bg-muted/50 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : parameterOptions && parameterOptions.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {parameterOptions.map((option) => {
                  const isSelected = selectedOptions.includes(option.id);
                  return (
                    <div
                      key={option.id}
                      className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors cursor-pointer hover:bg-muted/50 ${
                        isSelected ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => handleOptionToggle(option.id, !isSelected)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleOptionToggle(option.id, !!checked)}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.name}</p>
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                No hay opciones disponibles para este parámetro.
              </div>
            )}
          </div>
        ),
        footer: (
          <CustomModalFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={onClose} disabled={toggleMutation.isPending}>
              {toggleMutation.isPending ? 'Guardando...' : 'Cerrar'}
            </Button>
          </CustomModalFooter>
        ),
      }}
    />
  );
}