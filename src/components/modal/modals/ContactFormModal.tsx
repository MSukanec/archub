import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { FormModalHeader } from "../form/FormModalHeader";
import { FormModalFooter } from "../form/FormModalFooter";
import { FormModalLayout } from "../form/FormModalLayout";
import FormModalBody from "../form/FormModalBody";
import { useModalPanelStore } from "../form/modalPanelStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PhoneInput } from "@/components/ui-custom/PhoneInput";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useSearchUsers } from "@/hooks/use-search-users";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { UserPlus, User, Mail, Phone, Building, MapPin, FileText, Link, Unlink, Search, Check, X } from "lucide-react";

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

interface ContactFormModalProps {
  modalData?: {
    contact?: any;
    isEditing?: boolean;
  };
  onClose: () => void;
}

// Lista hardcoded de tipos de contacto
const contactTypes = [
  { id: 'arquitecto', name: 'Arquitecto' },
  { id: 'ingeniero', name: 'Ingeniero' },
  { id: 'constructor', name: 'Constructor' },
  { id: 'proveedor', name: 'Proveedor' },
  { id: 'cliente', name: 'Cliente' }
];

export function ContactFormModal({ modalData, onClose }: ContactFormModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const { data: userData } = useCurrentUser();
  const { data: searchResults = [] } = useSearchUsers(searchTerm);
  const { toast } = useToast();
  const { setPanel } = useModalPanelStore();

  const isEditing = modalData?.isEditing || false;
  const editingContact = modalData?.contact;

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

  // Set selected user if editing existing contact with linked user
  useEffect(() => {
    if (editingContact?.linked_user) {
      setSelectedUser(editingContact.linked_user);
    }
  }, [editingContact]);

  const createContactMutation = useMutation({
    mutationFn: async (data: CreateContactForm) => {
      const contactData = {
        ...data,
        organization_id: userData?.organization?.id,
        full_name: `${data.first_name} ${data.last_name || ''}`.trim(),
        linked_user_id: selectedUser?.id || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('contacts')
          .update(contactData)
          .eq('id', editingContact.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contacts')
          .insert([contactData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Contacto actualizado" : "Contacto creado",
        description: isEditing ? "El contacto ha sido actualizado exitosamente." : "El nuevo contacto ha sido creado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      onClose();
    },
    onError: (error: any) => {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error?.message || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateContactForm) => {
    createContactMutation.mutate(data);
  };

  const handleLinkUser = (user: any) => {
    setSelectedUser(user);
    form.setValue('linked_user_id', user.id);
    setShowUserSearch(false);
    setSearchTerm("");
  };

  const handleUnlinkUser = () => {
    setSelectedUser(null);
    form.setValue('linked_user_id', "");
  };

  // View Panel (para mostrar datos del contacto cuando no se está editando)
  const viewPanel = (
    <FormModalBody>
      <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={editingContact?.linked_user?.avatar_url} />
          <AvatarFallback className="text-lg">
            {editingContact?.first_name?.[0]}{editingContact?.last_name?.[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-lg font-semibold">{editingContact?.full_name}</h3>
          {editingContact?.company_name && (
            <p className="text-sm text-muted-foreground">{editingContact.company_name}</p>
          )}
          {contactTypes.find(t => t.id === editingContact?.contact_type_id) && (
            <Badge variant="outline" className="mt-1">
              {contactTypes.find(t => t.id === editingContact?.contact_type_id)?.name}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {editingContact?.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{editingContact.email}</span>
          </div>
        )}
        {editingContact?.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{editingContact.phone}</span>
          </div>
        )}
        {editingContact?.location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{editingContact.location}</span>
          </div>
        )}
      </div>

      {editingContact?.notes && (
        <div>
          <h4 className="text-sm font-medium mb-2">Notas</h4>
          <p className="text-sm text-muted-foreground">{editingContact.notes}</p>
        </div>
      )}

      {editingContact?.linked_user && (
        <div>
          <h4 className="text-sm font-medium mb-2">Usuario vinculado</h4>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={editingContact.linked_user.avatar_url} />
              <AvatarFallback>
                {editingContact.linked_user.full_name?.[0] || editingContact.linked_user.email?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{editingContact.linked_user.full_name}</p>
              <p className="text-xs text-muted-foreground">{editingContact.linked_user.email}</p>
            </div>
          </div>
        </div>
      )}
      </div>
    </FormModalBody>
  );

  // Edit Panel (formulario)
  const editPanel = (
    <FormModalBody>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nombre" />
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
                  <Input {...field} placeholder="Apellido" />
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
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="email@ejemplo.com" />
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
                  <PhoneInput {...field} placeholder="Número de teléfono" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contact_type_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de contacto</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
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
                  <Input {...field} placeholder="Nombre de la empresa" />
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
                <Input {...field} placeholder="Ciudad, región o dirección" />
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
                <Textarea {...field} placeholder="Notas adicionales sobre el contacto" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* User Linking Section */}
        <div className="space-y-3">
          <Label>Vincular con usuario existente</Label>
          
          {selectedUser ? (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedUser.avatar_url} />
                  <AvatarFallback>{selectedUser.full_name?.[0] || selectedUser.email?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{selectedUser.full_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleUnlinkUser}
              >
                <Unlink className="h-4 w-4 mr-2" />
                Desvincular
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {!showUserSearch ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUserSearch(true)}
                  className="w-full"
                >
                  <Link className="h-4 w-4 mr-2" />
                  Buscar usuario para vincular
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
                      variant="ghost"
                      onClick={() => {
                        setShowUserSearch(false);
                        setSearchTerm("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {searchTerm && (
                    <div className="max-h-32 overflow-y-auto border rounded-lg">
                      {searchResults.length > 0 ? (
                        searchResults.map((user: any) => (
                          <div
                            key={user.id}
                            className="flex items-center gap-3 p-2 hover:bg-muted cursor-pointer"
                            onClick={() => handleLinkUser(user)}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback>{user.full_name?.[0] || user.email?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{user.full_name}</p>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No se encontraron usuarios
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        </form>
      </Form>
    </FormModalBody>
  );

  const handleClose = () => {
    setPanel("view");
    onClose();
  };

  // Set to edit panel for creation or editing
  useEffect(() => {
    setPanel(isEditing ? "edit" : "edit"); // Always start in edit mode for contacts
  }, [isEditing, setPanel]);

  return (
    <FormModalLayout
      viewPanel={viewPanel}
      editPanel={editPanel}
      onClose={handleClose}
      headerContent={
        <FormModalHeader 
          title={isEditing ? "Editar Contacto" : "Nuevo Contacto"}
          icon={<UserPlus className="h-5 w-5" />}
        />
      }
      footerContent={
        <FormModalFooter
          cancelText="Cancelar"
          submitText={isEditing ? "Actualizar" : "Crear Contacto"}
          onSubmit={form.handleSubmit(onSubmit)}
          isLoading={createContactMutation.isPending}
          onCancel={handleClose}
        />
      }
    />
  );
}