import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { FormModalLayout } from '../../form/FormModalLayout';
import FormModalBody from '../../form/FormModalBody';
import { useModalPanelStore } from '../../form/modalPanelStore';
import { useGlobalModalStore } from '../../form/useGlobalModalStore';
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
  onClose: () => void;
}

export function MemberFormModal({ editingMember, onClose }: MemberModalProps) {
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

      const response = await apiRequest('POST', '/api/invite-member', {
        email: memberData.email,
        roleId: memberData.roleId,
        organizationId: organizationId,
      });

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: 'Miembro invitado',
        description: data.isNewUser 
          ? 'La invitación ha sido enviada por email' 
          : 'El usuario existente ha sido agregado a la organización',
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
    onClose();
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
      isSubmitting={isLoading}
    />
  );

  const viewPanel = editingMember ? (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium">Email</h4>
        <p className="text-muted-foreground mt-1">{editingMember?.email || 'Sin email'}</p>
      </div>
      <div>
        <h4 className="font-medium">Rol</h4>
        <p className="text-muted-foreground mt-1">{editingMember?.role?.name || 'Sin rol'}</p>
      </div>
      <div>
        <h4 className="font-medium">Estado</h4>
        <p className="text-muted-foreground mt-1">{editingMember?.status || 'Activo'}</p>
      </div>
    </div>
  ) : null;

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
    />
  );
}