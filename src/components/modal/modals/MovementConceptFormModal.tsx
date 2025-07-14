import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings, User } from 'lucide-react';

import { FormModalLayout } from '@/components/modal/form/FormModalLayout';
import FormModalBody from '@/components/modal/form/FormModalBody';
import { FormModalFooter } from '@/components/modal/form/FormModalFooter';
import { FormModalHeader } from '@/components/modal/form/FormModalHeader';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { useMovementConceptsAdmin, useCreateMovementConcept, useUpdateMovementConcept, MovementConceptAdmin } from '@/hooks/use-movement-concepts-admin';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  parent_id: z.string().nullable().optional(),
  view_mode: z.enum(['types', 'categories', 'subcategories']).optional(),
  is_system: z.boolean().default(true),
  extra_fields: z.record(z.any()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface MovementConceptFormModalProps {
  modalData?: {
    editingConcept?: MovementConceptAdmin;
  };
  onClose: () => void;
}

export default function MovementConceptFormModal({ modalData, onClose }: MovementConceptFormModalProps) {
  const { toast } = useToast();
  const editingConcept = modalData?.editingConcept;
  const isEditing = !!editingConcept;

  const { data: concepts = [] } = useMovementConceptsAdmin();
  const createMutation = useCreateMovementConcept();
  const updateMutation = useUpdateMovementConcept();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: editingConcept?.name || '',
      parent_id: editingConcept?.parent_id || null,
      view_mode: editingConcept?.view_mode as any || undefined,
      is_system: editingConcept?.is_system ?? true,
      extra_fields: editingConcept?.extra_fields || {},
    },
  });

  // Get parent options (flatten hierarchy for selection)
  const getParentOptions = (concepts: MovementConceptAdmin[], level = 0): Array<{ id: string; name: string; level: number }> => {
    const options: Array<{ id: string; name: string; level: number }> = [];
    
    concepts.forEach(concept => {
      // Don't include current concept as parent option when editing
      if (isEditing && concept.id === editingConcept?.id) return;
      
      options.push({
        id: concept.id,
        name: concept.name,
        level
      });
      
      if (concept.children && concept.children.length > 0) {
        options.push(...getParentOptions(concept.children, level + 1));
      }
    });
    
    return options;
  };

  const parentOptions = getParentOptions(concepts);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && editingConcept) {
        await updateMutation.mutateAsync({
          ...data,
          id: editingConcept.id,
          organization_id: editingConcept.organization_id,
        });
        toast({
          title: "Concepto actualizado",
          description: "El concepto se ha actualizado correctamente.",
        });
      } else {
        await createMutation.mutateAsync({
          ...data,
          organization_id: '', // System concepts don't have organization
        });
        toast({
          title: "Concepto creado",
          description: "El concepto se ha creado correctamente.",
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving concept:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el concepto. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <FormModalLayout>
      <FormModalHeader 
        title={isEditing ? "Editar Concepto" : "Crear Concepto"}
        subtitle={isEditing ? "Modifica la información del concepto" : "Agrega un nuevo concepto al sistema"}
      />

      <FormModalBody>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Tipo de concepto */}
            <FormField
              control={form.control}
              name="is_system"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Concepto del Sistema
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Los conceptos del sistema están disponibles para todas las organizaciones
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

            {/* Nombre */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Concepto *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Materiales, Mano de Obra, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Concepto Padre */}
            <FormField
              control={form.control}
              name="parent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Concepto Padre</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar concepto padre (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Sin concepto padre</SelectItem>
                      {parentOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          <span style={{ paddingLeft: `${option.level * 16}px` }}>
                            {option.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Modo de Vista */}
            <FormField
              control={form.control}
              name="view_mode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modo de Vista</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar modo de vista (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Sin modo específico</SelectItem>
                      <SelectItem value="types">Tipos</SelectItem>
                      <SelectItem value="categories">Categorías</SelectItem>
                      <SelectItem value="subcategories">Subcategorías</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

          </form>
        </Form>
      </FormModalBody>

      <FormModalFooter
        cancelText="Cancelar"
        submitText={isEditing ? "Actualizar" : "Crear"}
        onSubmit={form.handleSubmit(onSubmit)}
        onCancel={onClose}
        isLoading={isLoading}
      />
    </FormModalLayout>
  );
}