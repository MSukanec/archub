import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { FormModalHeader } from '@/components/modal';
import { FormModalFooter } from '@/components/modal';
import { FormModalLayout } from '@/components/modal';
import { FormModalBody } from '@/components/modal';
import { useModalPanelStore } from '@/components/modal';
import { useGlobalModalStore } from '@/components/modal';
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
  defaultEmail?: string;
  onClose: () => void;
}

export function MemberFormModal({ editingMember, defaultEmail, onClose }: MemberModalProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const { currentPanel, setPanel } = useModalPanelStore();
  const { closeModal } = useGlobalModalStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const isReinvite = !!defaultEmail;
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

  // Reset form when editing member changes or defaultEmail is provided
  useEffect(() => {
    if (editingMember) {
      form.reset({
        email: editingMember.users?.email || '',
        roleId: editingMember.role_id || '',
      });
      setPanel('edit');
    } else {
      form.reset({
        email: defaultEmail || '',
        roleId: '',
      });
      setPanel('edit');
    }
  }, [editingMember, defaultEmail, form, setPanel]);

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
      queryClient.invalidateQueries({ queryKey: ['organization-members-full'] });
      queryClient.invalidateQueries({ queryKey: ['organization-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['organization-former-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: isReinvite ? 'Miembro reinvitado' : 'Miembro invitado',
        description: data.isNewUser 
          ? 'La invitación ha sido enviada por email' 
          : 'El usuario recibirá una notificación para unirse nuevamente',
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
                    disabled={!!editingMember || !!defaultEmail}
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
      title={editingMember ? 'Editar Miembro' : (isReinvite ? 'Reinvitar Miembro' : 'Invitar Miembro')}
      description={editingMember 
        ? 'Actualiza el rol y permisos del miembro en tu organización.' 
        : isReinvite 
          ? 'Selecciona el rol para reinvitar a este miembro anterior.'
          : 'Ingresa el email del nuevo miembro. Si no tiene cuenta, recibirá una invitación por correo.'
      }
      icon={editingMember ? Users : UserPlus}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={editingMember ? 'Actualizar' : (isReinvite ? 'Reinvitar' : 'Invitar')}
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