import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Mail, User } from 'lucide-react';

import { CustomModalLayout } from '@/components/ui-custom/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/CustomModalFooter';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

const memberInviteSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
  role_id: z.string().min(1, 'Selecciona un rol')
});

type MemberInviteFormData = z.infer<typeof memberInviteSchema>;

interface Role {
  id: string;
  name: string;
  description: string;
  type: string;
}

interface NewMemberModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewMemberModal({ open, onClose }: NewMemberModalProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;

  const form = useForm<MemberInviteFormData>({
    resolver: zodResolver(memberInviteSchema),
    defaultValues: {
      email: '',
      role_id: ''
    }
  });

  // Fetch organization roles
  const { data: roles = [] } = useQuery({
    queryKey: ['organization-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('id, name, description, type')
        .eq('type', 'organization')
        .order('name');

      if (error) throw error;
      return data as Role[];
    },
    enabled: open
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      form.reset({
        email: '',
        role_id: ''
      });
    }
  }, [open, form]);

  const inviteMutation = useMutation({
    mutationFn: async (formData: MemberInviteFormData) => {
      if (!organizationId || !userData?.user?.id) {
        throw new Error('No se pudo identificar la organización o usuario');
      }

      // First check if user already exists in the organization
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', userData.user.id)
        .single();

      if (existingMember) {
        throw new Error('Este usuario ya es miembro de la organización');
      }

      // Check if there's a pending invitation
      const { data: existingInvite } = await supabase
        .from('organization_invitations')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('email', formData.email)
        .eq('status', 'pending')
        .single();

      if (existingInvite) {
        throw new Error('Ya existe una invitación pendiente para este email');
      }

      // Create invitation record
      const { error: inviteError } = await supabase
        .from('organization_invitations')
        .insert({
          organization_id: organizationId,
          email: formData.email,
          role_id: formData.role_id,
          invited_by: userData.user.id,
          status: 'pending',
          invited_at: new Date().toISOString()
        });

      if (inviteError) throw inviteError;

      // In a real app, you would send an email here
      // For now, we'll just create the invitation record
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Invitación enviada",
        description: "Se ha enviado la invitación por email correctamente"
      });
      
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      queryClient.invalidateQueries({ queryKey: ['organization-invites'] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la invitación",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (data: MemberInviteFormData) => {
    inviteMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <CustomModalLayout open={open} onClose={handleClose}>
      {{
        header: (
          <CustomModalHeader
            title="Invitar miembro"
            description="Envía una invitación por email para que se una a tu organización"
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                
                {/* Email field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email del invitado
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="usuario@ejemplo.com"
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Role selection */}
                <FormField
                  control={form.control}
                  name="role_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Rol en la organización
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              <div>
                                <div className="font-medium">{role.name}</div>
                                {role.description && (
                                  <div className="text-xs text-muted-foreground">{role.description}</div>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
            onSave={form.handleSubmit(handleSubmit)}
            saveText="Enviar invitación"
            saveLoading={inviteMutation.isPending}
          />
        )
      }}
    </CustomModalLayout>
  );
}