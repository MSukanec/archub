import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, Plus, Check } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  contact_type_links?: Array<{
    contact_type: {
      name: string;
    };
  }>;
}

export function PersonnelFormModal({ modalData, onClose }: { modalData?: any; onClose: () => void }) {
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
  const { data: contacts = [] } = useQuery({
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
      return (data || []) as Contact[];
    },
    enabled: !!userData?.organization?.id
  });

  // Fetch existing project personnel to filter out already assigned contacts
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

  // Filter available contacts (not already assigned)
  const availableContacts = contacts.filter(contact => 
    !existingPersonnel.includes(contact.id)
  );

  const createPersonnelMutation = useMutation({
    mutationFn: async (data: PersonnelFormData) => {
      if (!userData?.preferences?.last_project_id) {
        throw new Error('No hay proyecto seleccionado');
      }

      const personnelRecords = data.contact_ids.map(contactId => ({
        project_id: userData.preferences!.last_project_id,
        contact_id: contactId
      }));

      const { error } = await supabase
        .from('project_personnel')
        .insert(personnelRecords);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Éxito',
        description: 'Personal agregado al proyecto correctamente',
      });
      queryClient.invalidateQueries({ queryKey: ['project-personnel'] });
      onClose();
    },
    onError: (error) => {
      console.error('Error creating personnel:', error);
      toast({
        title: 'Error',
        description: 'No se pudo agregar el personal al proyecto',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (data: PersonnelFormData) => {
    createPersonnelMutation.mutate(data);
  };

  const handleContactToggle = (contactId: string) => {
    setSelectedContacts(prev => {
      const newSelection = prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId];
      
      form.setValue('contact_ids', newSelection);
      return newSelection;
    });
  };

  useEffect(() => {
    const contactIds = form.getValues('contact_ids') || [];
    setSelectedContacts(contactIds);
  }, []);

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="contact_ids"
          render={() => (
            <FormItem>
              <FormLabel>Seleccionar Contactos</FormLabel>
              <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-3">
                {availableContacts.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No hay contactos disponibles para agregar
                  </div>
                ) : (
                  availableContacts.map((contact) => {
                    const isSelected = selectedContacts.includes(contact.id);
                    const contactType = contact.contact_type_links?.[0]?.contact_type?.name || 'Sin tipo';
                    
                    return (
                      <div
                        key={contact.id}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleContactToggle(contact.id);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked !== isSelected) {
                                handleContactToggle(contact.id);
                              }
                            }}
                          />
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {contact.first_name?.charAt(0)}{contact.last_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {contact.first_name} {contact.last_name}
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              {contactType}
                            </Badge>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
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

  const headerContent = (
    <FormModalHeader 
      title="Agregar Personal al Proyecto"
      icon={Users}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel="Agregar Personal"
      onRightClick={form.handleSubmit(handleSubmit)}
      loading={createPersonnelMutation.isPending}
      rightDisabled={selectedContacts.length === 0}
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