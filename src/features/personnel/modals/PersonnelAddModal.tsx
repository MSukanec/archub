import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Search, UserPlus } from 'lucide-react';
import { useLocation } from 'wouter';

import { FormModalLayout } from '@/components/modal';
import { FormModalHeader } from '@/components/modal';
import { FormModalFooter } from '@/components/modal';
import { useGlobalModalStore } from '@/components/modal';

import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { useCurrentUser } from '@/features/users/hooks';
import { useContacts } from '@/features/contacts';
import { useToast } from '@/hooks/use-toast';
import { getAttachmentPublicUrl } from '@/features/contacts/utils';
import { useOrganizationMembers } from '@/features/organization/hooks';
import { useProjectPersonnel, useCreatePersonnel, useContactAttachmentsForPersonnel } from '@/features/personnel/hooks';
import { logActivity, ACTIVITY_ACTIONS, TARGET_TABLES } from '@/utils/logActivity';

const personnelFormSchema = z.object({
  contact_ids: z.array(z.string()).min(1, "Selecciona al menos un contacto")
});

type PersonnelFormData = z.infer<typeof personnelFormSchema>;

interface PersonnelAddModalProps {
  data?: any;
}

export function PersonnelAddModal({ data }: PersonnelAddModalProps) {
  const { toast } = useToast();
  const { closeModal } = useGlobalModalStore();
  const [, setLocation] = useLocation();
  const { data: currentUser } = useCurrentUser();
  const organizationId = currentUser?.organization?.id;
  const { data: contacts = [] } = useContacts(organizationId);
  const projectId = currentUser?.preferences?.last_project_id;
  const { data: members = [] } = useOrganizationMembers(organizationId);
  
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentMember = useMemo(() => {
    return members.find(m => m.user_id === currentUser?.user?.id) || null
  }, [members, currentUser?.user?.id]);

  // Helper para obtener nombre display
  const getDisplayName = (contact: any): string => {
    if (contact.first_name || contact.last_name) {
      return `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    }
    return contact.full_name || 'Sin nombre';
  };

  // Helper para obtener initials
  const getInitials = (contact: any): string => {
    if (contact.first_name || contact.last_name) {
      const first = contact.first_name?.[0] || '';
      const last = contact.last_name?.[0] || '';
      return (first + last).toUpperCase();
    }
    if (contact.full_name) {
      const parts = contact.full_name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return contact.full_name[0]?.toUpperCase() || '?';
    }
    return '?';
  };

  // Use feature hook to get assigned personnel
  const { data: projectPersonnel = [], isLoading: isLoadingAssigned } = useProjectPersonnel(
    projectId,
    organizationId
  );

  // Extract contact IDs from project personnel
  const assignedPersonnel = useMemo(
    () => projectPersonnel.map((p: any) => p.contact_id),
    [projectPersonnel]
  );

  // Filtrar contactos disponibles (no asignados) y ordenar alfabéticamente
  const availableContacts = useMemo(() => {
    const contactsArray = (contacts || []) as any[];
    const filtered = contactsArray.filter((c: any) => !assignedPersonnel.includes(c.id));
    
    // Ordenar alfabéticamente por nombre display
    return filtered.sort((a: any, b: any) => {
      const nameA = getDisplayName(a).toLowerCase();
      const nameB = getDisplayName(b).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [contacts, assignedPersonnel]);

  // Obtener IDs de attachments de avatares
  const avatarAttachmentIds = useMemo(() => {
    const contactsWithAvatars = availableContacts.filter((c: any) => c.avatar_attachment_id);
    return contactsWithAvatars.map((c: any) => c.avatar_attachment_id);
  }, [availableContacts]);

  // Use feature hook to get contact attachments
  const { data: contactAttachments = [] } = useContactAttachmentsForPersonnel(avatarAttachmentIds);

  // Filtrar por búsqueda y ordenar alfabéticamente
  const filteredContacts = useMemo(() => {
    let result = availableContacts;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = availableContacts.filter((contact: any) => {
        const displayName = getDisplayName(contact).toLowerCase();
        const email = contact.email?.toLowerCase() || '';
        return displayName.includes(query) || email.includes(query);
      });
    }
    
    // Ordenar alfabéticamente
    return result.sort((a: any, b: any) => {
      const nameA = getDisplayName(a).toLowerCase();
      const nameB = getDisplayName(b).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [availableContacts, searchQuery]);

  const form = useForm<PersonnelFormData>({
    resolver: zodResolver(personnelFormSchema),
    defaultValues: {
      contact_ids: []
    }
  });

  const createPersonnel = useCreatePersonnel();

  const handleSubmit = async (data: PersonnelFormData) => {
    setIsSubmitting(true);

    try {
      const projectId = currentUser?.preferences?.last_project_id;
      const organizationId = currentUser?.organization?.id;
      if (!projectId || !organizationId) throw new Error('No hay proyecto seleccionado');

      // Create personnel records sequentially using the feature hook
      for (const contact_id of data.contact_ids) {
        const result = await createPersonnel.mutateAsync({
          project_id: projectId,
          organization_id: organizationId,
          contact_id,
          notes: '',
          created_by: currentMember?.id || null,
        });

        const contact = (contacts as any[]).find((c: any) => c.id === contact_id);
        const displayName = contact ? getDisplayName(contact) : 'Personal';
        
        await logActivity({
          organization_id: organizationId,
          user_id: currentUser?.user?.id || '',
          action: ACTIVITY_ACTIONS.ADD_PERSONNEL,
          target_table: TARGET_TABLES.PERSONNEL,
          target_id: result?.id || contact_id,
          metadata: { full_name: displayName, role: null }
        });
      }

      closeModal();
    } catch (error: any) {
      console.error('Error adding personnel:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo agregar el personal',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactToggle = (contactId: string, checked: boolean) => {
    let newSelection: string[];
    
    if (checked) {
      newSelection = [...selectedContacts, contactId];
    } else {
      newSelection = selectedContacts.filter(id => id !== contactId);
    }
    
    setSelectedContacts(newSelection);
    form.setValue('contact_ids', newSelection);
  };

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="contact_ids"
          render={() => (
            <FormItem>
              <FormLabel>Seleccionar Contactos</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  {/* Buscador */}
                  <Input 
                    placeholder="Buscar contactos..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                  {/* Lista de contactos */}
                  <div className="space-y-2">
                    {isLoadingAssigned ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50 animate-pulse" />
                        <p className="text-sm">Cargando contactos disponibles...</p>
                      </div>
                    ) : (contacts as any[]).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground space-y-4">
                        <UserPlus className="h-12 w-12 mx-auto opacity-50" />
                        <div className="space-y-2">
                          <p className="text-sm font-medium">No hay contactos en tu organización</p>
                          <p className="text-xs">Para asignar personal a un proyecto, primero necesitas crear contactos</p>
                        </div>
                        <Button 
                          onClick={() => {
                            closeModal();
                            setLocation('/contacts');
                          }}
                          data-testid="button-create-contacts"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Ir a Contactos
                        </Button>
                      </div>
                    ) : availableContacts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hay contactos disponibles</p>
                        <p className="text-xs">Todos los contactos ya están asignados al proyecto</p>
                      </div>
                    ) : filteredContacts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No se encontraron contactos</p>
                        <p className="text-xs">Intenta con otro término de búsqueda</p>
                      </div>
                    ) : (
                      filteredContacts.map((contact: any) => {
                        // Buscar el avatar attachment del contacto
                        const avatarAttachment = contactAttachments.find(
                          (att: any) => att.id === contact.avatar_attachment_id
                        );
                        const avatarUrl = avatarAttachment 
                          ? getAttachmentPublicUrl(avatarAttachment)
                          : null;
                        const displayName = getDisplayName(contact);
                        const initials = getInitials(contact);

                        const isSelected = selectedContacts.includes(contact.id);
                        
                        return (
                          <div 
                            key={contact.id} 
                            onClick={() => handleContactToggle(contact.id, !isSelected)}
                            className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-[var(--accent)] text-white border-[var(--accent)]' 
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            <Avatar className="h-8 w-8">
                              {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                              <AvatarFallback className={`text-xs ${isSelected ? 'bg-white/20 text-white' : ''}`}>
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : ''}`}>
                                {displayName}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Contador de seleccionados */}
                  {selectedContacts.length > 0 && (
                    <div className="text-sm text-muted-foreground text-center pt-2 border-t">
                      {selectedContacts.length} contacto{selectedContacts.length !== 1 ? 's' : ''} seleccionado{selectedContacts.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
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
      title="Asignar Personal al Proyecto"
      description="Selecciona los contactos que trabajarán en este proyecto"
      icon={Users}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={closeModal}
      rightLabel="Asignar Personal"
      onRightClick={form.handleSubmit(handleSubmit)}
      submitDisabled={selectedContacts.length === 0 || isSubmitting}
      showLoadingSpinner={isSubmitting}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      onClose={closeModal}
      editPanel={formContent}
      isEditing={true}
      headerContent={headerContent}
      footerContent={footerContent}
    />
  );
}