import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, Eye, Package, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';

import { useCreateTaskParameter, useUpdateTaskParameter, TaskParameter } from '@/hooks/use-task-parameters-admin';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Schema for form validation
const taskParameterSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  label: z.string().min(1, 'La etiqueta es requerida'),
  type: z.enum(['text', 'number', 'select', 'boolean'], { 
    required_error: 'El tipo es requerido' 
  }),
  required: z.boolean(),
});

type TaskParameterFormData = z.infer<typeof taskParameterSchema>;

// Interfaces for option groups and values
interface TaskParameterValue {
  id: string;
  parameter_id: string;
  value: string;
  created_at: string;
}

interface TaskParameterOptionGroup {
  id: string;
  parameter_id: string;
  name: string;
  created_at: string;
  items_count?: number;
}

interface TaskParameterOptionGroupItem {
  id: string;
  option_group_id: string;
  parameter_value_id: string;
  created_at: string;
}

interface TaskParameterEditorModalProps {
  open: boolean;
  onClose: () => void;
  parameter?: TaskParameter;
}

export function TaskParameterEditorModal({ 
  open, 
  onClose, 
  parameter
}: TaskParameterEditorModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newOptionValue, setNewOptionValue] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [editingValue, setEditingValue] = useState<TaskParameterValue | null>(null);
  const [editingGroup, setEditingGroup] = useState<TaskParameterOptionGroup | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'value' | 'group'; id: string } | null>(null);
  const [showGroupItemsModal, setShowGroupItemsModal] = useState(false);
  const [selectedGroupForItems, setSelectedGroupForItems] = useState<TaskParameterOptionGroup | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const createMutation = useCreateTaskParameter();
  const updateMutation = useUpdateTaskParameter();
  
  
  const form = useForm<TaskParameterFormData>({
    resolver: zodResolver(taskParameterSchema),
    defaultValues: {
      name: '',
      label: '',
      type: 'text',
      required: false,
    },
  });

  const parameterType = form.watch('type');

  // Load parameter values
  const { data: parameterValues = [], isLoading: valuesLoading } = useQuery({
    queryKey: ['task-parameter-values', parameter?.id],
    queryFn: async () => {
      if (!parameter?.id) return [];
      
      const { data, error } = await supabase
        .from('task_parameter_values')
        .select('*')
        .eq('parameter_id', parameter.id)
        .order('value');
      
      if (error) throw error;
      return data as TaskParameterValue[];
    },
    enabled: !!parameter?.id,
  });

  // Load option groups
  const { data: optionGroups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['task-parameter-values', parameter?.id],
    queryFn: async () => {
      if (!parameter?.id) return [];
      
      const { data, error } = await supabase
        .from('task_parameter_option_groups')
        .select(`
          id,
          parameter_id,
          name,
          created_at
        `)
        .eq('parameter_id', parameter.id)
        .order('name');
      
      if (error) throw error;
      
      // Get item counts for each group
      const groupsWithCounts = await Promise.all(
        data.map(async (group) => {
          const { count } = await supabase
            .from('task_parameter_option_group_items')
            .select('*', { count: 'exact', head: true })
            .eq('option_group_id', group.id);
          
          return {
            ...group,
            items_count: count || 0
          };
        })
      );
      
      return groupsWithCounts as TaskParameterOptionGroup[];
    },
    enabled: !!parameter?.id,
  });

  // Mutations for parameter values
  const createValueMutation = useMutation({
    mutationFn: async (value: string) => {
      if (!parameter?.id) throw new Error('Parameter ID is required');
      
      const { data, error } = await supabase
        .from('task_parameter_values')
        .insert({
          parameter_id: parameter.id,
          value: value.trim(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      setNewOptionValue('');
      toast({
        title: 'Opción agregada',
        description: 'La opción se agregó correctamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo agregar la opción.',
        variant: 'destructive',
      });
    },
  });

  const updateValueMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) => {
      const { data, error } = await supabase
        .from('task_parameter_values')
        .update({ value: value.trim() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      setEditingValue(null);
      toast({
        title: 'Opción actualizada',
        description: 'La opción se actualizó correctamente.',
      });
    },
  });

  const deleteValueMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_parameter_values')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      toast({
        title: 'Opción eliminada',
        description: 'La opción se eliminó correctamente.',
      });
    },
  });

  // Mutations for option groups
  const createGroupMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!parameter?.id) throw new Error('Parameter ID is required');
      
      const { data, error } = await supabase
        .from('task_parameter_option_groups')
        .insert({
          parameter_id: parameter.id,
          name: name.trim(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin-clean'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      queryClient.refetchQueries({ queryKey: ['task-parameters-admin-clean'] });
      setNewGroupName('');
      setShowNewGroupModal(false);
      toast({
        title: 'Grupo creado',
        description: 'El grupo se creó correctamente.',
      });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from('task_parameter_option_groups')
        .update({ name: name.trim() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin-clean'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      queryClient.refetchQueries({ queryKey: ['task-parameters-admin-clean'] });
      setEditingGroup(null);
      toast({
        title: 'Grupo actualizado',
        description: 'El grupo se actualizó correctamente.',
      });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      // First delete all group items
      await supabase
        .from('task_parameter_option_group_items')
        .delete()
        .eq('option_group_id', id);
      
      // Then delete the group
      const { error } = await supabase
        .from('task_parameter_option_groups')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin-clean'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      queryClient.refetchQueries({ queryKey: ['task-parameters-admin-clean'] });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      toast({
        title: 'Grupo eliminado',
        description: 'El grupo y sus elementos se eliminaron correctamente.',
      });
    },
  });

  // Reset form when modal opens/closes or parameter changes
  useEffect(() => {
    if (parameter && open) {
      form.reset({
        name: parameter.name,
        label: parameter.label,
        type: parameter.type,
        required: parameter.required,
      });
    } else if (!parameter && open) {
      form.reset({
        name: '',
        label: '',
        type: 'text',
        required: false,
      });
    }
  }, [parameter, open, form]);

  const onSubmit = async (data: TaskParameterFormData) => {
    setIsSubmitting(true);
    
    try {
      const submitData = {
        ...data,
      };

      if (parameter) {
        // Update existing parameter
        await updateMutation.mutateAsync({
          id: parameter.id,
          ...submitData,
        });
        toast({
          title: 'Parámetro actualizado',
          description: 'El parámetro se actualizó correctamente.',
        });
      } else {
        // Create new parameter
        await createMutation.mutateAsync(submitData);
        toast({
          title: 'Parámetro creado',
          description: 'El parámetro se creó correctamente.',
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving parameter:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el parámetro.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setNewOptionValue('');
    setNewGroupName('');
    setEditingValue(null);
    setEditingGroup(null);
    setShowNewGroupModal(false);
    setShowGroupItemsModal(false);
    setSelectedGroupForItems(null);
    onClose();
  };



  const handleAddOption = () => {
    if (!newOptionValue.trim()) return;
    createValueMutation.mutate(newOptionValue);
  };

  const handleEditValue = (value: TaskParameterValue) => {
    setEditingValue(value);
  };

  const handleSaveEditValue = () => {
    if (!editingValue || !editingValue.value.trim()) return;
    updateValueMutation.mutate({
      id: editingValue.id,
      value: editingValue.value
    });
  };

  const handleDeleteValue = (id: string) => {
    setDeleteTarget({ type: 'value', id });
    setDeleteDialogOpen(true);
  };

  const handleDeleteGroup = (id: string) => {
    setDeleteTarget({ type: 'group', id });
    setDeleteDialogOpen(true);
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    createGroupMutation.mutate(newGroupName);
  };

  const handleEditGroup = (group: TaskParameterOptionGroup) => {
    setEditingGroup(group);
  };

  const handleSaveEditGroup = () => {
    if (!editingGroup || !editingGroup.name.trim()) return;
    updateGroupMutation.mutate({
      id: editingGroup.id,
      name: editingGroup.name
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    
    if (deleteTarget.type === 'value') {
      deleteValueMutation.mutate(deleteTarget.id);
    } else {
      deleteGroupMutation.mutate(deleteTarget.id);
    }
  };

  if (!open) return null;

  return (
    <CustomModalLayout 
      open={open} 
      onClose={handleClose}
      className="md:max-w-4xl"
    >
      {{
        header: (
          <CustomModalHeader
            title={parameter ? `Editar Parámetro - ${parameter.name}` : 'Nuevo Parámetro de Tarea'}
            subtitle={parameter ? 'Modificar configuración del parámetro y gestionar opciones' : 'Crear un nuevo parámetro para las plantillas de tareas'}
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody columns={1}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Main Parameter Fields */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Settings className="h-5 w-5" />
                      Configuración del Parámetro
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: tipo_material" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="label"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Etiqueta *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: Tipo de Material" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="text">Texto</SelectItem>
                                <SelectItem value="number">Número</SelectItem>
                                <SelectItem value="select">Selección</SelectItem>
                                <SelectItem value="boolean">Booleano</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rol Semántico *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar rol" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="material">Material</SelectItem>
                                <SelectItem value="ubicacion">Ubicación</SelectItem>
                                <SelectItem value="espesor">Espesor</SelectItem>
                                <SelectItem value="terminacion">Terminación</SelectItem>
                                <SelectItem value="uso">Uso</SelectItem>
                                <SelectItem value="otro">Otro</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                        control={form.control}
                        name="required"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Campo Obligatorio</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Este parámetro será requerido en las tareas
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                  </CardContent>
                </Card>

                {/* Only show select options section if type is select */}
                {parameterType === 'select' && parameter?.id && (
                  <>
                    <Separator />
                    
                    {/* Option Groups Section */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Package className="h-5 w-5" />
                            Grupos de Opciones
                          </CardTitle>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowNewGroupModal(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Nuevo Grupo
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {groupsLoading ? (
                          <div className="text-sm text-muted-foreground">Cargando grupos...</div>
                        ) : optionGroups.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground">
                            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No hay grupos de opciones</p>
                            <p className="text-xs">Crea un grupo para organizar las opciones</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {optionGroups.map((group) => (
                              <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                  {editingGroup?.id === group.id ? (
                                    <Input
                                      value={editingGroup.name}
                                      onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                                      className="w-48"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveEditGroup();
                                        if (e.key === 'Escape') setEditingGroup(null);
                                      }}
                                      autoFocus
                                    />
                                  ) : (
                                    <span className="font-medium">{group.name}</span>
                                  )}
                                  <Badge variant="secondary">
                                    {group.items_count} opciones
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  {editingGroup?.id === group.id ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={handleSaveEditGroup}
                                      disabled={updateGroupMutation.isPending}
                                    >
                                      Guardar
                                    </Button>
                                  ) : (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditGroup(group)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedGroupForItems(group);
                                          setShowGroupItemsModal(true);
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteGroup(group.id)}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Separator />

                    {/* General Options Section */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Settings className="h-5 w-5" />
                            Opciones Generales
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Nueva opción"
                              value={newOptionValue}
                              onChange={(e) => setNewOptionValue(e.target.value)}
                              className="w-40"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddOption();
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleAddOption}
                              disabled={!newOptionValue.trim() || createValueMutation.isPending}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Agregar
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {valuesLoading ? (
                          <div className="text-sm text-muted-foreground">Cargando opciones...</div>
                        ) : parameterValues.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground">
                            <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No hay opciones disponibles</p>
                            <p className="text-xs">Agrega opciones para este parámetro</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {parameterValues.map((value) => (
                              <div key={value.id} className="flex items-center justify-between p-2 border rounded-lg">
                                {editingValue?.id === value.id ? (
                                  <Input
                                    value={editingValue.value}
                                    onChange={(e) => setEditingValue({ ...editingValue, value: e.target.value })}
                                    className="flex-1 mr-2"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveEditValue();
                                      if (e.key === 'Escape') setEditingValue(null);
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  <span className="flex-1">{value.value}</span>
                                )}
                                <div className="flex items-center gap-2">
                                  {editingValue?.id === value.id ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={handleSaveEditValue}
                                      disabled={updateValueMutation.isPending}
                                    >
                                      Guardar
                                    </Button>
                                  ) : (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditValue(value)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteValue(value.id)}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </form>
            </Form>

            {/* New Group Modal */}
            {showNewGroupModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle>Nuevo Grupo de Opciones</CardTitle>
                    <CardDescription>
                      Crea un grupo para organizar las opciones del parámetro
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Nombre del Grupo</Label>
                      <Input
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="Ej: Materiales Básicos"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateGroup();
                          if (e.key === 'Escape') setShowNewGroupModal(false);
                        }}
                        autoFocus
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowNewGroupModal(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleCreateGroup}
                        disabled={!newGroupName.trim() || createGroupMutation.isPending}
                      >
                        Crear Grupo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {deleteTarget?.type === 'value' ? 'Eliminar Opción' : 'Eliminar Grupo'}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {deleteTarget?.type === 'value' 
                      ? 'Esta acción eliminará la opción permanentemente. ¿Estás seguro?'
                      : 'Esta acción eliminará el grupo y todas sus asociaciones permanentemente. ¿Estás seguro?'
                    }
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={confirmDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CustomModalBody>
        ),
        footer: (
          <div className="flex justify-end gap-3 p-6 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : parameter ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        )
      }}
    </CustomModalLayout>
  );
}