import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, User, UserCheck } from 'lucide-react';

import { FormModalLayout } from '@/components/modal/form/FormModalLayout';
import { FormModalHeader } from '@/components/modal/form/FormModalHeader';
import { FormModalFooter } from '@/components/modal/form/FormModalFooter';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

import { useCurrentUser } from '@/hooks/use-current-user';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const memberSchema = z.object({
  email: z.string().email("Debe ser un email válido"),
  role_id: z.string().min(1, "Debe seleccionar un rol"),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface MemberFormModalProps {
  open: boolean;
  onClose: () => void;
  editingMember?: any;
}

export function MemberFormModal({ open, onClose, editingMember }: MemberFormModalProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      email: "",
      role_id: "",
    },
  });

  const { handleSubmit, reset, formState: { isSubmitting } } = form;

  // Reset form when editing member changes or user data loads
  useEffect(() => {
    if (userData) {
      if (editingMember) {
        reset({
          email: editingMember.users?.email || '',
          role_id: editingMember.role_id || '',
        });
      } else {
        reset({
          email: '',
          role_id: '',
        });
      }
    }
  }, [editingMember, userData, reset]);

  // Fetch available roles (only ORGANIZATION type)
  const { data: roles = [] } = useQuery({
    queryKey: ['organization-roles'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('roles')
        .select('id, name, type')
        .eq('type', 'organization')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const memberMutation = useMutation({
    mutationFn: async (memberData: MemberFormData) => {
      if (!supabase || !userData?.organization?.id) {
        throw new Error('No organization selected');
      }

      if (editingMember) {
        // Update existing member
        const { data, error } = await supabase
          .from('organization_members')
          .update({
            role_id: memberData.role_id,
          })
          .eq('id', editingMember.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new member
        // First, check if user exists
        const { data: existingUser, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', memberData.email)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          throw userError;
        }

        if (existingUser) {
          // User exists, add to organization
          const { data, error } = await supabase
            .from('organization_members')
            .insert({
              user_id: existingUser.id,
              organization_id: userData.organization.id,
              role_id: memberData.role_id,
              is_active: true,
              joined_at: new Date().toISOString(),
              last_active_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) throw error;
          return data;
        } else {
          // User doesn't exist, send invitation (would require invitation system)
          throw new Error('El usuario no existe en el sistema. Primero debe registrarse.');
        }
      }
    },
    onSuccess: () => {
      const successMessage = editingMember 
        ? "Miembro actualizado exitosamente"
        : "Miembro agregado exitosamente a la organización";

      toast({
        title: editingMember ? "Miembro actualizado" : "Miembro agregado",
        description: successMessage,
      });

      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al procesar el miembro",
        variant: "destructive",
      });
    },
  });

  const handleSubmitForm = async (data: MemberFormData) => {
    setIsLoading(true);
    try {
      await memberMutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!open) return null;

  return (
    <FormModalLayout>
      <FormModalHeader
        title={editingMember ? "Editar Miembro" : "Agregar Miembro"}
        description={editingMember ? "Actualiza la información del miembro" : "Invita a un nuevo miembro a la organización"}
        onClose={handleClose}
      />
      
      <div className="p-6 space-y-6">
        <Form {...form}>
          <form id="member-form" onSubmit={handleSubmit(handleSubmitForm)} className="space-y-6">
            {/* Email Field - Only show in create mode */}
            {!editingMember && (
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="required-asterisk">Email del Usuario</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="usuario@ejemplo.com"
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Show current user info in edit mode */}
            {editingMember && (
              <div className="space-y-3">
                <FormLabel>Usuario</FormLabel>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={editingMember.users?.avatar_url} />
                        <AvatarFallback className="bg-accent/10 text-accent">
                          {editingMember.users?.full_name
                            ?.split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{editingMember.users?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{editingMember.users?.email}</p>
                      </div>
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Role Field */}
            <FormField
              control={form.control}
              name="role_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="required-asterisk">Rol</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Invited by Section - Only show in create mode */}
            {!editingMember && userData?.user && (
              <div className="space-y-3">
                <FormLabel>Invitado por</FormLabel>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={userData.user.avatar_url} />
                        <AvatarFallback className="bg-accent/10 text-accent">
                          {userData.user.full_name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{userData.user.full_name}</p>
                        <p className="text-xs text-muted-foreground">{userData.user.email}</p>
                      </div>
                      <UserCheck className="h-4 w-4 text-accent" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </form>
        </Form>
      </div>

      <FormModalFooter
        onCancel={handleClose}
        onSubmit={() => form.handleSubmit(handleSubmitForm)()}
        submitText={editingMember ? "Actualizar Miembro" : "Agregar Miembro"}
        cancelText="Cancelar"
        isLoading={isLoading || isSubmitting}
        form="member-form"
      />
    </FormModalLayout>
  );
}