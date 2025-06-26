import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, User } from "lucide-react";

import { CustomModalLayout } from "@/components/ui-custom/modal/CustomModalLayout";
import { CustomModalHeader } from "@/components/ui-custom/modal/CustomModalHeader";
import { CustomModalBody } from "@/components/ui-custom/modal/CustomModalBody";
import { CustomModalFooter } from "@/components/ui-custom/modal/CustomModalFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useContactTypes } from "@/hooks/use-contact-types";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const createContactSchema = z.object({
  first_name: z.string().min(1, "El nombre es requerido"),
  last_name: z.string().min(1, "El apellido es requerido"),
  email: z.union([z.string().email("Email inválido"), z.literal("")]).optional(),
  phone: z.string().optional(),
  contact_type_id: z.string().min(1, "El tipo de contacto es requerido"),
  company_name: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

type CreateContactForm = z.infer<typeof createContactSchema>;

interface Contact {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_name: string;
  location: string;
  notes: string;
  contact_type_id: string;
  created_at: string;
  contact_type?: {
    id: string;
    name: string;
  };
}

interface NewContactModalProps {
  open: boolean;
  onClose: () => void;
  editingContact?: Contact | null;
}

export function NewContactModal({ open, onClose, editingContact }: NewContactModalProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const { data: contactTypes = [] } = useContactTypes();

  const organizationId = userData?.preferences?.last_organization_id;

  const form = useForm<CreateContactForm>({
    resolver: zodResolver(createContactSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      contact_type_id: "",
      company_name: "",
      location: "",
      notes: "",
    },
  });

  // Reset form when editingContact changes
  React.useEffect(() => {
    if (editingContact) {
      form.reset({
        first_name: editingContact.first_name || "",
        last_name: editingContact.last_name || "",
        email: editingContact.email || "",
        phone: editingContact.phone || "",
        contact_type_id: editingContact.contact_type_id || "",
        company_name: editingContact.company_name || "",
        location: editingContact.location || "",
        notes: editingContact.notes || "",
      });
    } else {
      form.reset({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        contact_type_id: "",
        company_name: "",
        location: "",
        notes: "",
      });
    }
  }, [editingContact, form]);

  const createContactMutation = useMutation({
    mutationFn: async (formData: CreateContactForm) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      if (!organizationId) {
        throw new Error('No organization selected');
      }

      if (editingContact) {
        // Update existing contact
        const { error } = await supabase
          .from('contacts')
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email || null,
            phone: formData.phone || null,
            contact_type_id: formData.contact_type_id || null,
            company_name: formData.company_name || '',
            location: formData.location || '',
            notes: formData.notes || '',
          })
          .eq('id', editingContact.id);

        if (error) {
          throw new Error(`Error al actualizar contacto: ${error.message}`);
        }
      } else {
        // Create new contact

        const { data: contactData, error } = await supabase
          .from('contacts')
          .insert({
            organization_id: organizationId,
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email || null,
            phone: formData.phone || null,
            contact_type_id: formData.contact_type_id || null,
            company_name: formData.company_name || '',
            location: formData.location || '',
            notes: formData.notes || '',
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Error al crear contacto: ${error.message}`);
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: editingContact 
          ? "Contacto actualizado correctamente"
          : "Contacto creado correctamente"
      });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el contacto",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (data: CreateContactForm) => {
    createContactMutation.mutate(data);
  };

  const handleClose = () => {
    onClose();
    form.reset();
  };

  return (
    <CustomModalLayout open={open} onClose={handleClose}>
      {{
        header: (
          <CustomModalHeader
            title={editingContact ? "Editar contacto" : "Nuevo contacto"}
            description={editingContact ? "Modifica la información del contacto" : "Agrega un nuevo contacto a tu organización"}
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" id="contact-form">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium required-asterisk">Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Ingresa el nombre" {...field} />
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
                        <FormLabel className="text-sm font-medium required-asterisk">Apellido</FormLabel>
                        <FormControl>
                          <Input placeholder="Ingresa el apellido" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Email</FormLabel>
                        <FormControl>
                          <Input placeholder="ejemplo@correo.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="+54 11 1234-5678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="contact_type_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium required-asterisk">Tipo de contacto</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el tipo de contacto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contactTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Empresa</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre de la empresa" {...field} />
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
                        <FormLabel className="text-sm font-medium">Ubicación</FormLabel>
                        <FormControl>
                          <Input placeholder="Ciudad, País" {...field} />
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
                      <FormLabel className="text-sm font-medium">Notas</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Notas adicionales sobre el contacto..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CustomModalBody>
        ),
        footer: (
          <div className="p-3 border-t border-[var(--card-border)] mt-auto">
            <div className="flex gap-2 w-full">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="w-1/4"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="contact-form"
                className="w-3/4"
                disabled={createContactMutation.isPending}
              >
                {createContactMutation.isPending ? 'Guardando...' : (editingContact ? "Actualizar" : "Crear contacto")}
              </Button>
            </div>
          </div>
        )
      }}
    </CustomModalLayout>
  );
}