import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Check } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';

import { FormModalLayout } from '../../form/FormModalLayout';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { useGlobalModalStore } from '../../form/useGlobalModalStore';

import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useContacts } from '@/hooks/use-contacts';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

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
  
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

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
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {contacts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hay contactos disponibles</p>
                      <p className="text-xs">Agrega contactos en la sección de Contactos</p>
                    </div>
                  ) : (
                    contacts.map((contact: any) => (
                      <div key={contact.id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                        <Checkbox
                          checked={selectedContacts.includes(contact.id)}
                          onCheckedChange={(checked) => handleContactToggle(contact.id, checked as boolean)}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {contact.first_name?.[0]}{contact.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {contact.first_name} {contact.last_name}
                          </p>
                          {contact.email && (
                            <p className="text-xs text-muted-foreground">{contact.email}</p>
                          )}
                        </div>
                        {selectedContacts.includes(contact.id) && (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    ))
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
      rightLoading={addPersonnelMutation.isPending}
      rightDisabled={selectedContacts.length === 0}
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