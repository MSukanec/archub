import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { FormModalLayout } from '../form/FormModalLayout';
import { FormModalHeader } from '../form/FormModalHeader';
import { FormModalFooter } from '../form/FormModalFooter';
import FormModalBody from '../form/FormModalBody';
import { useModalPanelStore } from '../form/modalPanelStore';
import { useGlobalModalStore } from '../form/useGlobalModalStore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Package2, Plus, Tag, AlertTriangle } from 'lucide-react';
import { useMovementConceptsAdmin } from '@/hooks/use-movement-concepts-admin';
import { Alert, AlertDescription } from '@/components/ui/alert';

const conceptSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  parent_id: z.string().optional(),
});

type ConceptFormData = z.infer<typeof conceptSchema>;

interface OrganizationMovementConceptFormModalProps {
  modalData?: {
    editingConcept?: any;
    parentConcept?: {
      id: string;
      name: string;
      parent_id: string | null;
      is_system: boolean;
    };
  };
  onClose: () => void;
}

export default function OrganizationMovementConceptFormModal({ modalData, onClose }: OrganizationMovementConceptFormModalProps) {
  const editingConcept = modalData?.editingConcept;
  const parentConcept = modalData?.parentConcept;
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const { currentPanel, setPanel } = useModalPanelStore();
  const { closeModal } = useGlobalModalStore();
  const [isLoading, setIsLoading] = useState(false);

  // Query for parent concepts - only non-system concepts for organization
  const { data: allConcepts = [] } = useMovementConceptsAdmin();
  const availableParentConcepts = allConcepts.filter(concept => !concept.is_system);

  const form = useForm<ConceptFormData>({
    resolver: zodResolver(conceptSchema),
    defaultValues: {
      name: editingConcept?.name || '',
      description: editingConcept?.description || '',
      parent_id: editingConcept?.parent_id || parentConcept?.id || '',
    },
  });

  // Always show edit panel
  React.useEffect(() => {
    setPanel('edit');
  }, [setPanel]);

  // Reset form when editing concept changes
  React.useEffect(() => {
    if (editingConcept) {
      form.reset({
        name: editingConcept.name || '',
        description: editingConcept.description || '',
        parent_id: editingConcept.parent_id || '',
      });
    } else if (parentConcept) {
      form.reset({
        name: '',
        description: '',
        parent_id: parentConcept.id,
      });
    }
  }, [editingConcept, parentConcept, form]);

  const createMutation = useMutation({
    mutationFn: async (data: ConceptFormData) => {
      if (!userData?.organization?.id) {
        throw new Error('No organization found');
      }

      const { data: result, error } = await supabase
        .from('movement_concepts')
        .insert([{
          name: data.name,
          description: data.description,
          parent_id: data.parent_id || null,
          organization_id: userData.organization.id,
          is_system: false,
        }])
        .select();

      if (error) throw error;
      return result[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movement-concepts-admin'] });
      queryClient.invalidateQueries({ queryKey: ['system-movement-concepts'] });
      toast({
        title: "Concepto creado",
        description: "El nuevo concepto se ha creado correctamente"
      });
      closeModal();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Error al crear el concepto",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ConceptFormData) => {
      if (!editingConcept?.id) {
        throw new Error('No concept ID found');
      }

      const { data: result, error } = await supabase
        .from('movement_concepts')
        .update({
          name: data.name,
          description: data.description,
          parent_id: data.parent_id || null,
        })
        .eq('id', editingConcept.id)
        .select();

      if (error) throw error;
      return result[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movement-concepts-admin'] });
      queryClient.invalidateQueries({ queryKey: ['system-movement-concepts'] });
      toast({
        title: "Concepto actualizado",
        description: "El concepto se ha actualizado correctamente"
      });
      closeModal();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Error al actualizar el concepto",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ConceptFormData) => {
    // Prevent editing system concepts
    if (editingConcept?.is_system) {
      toast({
        title: "Edición no permitida",
        description: "Los conceptos del sistema no pueden ser modificados",
        variant: "destructive"
      });
      return;
    }

    if (editingConcept) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isSystemConcept = editingConcept?.is_system;

  return (
    <FormModalLayout>
      <FormModalHeader 
        title={editingConcept 
          ? `${isSystemConcept ? 'Ver' : 'Editar'} Concepto` 
          : 'Nuevo Concepto'
        }
        icon={Tag}
      />

      <FormModalBody columns={1}>
        {isSystemConcept && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Los conceptos del sistema no pueden ser modificados. Solo puedes ver su información.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Concepto *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Ej: Gastos de oficina"
                      disabled={isSystemConcept}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Descripción opcional del concepto"
                      disabled={isSystemConcept}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Concepto Padre</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={isSystemConcept || !!parentConcept}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar concepto padre (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Sin concepto padre</SelectItem>
                      {availableParentConcepts.map((concept) => (
                        <SelectItem key={concept.id} value={concept.id}>
                          {concept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {parentConcept && (
              <Alert>
                <Package2 className="h-4 w-4" />
                <AlertDescription>
                  Este concepto será creado como hijo de: <strong>{parentConcept.name}</strong>
                </AlertDescription>
              </Alert>
            )}
          </form>
        </Form>
      </FormModalBody>

      <FormModalFooter
        cancelText="Cancelar"
        submitText={isSystemConcept ? null : (isPending ? 'Guardando...' : (editingConcept ? 'Actualizar' : 'Crear'))}
        onSubmit={isSystemConcept ? undefined : form.handleSubmit(onSubmit)}
        isLoading={isPending}
        disabled={isPending || isSystemConcept}
      />
    </FormModalLayout>
  );
}