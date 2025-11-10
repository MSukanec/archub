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
  unit: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ProjectClientModalProps {
  projectId?: string;
  clientId?: string;
  onClose: () => void;
}

export function ProjectClientModal({ projectId, clientId, onClose }: ProjectClientModalProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const { closeModal } = useGlobalModalStore();
  const [isLoading, setIsLoading] = useState(false);

  const organizationId = userData?.organization?.id;
  const isEditing = !!clientId;

  // Query to get available contacts
  const { data: contacts = [] } = useQuery<any[]>({
    queryKey: [`/api/contacts?organization_id=${organizationId}`],
    enabled: !!organizationId,
  });

  // Query to get existing client data when editing
  const { data: existingClient } = useQuery<any>({
    queryKey: [`/api/projects/${projectId}/clients/${clientId}?organization_id=${organizationId}`],
    enabled: !!clientId && !!projectId && !!organizationId,
  });

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      contactId: '',
      unit: '',
    },
  });

  // Load existing data when editing
  useEffect(() => {
    if (existingClient) {
      form.reset({
        contactId: existingClient.client_id,
        unit: existingClient.unit || '',
      });
    } else if (!isEditing) {
      form.reset({
        contactId: '',
        unit: '',
      });
    }
  }, [existingClient, isEditing, form]);

  const saveClientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      if (!organizationId || !projectId) throw new Error('Missing organization or project ID');

      if (isEditing) {
        // Update existing client
        return await apiRequest('PATCH', `/api/projects/${projectId}/clients/${clientId}`, {
          unit: data.unit || null,
          organization_id: organizationId,
        });
      } else {
        // Create new client
        return await apiRequest('POST', `/api/projects/${projectId}/clients`, {
          client_id: data.contactId,
          organization_id: organizationId,
          unit: data.unit || null,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/clients?organization_id=${organizationId}`] });
      toast({
        title: isEditing ? 'Cliente actualizado' : 'Cliente agregado',
        description: isEditing 
          ? 'El cliente ha sido actualizado correctamente'
          : 'El cliente ha sido agregado al proyecto correctamente',
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: isEditing ? 'Error al actualizar cliente' : 'Error al agregar cliente',
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
      await saveClientMutation.mutateAsync(data);
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
                  disabled={isEditing}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unidad Funcional (Opcional)</FormLabel>
              <FormControl>
                <input
                  {...field}
                  type="text"
                  placeholder="Ej: Departamento 101, Casa 5, etc."
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
      title={isEditing ? "Editar Cliente" : "Agregar Cliente"}
      description={isEditing 
        ? "Modifica la información del cliente del proyecto"
        : "Selecciona un contacto para agregarlo como cliente del proyecto"}
      icon={Users}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={isEditing ? "Guardar" : "Agregar"}
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
