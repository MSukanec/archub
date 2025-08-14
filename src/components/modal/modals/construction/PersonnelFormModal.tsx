import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";

import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";

const PersonnelFormSchema = z.object({
  contact_ids: z.array(z.string()).min(1, "Selecciona al menos un contacto")
});

type PersonnelFormData = z.infer<typeof PersonnelFormSchema>;

interface PersonnelFormModalProps {
  modalData?: any;
  onClose: () => void;
}

export function PersonnelFormModal({ modalData, onClose }: PersonnelFormModalProps) {
  const { data: userData } = useCurrentUser();
  const { toast } = useToast();
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  const form = useForm<PersonnelFormData>({
    resolver: zodResolver(PersonnelFormSchema),
    defaultValues: {
      contact_ids: []
    }
  });

  // Fetch contacts
  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts', userData?.organization?.id],
    queryFn: async () => {
      if (!userData?.organization?.id) return [];
      
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          id,
          first_name,
          last_name,
          contact_type_links(
            contact_type:contact_types(name)
          )
        `)
        .eq('organization_id', userData.organization.id)
        .order('first_name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!userData?.organization?.id
  });

  // Fetch existing project personnel
  const { data: existingPersonnel = [] } = useQuery({
    queryKey: ['project-personnel', userData?.preferences?.last_project_id],
    queryFn: async () => {
      if (!userData?.preferences?.last_project_id) return [];
      
      const { data, error } = await supabase
        .from('project_personnel')
        .select('contact_id')
        .eq('project_id', userData.preferences.last_project_id);

      if (error) throw error;
      return data.map(p => p.contact_id);
    },
    enabled: !!userData?.preferences?.last_project_id
  });

  // Filter available contacts
  const availableContacts = contacts.filter(contact => 
    !existingPersonnel.includes(contact.id)
  );

  // Create personnel mutation
  const createPersonnelMutation = useMutation({
    mutationFn: async (data: PersonnelFormData) => {
      if (!userData?.preferences?.last_project_id) {
        throw new Error('No se ha seleccionado un proyecto');
      }

      const personnelToInsert = data.contact_ids.map(contactId => ({
        project_id: userData.preferences.last_project_id,
        contact_id: contactId,
        organization_id: userData.organization.id,
        assigned_by: userData.user.id,
        is_active: true
      }));

      const { data: result, error } = await supabase
        .from('project_personnel')
        .insert(personnelToInsert)
        .select();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Personal agregado",
        description: `Se agregaron ${selectedContacts.length} persona(s) al proyecto.`
      });
      
      queryClient.invalidateQueries({ queryKey: ['project-personnel'] });
      queryClient.invalidateQueries({ queryKey: ['construction-personnel'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error al agregar personal",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleContactToggle = (contactId: string) => {
    setSelectedContacts(prev => {
      const newSelection = prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId];
      
      form.setValue('contact_ids', newSelection);
      return newSelection;
    });
  };

  const handleSubmit = (data: PersonnelFormData) => {
    createPersonnelMutation.mutate(data);
  };

  // Edit Panel Content
  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="contact_ids"
          render={() => (
            <FormItem>
              <FormLabel>Seleccionar Contactos</FormLabel>
              <FormControl>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {contactsLoading ? (
                    <p className="text-sm text-muted-foreground">Cargando contactos...</p>
                  ) : availableContacts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay contactos disponibles</p>
                  ) : (
                    availableContacts.map((contact) => {
                      const isSelected = selectedContacts.includes(contact.id);
                      return (
                        <div
                          key={contact.id}
                          className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => handleContactToggle(contact.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleContactToggle(contact.id)}
                            />
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {contact.first_name?.charAt(0)}{contact.last_name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{contact.first_name} {contact.last_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {contact.contact_type_links?.[0]?.contact_type?.name || 'Sin tipo'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </FormControl>
              <FormMessage />
              {selectedContacts.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedContacts.length} contacto{selectedContacts.length !== 1 ? 's' : ''} seleccionado{selectedContacts.length !== 1 ? 's' : ''}
                </p>
              )}
            </FormItem>
          )}
        />
      </form>
    </Form>
  );

  // Header Content
  const headerContent = (
    <FormModalHeader 
      title="Agregar Personal al Proyecto"
      icon={Users}
    />
  );

  // Footer Content
  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel="Agregar Personal"
      onRightClick={form.handleSubmit(handleSubmit)}
      rightDisabled={createPersonnelMutation.isPending || selectedContacts.length === 0}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={null}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
      isEditing={true}
    />
  );
}