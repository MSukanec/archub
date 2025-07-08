import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, User, Search, Check, X, Link, Unlink, CheckCircle, Mail, MessageSquare, UserPlus } from "lucide-react";

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
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Estados para invitaciones
  const [existingInvitation, setExistingInvitation] = useState<any>(null);
  const [checkingInvitation, setCheckingInvitation] = useState(false);

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

  // Buscar usuarios basado en el email del formulario
  const emailValue = form.watch('email');
  const { data: searchResults = [] } = useSearchUsers(emailValue || "");

  // Detectar automáticamente si el email corresponde a un usuario existente
  useEffect(() => {
    if (emailValue && searchResults.length > 0 && !selectedUser) {
      const exactMatch = searchResults.find(user => user.email === emailValue);
      if (exactMatch) {
        setSelectedUser(exactMatch);
        form.setValue('linked_user_id', exactMatch.id);
        // Auto-completar campos solo si están vacíos
        if (!form.getValues('first_name') && exactMatch.full_name) {
          const nameParts = exactMatch.full_name.split(' ');
          form.setValue('first_name', nameParts[0] || '');
          if (nameParts.length > 1) {
            form.setValue('last_name', nameParts.slice(1).join(' '));
          }
        }
      }
    } else if (!emailValue) {
      setSelectedUser(null);
      form.setValue('linked_user_id', '');
    }
  }, [emailValue, searchResults, selectedUser, form]);

  // Reset form when contact changes
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
        const fullName = selectedUser 
          ? selectedUser.full_name 
          : `${formData.first_name || ''} ${formData.last_name || ''}`.trim();
          
        const { error } = await supabase
          .from('contacts')
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name || null,
            full_name: fullName || null,
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
        const fullName = selectedUser 
          ? selectedUser.full_name 
          : `${formData.first_name || ''} ${formData.last_name || ''}`.trim();

        const { data: contactData, error } = await supabase
          .from('contacts')
          .insert({
            organization_id: organizationId,
            first_name: formData.first_name,
            last_name: formData.last_name || null,
            full_name: fullName || null,
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
      
      // Invalidar ambas claves de caché para contactos
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['organization-contacts', organizationId] });
      
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

  // Mutación para enviar invitación por email
  const sendInvitationMutation = useMutation({
    mutationFn: async ({ email, fullName }: { email: string; fullName: string }) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      if (!organizationId || !userData?.user?.id) {
        throw new Error('Datos de usuario no disponibles');
      }

      const { error } = await supabase
        .from('organization_invitations')
        .insert({
          organization_id: organizationId,
          email: email,
          invited_by: userData.user.id,
          status: 'pending'
        });

      if (error) {
        throw new Error(`Error al enviar invitación: ${error.message}`);
      }
    },
    onSuccess: () => {
      toast({
        title: "Invitación enviada",
        description: "Se ha enviado la invitación por email correctamente"
      });
      // Verificar inmediatamente la invitación
      checkInvitation();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la invitación",
        variant: "destructive"
      });
    }
  });

  // Función para verificar invitación existente
  const checkInvitation = async () => {
    if (!emailValue || !supabase || !organizationId) return;
    
    setCheckingInvitation(true);
    try {
      const { data, error } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('email', emailValue)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error) {
        setExistingInvitation(data?.[0] || null);
      }
    } catch (error) {
      console.error('Error checking invitation:', error);
    } finally {
      setCheckingInvitation(false);
    }
  };

  // Verificar invitación existente cuando cambia el email
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (emailValue && !selectedUser) {
        checkInvitation();
      } else {
        setExistingInvitation(null);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [emailValue, selectedUser]);

  const handleUnlinkUser = () => {
    setSelectedUser(null);
    form.setValue('linked_user_id', '');
  };

  const handleCopyWhatsAppLink = () => {
    const currentEmail = form.getValues('email');
    const currentName = `${form.getValues('first_name')} ${form.getValues('last_name')}`.trim();
    
    if (!currentEmail) {
      toast({
        title: "Email requerido",
        description: "Ingresa un email para crear el enlace de WhatsApp",
        variant: "destructive"
      });
      return;
    }

    const whatsappMessage = `¡Hola ${currentName}! Te invitamos a unirte a nuestra organización en Archub. Regístrate con este email: ${currentEmail}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
    
    navigator.clipboard.writeText(whatsappUrl).then(() => {
      toast({
        title: "Enlace copiado",
        description: "El enlace de WhatsApp se ha copiado al portapapeles"
      });
    });
  };

  const isLinkedUser = !!selectedUser;
  const showInviteBlock = emailValue && !selectedUser;
  
  const handleSubmit = (data: CreateContactForm) => {
    createContactMutation.mutate(data);
  };

  const handleClose = () => {
    onClose();
    form.reset();
    setSelectedUser(null);
    setExistingInvitation(null);
    setCheckingInvitation(false);
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
          <CustomModalBody columns={1}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" id="contact-form">
                
                {/* Campo Usuario de Archub */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-sm font-medium">Usuario de Archub</FormLabel>
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
                                  Este usuario ya está en Archub
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {selectedUser.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <FormControl>
                            <Input 
                              placeholder="Buscar por email completo (ej: usuario@email.com)" 
                              type="email" 
                              {...field} 
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Si este contacto ya es un usuario de Archub, vinculalo aquí ingresando su email.
                          </p>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Bloque de invitación */}
                {showInviteBlock && (
                  <div className="bg-muted/50 border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Invitar a Archub</p>
                    </div>
                    
                    {existingInvitation ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <p className="text-sm text-muted-foreground">
                            Ya se envió una invitación a este email
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Estado: {existingInvitation.status === 'pending' ? 'Pendiente' : existingInvitation.status}
                        </Badge>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground">
                          Este email no corresponde a un usuario registrado. Puedes invitarlo a unirse a Archub.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentEmail = form.getValues('email');
                              const currentName = `${form.getValues('first_name')} ${form.getValues('last_name')}`.trim();
                              if (currentEmail) {
                                sendInvitationMutation.mutate({ 
                                  email: currentEmail, 
                                  fullName: currentName || 'Usuario' 
                                });
                              }
                            }}
                            disabled={sendInvitationMutation.isPending}
                          >
                            <Mail className="w-3 h-3 mr-1" />
                            {sendInvitationMutation.isPending ? 'Enviando...' : 'Enviar invitación'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCopyWhatsAppLink}
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Copiar link WhatsApp
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Nombre/s <span className="text-accent">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nombre/s" 
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
                      <FormLabel className="text-sm font-medium">Apellido/s</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Apellido/s" 
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

                <FormField
                  control={form.control}
                  name="contact_type_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Tipo de contacto</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Selecciona el tipo de contacto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background border border-border shadow-md">
                          {contactTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id} className="hover:bg-accent hover:text-accent-foreground">
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
                        <Input placeholder="Ciudad, país" {...field} />
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
                      <FormLabel className="text-sm font-medium">Notas</FormLabel>
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

              </form>
            </Form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter 
            onCancel={handleClose}
            form="contact-form"
            submitText={contact ? 'Actualizar contacto' : 'Crear contacto'}
            isLoading={createContactMutation.isPending}
          />
        )
      }}
    </CustomModalLayout>
  );
}