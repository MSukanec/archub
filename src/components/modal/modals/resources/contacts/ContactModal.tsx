import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, User, Mail, Phone, Building2, MapPin, FileText, Search, Check, X, Link, Unlink, Link2, MessageCircle } from "lucide-react";

import { FormModalLayout } from "../../../form/FormModalLayout";
import { FormModalHeader } from "../../../form/FormModalHeader";
import { FormModalFooter } from "../../../form/FormModalFooter";
import { FormSubsectionButton } from "../../../form/FormSubsectionButton";
import { useModalPanelStore } from "../../../form/modalPanelStore";
import { ContactAttachmentsForm } from "./forms/ContactAttachmentsForm";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { ComboBoxMultiSelectField } from "@/components/ui-custom/fields/ComboBoxMultiSelectField";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useContactTypes } from "@/hooks/use-contact-types";
import { useSearchUsers } from "@/hooks/use-search-users";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { PhoneField } from "@/components/ui-custom/fields/PhoneField";


const createContactSchema = z.object({
  first_name: z.string().min(1, "El nombre es requerido"),
  last_name: z.string().optional(),
  email: z.union([z.string().email("Email inválido"), z.literal("")]).optional(),
  phone: z.string().optional(),
  contact_type_ids: z.array(z.string()).optional(),
  company_name: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  linked_user_id: z.string().optional(),
}).refine((data) => {
  // Si no hay usuario vinculado, el nombre es obligatorio
  if (!data.linked_user_id && !data.first_name) {
    return false;
  }
  return true;
}, {
  message: "El nombre es requerido cuando no hay usuario vinculado",
  path: ["first_name"],
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
  contact_types?: Array<{
    id: string;
    name: string;
  }>;
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
    initialPanel?: 'view' | 'edit';
  };
  onClose: () => void;
}

