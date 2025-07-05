import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useContactTypes } from "@/hooks/use-contact-types";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { CustomPhoneInput } from "@/components/ui-custom/misc/CustomPhoneInput";

const createContactSchema = z.object({
  first_name: z.string().min(1, "El nombre es requerido"),
  last_name: z.string().optional(),
  email: z
    .union([z.string().email("Email inválido"), z.literal("")])
    .optional(),
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
}

interface NewContactModalProps {
  open: boolean;
  onClose: () => void;
  contact?: Contact | null;
  onSuccess?: () => void;
}

export function NewContactModal({
  open,
  onClose,
  contact,
  onSuccess,
}: NewContactModalProps) {
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

  useEffect(() => {
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
      form.reset();
    }
  }, [contact, form]);

  const createContactMutation = useMutation({
    mutationFn: async (formData: CreateContactForm) => {
      if (!supabase) throw new Error("Supabase client not initialized");
      if (!organizationId) throw new Error("No organization selected");

      if (contact) {
        const { error } = await supabase
          .from("contacts")
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name || null,
            email: formData.email || null,
            phone: formData.phone || null,
            contact_type_id: formData.contact_type_id || null,
            company_name: formData.company_name || "",
            location: formData.location || "",
            notes: formData.notes || "",
          })
          .eq("id", contact.id);

        if (error)
          throw new Error(`Error al actualizar contacto: ${error.message}`);
      } else {
        const { error } = await supabase.from("contacts").insert({
          organization_id: organizationId,
          first_name: formData.first_name,
          last_name: formData.last_name || null,
          email: formData.email || null,
          phone: formData.phone || null,
          contact_type_id: formData.contact_type_id || null,
          company_name: formData.company_name || "",
          location: formData.location || "",
          notes: formData.notes || "",
        });

        if (error) throw new Error(`Error al crear contacto: ${error.message}`);
      }
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: contact
          ? "Contacto actualizado correctamente"
          : "Contacto creado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      onSuccess?.();
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el contacto",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CreateContactForm) => {
    createContactMutation.mutate(data);
  };

  const handleClose = () => {
    onClose();
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="p-0 max-w-lg w-full bg-background rounded-xl shadow-xl overflow-hidden">
        {/* Header estilo SlideModal */}
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <h2 className="text-lg font-semibold text-card-foreground">
            {contact ? "Editar contacto" : "Nuevo contacto"}
          </h2>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body estilo SlideModal */}
        <div className="p-4 max-h-[70vh] overflow-y-auto bg-background">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              id="contact-form"
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="required-asterisk">Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre" {...field} />
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
                      <Input placeholder="Apellido" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ejemplo@correo.com"
                        type="email"
                        {...field}
                      />
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
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <CustomPhoneInput
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

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
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
        </div>

        {/* Footer estilo SlideModal */}
        <div className="flex gap-2 p-4 border-t bg-card">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            className="w-1/3"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="contact-form"
            className="w-2/3"
            disabled={createContactMutation.isPending}
          >
            {createContactMutation.isPending
              ? "Guardando..."
              : contact
                ? "Actualizar"
                : "Crear contacto"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
