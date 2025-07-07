import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';

import { useTaskParameterValues } from '@/hooks/use-task-parameters-admin';

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
  
  // Cargar todas las opciones del parámetro
  const { data: parameterValues, isLoading: isLoadingValues } = useTaskParameterValues(group?.parameter_id || '');
  
  // Simular asignaciones (por ahora vacías)
  const assignments: any[] = [];
  const isLoadingAssignments = false;

  // Actualizar selección cuando cargan las asignaciones
  useEffect(() => {
    if (assignments) {
      const assignedOptionIds = new Set(assignments.map(a => a.parameter_value_id));
      setSelectedOptions(assignedOptionIds);
    }
  }, [assignments]);

  const handleOptionToggle = async (optionId: string, isChecked: boolean) => {
    const newSelection = new Set(selectedOptions);
    
    if (isChecked) {
      newSelection.add(optionId);
    } else {
      newSelection.delete(optionId);
    }
    
    setSelectedOptions(newSelection);
  };

  if (!group) return null;

  const isLoading = isLoadingValues || isLoadingAssignments;
  const optionsCount = parameterValues?.length || 0;
  const selectedCount = selectedOptions.size;

  return (
    <CustomModalLayout
      open={open}
      onClose={onClose}
      content={{
        header: (
          <CustomModalHeader
            title={`Gestionar Grupo: ${group.name}`}
            description={`Asignar opciones del parámetro "${parameterLabel}" al grupo "${group.name}"`}
            onClose={onClose}
          />
        ),
        body: (
          <CustomModalBody columns={1}>
            <div className="space-y-4">
              {/* Contador de selección */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">
                  Opciones seleccionadas
                </span>
                <Badge variant="secondary">
                  {selectedCount} de {optionsCount}
                </Badge>
              </div>

              {/* Lista de opciones */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {isLoading ? (
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
                      <label
                        htmlFor={option.id}
                        className="flex-1 text-sm font-medium cursor-pointer"
                      >
                        {option.label}
                      </label>
                      {option.name && (
                        <span className="text-xs text-muted-foreground">
                          ({option.name})
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay opciones disponibles para este parámetro
                  </div>
                )}
              </div>
            </div>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={onClose}
            saveText="Cerrar"
            showSave={true}
            onSave={onClose}
          />
        ),
      }}
    />
  );
}