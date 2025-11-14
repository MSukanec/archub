import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { supabase } from '@/lib/supabase';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { FormModalLayout } from '../../form/FormModalLayout';
import { useGlobalModalStore } from '../../form/useGlobalModalStore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField';
import { MiniEmptyState } from '@/components/ui-custom/fields/MiniEmptyState';
import { Users, UserPlus } from 'lucide-react';

const clientSchema = z.object({
  contactId: z.string().min(1, 'Debe seleccionar un contacto'),
  unit: z.string().optional(),
  clientRoleId: z.string().optional(),
  status: z.enum(['active', 'inactive', 'deleted', 'potential', 'rejected', 'completed']).optional(),
  isPrimary: z.enum(['yes', 'no']).optional(),
  notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ProjectClientModalProps {
  modalData?: {
    projectId?: string;
    clientId?: string;
  };
  onClose: () => void;
}

export function ProjectClientModal({ modalData, onClose }: ProjectClientModalProps) {
  const { projectId, clientId } = modalData || {};
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const { closeModal } = useGlobalModalStore();
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const organizationId = userData?.organization?.id;
  const userId = userData?.user?.id;
  const isEditing = !!clientId;

  // Query to get organization_member_id for created_by field
  const { data: organizationMember } = useQuery<any>({
    queryKey: ['organization-member', organizationId, userId],
    queryFn: async () => {
      if (!supabase || !organizationId || !userId) return null;
      
      const { data, error } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching organization member:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!organizationId && !!userId && !isEditing,
  });

  // Query to get available contacts
  const { data: contacts = [] } = useQuery<any[]>({
    queryKey: [`/api/contacts?organization_id=${organizationId}`],
    enabled: !!organizationId,
  });

  // Query to get client roles
  const { data: clientRoles = [] } = useQuery<any[]>({
    queryKey: [`/api/client-roles?organization_id=${organizationId}`],
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
      clientRoleId: '',
      status: 'active',
      isPrimary: 'no',
      notes: '',
    },
  });

  // Load existing data when editing
  useEffect(() => {
    if (existingClient) {
      form.reset({
        contactId: existingClient.client_id,
        unit: existingClient.unit || '',
        clientRoleId: existingClient.client_role_id || '',
        status: existingClient.status || 'active',
        isPrimary: existingClient.is_primary ? 'yes' : 'no',
        notes: existingClient.notes || '',
      });
    } else if (!isEditing) {
      form.reset({
        contactId: '',
        unit: '',
        clientRoleId: '',
        status: 'active',
        isPrimary: 'no',
        notes: '',
      });
    }
  }, [existingClient, isEditing, form]);

  const saveClientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      if (!organizationId || !projectId) throw new Error('Missing organization or project ID');

      const payload: any = {
        organization_id: organizationId,
        unit: data.unit || null,
        client_role_id: data.clientRoleId || null,
        status: data.status || 'active',
        is_primary: data.isPrimary === 'yes',
        notes: data.notes || null,
      };

      if (isEditing) {
        // Update existing client
        return await apiRequest('PATCH', `/api/projects/${projectId}/clients/${clientId}`, payload);
      } else {
        // Create new client - include client_id and created_by
        const organizationMemberId = organizationMember?.id;
        return await apiRequest('POST', `/api/projects/${projectId}/clients`, {
          ...payload,
          client_id: data.contactId,
          created_by: organizationMemberId || null,
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

  const handleGoToContacts = () => {
    handleClose();
    setLocation('/contacts');
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
                {contacts.length === 0 ? (
                  <MiniEmptyState
                    message="Aún no tienes contactos creados. Crea tu primer contacto para poder agregarlo como cliente."
                    buttonText="Ir a Contactos"
                    onClick={handleGoToContacts}
                    icon={UserPlus}
                    sidebarLevel="organization"
                  />
                ) : (
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
                )}
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
                <Input
                  {...field}
                  placeholder="Ej: Departamento 101, Casa 5, etc."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="clientRoleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rol del Cliente (Opcional)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clientRoles.length === 0 ? (
                    <SelectItem value="_none" disabled>No hay roles disponibles</SelectItem>
                  ) : (
                    clientRoles.map((role: any) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado (Opcional)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                  <SelectItem value="potential">Potencial</SelectItem>
                  <SelectItem value="rejected">Rechazado</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="deleted">Eliminado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPrimary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>¿Cliente Principal?</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="yes">Sí</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Agregar notas o comentarios adicionales..."
                  rows={3}
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
