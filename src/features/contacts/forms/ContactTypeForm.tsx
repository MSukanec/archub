import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tag } from 'lucide-react';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCreateContactType, useUpdateContactType } from '../hooks';
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
  
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;

  const createMutation = useCreateContactType(organizationId || '');
  const updateMutation = useUpdateContactType(organizationId || '');

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

  const onSubmit = async (data: ContactTypeFormData) => {
    try {
      if (mode === 'edit' && contactType) {
        await updateMutation.mutateAsync({ typeId: contactType.id, input: { name: data.name } });
      } else {
        await createMutation.mutateAsync({ name: data.name });
      }
      handleClose();
    } catch {
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
