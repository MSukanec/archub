import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { FormModalLayout } from '../../form/FormModalLayout';
import { useGlobalModalStore } from '../../form/useGlobalModalStore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField';
import { Users } from 'lucide-react';

const clientSchema = z.object({
  contactId: z.string().min(1, 'Debe seleccionar un contacto'),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ProjectClientModalProps {
  projectId?: string;
  onClose: () => void;
}

export function ProjectClientModal({ projectId, onClose }: ProjectClientModalProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const { closeModal } = useGlobalModalStore();
  const [isLoading, setIsLoading] = useState(false);

  const organizationId = userData?.organization?.id;

  // Query to get available contacts
  const { data: contacts = [] } = useQuery<any[]>({
    queryKey: [`/api/contacts?organization_id=${organizationId}`],
    enabled: !!organizationId,
  });

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      contactId: '',
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    form.reset({
      contactId: '',
    });
  }, [form]);

  const addClientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      if (!organizationId || !projectId) throw new Error('Missing organization or project ID');

      return await apiRequest('POST', `/api/projects/${projectId}/clients`, {
        client_id: data.contactId,
        organization_id: organizationId,
        unit: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/clients?organization_id=${organizationId}`] });
      toast({
        title: 'Cliente agregado',
        description: 'El cliente ha sido agregado al proyecto correctamente',
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error al agregar cliente',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    form.reset();
    closeModal();
    onClose();
  };

  const handleSubmit = async (data: ClientFormData) => {
    setIsLoading(true);
    try {
      await addClientMutation.mutateAsync(data);
    } catch (error) {
      // Error handling is done in mutation onError
    } finally {
      setIsLoading(false);
    }
  };

  // Convert contacts to ComboBox options
  const contactOptions = contacts.map(contact => ({
    value: contact.id,
    label: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email,
  }));

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="contactId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contacto</FormLabel>
              <FormControl>
                <ComboBox
                  value={field.value}
                  onValueChange={field.onChange}
                  options={contactOptions}
                  placeholder="Seleccionar contacto..."
                  searchPlaceholder="Buscar contacto..."
                  emptyMessage="No se encontraron contactos."
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );

  const headerContent = (
    <FormModalHeader
      title="Seleccionar Cliente"
      description="Selecciona un contacto para agregarlo como cliente del proyecto"
      icon={Users}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel="Agregar"
      onRightClick={form.handleSubmit(handleSubmit)}
      showLoadingSpinner={isLoading}
      submitDisabled={isLoading}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
      forcedPanel="edit"
    />
  );
}
