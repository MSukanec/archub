import { useState, useEffect } from 'react';
import { FormModalLayout } from '../../form/FormModalLayout';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings, ArrowRight } from 'lucide-react';
import { useParameterAsChild, useDependencyOptions, useSaveDependencyOptions } from '@/hooks/use-dependency-options';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useGlobalModalStore } from '../../form/useGlobalModalStore';

export function ParameterVisibilityConfigModal() {
  const { data: modalData, type: modalType, open, closeModal } = useGlobalModalStore();
  const parameterId = modalData?.parameterId;
  const [configuredOptions, setConfiguredOptions] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // TODOS LOS HOOKS DEBEN ESTAR AL PRINCIPIO
  // Obtener dependencias donde este parámetro es hijo
  const { data: dependencies = [], isLoading: dependenciesLoading } = useParameterAsChild(parameterId);
  
  // Obtener información del parámetro hijo (actual)
  const { data: childParameter } = useQuery({
    queryKey: ['parameter-info', parameterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_parameters')
        .select('*')
        .eq('id', parameterId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Obtener opciones del parámetro hijo
  const { data: childOptions = [] } = useQuery({
    queryKey: ['child-parameter-options', parameterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_parameter_options')
        .select('*')
        .eq('parameter_id', parameterId)
        .order('label');
      
      if (error) throw error;
      return data;
    }
  });

  const saveDependencyOptionsMutation = useSaveDependencyOptions();

  // LOGS DE DEBUG DESPUÉS DE TODOS LOS HOOKS
    open,
    modalType,
    parameterId,
    modalData
  });

  // Cargar configuraciones existentes para cada dependencia
  useEffect(() => {
    const loadExistingConfigurations = async () => {
      const configs: Record<string, string[]> = {};
      
      for (const dependency of dependencies) {
        const { data: existingOptions } = await supabase
          .from('task_parameter_dependency_options')
          .select('child_option_id')
          .eq('dependency_id', dependency.id);
        
        configs[dependency.id] = existingOptions?.map(opt => opt.child_option_id) || [];
      }
      
      setConfiguredOptions(configs);
    };

    if (dependencies.length > 0) {
      loadExistingConfigurations();
    }
  }, [dependencies]);

  const handleOptionToggle = (dependencyId: string, optionId: string, checked: boolean) => {
    setConfiguredOptions(prev => {
      const currentOptions = prev[dependencyId] || [];
      const newOptions = checked 
        ? [...currentOptions, optionId]
        : currentOptions.filter(id => id !== optionId);
      
      return {
        ...prev,
        [dependencyId]: newOptions
      };
    });
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    
    try {
      // Guardar configuración para cada dependencia
      for (const dependency of dependencies) {
        const optionIds = configuredOptions[dependency.id] || [];
        await saveDependencyOptionsMutation.mutateAsync({
          dependencyId: dependency.id,
          childOptionIds: optionIds
        });
      }
      
      closeModal();
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  // Contenido del modal (editPanel)
  const getModalContent = () => {
    if (dependenciesLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      );
    }

    if (dependencies.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">Sin dependencias padre</p>
          <p>Este parámetro no tiene parámetros padre conectados, por lo que no se puede configurar visibilidad condicional.</p>
        </div>
      );
    }

    return (
      <ScrollArea className="max-h-[500px]">
        <div className="space-y-8">
          {dependencies.map((dependency, index) => (
            <div key={dependency.id} className="space-y-4">
              {index > 0 && <Separator />}
              
              {/* Encabezado de la dependencia */}
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="font-medium">
                  {dependency.parent_parameter?.label}
                </Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-medium">
                  {dependency.parent_option?.label}
                </Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary" className="font-medium">
                  {childParameter?.label}
                </Badge>
              </div>

              <div className="pl-4 border-l-2 border-muted space-y-3">
                <p className="text-sm text-muted-foreground">
                  Cuando se seleccione <strong>"{dependency.parent_option?.label}"</strong> en <strong>"{dependency.parent_parameter?.label}"</strong>, mostrar estas opciones en <strong>"{childParameter?.label}"</strong>:
                </p>

                {/* Grid de opciones del hijo */}
                <div className="grid grid-cols-2 gap-3">
                  {childOptions.map(option => {
                    const isChecked = (configuredOptions[dependency.id] || []).includes(option.id);
                    
                    return (
                      <div key={option.id} className="flex items-center space-x-2 p-2 rounded border bg-card">
                        <Checkbox
                          id={`${dependency.id}-${option.id}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => 
                            handleOptionToggle(dependency.id, option.id, checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor={`${dependency.id}-${option.id}`}
                          className="text-sm font-medium cursor-pointer flex-1"
                        >
                          {option.label}
                        </Label>
                      </div>
                    );
                  })}
                </div>

                {/* Resumen de opciones seleccionadas */}
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">
                    {(configuredOptions[dependency.id] || []).length} de {childOptions.length} opciones seleccionadas
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };

  const viewPanel = null;

  const editPanel = (
    <div className="space-y-4">
      {getModalContent()}
    </div>
  );

  const headerContent = (
    <FormModalHeader 
      title="Configurar Visibilidad por Opción"
      icon={Settings}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={closeModal}
      rightLabel={isSubmitting ? 'Guardando...' : 'Guardar Configuración'}
      onRightClick={handleSave}
      rightLoading={isSubmitting}
    />
  );

  if (!open || modalType !== 'parameter-visibility-config' || !parameterId) return null;

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={closeModal}
      onSubmit={handleSave}
      isEditing={true}
    />
  );
}