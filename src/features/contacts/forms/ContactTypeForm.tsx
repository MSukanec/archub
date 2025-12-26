import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCreateContactType, useUpdateContactType } from '../hooks';
import { contactTypeSchema, type ContactTypeFormData } from '../schemas';
import type { ContactType } from '../types';
export function FormPanel({
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
interface UseContactTypeFormProps {
  contactType?: ContactType;
  mode: 'create'| 'edit';
  onClose: () => void;
}
export function useContactTypeForm({ contactType, mode, onClose }: UseContactTypeFormProps) {
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
      if (mode === 'edit'&& contactType) {
        await updateMutation.mutateAsync({ typeId: contactType.id, input: { name: data.name } });
      } else {
        await createMutation.mutateAsync({ name: data.name });
      }
      handleClose();
    } catch {
    }
  };
  const canSubmit = !!organizationId;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  return {
    form,
    onSubmit,
    isSubmitting,
    canSubmit,
    handleClose,
  };
}
export { ContactTypeFormData };
