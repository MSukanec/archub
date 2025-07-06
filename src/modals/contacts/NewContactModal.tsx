import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, User, Search, Check, X, Link, Unlink, CheckCircle } from "lucide-react";

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
import { useSearchUsers } from "@/hooks/use-search-users";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { CustomPhoneInput } from "@/components/ui-custom/misc/CustomPhoneInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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
  last_name: string;
  email: string;
  phone: string;
  company_name: string;
  location: string;
  notes: string;
  contact_type_id: string;
  linked_user_id?: string;
  created_at: string;
  contact_type?: {
    id: string;
    name: string;
  };
  linked_user?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    organization_members?: Array<{
      organizations: {
        id: string;
        name: string;
      };
    }>;
  };
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
  const { data: contactTypes = [] } = useContactTypes();
  
  // Estados para búsqueda de usuarios
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserSearch, setShowUserSearch] = useState(false);
  
  const { data: searchResults = [] } = useSearchUsers(userSearchQuery);

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
      linked_user_id: "",
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
        linked_user_id: contact.linked_user_id || "",
      });
      
      // Si hay un usuario vinculado, establecerlo en el estado
      if (contact.linked_user) {
        setSelectedUser(contact.linked_user);
      } else {
        setSelectedUser(null);
      }
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
        linked_user_id: "",
      });
      setSelectedUser(null);
      setUserSearchQuery("");
      setShowUserSearch(false);
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
            last_name: formData.last_name || null,
            email: formData.email || null,
            phone: formData.phone || null,
            contact_type_id: formData.contact_type_id || null,
            company_name: formData.company_name || '',
            location: formData.location || '',
            notes: formData.notes || '',
            linked_user_id: selectedUser?.id || null,
          })
          .eq('id', contact.id);

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
            last_name: formData.last_name || null,
            email: formData.email || null,
            phone: formData.phone || null,
            contact_type_id: formData.contact_type_id || null,
            company_name: formData.company_name || '',
            location: formData.location || '',
            notes: formData.notes || '',
            linked_user_id: selectedUser?.id || null,
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
        description: contact 
          ? "Contacto actualizado correctamente"
          : "Contacto creado correctamente"
      });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      if (onSuccess) onSuccess();
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

  // Funciones auxiliares para vinculación de usuarios
  const handleUserSelect = (user: any) => {
    setSelectedUser(user);
    setUserSearchQuery("");
    setShowUserSearch(false);
    form.setValue('linked_user_id', user.id);
    
    // Auto-rellenar campos si están vacíos y no es modo edición
    if (!contact) {
      if (!form.getValues('first_name') && user.full_name) {
        const nameParts = user.full_name.split(' ');
        form.setValue('first_name', nameParts[0] || '');
        if (nameParts.length > 1) {
          form.setValue('last_name', nameParts.slice(1).join(' '));
        }
      }
      if (!form.getValues('email') && user.email) {
        form.setValue('email', user.email);
      }
    }
  };

  const handleUnlinkUser = () => {
    setSelectedUser(null);
    form.setValue('linked_user_id', '');
  };

  const isLinkedUser = !!selectedUser;
  
  const handleSubmit = (data: CreateContactForm) => {
    createContactMutation.mutate(data);
  };

  const handleClose = () => {
    onClose();
    form.reset();
    setSelectedUser(null);
    setUserSearchQuery("");
    setShowUserSearch(false);
  };

  return (
    <CustomModalLayout open={open} onClose={handleClose}>
      {{
        header: (
          <CustomModalHeader
            title={contact ? "Editar contacto" : "Nuevo contacto"}
            description={contact ? "Modifica la información del contacto" : "Agrega un nuevo contacto a tu organización"}
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" id="contact-form">
                
                {/* Sección de vinculación con usuario */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Usuario de Archub</Label>
                    {isLinkedUser && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleUnlinkUser}
                        className="h-auto p-1 text-xs text-muted-foreground hover:text-destructive"
                      >
                        <Unlink className="w-3 h-3 mr-1" />
                        Desvincular
                      </Button>
                    )}
                  </div>
                  
                  {isLinkedUser ? (
                    <div className="bg-accent/30 border border-accent rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={selectedUser.avatar_url} />
                          <AvatarFallback>
                            {selectedUser.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">
                              {selectedUser.full_name}
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Usuario de Archub
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {selectedUser.email}
                          </p>
                          {selectedUser.organization_members?.[0]?.organizations?.name && (
                            <p className="text-xs text-muted-foreground truncate">
                              {selectedUser.organization_members[0].organizations.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Si este contacto ya es un usuario de Archub, vinculalo aquí para mantener sincronizados sus datos.
                      </p>
                      
                      <div className="relative">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Buscar usuario por nombre o email..."
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowUserSearch(!showUserSearch)}
                          >
                            <Search className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {/* Resultados de búsqueda */}
                        {userSearchQuery.length >= 2 && searchResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto z-50">
                            {searchResults.map((user: any) => (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => handleUserSelect(user)}
                                className="w-full p-2 hover:bg-accent flex items-center gap-3 text-left"
                              >
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={user.avatar_url} />
                                  <AvatarFallback className="text-xs">
                                    {user.full_name?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">
                                    {user.full_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {user.email}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {userSearchQuery.length >= 2 && searchResults.length === 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md p-3 z-50">
                            <p className="text-sm text-muted-foreground text-center">
                              No se encontraron usuarios
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium required-asterisk">Nombre</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ingresa el nombre" 
                            disabled={isLinkedUser}
                            {...field} 
                          />
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
                        <FormLabel className="text-sm font-medium">Apellido</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ingresa el apellido" 
                            disabled={isLinkedUser}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="ejemplo@correo.com" 
                            type="email" 
                            disabled={isLinkedUser}
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
                        <FormLabel className="text-sm font-medium">Teléfono</FormLabel>
                        <FormControl>
                          <CustomPhoneInput 
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder="Número de teléfono"
                          />
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
                      <FormLabel className="text-sm font-medium">Tipo de contacto</FormLabel>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
          <div className="p-2 border-t border-[var(--card-border)] mt-auto">
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
                {createContactMutation.isPending ? 'Guardando...' : (contact ? "Actualizar" : "Crear contacto")}
              </Button>
            </div>
          </div>
        )
      }}
    </CustomModalLayout>
  );
}