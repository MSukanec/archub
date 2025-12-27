import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/features/users/hooks';
import { CLIENT_QUERY_KEYS } from '@/features/clients/constants';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComboBox } from '@/components/shared/fields/ComboBoxWriteField';
import { MiniEmptyState } from '@/components/shared/fields/MiniEmptyState';
import { Users, UserPlus, FileText, Mail, Phone, Badge as BadgeIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IdentityBadge } from '@/components/shared/IdentityBadge';

const clientSchema = z.object({
  contactId: z.string().min(1, 'Debe seleccionar un contacto'),
  clientRoleId: z.string().optional(),
  status: z.enum(['active', 'inactive', 'deleted', 'potential', 'rejected', 'completed']).optional(),
  isPrimary: z.enum(['yes', 'no']).optional(),
  notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

// Subcomponente: Formulario para create/edit
function FormPanel({
  form,
  onSubmit,
  contacts,
  contactsLoading,
  clientRoles,
  clientRolesLoading,
  isEditing,
  isViewMode,
  handleGoToContacts,
  isLoadingExisting,
}: {
  form: ReturnType<typeof useForm<ClientFormData>>;
  onSubmit: (data: ClientFormData) => void;
  contacts: any[];
  contactsLoading: boolean;
  clientRoles: any[];
  clientRolesLoading: boolean;
  isEditing: boolean;
  isViewMode: boolean;
  handleGoToContacts: () => void;
  isLoadingExisting?: boolean;
}) {
  const contactOptions = contacts
    .map(contact => {
      const fullName = contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.company_name;
      const avatarUrl = contact.linked_user?.avatar_url 
        || (contact.image_bucket && contact.image_path 
          ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${contact.image_bucket}/${contact.image_path}`
          : null);
      return {
        value: contact.id,
        label: fullName || contact.email,
        firstName: contact.first_name,
        lastName: contact.last_name,
        fullName: fullName,
        email: contact.email,
        avatarUrl,
        linkedUser: contact.linked_user,
      };
    })
    .sort((a, b) => (a.label || '').localeCompare(b.label || '', 'es'));

  if (isLoadingExisting) {
    return (
      <div className="space-y-4 p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
        <p className="text-sm text-muted-foreground">Cargando información del cliente...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Row 1: Contacto / Rol del Cliente (2 columns on desktop, 1 on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contactId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Contacto <span className="text-red-500">*</span>
                </FormLabel>
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
                      disabled={isEditing || isViewMode || contactsLoading}
                      data-testid="combobox-client-contact"
                      renderOption={(option) => (
                        <IdentityBadge
                          name={option.fullName || option.label}
                          avatarUrl={option.avatarUrl}
                          linkedUser={option.linkedUser}
                          subLabel={option.email}
                          size="sm"
                        />
                      )}
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
                <Select onValueChange={field.onChange} value={field.value} disabled={isViewMode || clientRolesLoading}>
                  <FormControl>
                    <SelectTrigger data-testid="select-client-role">
                      <SelectValue placeholder={clientRolesLoading ? "Cargando roles..." : "Seleccionar rol..."} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Sin rol</SelectItem>
                    {clientRoles && clientRoles.length > 0 ? (
                      [...clientRoles].sort((a: any, b: any) => a.name.localeCompare(b.name, 'es')).map((role: any) => (
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

        {/* Row 2: Estado / Cliente Principal (2 columns on desktop, 1 on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado (Opcional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isViewMode}>
                  <FormControl>
                    <SelectTrigger data-testid="select-client-status">
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
                <Select onValueChange={field.onChange} value={field.value} disabled={isViewMode}>
                  <FormControl>
                    <SelectTrigger data-testid="select-client-primary">
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
                  disabled={isViewMode}
                  data-testid="textarea-client-notes"
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

// Subcomponente: Vista de lectura
function ViewPanel({
  existingClient,
  contactInfo,
  roleInfo,
  statusBadge,
}: {
  existingClient: any;
  contactInfo: any;
  roleInfo: any;
  statusBadge: any;
}) {
  return (
    <div className="space-y-6">
      {/* Header con avatar y nombre */}
      <div className="text-center pt-4 pb-6">
        <div className="flex justify-center mb-4">
          <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
            {contactInfo?.linked_user?.avatar_url && (
              <AvatarImage 
                src={contactInfo.linked_user.avatar_url} 
                alt={`Avatar de ${contactInfo.fullName}`}
                className="object-cover"
              />
            )}
            <AvatarFallback className="text-2xl font-bold bg-accent text-white">
              {contactInfo?.initials || '??'}
            </AvatarFallback>
          </Avatar>
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-2" data-testid="text-client-name">
          {contactInfo?.fullName || 'Sin nombre'}
        </h2>

        {/* Rol del cliente */}
        {roleInfo && (
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            <Badge className="bg-accent text-white" data-testid="badge-client-role">
              {roleInfo.name}
            </Badge>
          </div>
        )}

        {/* Estado */}
        <div className="flex items-center justify-center gap-1">
          <Badge variant={statusBadge.variant} data-testid="badge-client-status">
            {statusBadge.label}
          </Badge>
          {existingClient?.is_primary && (
            <Badge variant="success" data-testid="badge-client-primary">
              Cliente Principal
            </Badge>
          )}
        </div>
      </div>

      <Separator />

      {/* Información de contacto */}
      <div className="grid grid-cols-1 gap-4">
        {contactInfo?.email && (
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-card" data-testid="card-client-email">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Mail className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium text-sm truncate" title={contactInfo.email}>
                {contactInfo.email}
              </p>
            </div>
          </div>
        )}

        {contactInfo?.phone && (
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-card" data-testid="card-client-phone">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Phone className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Teléfono</p>
              <p className="font-medium text-sm truncate" title={contactInfo.phone}>
                {contactInfo.phone}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Notas */}
      {existingClient?.notes && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-accent" />
              Notas
            </h3>
            <div className="p-3 rounded-lg border bg-card">
              <p className="text-sm text-foreground leading-relaxed" data-testid="text-client-notes">
                {existingClient.notes}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface ClientFormProps {
  modalData?: {
    projectId?: string;
    clientId?: string;
  };
  onClose: () => void;
  mode?: 'create' | 'edit' | 'view';
}

export function ClientForm({ modalData, onClose, mode = 'create' }: ClientFormProps) {
  const { projectId, clientId } = modalData || {};
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const organizationId = userData?.organization?.id;
  const isEditing = mode === 'edit';
  const isViewMode = mode === 'view';

  // Query to get available contacts - use LIGHT mode for fast loading
  const { data: allContacts = [], isLoading: contactsLoading } = useQuery<any[]>({
    queryKey: [`/api/contacts?organization_id=${organizationId}&mode=light`],
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });

  // Query to get existing project clients (to filter them from contact selector)
  const { data: existingProjectClients = [], refetch: refetchProjectClients } = useQuery<any[]>({
    queryKey: CLIENT_QUERY_KEYS.projectClients(projectId),
    enabled: !!organizationId && !!projectId && !isEditing && !isViewMode,
    staleTime: 0, // Always fresh to prevent showing already-added clients
  });

  // Query to get client roles
  const { data: clientRoles = [], isLoading: clientRolesLoading } = useQuery<any[]>({
    queryKey: [`/api/client-roles`],
    enabled: !!organizationId,
    staleTime: 60 * 1000, // 1 minute
  });

  // Query to get existing client data when editing
  // Use URL as queryKey so default fetcher works correctly
  const clientQueryUrl = `/api/projects/${projectId}/clients/${clientId}?organization_id=${organizationId}`;
  const { data: existingClient, isLoading: existingClientLoading } = useQuery<any>({
    queryKey: [clientQueryUrl],
    enabled: !!clientId && !!projectId && !!organizationId && (isEditing || isViewMode),
    staleTime: 0, // Always fetch fresh data when editing
  });

  // Filter out contacts that are already clients of this project (only in create mode)
  // In edit mode, ensure the current client's contact is always included in the list
  const contacts = useMemo(() => {
    if (isEditing || isViewMode) {
      // In edit/view mode, we need to ensure the current contact is in the list
      // even if it wouldn't normally be returned by the light query
      if (existingClient?.contact_id && existingClient?.contacts) {
        const contactInList = allContacts.find((c: any) => c.id === existingClient.contact_id);
        if (!contactInList) {
          // Add the current client's contact to the list
          const currentContact = existingClient.contacts;
          return [...allContacts, {
            id: currentContact.id,
            first_name: currentContact.first_name,
            last_name: currentContact.last_name,
            full_name: currentContact.full_name,
            email: currentContact.email,
            phone: currentContact.phone,
          }];
        }
      }
      return allContacts;
    }
    
    const existingContactIds = new Set(
      existingProjectClients.map((client: any) => client.contact_id)
    );
    
    return allContacts.filter((contact: any) => !existingContactIds.has(contact.id));
  }, [allContacts, existingProjectClients, isEditing, isViewMode, existingClient]);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      contactId: '',
      clientRoleId: '',
      status: 'active',
      isPrimary: 'yes',
      notes: '',
    },
  });

  // Load existing data when editing or viewing
  useEffect(() => {
    if (existingClient && (isEditing || isViewMode)) {
      form.reset({
        contactId: existingClient.contact_id || '',
        clientRoleId: existingClient.client_role_id || '',
        status: existingClient.status || 'active',
        isPrimary: existingClient.is_primary ? 'yes' : 'no',
        notes: existingClient.notes || '',
      });
    }
  }, [existingClient, isEditing, isViewMode, form]);

  const saveClientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      if (!organizationId || !projectId) throw new Error('Missing organization or project ID');

      const payload: any = {
        organization_id: organizationId,
        client_role_id: (data.clientRoleId && data.clientRoleId !== '') ? data.clientRoleId : null,
        status: data.status || 'active',
        is_primary: data.isPrimary === 'yes',
        notes: data.notes || null,
      };

      if (isEditing) {
        return await apiRequest('PATCH', `/api/projects/${projectId}/clients/${clientId}`, payload);
      } else {
        return await apiRequest('POST', `/api/projects/${projectId}/clients`, {
          ...payload,
          contact_id: data.contactId,
        });
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: CLIENT_QUERY_KEYS.dashboard(projectId),
          refetchType: 'all',
        }),
        queryClient.invalidateQueries({
          queryKey: CLIENT_QUERY_KEYS.projectClients(projectId),
          refetchType: 'all',
        }),
        queryClient.invalidateQueries({
          queryKey: [`/api/contacts?organization_id=${organizationId}&mode=light`],
          refetchType: 'all',
        }),
        ...(isEditing && clientId && organizationId ? [
          queryClient.invalidateQueries({
            queryKey: [clientQueryUrl],
            refetchType: 'all',
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
    } finally {
      setIsLoading(false);
    }
  };

  // Helper para obtener datos del contacto actual
  const contactInfo = useMemo(() => {
    if (!existingClient?.contacts) return null;
    const contact = existingClient.contacts;
    const fullName = contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    const initials = fullName.split(' ').map((n: string) => n.charAt(0)).join('').toUpperCase().slice(0, 2);
    return { ...contact, fullName, initials };
  }, [existingClient]);

  // Helper para obtener rol del cliente
  const roleInfo = useMemo(() => {
    if (!existingClient?.client_role_id) return null;
    return clientRoles.find((r: any) => r.id === existingClient.client_role_id);
  }, [existingClient, clientRoles]);

  // Helper para obtener badge de estado
  const statusBadge = useMemo(() => {
    const status = existingClient?.status || 'active';
    const badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: 'Activo', variant: 'default' },
      inactive: { label: 'Inactivo', variant: 'secondary' },
      potential: { label: 'Potencial', variant: 'outline' },
      rejected: { label: 'Rechazado', variant: 'destructive' },
      completed: { label: 'Completado', variant: 'default' },
      deleted: { label: 'Eliminado', variant: 'destructive' },
    };
    return badges[status] || badges.active;
  }, [existingClient]);

  const getHeader = () => {
    switch (mode) {
      case 'view':
        return {
          title: 'Ver Cliente',
          description: 'Información del cliente del proyecto',
        };
      case 'edit':
        return {
          title: 'Editar Cliente',
          description: 'Modifica la información del cliente del proyecto',
        };
      case 'create':
      default:
        return {
          title: 'Agregar Cliente',
          description: 'Selecciona un contacto para agregarlo como cliente del proyecto',
        };
    }
  };

  const header = getHeader();
  const isLoadingData = existingClientLoading || contactsLoading || clientRolesLoading;

  return (
    <ModalLayout onClose={handleClose} size="lg">
      <ModalHeader
        title={header.title}
        description={header.description}
        icon={Users}
      />

      <ModalBody>
        {mode === 'view' ? (
          existingClientLoading ? (
            <div className="space-y-4 p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
              <p className="text-sm text-muted-foreground">Cargando información del cliente...</p>
            </div>
          ) : existingClient ? (
            <ViewPanel
              existingClient={existingClient}
              contactInfo={contactInfo}
              roleInfo={roleInfo}
              statusBadge={statusBadge}
            />
          ) : null
        ) : (
          <FormPanel
            form={form}
            onSubmit={handleSubmit}
            contacts={contacts}
            contactsLoading={contactsLoading}
            clientRoles={clientRoles}
            clientRolesLoading={clientRolesLoading}
            isEditing={isEditing}
            isViewMode={isViewMode}
            handleGoToContacts={handleGoToContacts}
            isLoadingExisting={existingClientLoading && (isEditing || isViewMode)}
          />
        )}
      </ModalBody>

      {mode !== 'view' && (
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={handleClose}
          rightLabel={isEditing ? 'Guardar Cambios' : 'Agregar Cliente'}
          onRightClick={form.handleSubmit(handleSubmit)}
          isSubmitting={isLoading || isLoadingData}
          submitDisabled={isLoading || isLoadingData}
          data-testid="footer-client-form"
        />
      )}
      
      {mode === 'view' && (
        <ModalFooter
          leftLabel="Cerrar"
          onLeftClick={handleClose}
          data-testid="footer-client-view"
        />
      )}
    </ModalLayout>
  );
}
