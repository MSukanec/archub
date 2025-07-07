import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';
import { TaskTemplate, TaskTemplateParameter, TaskParameter } from '@shared/schema';

interface TaskTemplateEditorModalProps {
  open: boolean;
  onClose: () => void;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
}

interface TaskTemplateParameterWithParameter extends TaskTemplateParameter {
  parameter: TaskParameter;
}

interface TaskParameterOptionGroup {
  id: string;
  parameter_id: string;
  name: string;
}

export default function TaskTemplateEditorModal({
  open,
  onClose,
  categoryId,
  categoryCode,
  categoryName
}: TaskTemplateEditorModalProps) {
  const [newParameterId, setNewParameterId] = useState('');
  const [newOptionGroupId, setNewOptionGroupId] = useState('');
  const queryClient = useQueryClient();

  // Check if template exists
  const { data: template, isLoading: templateLoading } = useQuery<TaskTemplate | null>({
    queryKey: ['task-template', categoryCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .eq('code_prefix', categoryCode)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: open
  });

  // Fetch all available parameters
  const { data: availableParameters = [] } = useQuery({
    queryKey: ['task-parameters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_parameters')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: open
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('task_templates')
        .insert({
          code_prefix: categoryCode,
          name: `Plantilla de ${categoryName}`,
          name_template: `Ejecución de ${categoryName} {{material}} {{dimension}}`,
          category_id: categoryId
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-template', categoryCode] });
      toast({
        title: 'Plantilla creada',
        description: `Plantilla ${categoryCode} creada exitosamente`
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al crear la plantilla'
      });
    }
  });

  if (!open) return null;

  return (
    <CustomModalLayout open={open} onClose={onClose} className="md:max-w-4xl">
      {{
        header: (
          <CustomModalHeader
            title={`Editor de Plantilla - ${categoryCode}`}
            subtitle={`${categoryName} • Gestionar parámetros de la plantilla`}
            onClose={onClose}
          />
        ),
        body: (
          <CustomModalBody columns={1}>
            <div className="space-y-6">
              {/* Paso 1: Crear Plantilla */}
              {!template && !templateLoading && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="text-center space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">Paso 1: Crear Plantilla</h3>
                      <p className="text-sm text-muted-foreground">
                        Primero debes crear la plantilla básica para {categoryName}
                      </p>
                    </div>
                    <Button 
                      onClick={() => createTemplateMutation.mutate()}
                      disabled={createTemplateMutation.isPending}
                      size="lg"
                      className="w-full max-w-sm"
                    >
                      {createTemplateMutation.isPending ? "Creando..." : "CREAR PLANTILLA"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Loading state */}
              {templateLoading && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Cargando plantilla...</p>
                </div>
              )}

              {/* Paso 2: Gestión de Parámetros (solo si la plantilla existe) */}
              {template && (
                <div className="space-y-4">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-3">Paso 2: Agregar Parámetros</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Parámetro</Label>
                        <Select value={newParameterId} onValueChange={setNewParameterId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar parámetro" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableParameters.map((parameter) => (
                              <SelectItem key={parameter.id} value={parameter.id}>
                                {parameter.label || parameter.name} ({parameter.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-end">
                        <Button 
                          onClick={() => {
                            // Add parameter logic here
                            toast({
                              title: 'Función pendiente',
                              description: 'La funcionalidad de agregar parámetros estará disponible próximamente'
                            });
                          }}
                          disabled={!newParameterId}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Preview de la plantilla */}
                  <div className="bg-muted/30 rounded-lg border p-4">
                    <Label className="text-sm font-medium mb-2 block">
                      Vista previa de la plantilla:
                    </Label>
                    <div className="text-sm bg-background p-3 rounded border">
                      <span className="font-medium">
                        {template.name_template}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>• Los valores entre llaves ({`{{valor}}`}) serán reemplazados por parámetros reales</p>
                      <p>• Esta es la estructura base que se usará para generar nombres de tareas</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter 
            onCancel={onClose}
            onSave={onClose}
            cancelText="Cancelar"
            saveText="Cerrar"
          />
        )
      }}
    </CustomModalLayout>
  );
}