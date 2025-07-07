import { useState, useEffect } from 'react';
import { Eye, CheckCircle, Circle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';

interface TaskParameterOption {
  id: string;
  parameter_id: string;
  name: string;
  label: string;
  created_at: string;
}

interface TaskParameterOptionGroup {
  id: string;
  parameter_id: string;
  name: string;
  label: string;
  position?: number;
  created_at: string;
}

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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Mock data - would be replaced with real hooks
  const mockOptions: TaskParameterOption[] = [
    { id: '1', parameter_id: group.parameter_id, name: 'ladrillo_comun', label: 'Ladrillo Común', created_at: '2025-01-01' },
    { id: '2', parameter_id: group.parameter_id, name: 'ladrillo_visto', label: 'Ladrillo Visto', created_at: '2025-01-01' },
    { id: '3', parameter_id: group.parameter_id, name: 'bloque_hormigon', label: 'Bloque de Hormigón', created_at: '2025-01-01' },
    { id: '4', parameter_id: group.parameter_id, name: 'madera_pino', label: 'Madera de Pino', created_at: '2025-01-01' },
    { id: '5', parameter_id: group.parameter_id, name: 'madera_eucalipto', label: 'Madera de Eucalipto', created_at: '2025-01-01' },
  ];

  // Load selected options for this group
  useEffect(() => {
    if (open) {
      setIsLoading(true);
      // Mock loading delay
      setTimeout(() => {
        // Mock some selected options
        setSelectedOptions(['1', '3']);
        setIsLoading(false);
      }, 500);
    }
  }, [open, group.id]);

  const handleOptionToggle = (optionId: string, checked: boolean) => {
    if (checked) {
      setSelectedOptions(prev => [...prev, optionId]);
    } else {
      setSelectedOptions(prev => prev.filter(id => id !== optionId));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Mock save operation
      console.log('Saving group assignments:', {
        groupId: group.id,
        optionIds: selectedOptions
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      onClose();
    } catch (error) {
      console.error('Error saving assignments:', error);
    } finally {
      setIsSaving(false);
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
          <CustomModalBody columns={1}>
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

              {isLoading ? (
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
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {mockOptions.map((option) => {
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
              )}
            </div>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar Asignaciones'}
            </Button>
          </CustomModalFooter>
        ),
      }}
    />
  );
}