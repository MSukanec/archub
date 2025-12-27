import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useOptimisticMutation } from '@/core/save-engine/useOptimisticMutation';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/features/users/hooks';
import { FormModalLayout } from '@/components/modal';
import { FormModalHeader } from '@/components/modal';
import { FormModalFooter } from '@/components/modal';
import { FormModalBody } from '@/components/modal';
import { useModalPanelStore } from '@/components/modal';
import { useGlobalModalStore } from '@/components/modal';
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

export function OrganizationMovementConceptFormModal({ modalData, onClose }: OrganizationMovementConceptFormModalProps) {
  const editingConcept = modalData?.editingConcept;
  const parentConcept = modalData?.parentConcept;
  const { data: userData } = useCurrentUser();
  const { currentPanel, setPanel } = useModalPanelStore();
  const { closeModal } = useGlobalModalStore();

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

  // Always show edit panel since this modal doesn't have view
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

  const createMutation = useOptimisticMutation({
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
    queryKey: ['movement-concepts-admin'],
    optimisticUpdate: (oldData: any[], variables: ConceptFormData) => {
      if (!oldData) return oldData;
      return [...oldData, { ...variables, id: 'temp-' + Date.now(), is_system: false }];
    },
    onSuccessMessage: "El nuevo concepto se ha creado correctamente",
    onErrorMessage: "Error al crear el concepto",
    additionalQueryKeys: [
      ['organization-movement-concepts'],
      ['system-movement-concepts']
    ]
  });

  const updateMutation = useOptimisticMutation({
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
    queryKey: ['movement-concepts-admin'],
    optimisticUpdate: (oldData: any[], variables: ConceptFormData) => {
      if (!oldData) return oldData;
      return oldData.map(item => 
        item.id === editingConcept.id ? { ...item, ...variables } : item
      );
    },
    onSuccessMessage: "El concepto se ha actualizado correctamente",
    onErrorMessage: "Error al actualizar el concepto",
    additionalQueryKeys: [
      ['organization-movement-concepts'],
      ['system-movement-concepts']
    ]
  });

  const onSubmit = (data: ConceptFormData) => {
    // Prevent editing system concepts
    if (editingConcept?.is_system) {
      return;
    }

    // Add parent_id automatically from parentConcept
    const formData = {
      ...data,
      parent_id: parentConcept?.id || editingConcept?.parent_id || null
    };

    if (editingConcept) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
    closeModal();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isSystemConcept = editingConcept?.is_system;

  // No view panel needed for this modal
  const viewPanel = null;

  const editPanel = (
    <>
      {isSystemConcept && (
        <div>
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Los conceptos del sistema no pueden ser modificados. Solo puedes ver su información.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="contents">
          {/* Nombre del Concepto */}
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

          {/* Descripción */}
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

          {/* Info about parent concept */}
          {parentConcept && (
            <div>
              <Alert>
                <Package2 className="h-4 w-4" />
                <AlertDescription>
                  Este concepto será creado como hijo de: <strong>{parentConcept.name}</strong>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </form>
      </Form>
    </>
  );

  const headerContent = (
    <FormModalHeader
      title={editingConcept 
        ? `${isSystemConcept ? 'Ver' : 'Editar'} Concepto` 
        : 'Nuevo Concepto'}
      description={editingConcept && isSystemConcept
        ? 'Los conceptos del sistema no pueden ser modificados'
        : editingConcept 
          ? 'Modifica el concepto personalizado de tu organización'
          : 'Crea un nuevo concepto personalizado para tu organización'}
      icon={Tag}
    />
  );

  const footerContent = isSystemConcept ? (
    <FormModalFooter
      rightLabel="Cerrar"
      onRightClick={closeModal}
    />
  ) : (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={closeModal}
      rightLabel={editingConcept ? "Actualizar Concepto" : "Crear Concepto"}
      onRightClick={form.handleSubmit(onSubmit)}
      showLoadingSpinner={isPending}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={closeModal}
    />
  );
}