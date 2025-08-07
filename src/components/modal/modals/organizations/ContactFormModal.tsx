import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, User, Mail, Phone, Building2, MapPin, FileText, Search, Check, X, Link, Unlink } from "lucide-react";

import { FormModalLayout } from "../../form/FormModalLayout";
import { FormModalHeader } from "../../form/FormModalHeader";
import { FormModalFooter } from "../../form/FormModalFooter";
import { useModalPanelStore } from "../../form/modalPanelStore";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
  const { editingContact, isEditing = false } = modalData || {};
  const { currentPanel, setPanel } = useModalPanelStore();
  const { data: userData } = useCurrentUser();
  const { data: contactTypes } = useContactTypes();
  const { toast } = useToast();
  const [isLinkingUser, setIsLinkingUser] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateContactForm>({
    resolver: zodResolver(createContactSchema),
    defaultValues: {
      first_name: editingContact?.first_name || '',
      last_name: editingContact?.last_name || '',
      email: editingContact?.email || '',
      phone: editingContact?.phone || '',
      contact_type_id: editingContact?.contact_type_id || '',
      company_name: editingContact?.company_name || '',
      location: editingContact?.location || '',
      notes: editingContact?.notes || '',
      linked_user_id: editingContact?.linked_user_id || '',
    }
  });

  const { data: searchResults } = useSearchUsers(searchTerm);

  React.useEffect(() => {
    if (editingContact) {
      form.reset({
        first_name: editingContact.first_name || '',
        last_name: editingContact.last_name || '',
        email: editingContact.email || '',
        phone: editingContact.phone || '',
        contact_type_id: editingContact.contact_type_id || '',
        company_name: editingContact.company_name || '',
        location: editingContact.location || '',
        notes: editingContact.notes || '',
        linked_user_id: editingContact.linked_user_id || '',
      });
      setPanel('edit');
    } else {
      form.reset({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        contact_type_id: '',
        company_name: '',
        location: '',
        notes: '',
        linked_user_id: '',
      });
      setPanel('edit');
    }
  }, [editingContact, form, setPanel]);

  const createContactMutation = useMutation({
    mutationFn: async (data: CreateContactForm) => {
      if (!userData?.organization?.id) {
        throw new Error('Organization ID not found');
      }

      if (isEditing && editingContact) {
        const { data: updatedContact, error } = await supabase
          .from('contacts')
          .update({
            first_name: data.first_name,
            last_name: data.last_name || null,
            email: data.email || null,
            phone: data.phone || null,
            contact_type_id: data.contact_type_id || null,
            company_name: data.company_name || null,
            location: data.location || null,
            notes: data.notes || null,
            linked_user_id: data.linked_user_id || null,
          })
          .eq('id', editingContact.id)
          .select()
          .single();

        if (error) throw error;
        return updatedContact;
      } else {
        const { data: newContact, error } = await supabase
          .from('contacts')
          .insert({
            organization_id: userData.organization.id,
            first_name: data.first_name,
            last_name: data.last_name || null,
            email: data.email || null,
            phone: data.phone || null,
            contact_type_id: data.contact_type_id || null,
            company_name: data.company_name || null,
            location: data.location || null,
            notes: data.notes || null,
            linked_user_id: data.linked_user_id || null,
          })
          .select()
          .single();

        if (error) throw error;
        return newContact;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: isEditing ? "Contacto actualizado" : "Contacto creado",
        description: isEditing 
          ? "El contacto ha sido actualizado exitosamente" 
          : "El nuevo contacto ha sido agregado a tu organización",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Hubo un error al procesar el contacto",
        variant: "destructive",
      });
    }
  });

  const handleClose = () => {
    form.reset();
    setPanel('view');
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

  const viewPanel = (
    <>
      <div>
          {editingContact ? `${editingContact.first_name} ${editingContact.last_name || ''}`.trim() : 'Sin nombre'}
        </p>
      </div>
      
      {editingContact?.email && (
        <div>
        </div>
      )}
      
      {editingContact?.phone && (
        <div>
        </div>
      )}
      
      {editingContact?.company_name && (
        <div>
        </div>
      )}
    </>
  );

  const editPanel = (
    <>
      {/* User Linking Section - FULL WIDTH */}
        
        {selectedUser || editingContact?.linked_user ? (
                <AvatarImage src={(selectedUser || editingContact?.linked_user)?.avatar_url} />
                <AvatarFallback>
                  {(selectedUser || editingContact?.linked_user)?.full_name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                  {(selectedUser || editingContact?.linked_user)?.full_name}
                </p>
                  {(selectedUser || editingContact?.linked_user)?.email}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleUnlinkUser}
            >
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            onClick={() => setIsLinkingUser(true)}
          >
            Vincular usuario existente
          </Button>
        )}

        {/* User Search */}
        {isLinkingUser && (
              <Input
                placeholder="Buscar usuario por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {searchResults && searchResults.length > 0 && (
                {searchResults.map((user: any) => (
                  <div
                    key={user.id}
                    onClick={() => handleLinkUser(user.id)}
                  >
                        <AvatarImage src={user.avatar_url} />
                          {user.full_name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsLinkingUser(false)}
            >
              Cancelar búsqueda
            </Button>
          </div>
        )}
      </div>

      {/* FORM FIELDS - RESPONSIVE GRID LAYOUT */}
      <Form {...form}>
          {/* Nombre - Apellido */}
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

          {/* Email - Telefono */}
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

          {/* Tipo de Contacto - FULL WIDTH */}
          <FormField
            control={form.control}
            name="contact_type_id"
            render={({ field }) => (
                <FormLabel>Tipo de contacto</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
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

          {/* Empresa - Ubicacion */}
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
                  <Input placeholder="Ciudad, país" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notas - FULL WIDTH */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
                <FormLabel>Notas</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Notas adicionales sobre el contacto" 
                    {...field} 
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </>
  );

  const headerContent = (
    <FormModalHeader
      title={isEditing ? "Editar Contacto" : "Nuevo Contacto"}
      icon={UserPlus}
      leftActions={
        currentPanel === 'edit' && isEditing ? (
          <button
            type="button"
            onClick={() => setPanel('view')}
          >
            ← Volver
          </button>
        ) : undefined
      }
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={isEditing ? "Actualizar Contacto" : "Crear Contacto"}
      onRightClick={() => {
        if (currentPanel === 'view' && isEditing) {
          setPanel('edit');
        } else {
          form.handleSubmit(onSubmit)();
        }
      }}
      rightLoading={createContactMutation.isPending}
    />
  );

  return (
    <FormModalLayout
      columns={2}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
    />
  );
}