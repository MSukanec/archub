import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Check, Search } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';

import { FormModalLayout } from '../../form/FormModalLayout';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { useGlobalModalStore } from '../../form/useGlobalModalStore';

import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useContacts } from '@/hooks/use-contacts';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { getAttachmentPublicUrl } from '@/services/contactAttachments';

const personnelFormSchema = z.object({
  contact_ids: z.array(z.string()).min(1, "Selecciona al menos un contacto")
});

type PersonnelFormData = z.infer<typeof personnelFormSchema>;

interface PersonnelFormModalProps {
  data?: any;
}

export function PersonnelFormModal({ data }: PersonnelFormModalProps) {
  const { toast } = useToast();
  const { closeModal } = useGlobalModalStore();
  const { data: currentUser } = useCurrentUser();
  const { data: contacts = [] } = useContacts();
  const projectId = currentUser?.preferences?.last_project_id;
  
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Query para obtener personal ya asignado al proyecto
  const { data: assignedPersonnel = [] } = useQuery({
    queryKey: ['project-personnel', projectId],
    queryFn: async () => {
      if (!projectId || !supabase) return [];
      
      const { data, error } = await supabase
        .from('project_personnel')
        .select('contact_id')
        .eq('project_id', projectId);
      
      if (error) throw error;
      return data?.map(p => p.contact_id) || [];
    },
    enabled: !!projectId && !!supabase
  });

  // Query para obtener todos los attachments de los contactos
  const { data: contactAttachments = [] } = useQuery({
    queryKey: ['contact-attachments-all'],
    queryFn: async () => {
      if (!supabase) return [];
      
      const { data, error } = await supabase
        .from('contact_attachments')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!supabase
  });

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

  // Filtrar contactos disponibles (no asignados)
  const availableContacts = useMemo(() => {
    const contactsArray = (contacts || []) as any[];
    return contactsArray.filter((c: any) => !assignedPersonnel.includes(c.id));
  }, [contacts, assignedPersonnel]);

  // Filtrar por búsqueda
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return availableContacts;
    
    const query = searchQuery.toLowerCase();
    return availableContacts.filter((contact: any) => {
      const displayName = getDisplayName(contact).toLowerCase();
      const email = contact.email?.toLowerCase() || '';
      return displayName.includes(query) || email.includes(query);
    });
  }, [availableContacts, searchQuery]);

  const form = useForm<PersonnelFormData>({
    resolver: zodResolver(personnelFormSchema),
    defaultValues: {
      contact_ids: []
    }
  });

  const addPersonnelMutation = useMutation({
    mutationFn: async (formData: PersonnelFormData) => {
      const projectId = currentUser?.preferences?.last_project_id;
      if (!projectId || !supabase) throw new Error('No hay proyecto seleccionado');

      // Insertar cada contacto seleccionado en project_personnel
      const personnelToInsert = formData.contact_ids.map(contact_id => ({
        project_id: projectId,
        contact_id,
        notes: ''
      }));

      const { error } = await supabase
        .from('project_personnel')
        .insert(personnelToInsert);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-personnel'] });
      toast({
        title: 'Personal agregado',
        description: 'El personal ha sido asignado al proyecto correctamente'
      });
      closeModal();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo agregar el personal',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (data: PersonnelFormData) => {
    addPersonnelMutation.mutate(data);
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
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar contactos..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {/* Lista de contactos */}
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {availableContacts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hay contactos disponibles</p>
                        <p className="text-xs">Todos los contactos ya están asignados o agrega más en la sección de Contactos</p>
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
                        const avatarUrl = avatarAttachment ? getAttachmentPublicUrl(avatarAttachment) : null;
                        const displayName = getDisplayName(contact);
                        const initials = getInitials(contact);

                        return (
                          <div key={contact.id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                            <Checkbox
                              checked={selectedContacts.includes(contact.id)}
                              onCheckedChange={(checked) => handleContactToggle(contact.id, checked as boolean)}
                            />
                            <Avatar className="h-8 w-8">
                              {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                              <AvatarFallback className="text-xs">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {displayName}
                              </p>
                              {contact.email && (
                                <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                              )}
                            </div>
                            {selectedContacts.includes(contact.id) && (
                              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                            )}
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
      submitDisabled={selectedContacts.length === 0}
      showLoadingSpinner={addPersonnelMutation.isPending}
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