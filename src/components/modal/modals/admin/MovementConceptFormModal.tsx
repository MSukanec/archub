import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { FormModalLayout } from '../../form/FormModalLayout';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import FormModalBody from '../../form/FormModalBody';
import { useModalPanelStore } from '../../form/modalPanelStore';
import { useGlobalModalStore } from '../../form/useGlobalModalStore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Package2, Plus } from 'lucide-react';
import { useMovementConceptsAdmin } from '@/hooks/use-movement-concepts-admin';

const conceptSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  parent_id: z.string().optional(),
  is_system: z.boolean().default(true),
});

type ConceptFormData = z.infer<typeof conceptSchema>;

interface MovementConceptFormModalProps {
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

export default function MovementConceptFormModal({ modalData, onClose }: MovementConceptFormModalProps) {
  const editingConcept = modalData?.editingConcept;
  const parentConcept = modalData?.parentConcept;
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const { currentPanel, setPanel } = useModalPanelStore();
  const { closeModal } = useGlobalModalStore();
  const [isLoading, setIsLoading] = useState(false);

  // Query for parent concepts
  const { data: concepts = [] } = useMovementConceptsAdmin();

  const form = useForm<ConceptFormData>({
    resolver: zodResolver(conceptSchema),
    defaultValues: {
      name: editingConcept?.name || '',
      description: editingConcept?.description || '',
      parent_id: editingConcept?.parent_id || parentConcept?.id || '',
      is_system: true, // Siempre true para admin
    },
  });

  // Always show edit panel for both creating and editing
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
        is_system: true, // Siempre true para admin
      });
    }
  }, [editingConcept, form]);

  const createConceptMutation = useMutation({
    mutationFn: async (conceptData: ConceptFormData) => {
      const { data, error } = await supabase
        .from('movement_concepts')
        .insert([{
          name: conceptData.name,
          description: conceptData.description || null,
          parent_id: conceptData.parent_id || null,
          is_system: conceptData.is_system,
          organization_id: conceptData.is_system ? null : userData?.preferences?.last_organization_id,
        }])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movement-concepts-admin'] });
      toast({
        title: 'Concepto creado',
        description: 'El concepto de movimiento ha sido creado correctamente',
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error al crear concepto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateConceptMutation = useMutation({
    mutationFn: async (conceptData: ConceptFormData) => {
      if (!editingConcept?.id) throw new Error('No concept to update');

      const { data, error } = await supabase
        .from('movement_concepts')
        .update({
          name: conceptData.name,
          description: conceptData.description || null,
          parent_id: conceptData.parent_id || null,
          is_system: conceptData.is_system,
        })
        .eq('id', editingConcept.id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movement-concepts-admin'] });
      toast({
        title: 'Concepto actualizado',
        description: 'El concepto de movimiento ha sido actualizado correctamente',
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error al actualizar concepto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    form.reset();
    setPanel('view');
    closeModal();
  };

  const handleSubmit = async (data: ConceptFormData) => {
    setIsLoading(true);
    try {
      if (editingConcept) {
        await updateConceptMutation.mutateAsync(data);
      } else {
        await createConceptMutation.mutateAsync(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get flat list of concepts for parent selection
  const getParentOptions = (concepts: any[], level = 0): Array<{ id: string; name: string; level: number }> => {
    const options: Array<{ id: string; name: string; level: number }> = [];
    
    concepts.forEach(concept => {
      // Don't include current concept as parent option when editing
      if (editingConcept && concept.id === editingConcept?.id) return;
      
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

  const editPanel = (
    <FormModalBody columns={1}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Concepto</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Ingrese el nombre del concepto"
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
              <Select onValueChange={field.onChange} value={field.value}>
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

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Descripción del concepto (opcional)"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        </form>
      </Form>
    </FormModalBody>
  );

  const headerContent = (
    <FormModalHeader
      title={editingConcept 
        ? 'Editar Concepto de Movimiento' 
        : parentConcept 
          ? `Nuevo Concepto Hijo de "${parentConcept.name}"` 
          : 'Nuevo Concepto de Movimiento'}
      description={editingConcept 
        ? 'Modifica los datos del concepto de movimiento seleccionado'
        : parentConcept 
          ? `Crea un nuevo concepto como subcategoría de "${parentConcept.name}"`
          : 'Define un nuevo concepto para categorizar movimientos financieros'}
      icon={editingConcept ? Package2 : Plus}
    />
  );

  const footerContent = (
    <FormModalFooter
      cancelText="Cancelar"
      submitText={editingConcept ? 'Actualizar' : 'Crear'}
      onLeftClick={handleClose}
      onSubmit={form.handleSubmit(handleSubmit)}
      showLoadingSpinner={isLoading}
    />
  );

  const viewPanel = editingConcept ? (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium">Nombre</h4>
        <p className="text-muted-foreground mt-1">{editingConcept?.name || 'Sin nombre'}</p>
      </div>
      <div>
        <h4 className="font-medium">Concepto Padre</h4>
        <p className="text-muted-foreground mt-1">{editingConcept?.parent_name || 'Sin padre'}</p>
      </div>
      <div>
        <h4 className="font-medium">Tipo</h4>
        <p className="text-muted-foreground mt-1">{editingConcept?.is_system ? 'Sistema' : 'Usuario'}</p>
      </div>
    </div>
  ) : null;

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
    />
  );
}