import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Package, Plus, Settings, Edit3, Trash2 } from 'lucide-react';
import { useTaskParametersAdmin } from '@/hooks/use-task-parameters-admin';

export interface TaskTemplate {
  id: string;
  code: string;
  name: string;
  name_template: string;
  category_id: string;
  created_at: string;
}

export interface TaskTemplateParameter {
  id: string;
  template_id: string;
  parameter_id: string;
  option_group_id?: string;
  is_required: boolean;
  position: number;
  created_at: string;
}

interface TaskTemplateEditorModalProps {
  open: boolean;
  onClose: () => void;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
}

export default function TaskTemplateEditorModal({
  open,
  onClose,
  categoryId,
  categoryCode,
  categoryName
}: TaskTemplateEditorModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newParameterId, setNewParameterId] = useState<string>('');

  // Fetch existing template
  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ['task-template', categoryCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_templates')
        .select('id, code, name, name_template, category_id, created_at')
        .eq('code', categoryCode)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return data;
    },
    enabled: open
  });

  // Fetch available parameters
  const { data: availableParameters = [] } = useTaskParametersAdmin();

  // Fetch template parameters
  const { data: templateParameters = [] } = useQuery({
    queryKey: ['task-template-parameters', template?.id],
    queryFn: async () => {
      if (!template?.id) return [];
      
      const { data, error } = await supabase
        .from('task_template_parameters')
        .select('*')
        .eq('template_id', template.id)
        .order('position');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!template?.id
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('task_templates')
        .insert([{
          code: categoryCode,
          name: categoryName,
          name_template: `${categoryName} - {{parametro}}`,
          category_id: categoryId
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-template', categoryCode] });
      toast({
        title: 'Plantilla creada',
        description: 'Plantilla creada exitosamente'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al crear plantilla'
      });
    }
  });

  // Add parameter mutation
  const addParameterMutation = useMutation({
    mutationFn: async () => {
      if (!template?.id || !newParameterId) throw new Error('Datos faltantes');
      
      const { data, error } = await supabase
        .from('task_template_parameters')
        .insert([{
          template_id: template.id,
          parameter_id: newParameterId,
          is_required: false,
          position: templateParameters.length
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-template-parameters', template?.id] });
      setNewParameterId('');
      toast({
        title: 'Parámetro agregado',
        description: 'Parámetro agregado a la plantilla exitosamente'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al agregar parámetro'
      });
    }
  });

  // Delete parameter mutation
  const deleteParameterMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_template_parameters')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-template-parameters', template?.id] });
      toast({
        title: 'Parámetro eliminado',
        description: 'Parámetro eliminado de la plantilla'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al eliminar parámetro'
      });
    }
  });

  const handleCreateTemplate = () => {
    createTemplateMutation.mutate();
  };

  const handleAddParameter = () => {
    if (!newParameterId) return;
    addParameterMutation.mutate();
  };

  const handleDeleteParameter = (id: string) => {
    deleteParameterMutation.mutate(id);
  };

  if (!open) return null;

  return (
    <CustomModalLayout open={open} onClose={onClose} className="md:max-w-4xl">
      <CustomModalHeader
        title={`Editor de Plantilla - ${categoryCode}`}
        subtitle={`${categoryName} • Gestionar parámetros de la plantilla`}
        onClose={onClose}
      />
      
      <CustomModalBody columns={1} className="space-y-6">
        {/* Estado de la Plantilla */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Estado de la Plantilla</h3>
          </div>
          
          <div className="rounded-lg border bg-card p-4">
            {templateLoading ? (
              <div className="text-sm text-muted-foreground">Cargando plantilla...</div>
            ) : template ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="default">Plantilla Existente</Badge>
                  <span className="text-sm">
                    {template.name}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Creada: {new Date(template.created_at).toLocaleDateString()}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">Sin Plantilla</Badge>
                  <span className="text-sm text-muted-foreground">
                    No existe plantilla para esta categoría
                  </span>
                </div>
                <Button 
                  onClick={handleCreateTemplate}
                  disabled={createTemplateMutation.isPending}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Plantilla
                </Button>
              </div>
            )}
          </div>
        </div>

        {template && (
          <>
            <Separator />
            
            {/* Agregar Parámetro */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Agregar Parámetro</h3>
              </div>
              
              <div className="rounded-lg border bg-card p-4">
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label>Parámetro</Label>
                    <Select value={newParameterId} onValueChange={setNewParameterId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar parámetro" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableParameters
                          .filter(p => !templateParameters.some(tp => tp.parameter_id === p.id))
                          .map((parameter) => (
                            <SelectItem key={parameter.id} value={parameter.id}>
                              {parameter.name} ({parameter.type})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    onClick={handleAddParameter}
                    disabled={!newParameterId || addParameterMutation.isPending}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Lista de Parámetros */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Parámetros de la Plantilla</h3>
              </div>
              
              <div className="space-y-3">
                {templateParameters.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay parámetros configurados
                  </div>
                ) : (
                  templateParameters.map((templateParam) => {
                    const parameter = availableParameters.find(p => p.id === templateParam.parameter_id);
                    return (
                      <div key={templateParam.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{parameter?.type}</Badge>
                          <span className="font-medium">{parameter?.name}</span>
                          {templateParam.is_required && (
                            <Badge variant="destructive" className="text-xs">Requerido</Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteParameter(templateParam.id)}
                          disabled={deleteParameterMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </CustomModalBody>
      
      <CustomModalFooter onClose={onClose}>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={onClose}>
          Guardar
        </Button>
      </CustomModalFooter>
    </CustomModalLayout>
  );
}