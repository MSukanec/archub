import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { CustomModalLayout } from '@/components/modal/legacy/CustomModalLayout';
import { CustomModalHeader } from '@/components/modal/legacy/CustomModalHeader';
import { CustomModalBody } from '@/components/modal/legacy/CustomModalBody';
import { CustomModalFooter } from '@/components/modal/legacy/CustomModalFooter';

import { 
  useCreateMovementConcept, 
  useUpdateMovementConcept, 
  MovementConceptAdmin 
} from '@/hooks/use-movement-concepts-admin';
import { useCurrentUser } from '@/hooks/use-current-user';

const movementConceptSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  description: z.string().optional(),
  parent_id: z.string().optional(),
  is_system: z.boolean().default(false),
});

type MovementConceptForm = z.infer<typeof movementConceptSchema>;

interface NewAdminMovementConceptModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingConcept?: MovementConceptAdmin | null;
  parentConcepts?: MovementConceptAdmin[];
}

export function NewAdminMovementConceptModal({
  isOpen,
  onClose,
  editingConcept,
  parentConcepts = []
}: NewAdminMovementConceptModalProps) {
  const { data: userData } = useCurrentUser();
  const createConceptMutation = useCreateMovementConcept();
  const updateConceptMutation = useUpdateMovementConcept();
  
  const isEditing = !!editingConcept;
  const isLoading = createConceptMutation.isPending || updateConceptMutation.isPending;

  const form = useForm<MovementConceptForm>({
    resolver: zodResolver(movementConceptSchema),
    defaultValues: {
      name: editingConcept?.name || '',
      description: editingConcept?.description || '',
      parent_id: editingConcept?.parent_id || '',
      is_system: editingConcept?.is_system || false,
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      if (editingConcept) {
        form.reset({
          name: editingConcept.name,
          description: editingConcept.description || '',
          parent_id: editingConcept.parent_id || '',
          is_system: editingConcept.is_system,
        });
      } else {
        form.reset({
          name: '',
          description: '',
          parent_id: '',
          is_system: false,
        });
      }
    }
  }, [isOpen, editingConcept, form]);

  const onSubmit = async (data: MovementConceptForm) => {
    if (!userData?.organization?.id) {
      console.error('No organization ID available');
      return;
    }

    const conceptData = {
      ...data,
      organization_id: userData.organization.id,
      parent_id: data.parent_id || null,
    };

    try {
      if (isEditing && editingConcept) {
        await updateConceptMutation.mutateAsync({
          id: editingConcept.id,
          ...conceptData,
        });
      } else {
        await createConceptMutation.mutateAsync(conceptData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving movement concept:', error);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.handleSubmit(onSubmit)();
    }
  };

  // Flatten parent concepts for select options
  const flattenConcepts = (concepts: MovementConceptAdmin[], level = 0): Array<{ id: string; name: string; level: number }> => {
    const result: Array<{ id: string; name: string; level: number }> = [];
    
    concepts.forEach(concept => {
      // Skip the concept being edited to prevent circular references
      if (concept.id !== editingConcept?.id) {
        result.push({
          id: concept.id,
          name: concept.name,
          level,
        });
        
        if (concept.children && concept.children.length > 0) {
          result.push(...flattenConcepts(concept.children, level + 1));
        }
      }
    });
    
    return result;
  };

  const flatParentConcepts = flattenConcepts(parentConcepts);

  return (
    <CustomModalLayout isOpen={isOpen} onClose={onClose}>
      <CustomModalHeader
        title={isEditing ? 'Editar Concepto de Movimiento' : 'Nuevo Concepto de Movimiento'}
        onClose={onClose}
      />

      <CustomModalBody columns={1}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="space-y-4">
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Concepto</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del concepto" {...field} />
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
                    <Input placeholder="Descripción del concepto (opcional)" {...field} />
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
                  <FormLabel>Concepto Padre (opcional)</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar concepto padre..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Sin concepto padre</SelectItem>
                      {flatParentConcepts.map((concept) => (
                        <SelectItem key={concept.id} value={concept.id}>
                          {'—'.repeat(concept.level)} {concept.name}
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
              name="is_system"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Concepto del Sistema</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Los conceptos del sistema no pueden ser editados por usuarios
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

          </form>
        </Form>
      </CustomModalBody>

      <CustomModalFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          onClick={form.handleSubmit(onSubmit)}
        >
          {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
        </Button>
      </CustomModalFooter>
    </CustomModalLayout>
  );
}