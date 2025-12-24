import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Phone, Building, MapPin, Link2, Share2, Upload, User, Paperclip, FileText, Image as ImageIcon, Film } from "lucide-react";
import { Separator } from "@/components/ui/separator";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ComboBoxMultiSelectField } from "@/components/shared/fields/ComboBoxMultiSelectField";
import { FileUploader } from "@/components/shared/fields/FileUploader";
import { PhoneField } from "@/components/shared/fields/PhoneField";
import { AvatarUploader } from "@/components/shared/fields/AvatarUploader";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useContactTypes, useContact, useContactAttachments } from "@/features/contacts/hooks";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { contactsKeys } from "@/core/query-keys";
import { uploadContactAvatar, getContactAvatarUrl, uploadContactDocument } from "@/lib/storage/uploadHelpers";
import { deleteFile } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { logActivity, ACTIVITY_ACTIONS, TARGET_TABLES } from '@/utils/logActivity';
import type { ContactMediaLink } from '../services/getContactAttachments';

const createContactSchema = z.object({
  first_name: z.string().min(1, "El nombre es requerido"),
  last_name: z.string().optional(),
  email: z.union([z.string().email("Email inválido"), z.literal("")]).optional(),
  phone: z.string().optional(),
  contact_type_ids: z.array(z.string()).optional(),
  company_name: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  linked_user_id: z.string().optional(),
}).refine((data) => {
  if (!data.linked_user_id && !data.first_name) {
    return false;
  }
  return true;
}, {
  message: "El nombre es requerido cuando no hay usuario vinculado",
  path: ["first_name"],
});

export type CreateContactForm = z.infer<typeof createContactSchema>;

export type Contact = import('@/features/contacts/types').ContactWithRelations;

