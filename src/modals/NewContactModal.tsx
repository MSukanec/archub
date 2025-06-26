import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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

import { useCurrentUser } from "@/hooks/use-current-user";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { CustomPhoneInput } from "@/components/ui-custom/misc/CustomPhoneInput";

const createContactSchema = z.object({
  first_name: z.string().min(1, "El nombre es requerido"),
  last_name: z.string().optional(),
  email: z.union([z.string().email("Email inválido"), z.literal("")]).optional(),
  phone: z.string().optional(),
  contact_type_id: z.string().optional(),
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
}

interface NewContactModalProps {
  open: boolean;
  onClose: () => void;
  contact?: Contact | null;
  onSuccess?: () => void;
}

export function NewContactModal({ open, onClose, contact, onSuccess }: NewContactModalProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const queryClient = useQueryClient();

  const organizationId = userData?.preferences?.last_organization_id;

  const contactTypes = [
    { id: 'arquitecto', name: 'Arquitecto' },
    { id: 'ingeniero', name: 'Ingeniero' },
    { id: 'constructor', name: 'Constructor' },
    { id: 'proveedor', name: 'Proveedor' },
    { id: 'cliente', name: 'Cliente' }
  ];

  const form = useForm<CreateContactForm>({
    resolver: zodResolver(createContactSchema),
    defaultValues: {
      first_name: contact?.first_name || "",
      last_name: contact?.last_name || "",
      email: contact?.email || "",
      phone: contact?.phone || "",
      contact_type_id: contact?.contact_type_id || "",
      company_name: contact?.company_name || "",
      location: contact?.location || "",
      notes: contact?.notes || "",
    },
  });

  // Reset form when contact changes
  React.useEffect(() => {
    if (contact) {
      form.reset({
        first_name: contact.first_name || "",
        last_name: contact.last_name || "",
        email: contact.email || "",
        phone: contact.phone || "",
        contact_type_id: contact.contact_type_id || "",
        company_name: contact.company_name || "",
        location: contact.location || "",
        notes: contact.notes || "",
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
  }, [contact, form]);

  const createContactMutation = useMutation({
    mutationFn: async (formData: CreateContactForm) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      if (!organizationId) {
        throw new Error('No organization selected');
      }

      if (contact) {
        // Update existing contact
        const { error } = await supabase
          .from('contacts')
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name || '',
            email: formData.email || '',
            phone: formData.phone || '',
            contact_type_id: formData.contact_type_id || '',
            company_name: formData.company_name || '',
            location: formData.location || '',
            notes: formData.notes || '',
          })
          .eq('id', contact.id);

        if (error) {
          throw new Error(`Error al actualizar contacto: ${error.message}`);
        }

        return { message: 'Contacto actualizado exitosamente' };
      } else {
        // Create new contact
        const { error } = await supabase
          .from('contacts')
          .insert({
            organization_id: organizationId,
            first_name: formData.first_name,
            last_name: formData.last_name || '',
            email: formData.email || '',
            phone: formData.phone || '',
            contact_type_id: formData.contact_type_id || '',
            company_name: formData.company_name || '',
            location: formData.location || '',
            notes: formData.notes || '',
          });

        if (error) {
          throw new Error(`Error al crear contacto: ${error.message}`);
        }

        return { message: 'Contacto creado exitosamente' };
      }
    },
    onSuccess: (data) => {
      toast({
        title: contact ? "Contacto actualizado" : "Contacto creado",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      onSuccess?.();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const onSubmit = async (data: CreateContactForm) => {
    createContactMutation.mutate(data);
  };

  if (!open) return null;

  return (
    <CustomModalLayout open={open} onOpenChange={onClose}>
      {{
        header: (
          <CustomModalHeader
            title={contact ? "Editar contacto" : "Nuevo contacto"}
            description={contact ? "Modifica la información del contacto" : "Agrega un nuevo contacto a tu organización"}
            onClose={onClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nombre */}
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="required-asterisk">Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Ingresa el nombre" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Apellido */}
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido</FormLabel>
                        <FormControl>
                          <Input placeholder="Ingresa el apellido" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="ejemplo@correo.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Teléfono */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <CustomPhoneInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Número de teléfono"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Tipo de contacto */}
                <FormField
                  control={form.control}
                  name="contact_type_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de contacto</FormLabel>
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
                  {/* Empresa */}
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empresa</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre de la empresa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Ubicación */}
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ubicación</FormLabel>
                        <FormControl>
                          <Input placeholder="Ciudad, País" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Notas */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Notas adicionales sobre el contacto..." 
                          rows={3}
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
          <CustomModalFooter
            onCancel={onClose}
            onSave={form.handleSubmit(onSubmit)}
            saveText={contact ? "Actualizar contacto" : "Crear contacto"}
            isLoading={createContactMutation.isPending}
          />
        ),
      }}
    </CustomModalLayout>
  );
}