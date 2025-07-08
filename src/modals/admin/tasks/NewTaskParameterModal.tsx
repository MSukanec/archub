import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Eye, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';

import { useCreateTaskParameter, useUpdateTaskParameter, TaskParameter, useTaskParameterOptionGroups, useCreateTaskParameterOptionGroup, useDeleteTaskParameterOptionGroup, useUpdateTaskParameterOptionGroup, useTaskSubcategories } from '@/hooks/use-task-parameters-admin';
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
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  
  const createMutation = useCreateTaskParameter();
  const updateMutation = useUpdateTaskParameter();
  const createGroupMutation = useCreateTaskParameterOptionGroup();
  const deleteGroupMutation = useDeleteTaskParameterOptionGroup();
  const updateGroupMutation = useUpdateTaskParameterOptionGroup();
  
  // Load option groups for this parameter
  const parameterId = parameter?.parameter_id || '';
  console.log('Loading groups for parameter:', { parameter, parameterId });
  const { data: optionGroups, isLoading: isLoadingGroups } = useTaskParameterOptionGroups(parameterId);
  
  // Load subcategories for group creation
  const { data: subcategories = [], isLoading: subcategoriesLoading } = useTaskSubcategories();
  
  const form = useForm<TaskParameterFormData>({
    resolver: zodResolver(taskParameterSchema),
    defaultValues: {
      name: '',
      label: '',
      type: 'text',
      expression_template: '',
    },
  });

  const { toast } = useToast();

  // Functions for inline group creation
  const handleCreateGroup = async () => {
    if (!selectedSubcategoryId || !parameter?.parameter_id) return;
    
    const selectedSubcategory = subcategories.find(cat => cat.id === selectedSubcategoryId);
    if (!selectedSubcategory) return;
    
    setIsCreatingGroup(true);
    try {
      await createGroupMutation.mutateAsync({
        parameter_id: parameter.parameter_id,
        name: selectedSubcategory.name,
        category_id: selectedSubcategoryId
      });
      setSelectedSubcategoryId('');
      toast({
        title: "Éxito",
        description: "Grupo creado correctamente"
      });
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al crear el grupo"
      });
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await deleteGroupMutation.mutateAsync(groupId);
      toast({
        title: "Éxito",
        description: "Grupo eliminado correctamente"
      });
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al eliminar el grupo"
      });
    }
  };

  const handleUpdateGroup = async (groupId: string, newName: string) => {
    try {
      await updateGroupMutation.mutateAsync({
        id: groupId,
        name: newName
      });
      setEditingGroupId(null);
      setEditingGroupName('');
      toast({
        title: "Éxito",
        description: "Grupo actualizado correctamente"
      });
    } catch (error) {
      console.error('Error updating group:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al actualizar el grupo"
      });
    }
  };

  const handleClose = () => {
    form.reset();
    setSelectedSubcategoryId('');
    setEditingGroupId(null);
    setEditingGroupName('');
    onClose();
  };

  // Load parameter data for editing
  useEffect(() => {
    if (parameter && open) {
      form.reset({
        name: parameter.name,
        label: parameter.label,
        type: parameter.type,
        expression_template: parameter.expression_template || '',
      });
    } else if (!parameter && open) {
      form.reset({
        name: '',
        label: '',
        type: 'text',
        expression_template: '',
      });
    }
  }, [parameter, open, form]);

  const onSubmit = async (data: TaskParameterFormData) => {
    console.log('Creating parameter with data:', data);
    setIsSubmitting(true);
    try {
      if (parameter) {
        await updateMutation.mutateAsync({
          id: parameter.id,
          ...data,
        });
        toast({
          title: "Éxito",
          description: "Parámetro actualizado correctamente"
        });
      } else {
        const result = await createMutation.mutateAsync(data);
        console.log('Parameter created with ID:', result.id);
        if (onParameterCreated) {
          onParameterCreated(result.id);
        }
        toast({
          title: "Éxito",
          description: "Parámetro creado correctamente"
        });
      }
      handleClose();
    } catch (error) {
      console.error('Error saving parameter:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al guardar el parámetro"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <CustomModalLayout open={open} onClose={handleClose}>
        {{
          header: (
            <CustomModalHeader
              title={parameter ? "Editar Parámetro" : "Nuevo Parámetro"}
              subtitle={parameter ? "Modifica los datos del parámetro" : "Crea un nuevo parámetro de tarea"}
              onClose={handleClose}
            />
          ),
          body: (
            <CustomModalBody>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-6">
                {/* Configuración Básica */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="label"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="required-asterisk">Etiqueta (Visible)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Ej: Morteros"
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
                              placeholder="Ej: mortar_type"
                              disabled={isSubmitting}
                            />
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
                          <FormLabel className="required-asterisk">Tipo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="z-[9999]">
                              <SelectItem value="text">Texto</SelectItem>
                              <SelectItem value="number">Número</SelectItem>
                              <SelectItem value="select">Selección</SelectItem>
                              <SelectItem value="boolean">Verdadero/Falso</SelectItem>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Grupos de Opciones - Solo visible si es tipo select */}
                {form.watch('type') === 'select' && (
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-sm font-medium">Grupos de Opciones</h3>
                        <Badge variant="outline" className="text-xs">
                          {optionGroups?.length || 0} grupos
                        </Badge>
                      </div>

                      {/* Crear nuevo grupo */}
                      <div className="flex gap-2">
                        <Select value={selectedSubcategoryId} onValueChange={setSelectedSubcategoryId}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Seleccionar subcategoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {subcategories.map((subcategory) => (
                              <SelectItem key={subcategory.id} value={subcategory.id}>
                                {subcategory.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCreateGroup}
                          disabled={!selectedSubcategoryId || isCreatingGroup || !parameter}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Lista de grupos existentes */}
                      {optionGroups && optionGroups.length > 0 && (
                        <div className="space-y-2">
                          {optionGroups.map((group) => (
                            <div key={group.id} className="flex items-center justify-between p-2 border rounded bg-background">
                              <div className="flex items-center gap-2">
                                {editingGroupId === group.id ? (
                                  <Input
                                    value={editingGroupName}
                                    onChange={(e) => setEditingGroupName(e.target.value)}
                                    className="h-8 w-32"
                                    onBlur={() => {
                                      if (editingGroupName.trim()) {
                                        handleUpdateGroup(group.id, editingGroupName.trim());
                                      } else {
                                        setEditingGroupId(null);
                                        setEditingGroupName('');
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        if (editingGroupName.trim()) {
                                          handleUpdateGroup(group.id, editingGroupName.trim());
                                        }
                                      } else if (e.key === 'Escape') {
                                        setEditingGroupId(null);
                                        setEditingGroupName('');
                                      }
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  <span className="text-sm font-medium">{group.name}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedGroup(group);
                                    setIsAssignmentModalOpen(true);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingGroupId(group.id);
                                    setEditingGroupName(group.name);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteGroup(group.id)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
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
            <CustomModalFooter
              onClose={handleClose}
              isSubmitting={isSubmitting}
              submitText={parameter ? "Actualizar" : "Guardar"}
            />
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