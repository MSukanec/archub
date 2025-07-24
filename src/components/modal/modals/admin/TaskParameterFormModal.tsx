import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, Eye, Settings, Package, Pencil, CheckSquare, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import { FormModalLayout } from '@/components/modal/form/FormModalLayout';
import { FormModalHeader } from '@/components/modal/form/FormModalHeader';
import { FormModalFooter } from '@/components/modal/form/FormModalFooter';
import { useToast } from '@/hooks/use-toast';

import { useCreateTaskParameter, useUpdateTaskParameter, TaskParameter, useTaskParameterOptionGroups, useCreateTaskParameterOptionGroup, useDeleteTaskParameterOptionGroup, useUpdateTaskParameterOptionGroup, useTaskGroups } from '@/hooks/use-task-parameters-admin';
import { TaskParameterGroupAssignmentModal } from '@/modals/admin/tasks/NewTaskParameterGroupAssignmentModal';
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

interface TaskParameterFormModalProps {
  modalData?: {
    parameter?: TaskParameter;
    onParameterCreated?: (parameterId: string) => void;
  };
  onClose: () => void;
}

export function TaskParameterFormModal({ modalData, onClose }: TaskParameterFormModalProps) {
  const { parameter, onParameterCreated } = modalData || {};
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [selectedTaskGroupId, setSelectedTaskGroupId] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  
  const { toast } = useToast();
  
  const createMutation = useCreateTaskParameter();
  const updateMutation = useUpdateTaskParameter();
  const createGroupMutation = useCreateTaskParameterOptionGroup();
  const deleteGroupMutation = useDeleteTaskParameterOptionGroup();
  // Removed updateGroupMutation as group editing is no longer allowed
  
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

  // Load parameter data when editing
  useEffect(() => {
    if (parameter) {
      form.reset({
        name: parameter.name || '',
        label: parameter.label || '',
        type: parameter.type as any || 'text',
        expression_template: parameter.expression_template || '',
      });
    }
  }, [parameter, form]);

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

  // Removed group editing functions as requested - groups only have check and delete buttons

  // Submit function
  const handleSubmit = async (data: TaskParameterFormData) => {
    console.log('Creating parameter with data:', data);
    setIsSubmitting(true);
    
    try {
      let result;
      if (parameter) {
        // Update existing parameter
        result = await updateMutation.mutateAsync({
          id: parameter.parameter_id,
          ...data
        });
      } else {
        // Create new parameter
        result = await createMutation.mutateAsync(data);
      }
      
      console.log('Parameter created with ID:', result.id);
      
      toast({
        title: parameter ? 'Parámetro actualizado' : 'Parámetro creado',
        description: parameter ? 'El parámetro se ha actualizado correctamente' : 'El parámetro se ha creado correctamente'
      });

      if (onParameterCreated && result.id) {
        onParameterCreated(result.id);
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al procesar la solicitud'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewPanel = null; // No view mode needed for this modal

  const editPanel = (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Label Field */}
          <FormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre (visible) *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ej: Ladrillos y Bloques" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Name Field */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ej: brick-type" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Type Field */}
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

          {/* Expression Template Field */}
          <FormField
            control={form.control}
            name="expression_template"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plantilla de frase</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input 
                      placeholder="de {value}" 
                      {...field} 
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const currentValue = field.value || '';
                      const cursorPosition = (document.activeElement as HTMLInputElement)?.selectionStart || currentValue.length;
                      const newValue = currentValue.slice(0, cursorPosition) + '{value}' + currentValue.slice(cursorPosition);
                      field.onChange(newValue);
                    }}
                  >
                    Insertar {'{value}'}
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Usa <code className="bg-muted px-1 py-0.5 rounded text-xs">{'{value}'}</code> donde quieres que aparezca el valor seleccionado. Ejemplo: "de <code className="bg-muted px-1 py-0.5 rounded text-xs">{'{value}'}</code>"
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      {/* Option Groups Section - Only show for existing parameters */}
      {parameter && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Grupos de Opciones</h3>
          </div>

          {/* Create new group section */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <h4 className="font-medium">Crear nuevo grupo</h4>
                <div className="flex gap-2">
                  <Select value={selectedTaskGroupId} onValueChange={setSelectedTaskGroupId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleccionar tipo de tarea" />
                    </SelectTrigger>
                    <SelectContent>
                      {taskGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleCreateGroup}
                    disabled={!selectedTaskGroupId || isCreatingGroup}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Crear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Existing groups */}
          {isLoadingGroups ? (
            <div className="text-center py-4 text-muted-foreground">
              Cargando grupos...
            </div>
          ) : optionGroups && optionGroups.length > 0 ? (
            <div className="space-y-2">
              {optionGroups.map((group) => (
                <Card key={group.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{group.name}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedGroup(group);
                            setIsAssignmentModalOpen(true);
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGroup(group.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay grupos creados para este parámetro
            </div>
          )}
        </div>
      )}

      {/* Assignment Modal */}
      {isAssignmentModalOpen && selectedGroup && (
        <TaskParameterGroupAssignmentModal
          open={isAssignmentModalOpen}
          onClose={() => {
            setIsAssignmentModalOpen(false);
            setSelectedGroup(null);
          }}
          group={selectedGroup}
          parameterLabel={parameter?.label || ''}
        />
      )}
    </div>
  );

  const headerContent = (
    <FormModalHeader 
      title={parameter ? "Editar Parámetro" : "Nuevo Parámetro"}
      description="Crea un nuevo parámetro de plantilla"
      icon={Settings}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={parameter ? "Actualizar" : "Guardar"}
      onRightClick={form.handleSubmit(handleSubmit)}
      rightLoading={isSubmitting}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      isEditing={true}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
    />
  );
}