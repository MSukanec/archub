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

import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';

import { useCreateTaskParameter, useUpdateTaskParameter, TaskParameter, useTaskParameterOptionGroups, useCreateTaskParameterOptionGroup, useDeleteTaskParameterOptionGroup, useUpdateTaskParameterOptionGroup, useTaskSubcategories } from '@/hooks/use-task-parameters-admin';
import { TaskParameterGroupAssignmentModal } from './TaskParameterGroupAssignmentModal';
import { useUnits } from '@/hooks/use-units';

const taskParameterSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  label: z.string().min(1, 'La etiqueta es requerida'),
  type: z.enum(['text', 'number', 'select', 'boolean'], { 
    required_error: 'El tipo es requerido' 
  }),
  role: z.string().optional(),
  is_required: z.boolean().optional(),
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
  
  // Load units for the selector
  const { data: units, isLoading: unitsLoading } = useUnits();
  
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
      role: '',
      is_required: false,
    },
  });

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
        category_id: selectedSubcategory.id,
      });
      setSelectedSubcategoryId('');
    } catch (error) {
      console.error('Error creating group:', error);
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
    setEditingGroupName(group.category_id || '');
  };

  const handleSaveGroupEdit = async () => {
    if (!editingGroupId || !editingGroupName) return;
    
    const selectedSubcategory = subcategories.find(cat => cat.id === editingGroupName);
    if (!selectedSubcategory) return;
    
    try {
      await updateGroupMutation.mutateAsync({
        id: editingGroupId,
        name: selectedSubcategory.name,
        category_id: selectedSubcategory.id,
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
        is_required: parameter.is_required,
      });
    } else if (!parameter && open) {
      form.reset({
        name: '',
        label: '',
        type: 'text',
        role: '',
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
                  <Accordion type="single" collapsible defaultValue="basic-data" className="w-full">
                    {/* Acordeón Datos Básicos */}
                    <AccordionItem value="basic-data">
                      <AccordionTrigger className="text-sm font-medium px-3 py-2 border rounded-lg mb-2">
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          <span>Configuración del Parámetro</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-0 pt-2">
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
                            name="role"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Rol Semántico</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ''} disabled={isSubmitting}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar rol" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="z-[9999]">
                                    <SelectItem value="">Sin rol específico</SelectItem>
                                    <SelectItem value="material">Material</SelectItem>
                                    <SelectItem value="dimension">Dimensión</SelectItem>
                                    <SelectItem value="quantity">Cantidad</SelectItem>
                                    <SelectItem value="quality">Calidad</SelectItem>
                                    <SelectItem value="specification">Especificación</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />



                          <FormField
                            control={form.control}
                            name="is_required"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                  <FormLabel>Campo Obligatorio</FormLabel>
                                  <div className="text-xs text-muted-foreground">
                                    Este parámetro será requerido en las tareas
                                  </div>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={isSubmitting}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Acordeón Grupos de Opciones */}
                    {form.watch('type') === 'select' && (
                      <AccordionItem value="option-groups">
                        <AccordionTrigger className="text-sm font-medium px-3 py-2 border rounded-lg mb-2">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            <span>Grupos de Opciones</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-0 pt-2">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium">Grupos existentes</h4>
                            </div>
                            
                            {/* Inline group creation */}
                            {parameter && (
                              <div className="flex gap-2">
                                <Select value={selectedSubcategoryId} onValueChange={setSelectedSubcategoryId}>
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Seleccionar subcategoría..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {subcategoriesLoading ? (
                                      <SelectItem value="loading" disabled>Cargando...</SelectItem>
                                    ) : subcategories.length > 0 ? (
                                      subcategories.map((subcategory) => (
                                        <SelectItem key={subcategory.id} value={subcategory.id}>
                                          {subcategory.code || subcategory.name} {subcategory.name && subcategory.code ? '- ' + subcategory.name : ''}
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <SelectItem value="empty" disabled>No hay subcategorías disponibles</SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleCreateGroup}
                                  disabled={!selectedSubcategoryId || isCreatingGroup}
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
                                              <SelectValue placeholder="Seleccionar subcategoría..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {subcategories.map((subcategory) => (
                                                <SelectItem key={subcategory.id} value={subcategory.id}>
                                                  {subcategory.name} - {subcategory.label || subcategory.description}
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
                                            {group.category_id ? 
                                              subcategories.find(cat => cat.id === group.category_id)?.label || 
                                              subcategories.find(cat => cat.id === group.category_id)?.description || 
                                              'Categoría no encontrada' 
                                              : 'Sin categoría asignada'
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
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
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