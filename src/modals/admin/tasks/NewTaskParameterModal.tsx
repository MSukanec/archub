import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, Eye, Settings, Package, Pencil, CheckSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import { CustomModalLayout } from '@/components/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/modal/CustomModalFooter';
import { useToast } from '@/hooks/use-toast';

import { useCreateTaskParameter, useUpdateTaskParameter, TaskParameter, useTaskParameterOptionGroups, useCreateTaskParameterOptionGroup, useDeleteTaskParameterOptionGroup, useUpdateTaskParameterOptionGroup, useTaskGroups } from '@/hooks/use-task-parameters-admin';
import { TaskParameterGroupAssignmentModal } from './NewTaskParameterGroupAssignmentModal';
import { useUnits } from '@/hooks/use-units';

const taskParameterSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  label: z.string().min(1, 'La etiqueta es requerida'),
  type: z.enum(['text', 'number', 'select', 'boolean'], { 
    required_error: 'El tipo es requerido' 
  }),
  expression_template: z.string().optional(),
});

type TaskParameterFormData = z.infer<typeof taskParameterSchema>;

interface NewTaskParameterModalProps {
  open: boolean;
  onClose: () => void;
  parameter?: TaskParameter;
  onParameterCreated?: (parameterId: string) => void;
}

export function NewTaskParameterModal({ 
  open, 
  onClose, 
  parameter,
  onParameterCreated
}: NewTaskParameterModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [selectedTaskGroupId, setSelectedTaskGroupId] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  
  const { toast } = useToast();
  
  const createMutation = useCreateTaskParameter();
  const updateMutation = useUpdateTaskParameter();
  const createGroupMutation = useCreateTaskParameterOptionGroup();
  const deleteGroupMutation = useDeleteTaskParameterOptionGroup();
  const updateGroupMutation = useUpdateTaskParameterOptionGroup();
  
  // Load units for the selector
  const { data: units, isLoading: unitsLoading } = useUnits();
  
  // Load option groups for this parameter
  const parameterId = parameter?.parameter_id || '';
  console.log('Loading groups for parameter:', { parameter, parameterId });
  const { data: optionGroups, isLoading: isLoadingGroups } = useTaskParameterOptionGroups(parameterId);
  
  // Load task groups for group creation
  const { data: taskGroups = [], isLoading: taskGroupsLoading } = useTaskGroups();
  
  const form = useForm<TaskParameterFormData>({
    resolver: zodResolver(taskParameterSchema),
    defaultValues: {
      name: '',
      label: '',
      type: 'text',
      expression_template: '',
    },
  });

  // Functions for inline group creation
  const handleCreateGroup = async () => {
    if (!selectedTaskGroupId || !parameter?.parameter_id) return;
    
    const selectedTaskGroup = taskGroups.find(group => group.id === selectedTaskGroupId);
    if (!selectedTaskGroup) return;
    
    // Check if group already exists for this task group
    const existingGroup = optionGroups?.find(group => group.task_group_id === selectedTaskGroupId);
    if (existingGroup) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ya existe un grupo para este tipo de tarea'
      });
      return;
    }
    
    setIsCreatingGroup(true);
    try {
      await createGroupMutation.mutateAsync({
        parameter_id: parameter.parameter_id,
        name: selectedTaskGroup.name,
        task_group_id: selectedTaskGroup.id,
      });
      setSelectedTaskGroupId('');
      toast({
        title: 'Éxito',
        description: 'Grupo creado correctamente'
      });
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al crear el grupo'
      });
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await deleteGroupMutation.mutateAsync(groupId);
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const handleEditGroup = (group: any) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.task_group_id || '');
  };

  const handleSaveGroupEdit = async () => {
    if (!editingGroupId || !editingGroupName) return;
    
    const selectedTaskGroup = taskGroups.find(group => group.id === editingGroupName);
    if (!selectedTaskGroup) return;
    
    try {
      await updateGroupMutation.mutateAsync({
        id: editingGroupId,
        name: selectedTaskGroup.name,
        task_group_id: selectedTaskGroup.id,
      });
      setEditingGroupId(null);
      setEditingGroupName('');
    } catch (error) {
      console.error('Error updating group:', error);
    }
  };

  const handleCancelGroupEdit = () => {
    setEditingGroupId(null);
    setEditingGroupName('');
  };

  // Reset form when modal opens/closes or parameter changes
  useEffect(() => {
    if (parameter && open) {
      form.reset({
        name: parameter.name,
        label: parameter.label,
        type: parameter.type,
        role: parameter.role || '',
        expression_template: parameter.expression_template || '',
        is_required: parameter.is_required,
      });
    } else if (!parameter && open) {
      form.reset({
        name: '',
        label: '',
        type: 'text',
        role: '',
        expression_template: '',
        is_required: false,
      });
    }
  }, [parameter, open, form]);

  const onSubmit = async (data: TaskParameterFormData) => {
    setIsSubmitting(true);
    
    try {
      const submitData = {
        ...data,
        role: data.role?.trim() || undefined,
        expression_template: data.expression_template?.trim() || undefined,
      };

      if (parameter) {
        await updateMutation.mutateAsync({
          id: parameter.id,
          ...submitData,
        });
      } else {
        const newParameter = await createMutation.mutateAsync(submitData);
        if (onParameterCreated && newParameter?.id) {
          onParameterCreated(newParameter.id);
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Error submitting parameter:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <>
      <CustomModalLayout open={open} onClose={handleClose}>
        {{
          header: (
            <CustomModalHeader
              title={parameter ? 'Editar Parámetro' : 'Nuevo Parámetro'}
              description={parameter ? 'Modifica los datos del parámetro' : 'Crea un nuevo parámetro de plantilla'}
              onClose={handleClose}
            />
          ),
          body: (
            <CustomModalBody columns={1}>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="parameter-form">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="label"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="required-asterisk">Etiqueta (Visible)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Ej: Ladrillos y Bloques"
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="required-asterisk">Nombre (Clave)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Ej: brick-type"
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="required-asterisk">Tipo</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isSubmitting}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="z-[9999]">
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
                      name="expression_template"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plantilla de frase</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="de {value}"
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          {field.value && !field.value.includes('{value}') && (
                            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                              ⚠️ La plantilla debería incluir {'{value}'} como placeholder
                            </div>
                          )}
                          {field.value && field.value.includes('{value}') && (
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">Frase resultante:</span> {field.value.replace('{value}', 'Ladrillo hueco')}
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />


                    {/* Grupos de Opciones - Siempre visible si es tipo select */}
                    {form.watch('type') === 'select' && (
                      <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center gap-2 mb-4">
                          <Package className="w-4 h-4" />
                          <span className="text-sm font-medium">Grupos de Opciones</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Grupos existentes</h4>
                        </div>
                            
                        {/* Inline group creation */}
                        {parameter && (
                          <div className="flex gap-2">
                            <Select value={selectedTaskGroupId} onValueChange={setSelectedTaskGroupId}>
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Seleccionar tipo de tarea..." />
                              </SelectTrigger>
                              <SelectContent>
                                {taskGroupsLoading ? (
                                  <SelectItem value="loading" disabled>Cargando...</SelectItem>
                                ) : taskGroups.length > 0 ? (
                                  taskGroups
                                    .filter(taskGroup => !optionGroups?.some(group => group.task_group_id === taskGroup.id))
                                    .map((taskGroup) => (
                                      <SelectItem key={taskGroup.id} value={taskGroup.id}>
                                        {taskGroup.name}
                                      </SelectItem>
                                    ))
                                ) : (
                                  <SelectItem value="empty" disabled>No hay tipos de tarea disponibles</SelectItem>
                                )}
                                {taskGroups.length > 0 && taskGroups.filter(taskGroup => !optionGroups?.some(group => group.task_group_id === taskGroup.id)).length === 0 && (
                                  <SelectItem value="no-available" disabled>Todos los tipos de tarea ya tienen grupos</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleCreateGroup}
                              disabled={!selectedTaskGroupId || isCreatingGroup}
                              className="h-10"
                            >
                              {isCreatingGroup ? (
                                'Creando...'
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-1" />
                                  Crear
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                            
                        <div className="space-y-2">
                          {/* Grupos reales desde la base de datos */}
                          {isLoadingGroups ? (
                            <div className="text-sm text-muted-foreground text-center py-4">
                              Cargando grupos...
                            </div>
                          ) : optionGroups && optionGroups.length > 0 ? (
                            optionGroups.map((group) => (
                              <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex-1">
                                  {editingGroupId === group.id ? (
                                    <div className="flex gap-2">
                                      <Select value={editingGroupName} onValueChange={setEditingGroupName}>
                                        <SelectTrigger className="text-sm flex-1">
                                          <SelectValue placeholder="Seleccionar tipo de tarea..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {taskGroups.map((taskGroup) => (
                                            <SelectItem key={taskGroup.id} value={taskGroup.id}>
                                              {taskGroup.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleSaveGroupEdit}
                                        disabled={!editingGroupName}
                                      >
                                        ✓
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleCancelGroupEdit}
                                      >
                                        ✕
                                      </Button>
                                    </div>
                                  ) : (
                                    <div>
                                      <p className="text-sm font-medium">{group.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {group.task_group_id ? 
                                          taskGroups.find(tg => tg.id === group.task_group_id)?.name || 
                                          'Tipo de tarea no encontrado' 
                                          : 'Sin tipo de tarea asignado'
                                        }
                                      </p>
                                    </div>
                                  )}
                                </div>
                                {editingGroupId !== group.id && (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setSelectedGroup(group);
                                        setIsAssignmentModalOpen(true);
                                      }}
                                      className="h-7 w-7 p-0"
                                    >
                                      <CheckSquare className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditGroup(group)}
                                      className="h-7 w-7 p-0"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteGroup(group.id)}
                                      className="h-7 w-7 p-0"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : parameter ? (
                            <div className="text-sm text-muted-foreground text-center py-4">
                              No hay grupos de opciones configurados para este parámetro.
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground text-center py-4">
                              Los grupos se mostrarán después de crear el parámetro.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              </Form>
            </CustomModalBody>
          ),
          footer: (
            <div className="p-2 border-t border-[var(--card-border)] mt-auto">
              <div className="flex gap-2 w-full">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  className="w-1/4"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  form="parameter-form"
                  className="w-3/4"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Guardando...' : (parameter ? "Actualizar" : "Guardar")}
                </Button>
              </div>
            </div>
          ),
        }}
      </CustomModalLayout>



      {/* Modal de asignación de opciones a grupos */}
      {selectedGroup && (
        <TaskParameterGroupAssignmentModal
          open={isAssignmentModalOpen}
          onClose={() => {
            setIsAssignmentModalOpen(false);
            setSelectedGroup(null);
          }}
          group={selectedGroup}
          parameterLabel={parameter?.label || form.watch('label') || 'Nuevo parámetro'}
        />
      )}
    </>
  );
}