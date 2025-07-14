import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { FormModalHeader } from '../form/FormModalHeader';
import { FormModalFooter } from '../form/FormModalFooter';
import FormModalBody from '../form/FormModalBody';
import { useModalPanelStore } from '../form/modalPanelStore';
import { useGlobalModalStore } from '../form/useGlobalModalStore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserPlus } from 'lucide-react';

const memberSchema = z.object({
  email: z.string().email('Email inválido'),
  roleId: z.string().min(1, 'Debe seleccionar un rol'),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface MemberModalProps {
  editingMember?: any;
}

export function MemberFormModal({ editingMember }: MemberModalProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const { currentPanel, setPanel } = useModalPanelStore();
  const { closeModal } = useGlobalModalStore();
  const [isLoading, setIsLoading] = useState(false);

  const organizationId = userData?.preferences?.last_organization_id;

  // Query to get available roles
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

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      email: '',
      roleId: '',
    },
  });

  // Reset form when editing member changes
  useEffect(() => {
    if (editingMember) {
      form.reset({
        email: editingMember.users?.email || '',
        roleId: editingMember.role_id || '',
      });
      setPanel('edit');
    } else {
      form.reset({
        email: '',
        roleId: '',
      });
      setPanel('edit');
    }
  }, [editingMember, form, setPanel]);

  const createMemberMutation = useMutation({
    mutationFn: async (memberData: MemberFormData) => {
      if (!organizationId) throw new Error('No organization selected');

      // First, invite the user
      const { data: invitation, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        memberData.email
      );

      if (inviteError) throw inviteError;

      // Then create the organization member record
      const { data, error } = await supabase
        .from('organization_members')
        .insert({
          organization_id: organizationId,
          user_id: invitation.user.id,
          role_id: memberData.roleId,
          joined_at: new Date().toISOString(),
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      toast({
        title: 'Miembro invitado',
        description: 'La invitación ha sido enviada correctamente',
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error al invitar miembro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async (memberData: MemberFormData) => {
      if (!editingMember?.id) throw new Error('No member to update');

      const { data, error } = await supabase
        .from('organization_members')
        .update({
          role_id: memberData.roleId,
        })
        .eq('id', editingMember.id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      toast({
        title: 'Miembro actualizado',
        description: 'El rol del miembro ha sido actualizado correctamente',
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error al actualizar miembro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    form.reset();
    setPanel('view');
    closeModal();
  };

  const handleSubmit = async (data: MemberFormData) => {
    setIsLoading(true);
    try {
      if (editingMember) {
        await updateMemberMutation.mutateAsync(data);
      } else {
        await createMemberMutation.mutateAsync(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="Ingresa el email del miembro"
                    disabled={!!editingMember}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="roleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rol</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un rol" />
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
        </form>
      </Form>
  );

  const headerContent = (
    <FormModalHeader
      title={editingMember ? 'Editar Miembro' : 'Invitar Miembro'}
      icon={editingMember ? Users : UserPlus}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={editingMember ? 'Actualizar' : 'Invitar'}
      onRightClick={form.handleSubmit(handleSubmit)}
      rightLoading={isLoading}
    />
  );

  return {
    editPanel,
    headerContent,
    footerContent
  };
}