export function ContactFormModal({ modalData, onClose }: ContactFormModalProps) {
  const { editingContact, isEditing = false, initialPanel = 'edit' } = modalData || {};
  const { currentPanel, currentSubform, setPanel, setCurrentSubform } = useModalPanelStore();
  const { data: userData } = useCurrentUser();
  const { data: contactTypes } = useContactTypes();
  const { toast } = useToast();
  const [foundUser, setFoundUser] = useState<any>(null);

  const form = useForm<CreateContactForm>({
    resolver: zodResolver(createContactSchema),
    defaultValues: {
      first_name: editingContact?.first_name || '',
      last_name: editingContact?.last_name || '',
      email: editingContact?.email || '',
      phone: editingContact?.phone || '',
      contact_type_ids: editingContact?.contact_types?.map(ct => ct.id) || [],
      company_name: editingContact?.company_name || '',
      location: editingContact?.location || '',
      notes: editingContact?.notes || '',
      linked_user_id: editingContact?.linked_user_id || '',
    }
  });

  const organizationId = userData?.preferences?.last_organization_id;
  const linkedUserId = editingContact?.linked_user_id || form.watch('linked_user_id');

  // Query para obtener roles disponibles
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('id, name, type')
        .eq('type', 'organization')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  // Query para verificar si el usuario vinculado ya es miembro de la organización
  const { data: isMemberData } = useQuery({
    queryKey: ['is-member', linkedUserId, organizationId],
    queryFn: async () => {
      if (!linkedUserId || !organizationId) return { isMember: false };
      
      const { data, error } = await supabase
        .from('organization_members')
        .select('id')
        .eq('user_id', linkedUserId)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .single();

      return { isMember: !!data };
    },
    enabled: !!linkedUserId && !!organizationId,
  });

  const isAlreadyMember = isMemberData?.isMember || false;

  // Mutation para invitar al usuario a la organización
  const inviteMemberMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId || !editingContact?.linked_user?.email) {
        throw new Error('Faltan datos para invitar al usuario');
      }

      // Obtener el primer rol que no sea admin como predeterminado
      const defaultRole = roles.find(r => !r.name.toLowerCase().includes('admin'));
      if (!defaultRole) {
        throw new Error('No se encontró un rol válido');
      }

      const response = await apiRequest('POST', '/api/invite-member', {
        email: editingContact.linked_user.email,
        roleId: defaultRole.id,
        organizationId: organizationId,
      });

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      queryClient.invalidateQueries({ queryKey: ['is-member', linkedUserId, organizationId] });
      toast({
        title: 'Usuario invitado',
        description: data.isNewUser 
          ? 'La invitación ha sido enviada por email' 
          : 'El usuario ha sido agregado a la organización',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error al invitar usuario',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Watch email value for automatic user detection
  const emailValue = form.watch('email');

  // Detección automática de usuario por email con debounce
  useEffect(() => {
    if (!emailValue || emailValue.trim().length === 0) {
      setFoundUser(null);
      return;
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue.trim())) {
      setFoundUser(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const { data: existingUser, error } = await supabase
          .from('users')
          .select('id, full_name, email, avatar_url')
          .ilike('email', emailValue.trim())
          .single();

        if (error || !existingUser) {
          setFoundUser(null);
        } else {
          setFoundUser(existingUser);
        }
      } catch (err) {
        setFoundUser(null);
      }
    }, 600); // 600ms debounce

    return () => {
      clearTimeout(timeoutId);
    };
  }, [emailValue]);

  // Auto-completar campos cuando se encuentra un usuario
  useEffect(() => {
    if (foundUser) {
      const nameParts = foundUser.full_name?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      form.setValue("linked_user_id", foundUser.id);
      form.setValue("first_name", firstName);
      form.setValue("last_name", lastName);
      form.setValue("email", foundUser.email || '');
    } else {
      // Si no hay usuario encontrado y no estamos editando un contacto ya vinculado, limpiar el linked_user_id
      if (!editingContact?.linked_user) {
        form.setValue("linked_user_id", "");
      }
    }
  }, [foundUser, form, editingContact]);

  React.useEffect(() => {
    if (editingContact) {
      // Si tiene usuario vinculado, usar datos del usuario; sino, usar datos del contacto
      let firstName = editingContact.first_name || '';
      let lastName = editingContact.last_name || '';
      let email = editingContact.email || '';
      
      if (editingContact.linked_user) {
        const nameParts = editingContact.linked_user.full_name?.split(' ') || [];
        firstName = nameParts[0] || editingContact.first_name || '';
        lastName = nameParts.slice(1).join(' ') || editingContact.last_name || '';
        email = editingContact.linked_user.email || editingContact.email || '';
      }
      
      form.reset({
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: editingContact.phone || '',
        contact_type_ids: editingContact.contact_types?.map(ct => ct.id) || [],
        company_name: editingContact.company_name || '',
        location: editingContact.location || '',
        notes: editingContact.notes || '',
        linked_user_id: editingContact.linked_user_id || '',
      });
      setPanel(initialPanel);
    } else {
      form.reset({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        contact_type_ids: [],
        company_name: '',
        location: '',
        notes: '',
        linked_user_id: '',
      });
      setPanel('edit');
    }
  }, [editingContact, form, setPanel, initialPanel]);

  const createContactMutation = useMutation({
    mutationFn: async (data: CreateContactForm) => {
      if (!userData?.organization?.id) {
        throw new Error('Organization ID not found');
      }

      const organizationId = userData.organization.id;

      if (isEditing && editingContact) {
        // Update contact
        // Verificar si ya existe otro contacto con el mismo email (si se proporciona email y cambió)
        if (data.email && data.email.trim().length > 0 && data.email !== editingContact.email) {
          const { data: existingContact, error: checkError } = await supabase
            .from('contacts')
            .select('id, first_name, last_name, email')
            .eq('organization_id', organizationId)
            .ilike('email', data.email.trim())
            .neq('id', editingContact.id)
            .maybeSingle();

          if (checkError) throw checkError;

          if (existingContact) {
            const contactName = `${existingContact.first_name} ${existingContact.last_name || ''}`.trim();
            throw new Error(`Ya existe otro contacto con el email "${data.email}" (${contactName}). No se pueden tener contactos duplicados con el mismo email.`);
          }
        }

        const { data: updatedContact, error } = await supabase
          .from('contacts')
          .update({
            first_name: data.first_name,
            last_name: data.last_name || null,
            email: data.email || null,
            phone: data.phone || null,
            company_name: data.company_name || null,
            location: data.location || null,
            notes: data.notes || null,
            linked_user_id: data.linked_user_id || null,
          })
          .eq('id', editingContact.id)
          .select()
          .single();

        if (error) throw error;

        // Delete existing contact type links
        await supabase
          .from('contact_type_links')
          .delete()
          .eq('contact_id', editingContact.id);

        // Insert new contact type links
        if (data.contact_type_ids && data.contact_type_ids.length > 0) {
          const typeLinks = data.contact_type_ids.map(typeId => ({
            contact_id: editingContact.id,
            contact_type_id: typeId,
            organization_id: organizationId,
          }));

          const { error: linksError } = await supabase
            .from('contact_type_links')
            .insert(typeLinks);

          if (linksError) throw linksError;
        }

        return updatedContact;
      } else {
        // Create new contact
        // Verificar si ya existe un contacto con el mismo email (si se proporciona email)
        if (data.email && data.email.trim().length > 0) {
          const { data: existingContact, error: checkError } = await supabase
            .from('contacts')
            .select('id, first_name, last_name, email')
            .eq('organization_id', organizationId)
            .ilike('email', data.email.trim())
            .maybeSingle();

          if (checkError) throw checkError;

          if (existingContact) {
            const contactName = `${existingContact.first_name} ${existingContact.last_name || ''}`.trim();
            throw new Error(`Ya existe un contacto con el email "${data.email}" (${contactName}). No se pueden crear contactos duplicados con el mismo email.`);
          }
        }

        const { data: newContact, error } = await supabase
          .from('contacts')
          .insert({
            organization_id: organizationId,
            first_name: data.first_name,
            last_name: data.last_name || null,
            email: data.email || null,
            phone: data.phone || null,
            company_name: data.company_name || null,
            location: data.location || null,
            notes: data.notes || null,
            linked_user_id: data.linked_user_id || null,
          })
          .select()
          .single();

        if (error) throw error;

        // Insert contact type links
        if (data.contact_type_ids && data.contact_type_ids.length > 0) {
          const typeLinks = data.contact_type_ids.map(typeId => ({
            contact_id: newContact.id,
            contact_type_id: typeId,
            organization_id: organizationId,
          }));

          const { error: linksError } = await supabase
            .from('contact_type_links')
            .insert(typeLinks);

          if (linksError) throw linksError;
        }

        return newContact;
      }
    },
    onSuccess: async () => {
      // Si estamos creando un nuevo contacto (no editando), marcar checklist
      if (!isEditing) {
        try {
          const { error: checklistError } = await supabase.rpc('tick_home_checklist', {
            p_key: 'create_contact',
            p_value: true
          });
          
          if (checklistError) {
            console.error('Error updating home checklist:', checklistError);
          }
        } catch (error) {
          console.error('Error calling tick_home_checklist:', error);
        }
      }

      // Invalidate contacts query - using the query key pattern from useContacts hook
      queryClient.invalidateQueries({ 
        queryKey: [`/api/contacts?organization_id=${userData?.organization?.id}`] 
      });
      // Also invalidate any other contact-related queries
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && key.includes('/api/contacts');
        }
      });
      // Invalidate current-user to refresh checklist status
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      
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
    setFoundUser(null);
    onClose();
  };

  const onSubmit = (data: CreateContactForm) => {
    createContactMutation.mutate(data);
  };

  const viewPanel = (
    <div className="space-y-4">
      {/* Badge si el contacto está vinculado */}
      {editingContact?.linked_user && (
        <div className="p-3 border border-accent/20 bg-accent/5 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link2 className="h-4 w-4 text-accent" />
            <div>
              <p className="text-sm font-medium">Vinculado a usuario de Archub</p>
              <p className="text-xs text-muted-foreground">
                {editingContact.linked_user.full_name}
              </p>
            </div>
          </div>
          {!isAlreadyMember && (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => inviteMemberMutation.mutate()}
              disabled={inviteMemberMutation.isPending}
              data-testid="button-invite-to-organization"
            >
              {inviteMemberMutation.isPending ? 'Invitando...' : 'Invitar a la organización'}
            </Button>
          )}
        </div>
      )}

      {/* Botones de acción rápida - DEBAJO del banner */}
      {(editingContact?.email || editingContact?.phone) && (
        <div className="grid grid-cols-2 gap-2">
          {editingContact.email && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = `mailto:${editingContact.email}`}
              className="flex items-center justify-center gap-2 border-muted-foreground text-muted-foreground hover:border-muted-foreground hover:text-foreground"
              data-testid="button-email-contact"
            >
              <Mail className="h-4 w-4" />
              Enviar Email
            </Button>
          )}
          {editingContact.phone && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const cleanPhone = editingContact.phone?.replace(/[\s\-\(\)]/g, '') || ''
                window.open(`https://wa.me/${cleanPhone}`, '_blank')
              }}
              className="flex items-center justify-center gap-2 text-green-600 hover:text-green-700 border-green-600 hover:border-green-700"
              data-testid="button-whatsapp-contact"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
          )}
        </div>
      )}

      {/* Información básica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Nombre</h4>
          <p className="text-sm mt-1">
            {editingContact?.first_name || '—'}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Apellido</h4>
          <p className="text-sm mt-1">
            {editingContact?.last_name || '—'}
          </p>
        </div>
      </div>

      {/* Email y Teléfono en grid */}
      {(editingContact?.email || editingContact?.phone) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {editingContact.email && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
              <a 
                href={`mailto:${editingContact.email}`}
                className="text-sm mt-1 text-accent hover:underline block"
              >
                {editingContact.email}
              </a>
            </div>
          )}
          
          {editingContact.phone && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Teléfono</h4>
              <p className="text-sm mt-1">{editingContact.phone}</p>
            </div>
          )}
        </div>
      )}

      {/* Tipos de contacto */}
      {editingContact?.contact_types && editingContact.contact_types.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Tipos de contacto</h4>
          <div className="flex flex-wrap gap-2">
            {editingContact.contact_types.map((type) => (
              <Badge 
                key={type.id} 
                variant="outline"
                className="bg-accent/10 border-accent/20"
              >
                {type.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Empresa */}
      {editingContact?.company_name && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Empresa</h4>
          <p className="text-sm mt-1">{editingContact.company_name}</p>
        </div>
      )}

      {/* Ubicación */}
      {editingContact?.location && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Ubicación</h4>
          <p className="text-sm mt-1">{editingContact.location}</p>
        </div>
      )}

      {/* Notas */}
      {editingContact?.notes && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Notas</h4>
          <p className="text-sm mt-1 text-muted-foreground whitespace-pre-wrap">
            {editingContact.notes}
          </p>
        </div>
      )}
    </div>
  );

  const editPanel = (
    <>
      {/* Badge si el contacto ya está vinculado */}
      {(editingContact?.linked_user || form.watch('linked_user_id')) && (
        <div className="mb-4 p-3 border border-accent/20 bg-accent/5 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link2 className="h-4 w-4 text-accent" />
            <div>
              <p className="text-sm font-medium">Vinculado a usuario de Archub</p>
              <p className="text-xs text-muted-foreground">
                {editingContact?.linked_user?.full_name || foundUser?.full_name || 'Usuario vinculado'}
              </p>
            </div>
          </div>
          {!isAlreadyMember && editingContact?.linked_user && (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => inviteMemberMutation.mutate()}
              disabled={inviteMemberMutation.isPending}
              data-testid="button-invite-to-organization"
            >
              {inviteMemberMutation.isPending ? 'Invitando...' : 'Invitar a la organización'}
            </Button>
          )}
        </div>
      )}

      {/* FORM FIELDS - CON SPACING CONSISTENTE */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 -mt-2">
          {/* Nombre - Apellido */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Nombre" 
                      {...field} 
                      disabled={!!editingContact?.linked_user}
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
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Apellido" 
                      {...field} 
                      disabled={!!editingContact?.linked_user}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Email - FULL WIDTH */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="email@ejemplo.com" 
                    {...field} 
                    disabled={!!editingContact?.linked_user}
                  />
                </FormControl>
                <FormMessage />
                
                {/* Feedback automático de vinculación - solo cuando HAY coincidencia */}
                {foundUser && field.value && field.value.length > 0 && !editingContact?.linked_user && (
                  <div className="mt-2">
                    <div className="flex items-start gap-2 p-2 border border-accent/20 bg-accent/5 rounded-md">
                      <Link2 className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">
                          Ya existe un usuario de Archub con este correo.
                        </p>
                        <p className="text-xs text-accent font-medium mt-0.5">
                          Vinculado a {foundUser.full_name}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </FormItem>
            )}
          />

          {/* Teléfono - Tipos de Contacto */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <PhoneField
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
              name="contact_type_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipos de contacto</FormLabel>
                  <FormControl>
                    <ComboBoxMultiSelectField
                      options={contactTypes?.map(type => ({
                        value: type.id,
                        label: type.name
                      })) || []}
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder="Seleccionar tipos de contacto..."
                      searchPlaceholder="Buscar tipos..."
                      emptyText="No hay tipos disponibles"
                      className="w-full min-h-[40px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Empresa - Ubicacion */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
          </div>

          {/* Notas - FULL WIDTH */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
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

          {/* FormSubsectionButton para Adjuntos */}
          <div className="pt-4 border-t">
            <FormSubsectionButton
              icon={<FileText />}
              title="Archivos y Media"
              description={
                isEditing && editingContact 
                  ? "Gestionar archivos adjuntos del contacto"
                  : "Guarda el contacto primero y luego podrás subir archivos"
              }
              onClick={() => {
                if (isEditing && editingContact) {
                  setPanel('subform');
                  setCurrentSubform('attachments');
                } else {
                  // Si no está en modo edición, mostrar toast explicativo y guardar
                  toast({
                    title: "Guardando contacto",
                    description: "Después de guardar podrás editar el contacto para subir archivos",
                  });
                  form.handleSubmit(onSubmit)();
                }
              }}
            />
          </div>
        </form>
      </Form>
    </>
  );

  const headerContent = (
    <FormModalHeader
      title={
        currentPanel === 'subform' && currentSubform === 'attachments' 
          ? "Archivos y Media"
          : currentPanel === 'view'
            ? "Contacto"
            : (isEditing ? "Editar Contacto" : "Nuevo Contacto")
      }
      description={
        currentPanel === 'subform' && currentSubform === 'attachments' 
          ? "Gestionar archivos adjuntos del contacto"
          : currentPanel === 'view'
            ? "Información del contacto"
            : isEditing 
              ? "Actualiza la información del contacto"
              : "Agrega un nuevo contacto a tu organización"
      }
      icon={currentPanel === 'subform' && currentSubform === 'attachments' ? FileText : UserPlus}
      leftActions={
        currentPanel === 'edit' && isEditing ? (
          <button
            type="button"
            onClick={() => setPanel('view')}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Volver
          </button>
        ) : currentPanel === 'subform' && currentSubform === 'attachments' ? (
          <button
            type="button"
            onClick={() => setPanel('edit')}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Volver
          </button>
        ) : undefined
      }
      rightActions={undefined}
    />
  );

  const attachmentsPanel = isEditing && editingContact ? (
    <ContactAttachmentsForm 
      contactId={editingContact.id} 
      contact={editingContact}
    />
  ) : null;

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={
        currentPanel === 'subform' && currentSubform === 'attachments' ? "Cerrar" :
        currentPanel === 'view' ? "Editar" :
        createContactMutation.isPending ? "Guardando..." : 
        (isEditing ? "Actualizar Contacto" : "Crear Contacto")
      }
      onRightClick={() => {
        if (currentPanel === 'subform' && currentSubform === 'attachments') {
          handleClose();
        } else if (currentPanel === 'view' && isEditing) {
          setPanel('edit');
        } else {
          form.handleSubmit(onSubmit)();
        }
      }}

    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      subformPanel={attachmentsPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
    />
  );
}

export default ContactFormModal;