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
import { CLIENT_QUERY_KEYS } from '@/features/clients/constants';
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

interface ClientDataModalProps {
  modalData?: {
    projectId?: string;
    clientId?: string;
    mode?: 'view' | 'edit';
  };
  onClose: () => void;
}

export function ProjectClientModal({ modalData, onClose }: ClientDataModalProps) {
  const { projectId, clientId } = modalData || {};
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const { closeModal } = useGlobalModalStore();
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const organizationId = userData?.organization?.id;
  const isEditing = !!clientId;

  // Query to get available contacts
  const { data: contacts = [], isLoading: contactsLoading } = useQuery<any[]>({
    queryKey: [`/api/contacts?organization_id=${organizationId}`],
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes - cache contacts for better UX
  });

  // Query to get client roles (organization_id is derived server-side)
  const { data: clientRoles = [], isLoading: clientRolesLoading } = useQuery<any[]>({
    queryKey: [`/api/client-roles`],
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes - cache client roles for better UX
  });

  // Query to get existing client data when editing - with cache optimization
  const { data: existingClient } = useQuery<any>({
    queryKey: CLIENT_QUERY_KEYS.projectClient(projectId, clientId, organizationId),
    enabled: !!clientId && !!projectId && !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes - use cached data if available
  });

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      contactId: '',
      unit: '',
      clientRoleId: '',
      status: 'active',
      isPrimary: 'yes',
      notes: '',
    },
  });

  // Load existing data when editing
  useEffect(() => {
    if (existingClient) {
      form.reset({
        contactId: existingClient.contact_id,
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
        isPrimary: 'yes',
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
        client_role_id: (data.clientRoleId && data.clientRoleId !== '') ? data.clientRoleId : null,
        status: data.status || 'active',
        is_primary: data.isPrimary === 'yes',
        notes: data.notes || null,
      };

      if (isEditing) {
        // Update existing client
        return await apiRequest('PATCH', `/api/projects/${projectId}/clients/${clientId}`, payload);
      } else {
        // Create new client - backend derives created_by from session
        return await apiRequest('POST', `/api/projects/${projectId}/clients`, {
          ...payload,
          contact_id: data.contactId,
        });
      }
    },
    onSuccess: async () => {
      // Targeted cache invalidation in parallel for optimal performance
      await Promise.all([
        // Invalidate client dashboard KPIs
        queryClient.invalidateQueries({
          queryKey: CLIENT_QUERY_KEYS.dashboard(projectId),
        }),
        // Invalidate project clients list
        queryClient.invalidateQueries({
          queryKey: CLIENT_QUERY_KEYS.projectClients(projectId),
        }),
        // Invalidate specific client if editing
        ...(isEditing && clientId && organizationId ? [
          queryClient.invalidateQueries({
            queryKey: CLIENT_QUERY_KEYS.projectClient(projectId, clientId, organizationId),
          })
        ] : []),
      ]);
      
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
        {/* Row 1: Contacto / Rol del Cliente (2 columns on desktop, 1 on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contactId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contacto</FormLabel>
                <FormControl>
                  {!contactsLoading && contacts.length === 0 ? (
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
                      placeholder={contactsLoading ? "Cargando contactos..." : "Seleccionar contacto..."}
                      searchPlaceholder="Buscar contacto..."
                      emptyMessage="No se encontraron contactos."
                      className="w-full"
                      disabled={isEditing || contactsLoading}
                    />
                  )}
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
                <Select onValueChange={field.onChange} value={field.value} disabled={clientRolesLoading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={clientRolesLoading ? "Cargando roles..." : "Seleccionar rol..."} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Sin rol</SelectItem>
                    {clientRoles && clientRoles.length > 0 ? (
                      clientRoles.map((role: any) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))
                    ) : null}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 2: Unidad Funcional / Estado / Cliente Principal (3 columns on desktop, 1 on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidad Funcional (Opcional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Ej: Dpto 101"
                  />
                </FormControl>
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
        </div>

        {/* Row 3: Notas (full width) */}
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
