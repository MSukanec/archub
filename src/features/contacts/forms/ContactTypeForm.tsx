import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tag } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { createContactType, updateContactType } from '../services';
import { CONTACT_TYPE_QUERY_KEYS } from '../constants';
import { contactTypeSchema, type ContactTypeFormData } from '../schemas';
import type { ContactType } from '../types';

function FormPanel({
  form,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<ContactTypeFormData>>;
  onSubmit: (data: ContactTypeFormData) => void;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nombre <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ej: Proveedor, Subcontratista, Arquitecto" 
                  {...field}
                  data-testid="input-contact-type-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

interface ContactTypeFormProps {
  modalData?: {
    contactType?: ContactType;
    isEditing?: boolean;
  };
  onClose: () => void;
  mode?: 'create' | 'edit';
}

export function ContactTypeForm({ modalData, onClose, mode: propMode }: ContactTypeFormProps) {
  const { contactType, isEditing = false } = modalData || {};
  const mode = propMode || (isEditing || contactType ? 'edit' : 'create');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;

  const form = useForm<ContactTypeFormData>({
    resolver: zodResolver(contactTypeSchema),
    defaultValues: {
      name: '',
    }
  });

  useEffect(() => {
    if (contactType) {
      form.reset({
        name: contactType.name || '',
      });
    } else {
      form.reset({
        name: '',
      });
    }
  }, [contactType, form]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const createMutation = useMutation({
    mutationFn: (input: { name: string }) => {
      if (!organizationId) throw new Error('Organization ID is required');
      return createContactType(organizationId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACT_TYPE_QUERY_KEYS.lists() });
      toast({
        title: 'Tipo creado',
        description: 'El tipo de contacto se creó correctamente'
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Error creating contact type:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el tipo de contacto',
        variant: 'destructive'
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ typeId, input }: { typeId: string; input: { name: string } }) => {
      if (!organizationId) throw new Error('Organization ID is required');
      return updateContactType(typeId, organizationId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACT_TYPE_QUERY_KEYS.lists() });
      toast({
        title: 'Tipo actualizado',
        description: 'El tipo de contacto se actualizó correctamente'
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Error updating contact type:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el tipo de contacto',
        variant: 'destructive'
      });
    }
  });

  const onSubmit = (data: ContactTypeFormData) => {
    if (mode === 'edit' && contactType) {
      updateMutation.mutate({
        typeId: contactType.id,
        input: { name: data.name }
      });
    } else {
      createMutation.mutate({ name: data.name });
    }
  };

  const canSubmit = !!organizationId;

  const getHeader = () => {
    switch (mode) {
      case 'edit':
        return { 
          title: 'Editar Tipo de Contacto', 
          description: 'Modifica el nombre del tipo de contacto' 
        };
      case 'create':
      default:
        return { 
          title: 'Nuevo Tipo de Contacto', 
          description: 'Crea un nuevo tipo de contacto personalizado para tu organización' 
        };
    }
  };

  const header = getHeader();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <ModalLayout onClose={handleClose} size="sm">
      <ModalHeader 
        title={header.title}
        description={header.description}
        icon={Tag}
      />
      
      <ModalBody>
        <FormPanel form={form} onSubmit={onSubmit} />
      </ModalBody>

      <ModalFooter
        leftLabel="Cancelar"
        onLeftClick={handleClose}
        rightLabel={mode === 'create' ? 'Crear Tipo' : 'Guardar Cambios'}
        onRightClick={form.handleSubmit(onSubmit)}
        isSubmitting={isSubmitting}
        canSubmit={() => canSubmit}
      />
    </ModalLayout>
  );
}
