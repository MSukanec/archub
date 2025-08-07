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
  console.log('🔧 ParameterVisibilityConfigModal render:', {
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
      console.error('Error saving configurations:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Contenido del modal (editPanel)
  const getModalContent = () => {
    if (dependenciesLoading) {
      return (
        </div>
      );
    }

    if (dependencies.length === 0) {
      return (
          <p>Este parámetro no tiene parámetros padre conectados, por lo que no se puede configurar visibilidad condicional.</p>
        </div>
      );
    }

    return (
          {dependencies.map((dependency, index) => (
              {index > 0 && <Separator />}
              
              {/* Encabezado de la dependencia */}
                  {dependency.parent_parameter?.label}
                </Badge>
                  {dependency.parent_option?.label}
                </Badge>
                  {childParameter?.label}
                </Badge>
              </div>

                  Cuando se seleccione <strong>"{dependency.parent_option?.label}"</strong> en <strong>"{dependency.parent_parameter?.label}"</strong>, mostrar estas opciones en <strong>"{childParameter?.label}"</strong>:
                </p>

                {/* Grid de opciones del hijo */}
                  {childOptions.map(option => {
                    const isChecked = (configuredOptions[dependency.id] || []).includes(option.id);
                    
                    return (
                        <Checkbox
                          id={`${dependency.id}-${option.id}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => 
                            handleOptionToggle(dependency.id, option.id, checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor={`${dependency.id}-${option.id}`}
                        >
                          {option.label}
                        </Label>
                      </div>
                    );
                  })}
                </div>

                {/* Resumen de opciones seleccionadas */}
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
      {getModalContent()}
    </div>
  );

  const headerContent = (
    <FormModalHeader 
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