import { useState, useEffect, useMemo } from 'react';
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
import { FormModalHeader } from '@/components/modal';
import { FormModalFooter } from '@/components/modal';
import { FormModalLayout } from '@/components/modal';
import { useGlobalModalStore } from '@/components/modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField';
import { MiniEmptyState } from '@/components/ui-custom/fields/MiniEmptyState';
import { Users, UserPlus, Building2, FileText, User, Mail, Phone, Badge as BadgeIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  const { projectId, clientId, mode } = modalData || {};
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const { closeModal } = useGlobalModalStore();
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const organizationId = userData?.organization?.id;
  const isEditing = !!clientId && mode !== 'view';
  const isViewMode = mode === 'view';

  // Query to get available contacts
  const { data: contacts = [], isLoading: contactsLoading } = useQuery<any[]>({
    queryKey: [`/api/contacts?organization_id=${organizationId}`],
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });

  // Query to get client roles (organization_id is derived server-side)
  const { data: clientRoles = [], isLoading: clientRolesLoading } = useQuery<any[]>({
    queryKey: [`/api/client-roles`],
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });

  // Query to get existing client data when editing - with cache optimization
  // Note: The API returns the client object directly (not wrapped in {success, data})
  const { data: existingClient, isLoading: existingClientLoading } = useQuery<any>({
    queryKey: [`/api/projects/${projectId}/clients/${clientId}?organization_id=${organizationId}`],
    enabled: !!clientId && !!projectId && !!organizationId,
    staleTime: 2 * 60 * 1000,
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
    if (existingClient && isEditing) {
      form.reset({
        contactId: existingClient.contact_id || '',
        unit: existingClient.unit || '',
        clientRoleId: existingClient.client_role_id || '',
        status: existingClient.status || 'active',
        isPrimary: existingClient.is_primary ? 'yes' : 'no',
        notes: existingClient.notes || '',
      });
    } else if (!isEditing && !isViewMode) {
      form.reset({
        contactId: '',
        unit: '',
        clientRoleId: '',
        status: 'active',
        isPrimary: 'yes',
        notes: '',
      });
    }
  }, [existingClient, isEditing, isViewMode, form]);

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
                      disabled={isEditing || isViewMode || contactsLoading}
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
                    disabled={isViewMode}
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
                <Select onValueChange={field.onChange} value={field.value} disabled={isViewMode}>
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
                <Select onValueChange={field.onChange} value={field.value} disabled={isViewMode}>
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
                  disabled={isViewMode}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );

  // Helper para obtener datos del contacto actual - recalcula cuando existingClient cambia
  const contactInfo = useMemo(() => {
    if (!existingClient?.contacts) return null;
    const contact = existingClient.contacts;
    const fullName = contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    const initials = fullName.split(' ').map((n: string) => n.charAt(0)).join('').toUpperCase().slice(0, 2);
    return { ...contact, fullName, initials };
  }, [existingClient]);

  // Helper para obtener rol del cliente - recalcula cuando existingClient o clientRoles cambian
  const roleInfo = useMemo(() => {
    if (!existingClient?.client_role_id) return null;
    const role = clientRoles.find((r: any) => r.id === existingClient.client_role_id);
    return role;
  }, [existingClient, clientRoles]);

  // Helper para obtener badge de estado - recalcula cuando existingClient cambia
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

  const viewPanel = (
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

        <h2 className="text-2xl font-bold text-foreground mb-2">
          {contactInfo?.fullName || 'Sin nombre'}
        </h2>

        {/* Rol del cliente */}
        {roleInfo && (
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            <Badge className="bg-accent text-white">
              {roleInfo.name}
            </Badge>
          </div>
        )}

        {/* Estado */}
        <div className="flex items-center justify-center gap-1">
          <Badge variant={statusBadge.variant}>
            {statusBadge.label}
          </Badge>
          {existingClient?.is_primary && (
            <Badge variant="default" className="bg-green-600 text-white">
              Cliente Principal
            </Badge>
          )}
        </div>
      </div>

      <Separator />

      {/* Información de contacto */}
      <div className="grid grid-cols-1 gap-4">
        {contactInfo?.email && (
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
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
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
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

        {existingClient?.unit && (
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Building2 className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Unidad Funcional</p>
              <p className="font-medium text-sm truncate" title={existingClient.unit}>
                {existingClient.unit}
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
              <p className="text-sm text-foreground leading-relaxed">
                {existingClient.notes}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const headerContent = (
    <FormModalHeader
      title={isViewMode ? "Ver Cliente" : isEditing ? "Editar Cliente" : "Agregar Cliente"}
      description={isViewMode 
        ? "Información del cliente del proyecto"
        : isEditing 
          ? "Modifica la información del cliente del proyecto"
          : "Selecciona un contacto para agregarlo como cliente del proyecto"}
      icon={Users}
    />
  );

  const footerContent = isViewMode ? (
    <FormModalFooter
      submitText="Cerrar"
      onSubmit={handleClose}
    />
  ) : (
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
      viewPanel={isViewMode ? viewPanel : null}
      editPanel={!isViewMode ? editPanel : null}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
      forcedPanel={isViewMode ? "view" : "edit"}
    />
  );
}
