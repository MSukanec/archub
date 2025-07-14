import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, User, Mail, Phone, Building2, MapPin, FileText, Link, Unlink, Search } from "lucide-react";

import { CustomModalLayout } from "../legacy/CustomModalLayout";
import { CustomModalHeader } from "../legacy/CustomModalHeader";
import { CustomModalBody } from "../legacy/CustomModalBody";
import { CustomModalFooter } from "../legacy/CustomModalFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useContactTypes } from "@/hooks/use-contact-types";
import { useSearchUsers } from "@/hooks/use-search-users";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { PhoneInput } from "@/components/ui-custom/PhoneInput";

const createContactSchema = z.object({
  first_name: z.string().min(1, "El nombre es requerido"),
  last_name: z.string().optional(),
  email: z.union([z.string().email("Email inválido"), z.literal("")]).optional(),
  phone: z.string().optional(),
  contact_type_id: z.string().optional(),
  company_name: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  linked_user_id: z.string().optional(),
});

type CreateContactForm = z.infer<typeof createContactSchema>;

interface Contact {
  id: string;
  organization_id: string;
  first_name: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  contact_type_id?: string;
  company_name?: string;
  location?: string;
  notes?: string;
  linked_user_id?: string;
  created_at: string;
  linked_user?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface ContactFormModalProps {
  modalData?: {
    editingContact?: Contact;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function ContactFormModal({ modalData, onClose }: ContactFormModalProps) {
  const { toast } = useToast();
  const { user, organization } = useCurrentUser();
  const { data: contactTypes } = useContactTypes();
  
  const editingContact = modalData?.editingContact;
  const isEditing = modalData?.isEditing || false;

  const [isLinkingUser, setIsLinkingUser] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  const { data: searchResults } = useSearchUsers(searchTerm, {
    enabled: isLinkingUser && searchTerm.length > 2
  });

  const form = useForm<CreateContactForm>({
    resolver: zodResolver(createContactSchema),
    defaultValues: {
      first_name: editingContact?.first_name || "",
      last_name: editingContact?.last_name || "",
      email: editingContact?.email || "",
      phone: editingContact?.phone || "",
      contact_type_id: editingContact?.contact_type_id || "",
      company_name: editingContact?.company_name || "",
      location: editingContact?.location || "",
      notes: editingContact?.notes || "",
      linked_user_id: editingContact?.linked_user_id || "",
    },
  });

  const createContactMutation = useMutation({
    mutationFn: async (data: CreateContactForm) => {
      if (!organization?.id) throw new Error("No organization found");

      const contactData = {
        ...data,
        organization_id: organization.id,
        linked_user_id: selectedUser?.id || data.linked_user_id || null,
      };

      if (isEditing && editingContact) {
        const { error } = await supabase
          .from("contacts")
          .update(contactData)
          .eq("id", editingContact.id);
        
        if (error) throw error;
        return { ...editingContact, ...contactData };
      } else {
        const { data: contact, error } = await supabase
          .from("contacts")
          .insert([contactData])
          .select()
          .single();
        
        if (error) throw error;
        return contact;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["organization-contacts"] });
      
      toast({
        title: isEditing ? "Contacto actualizado" : "Contacto creado",
        description: isEditing ? "El contacto ha sido actualizado correctamente." : "El contacto ha sido agregado correctamente.",
      });
      
      onClose();
    },
    onError: (error: any) => {
      console.error("Error al crear/actualizar contacto:", error);
      toast({
        title: "Error",
        description: error.message || "Hubo un error al procesar el contacto",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setIsLinkingUser(false);
    setSelectedUser(null);
    setSearchTerm("");
    onClose();
  };

  const onSubmit = (data: CreateContactForm) => {
    createContactMutation.mutate(data);
  };

  const handleLinkUser = (userId: string) => {
    const user = searchResults?.find((u: any) => u.id === userId);
    setSelectedUser(user);
    setIsLinkingUser(false);
    form.setValue("linked_user_id", userId);
  };

  const handleUnlinkUser = () => {
    setSelectedUser(null);
    form.setValue("linked_user_id", "");
  };



  // Edit Panel Content
  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre *</FormLabel>
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
                  <Input type="email" placeholder="email@ejemplo.com" {...field} />
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
                  <PhoneInput
                    value={field.value}
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
                <FormLabel>Tipo de Contacto</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {contactTypes?.map((type) => (
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
        </div>

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
                  placeholder="Notas adicionales sobre el contacto"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* User Linking Section */}
        <div className="space-y-3">
          <Label>Vincular Usuario</Label>
          {selectedUser || editingContact?.linked_user ? (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedUser?.avatar_url || editingContact?.linked_user?.avatar_url} />
                  <AvatarFallback>
                    {(selectedUser?.full_name || editingContact?.linked_user?.full_name)?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {selectedUser?.full_name || editingContact?.linked_user?.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedUser?.email || editingContact?.linked_user?.email}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleUnlinkUser}
              >
                <Unlink className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {!isLinkingUser ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsLinkingUser(true)}
                  className="w-full"
                >
                  <Link className="h-4 w-4 mr-2" />
                  Vincular Usuario
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Buscar usuario por nombre o email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsLinkingUser(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                  {searchResults && searchResults.length > 0 && (
                    <div className="border rounded-lg max-h-48 overflow-y-auto">
                      {searchResults.map((user: any) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 p-2 hover:bg-muted cursor-pointer"
                          onClick={() => handleLinkUser(user.id)}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>{user.full_name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{user.full_name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </form>
    </Form>
  );

  return (
    <CustomModalLayout open={true} onClose={handleClose}>
      {{
        header: (
          <CustomModalHeader
            title={isEditing ? "Editar Contacto" : "Nuevo Contacto"}
            description={isEditing ? "Modifica los detalles del contacto" : "Crea un nuevo contacto para tu organización"}
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody columns={2}>
            {editPanel}
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleClose}
            onSave={form.handleSubmit(onSubmit)}
            cancelText="Cancelar"
            saveText={isEditing ? "Actualizar" : "Crear Contacto"}
            isLoading={createContactMutation.isPending}
          />
        )
      }}
    </CustomModalLayout>
  );
}