function getDisplayName(contact: Contact | undefined | null): string {
  return contact?.full_name || `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim() || 'Sin nombre';
}

function getInitials(contact: Contact | undefined | null): string {
  const name = getDisplayName(contact);
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface FormPanelProps {
  form: ReturnType<typeof useForm<CreateContactForm>>;
  onSubmit: (data: CreateContactForm) => void;
  isSubmitting: boolean;
  contact?: Contact;
  contactTypes?: any[];
  foundUser?: any;
  isAlreadyMember?: boolean;
  inviteMemberMutation?: any;
  onAvatarChange: (file: File) => Promise<void>;
  avatarUploading: boolean;
  filesToUpload: any[];
  setFilesToUpload: (files: any[]) => void;
  existingFiles: any[];
  onExistingFileDelete: (fileId: string) => Promise<void>;
  currentAvatarUrl?: string;
}

export function FormPanel({
  form,
  onSubmit,
  isSubmitting,
  contact,
  contactTypes,
  foundUser,
  isAlreadyMember,
  inviteMemberMutation,
  onAvatarChange,
  avatarUploading,
  filesToUpload,
  setFilesToUpload,
  existingFiles,
  onExistingFileDelete,
  currentAvatarUrl,
}: FormPanelProps) {
  const linkedUser = contact?.linked_user || foundUser;
  
  const firstName = form.watch('first_name');
  const lastName = form.watch('last_name');
  
  const displayNameLive = `${firstName || ''} ${lastName || ''}`.trim() || 'Sin nombre';
  
  const initials = displayNameLive
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <AvatarUploader
          avatarUrl={currentAvatarUrl}
          initials={initials}
          displayName={displayNameLive}
          onAvatarSelect={onAvatarChange}
          isUploading={avatarUploading}
        />

        {linkedUser && (
          <div className="mb-4 p-3 border border-accent/20 bg-accent/5 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link2 className="h-4 w-4 text-accent" />
              <div>
                <p className="text-sm font-medium">Vinculado a usuario de Archub</p>
                <p className="text-xs text-muted-foreground">
                  {linkedUser.full_name || 'Usuario vinculado'}
                </p>
              </div>
            </div>
            {!isAlreadyMember && contact?.linked_user && inviteMemberMutation && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => inviteMemberMutation.mutate()}
                disabled={inviteMemberMutation.isPending}
                data-testid="button-invite-to-organization"
              >
                {inviteMemberMutation.isPending ? 'Invitando...' : 'Invitar'}
              </Button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Nombre" 
                    {...field}
                    disabled={!!contact?.linked_user}
                    data-testid="input-first-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Apellido" 
                    {...field}
                    disabled={!!contact?.linked_user}
                    data-testid="input-last-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="email@ejemplo.com" 
                  {...field} 
                  disabled={!!contact?.linked_user}
                  data-testid="input-email"
                />
              </FormControl>
              <FormMessage />
              
              {foundUser && field.value && field.value.length > 0 && !contact?.linked_user && (
                <div className="mt-2">
                  <div className="flex items-start gap-2 p-2 border border-accent/20 bg-accent/5 rounded-md">
                    <Link2 className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">
                        Ya existe un usuario de Archub con este correo.
                      </p>
                      <p className="text-xs text-accent font-medium mt-0.5">
                        Vinculado a {foundUser.full_name}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <PhoneField
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Número de teléfono"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact_type_ids"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipos de contacto</FormLabel>
                <FormControl>
                  <ComboBoxMultiSelectField
                    options={contactTypes?.map(type => ({
                      value: type.id,
                      label: type.name
                    })) || []}
                    value={field.value || []}
                    onChange={field.onChange}
                    placeholder="Seleccionar tipos de contacto..."
                    searchPlaceholder="Buscar tipos..."
                    emptyText="No hay tipos disponibles"
                    className="w-full min-h-[40px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="company_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre de la empresa" {...field} data-testid="input-company-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ubicación</FormLabel>
                <FormControl>
                  <Input placeholder="Ciudad, país" {...field} data-testid="input-location" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Notas adicionales sobre el contacto" 
                  {...field} 
                  rows={3}
                  data-testid="textarea-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />
        <div className="space-y-2">
          <FormLabel className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Archivos adjuntos
          </FormLabel>
          <p className="text-xs text-muted-foreground">
            Gestiona los archivos adjuntos del contacto
          </p>
          <FileUploader
            mode="multiple"
            existingFiles={existingFiles}
            filesToUpload={filesToUpload}
            onFilesChange={setFilesToUpload}
            onExistingFileDelete={onExistingFileDelete}
            emptyStateDescription="Arrastra archivos o haz clic para seleccionar"
            newFileBadgeText="Nuevo"
            maxSize={10 * 1024 * 1024}
            accept={{
              'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
              'application/pdf': ['.pdf'],
            }}
          />
        </div>

      </form>
    </Form>
  );
}

interface ViewPanelProps {
  contact: Contact;
  contactAvatarUrl?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  existingFiles: any[];
  handleShare: () => void;
  inviteMemberMutation?: any;
  isAlreadyMember?: boolean;
}

export function ViewPanel({
  contact,
  contactAvatarUrl,
  onEdit,
  onDelete,
  existingFiles,
  handleShare,
  inviteMemberMutation,
  isAlreadyMember,
}: ViewPanelProps) {
  const displayName = getDisplayName(contact);
  const linkedUserAvatarUrl = contact.linked_user?.avatar_url || "";

  const handleCall = () => {
    if (contact.phone) {
      window.location.href = `tel:${contact.phone}`;
    }
  };

  const handleEmail = () => {
    if (contact.email) {
      window.location.href = `mailto:${contact.email}`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center pt-4 pb-6">
        <div className="flex justify-center mb-4">
          <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
            {contactAvatarUrl && contactAvatarUrl.trim() !== '' && (
              <AvatarImage 
                src={contactAvatarUrl} 
                alt={`Avatar de ${displayName}`}
                className="object-cover"
              />
            )}
            {!contactAvatarUrl && linkedUserAvatarUrl && linkedUserAvatarUrl.trim() !== '' && (
              <AvatarImage 
                src={linkedUserAvatarUrl} 
                alt={`Avatar de ${displayName}`}
                className="object-cover"
              />
            )}
            <AvatarFallback className="text-2xl font-bold bg-accent text-white">
              {getInitials(contact)}
            </AvatarFallback>
          </Avatar>
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-2" data-testid="text-contact-name">
          {displayName}
        </h2>

        {contact.contact_types && contact.contact_types.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {contact.contact_types.map((type: any) => (
              <Badge
                key={type.id}
                className="bg-accent text-white"
                data-testid={`badge-contact-type-${type.id}`}
              >
                {type.name}
              </Badge>
            ))}
          </div>
        )}

        {contact.linked_user && (
          <div className="flex items-center justify-center gap-1 mb-4">
            <User className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-600 font-medium">Usuario de Archub</span>
          </div>
        )}
      </div>

      <Separator />

      {contact.linked_user && !isAlreadyMember && inviteMemberMutation && (
        <div className="p-3 border border-accent/20 bg-accent/5 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link2 className="h-4 w-4 text-accent" />
            <div>
              <p className="text-sm font-medium">Usuario de Archub</p>
              <p className="text-xs text-muted-foreground">Invítalo a tu organización</p>
            </div>
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => inviteMemberMutation.mutate()}
            disabled={inviteMemberMutation.isPending}
            data-testid="button-invite-to-organization"
          >
            {inviteMemberMutation.isPending ? 'Invitando...' : 'Invitar'}
          </Button>
        </div>
      )}

      <div className={`grid gap-3 ${contact.phone && contact.email ? 'grid-cols-3' : contact.phone || contact.email ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {contact.phone && (
          <Button
            variant="default"
            onClick={handleCall}
            className="flex items-center gap-2 py-3"
            data-testid="button-call-contact"
          >
            <Phone className="h-4 w-4" />
            Llamar
          </Button>
        )}
        {contact.email && (
          <Button
            variant="default"
            onClick={handleEmail}
            className="flex items-center gap-2 py-3"
            data-testid="button-email-contact"
          >
            <Mail className="h-4 w-4" />
            Email
          </Button>
        )}
        <Button
          variant="default"
          onClick={handleShare}
          className="flex items-center gap-2 py-3"
          data-testid="button-share-contact"
        >
          <Share2 className="h-4 w-4" />
          Compartir
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {contact.email && (
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Mail className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium text-sm truncate" title={contact.email}>
                {contact.email}
              </p>
            </div>
          </div>
        )}

        {contact.phone && (
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Phone className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Teléfono</p>
              <p className="font-medium text-sm truncate" title={contact.phone}>
                {contact.phone}
              </p>
            </div>
          </div>
        )}

        {contact.company_name && (
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Building className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Empresa</p>
              <p className="font-medium text-sm truncate" title={contact.company_name}>
                {contact.company_name}
              </p>
            </div>
          </div>
        )}

        {contact.location && (
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
            <div className="p-2 bg-accent/10 rounded-lg">
              <MapPin className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Ubicación</p>
              <p className="font-medium text-sm truncate" title={contact.location}>
                {contact.location}
              </p>
            </div>
          </div>
        )}
      </div>

      {contact.notes && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Notas</h3>
          <div className="p-3 rounded-lg border bg-card">
            <p className="text-sm text-foreground leading-relaxed">
              {contact.notes}
            </p>
          </div>
        </div>
      )}

      {existingFiles && existingFiles.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Archivos adjuntos ({existingFiles.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {existingFiles.map((file: any) => {
              const isImage = file.file_type === 'image' || file.file_type?.startsWith('image/');
              const isVideo = file.file_type === 'video' || file.file_type?.startsWith('video/');
              
              return (
                <a
                  key={file.id}
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square rounded-lg border bg-muted/30 overflow-hidden hover:border-accent transition-colors"
                >
                  {isImage && file.file_url ? (
                    <img
                      src={file.file_url}
                      alt={file.file_name}
                      className="w-full h-full object-cover"
                    />
                  ) : isVideo ? (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Film className="h-8 w-8 text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-xs text-white truncate font-medium">
                      {file.file_name}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

interface UseContactFormProps {
  contactId?: string;
  contact?: Contact;
  mode: "create" | "edit" | "view";
  onSuccess?: () => void;
}

export function useContactForm({ contactId, contact, mode, onSuccess }: UseContactFormProps) {
  const { data: userData } = useCurrentUser();
  const { toast } = useToast();
  
  const organizationId = userData?.organization?.id;

  const [foundUser, setFoundUser] = useState<any>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [contactAvatarUrl, setContactAvatarUrl] = useState<string>('');
  const [filesToUpload, setFilesToUpload] = useState<any[]>([]);

  const { data: fetchedContact, isLoading: contactLoading } = useContact(organizationId, contactId);

  const { data: contactTypes } = useContactTypes(organizationId);

  const { data: attachmentsData = [], refetch: refetchAttachments } = useContactAttachments(contactId, organizationId);

  const editingContact = contact || fetchedContact;

  const existingFiles = (attachmentsData || []).map((link: ContactMediaLink) => ({
    id: link.media_file?.id || link.id,
    file_name: link.media_file?.file_name || 'Archivo adjunto',
    file_type: link.media_file?.file_type || 'document',
    file_size: link.media_file?.file_size || 0,
    file_url: link.media_file?.file_url || '',
    isExisting: true,
  }));

  const handleExistingFileDelete = async (fileId: string) => {
    try {
      await deleteFile(fileId, false);
      await refetchAttachments();
      toast({
        title: 'Archivo eliminado',
        description: 'El archivo ha sido eliminado correctamente',
      });
    } catch (error: any) {
      toast({
        title: 'Error al eliminar archivo',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (!editingContact?.id) {
      setContactAvatarUrl('');
      return;
    }

    const loadAvatarUrl = async () => {
      const url = await getContactAvatarUrl(editingContact.id);
      setContactAvatarUrl(url || '');
    };

    loadAvatarUrl();
  }, [editingContact?.id]);

  const currentAvatarUrl = contactAvatarUrl;

  const form = useForm<CreateContactForm>({
    resolver: zodResolver(createContactSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      contact_type_ids: [],
      company_name: '',
      location: '',
      notes: '',
      linked_user_id: '',
    }
  });

  useEffect(() => {
    if (editingContact?.id) {
      form.reset({
        first_name: editingContact.first_name || '',
        last_name: editingContact.last_name || '',
        email: editingContact.email || '',
        phone: editingContact.phone || '',
        contact_type_ids: editingContact.contact_types?.map((ct: any) => ct.id) || [],
        company_name: editingContact.company_name || '',
        location: editingContact.location || '',
        notes: editingContact.notes || '',
        linked_user_id: editingContact.linked_user_id || '',
      });
    }
  }, [editingContact?.id, form]);

  const linkedUserId = editingContact?.linked_user_id || form.watch('linked_user_id');

  const { data: roles = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['/api/roles'],
    staleTime: 10 * 60 * 1000,
  });

  const { data: isMemberData } = useQuery<{ isMember: boolean } | null>({
    queryKey: ['/api/organization-members', linkedUserId, organizationId],
    enabled: !!linkedUserId && !!organizationId,
    staleTime: 5 * 60 * 1000,
  });

  const isAlreadyMember = isMemberData?.isMember || false;

  const emailValue = form.watch('email');

  useEffect(() => {
    if (!emailValue || emailValue.trim().length === 0) {
      setFoundUser(null);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue.trim())) {
      setFoundUser(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      setFoundUser(null);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [emailValue]);

  useEffect(() => {
    if (foundUser) {
      const nameParts = foundUser.full_name?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      form.setValue("linked_user_id", foundUser.id);
      form.setValue("first_name", firstName);
      form.setValue("last_name", lastName);
      form.setValue("email", foundUser.email || '');
    } else {
      if (!editingContact?.linked_user) {
        form.setValue("linked_user_id", "");
      }
    }
  }, [foundUser, form, editingContact]);

  const inviteMemberMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId || !editingContact?.linked_user?.email) {
        throw new Error('Faltan datos para invitar al usuario');
      }

      const defaultRole = roles.find(r => !r.name.toLowerCase().includes('admin'));
      if (!defaultRole) {
        throw new Error('No se encontró un rol válido');
      }

      const response = await apiRequest('POST', '/api/invite-member', {
        email: editingContact.linked_user.email,
        roleId: defaultRole.id,
        organizationId: organizationId,
      });

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      queryClient.invalidateQueries({ queryKey: ['is-member', linkedUserId, organizationId] });
      toast({
        title: 'Usuario invitado',
        description: 'La invitación ha sido enviada',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAvatarUpload = async (file: File) => {
    if (!editingContact?.id || !organizationId) return;
    
    try {
      setAvatarUploading(true);
      
      const result = await uploadContactAvatar(file, editingContact.id, organizationId);
      
      setContactAvatarUrl(result.url);
      
      await queryClient.refetchQueries({ 
        queryKey: contactsKeys.list(organizationId) 
      });
      await queryClient.refetchQueries({ 
        queryKey: contactsKeys.detail(organizationId, editingContact.id) 
      });
      
      toast({
        title: 'Avatar actualizado',
        description: 'La foto de perfil ha sido actualizada exitosamente'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo subir el avatar',
        variant: 'destructive'
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  const createContactMutation = useMutation({
    mutationFn: async (data: CreateContactForm) => {
      if (!userData?.organization?.id) throw new Error('Organization ID not found');

      const orgId = userData.organization.id;

      if (mode === 'edit' && editingContact) {
        if (data.email && data.email.trim().length > 0 && data.email !== editingContact.email) {
          const { data: existingContact, error: checkError } = await supabase
            .from('contacts')
            .select('id, first_name, last_name, email')
            .eq('organization_id', orgId)
            .ilike('email', data.email.trim())
            .neq('id', editingContact.id)
            .maybeSingle();

          if (checkError) throw checkError;
          if (existingContact) {
            const contactName = `${existingContact.first_name} ${existingContact.last_name || ''}`.trim();
            throw new Error(`Ya existe otro contacto con el email "${data.email}" (${contactName}). No se pueden tener contactos duplicados con el mismo email.`);
          }
        }

        const fullName = [data.first_name, data.last_name]
          .filter(Boolean)
          .join(' ')
          .trim() || null;

        const { data: updatedContact, error } = await supabase
          .from('contacts')
          .update({
            first_name: data.first_name,
            last_name: data.last_name || null,
            full_name: fullName,
            email: data.email || null,
            phone: data.phone || null,
            company_name: data.company_name || null,
            location: data.location || null,
            notes: data.notes || null,
            linked_user_id: data.linked_user_id || null,
          })
          .eq('id', editingContact.id)
          .select()
          .single();

        if (error) throw error;

        const newTypeIds = data.contact_type_ids || [];
        
        const { data: currentLinks } = await supabase
          .from('contact_type_links')
          .select('id, contact_type_id')
          .eq('contact_id', editingContact.id);
        
        const currentTypeIds = (currentLinks || []).map(link => link.contact_type_id);
        
        const typesToAdd = newTypeIds.filter(id => !currentTypeIds.includes(id));
        const linksToRemove = (currentLinks || []).filter(link => !newTypeIds.includes(link.contact_type_id));
        
        for (const link of linksToRemove) {
          await supabase
            .from('contact_type_links')
            .delete()
            .eq('id', link.id);
        }
        
        if (typesToAdd.length > 0) {
          const typeLinks = typesToAdd.map(typeId => ({
            contact_id: editingContact.id,
            contact_type_id: typeId,
            organization_id: orgId,
          }));

          const { error: linksError } = await supabase
            .from('contact_type_links')
            .insert(typeLinks);

          if (linksError) throw linksError;
        }

        return updatedContact;
      } else {
        if (data.email && data.email.trim().length > 0) {
          const { data: existingContact, error: checkError } = await supabase
            .from('contacts')
            .select('id, first_name, last_name, email')
            .eq('organization_id', orgId)
            .ilike('email', data.email.trim())
            .maybeSingle();

          if (checkError) throw checkError;
          if (existingContact) {
            const contactName = `${existingContact.first_name} ${existingContact.last_name || ''}`.trim();
            throw new Error(`Ya existe un contacto con el email "${data.email}" (${contactName}). No se pueden crear contactos duplicados con el mismo email.`);
          }
        }

        const newFullName = [data.first_name, data.last_name]
          .filter(Boolean)
          .join(' ')
          .trim() || null;

        const { data: newContact, error } = await supabase
          .from('contacts')
          .insert({
            organization_id: orgId,
            first_name: data.first_name,
            last_name: data.last_name || null,
            full_name: newFullName,
            email: data.email || null,
            phone: data.phone || null,
            company_name: data.company_name || null,
            location: data.location || null,
            notes: data.notes || null,
            linked_user_id: data.linked_user_id || null,
          })
          .select()
          .single();

        if (error) throw error;

        if (data.contact_type_ids && data.contact_type_ids.length > 0) {
          const typeLinks = data.contact_type_ids.map(typeId => ({
            contact_id: newContact.id,
            contact_type_id: typeId,
            organization_id: orgId,
          }));

          const { error: linksError } = await supabase
            .from('contact_type_links')
            .insert(typeLinks);

          if (linksError) throw linksError;
        }

        return newContact;
      }
    },
    onSuccess: async (result, variables) => {
      const createdContactId = result?.id || editingContact?.id;
      
      if (filesToUpload.length > 0 && createdContactId && organizationId) {
        for (const fileInput of filesToUpload) {
          try {
            if (!fileInput.file) continue;
            
            await uploadContactDocument(
              fileInput.file,
              createdContactId,
              organizationId,
              'document'
            );
          } catch (uploadError: any) {
            console.error('Error uploading contact file:', uploadError);
            toast({
              variant: 'destructive',
              title: 'Error al subir archivo',
              description: uploadError?.message || 'Error desconocido',
            });
          }
        }
        setFilesToUpload([]);
      }
      
      await logActivity({
        organization_id: organizationId || '',
        user_id: userData?.user?.id || '',
        action: mode === 'edit' ? ACTIVITY_ACTIONS.UPDATE_CONTACT : ACTIVITY_ACTIONS.ADD_CONTACT,
        target_table: TARGET_TABLES.CONTACTS,
        target_id: createdContactId || '',
        metadata: { 
          first_name: variables.first_name || '',
          last_name: variables.last_name || '',
          company_name: variables.company_name || ''
        }
      });

      if (mode === 'create') {
        try {
          const { error: checklistError } = await supabase.rpc('tick_home_checklist', {
            p_key: 'create_contact',
            p_value: true
          });
          if (checklistError) console.error('Error updating home checklist:', checklistError);
          queryClient.invalidateQueries({ queryKey: ['current-user'] });
        } catch (error) {
          console.error('Error calling tick_home_checklist:', error);
        }
      }

      queryClient.invalidateQueries({ queryKey: contactsKeys.all });
      queryClient.invalidateQueries({ queryKey: contactsKeys.attachmentList(organizationId, createdContactId) });
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && typeof key[0] === 'string' && key[0].includes('/clients');
        }
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === 'clients';
        }
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && typeof key[0] === 'string' && key[0].includes('/api/contacts');
        }
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === 'personnel';
        }
      });
      
      toast({
        title: mode === 'edit' ? "Contacto actualizado" : "Contacto creado",
        description: mode === 'edit' 
          ? "El contacto ha sido actualizado exitosamente" 
          : "El nuevo contacto ha sido agregado a tu organización",
      });
      
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Hubo un error al procesar el contacto",
        variant: "destructive",
      });
    }
  });

  const onSubmit = async (data: CreateContactForm) => {
    createContactMutation.mutate(data);
  };

  const handleShare = () => {
    if (navigator.share && editingContact) {
      navigator.share({
        title: `Contacto: ${getDisplayName(editingContact)}`,
        text: `${getDisplayName(editingContact)}${editingContact.email ? `\nEmail: ${editingContact.email}` : ''}${editingContact.phone ? `\nTeléfono: ${editingContact.phone}` : ''}`,
      });
    }
  };

  return {
    form,
    onSubmit,
    editingContact,
    contactTypes,
    foundUser,
    isAlreadyMember,
    inviteMemberMutation,
    handleAvatarUpload,
    avatarUploading,
    filesToUpload,
    setFilesToUpload,
    existingFiles,
    handleExistingFileDelete,
    currentAvatarUrl,
    handleShare,
    isSubmitting: createContactMutation.isPending,
    contactLoading,
    organizationId,
  };
}
