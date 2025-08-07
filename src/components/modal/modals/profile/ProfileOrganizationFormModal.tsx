import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building } from 'lucide-react';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { FormModalLayout } from '../../form/FormModalLayout';
import { useModalPanelStore } from '../../form/modalPanelStore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const organizationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  is_active: z.boolean()
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

interface Organization {
  id: string;
  name: string;
  is_active: boolean;
  plan_id?: string;
}

interface ProfileOrganizationFormModalProps {
  modalData?: {
    organization?: Organization;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function ProfileOrganizationFormModal({ modalData, onClose }: ProfileOrganizationFormModalProps) {
  const { organization, isEditing = false } = modalData || {};
  const { currentPanel, setPanel } = useModalPanelStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: organization?.name || '',
      is_active: organization?.is_active ?? true
    }
  });

  React.useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name || '',
        is_active: organization.is_active ?? true
      });
      setPanel('edit');
    } else {
      form.reset({
        name: '',
        is_active: true
      });
      setPanel('edit');
    }
  }, [organization, form, setPanel]);

  const handleClose = () => {
    form.reset();
    setPanel('view');
    onClose();
  };

  const updateOrganizationMutation = useMutation({
    mutationFn: async (data: OrganizationFormData) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase
        .from('organizations')
        .update({
          name: data.name,
          is_active: data.is_active
        })
        .eq('id', organization!.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['user-organizations'] });
      toast({
        title: 'Organización actualizada',
        description: 'Los cambios se guardaron correctamente.'
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Error updating organization:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la organización. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  });

  const onSubmit = async (data: OrganizationFormData) => {
    setIsLoading(true);
    try {
      await updateOrganizationMutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  };

  const viewPanel = (
      <div>
      </div>
      <div>
          {organization?.is_active ? 'Activa' : 'Inactiva'}
        </p>
      </div>
    </div>
  );

  const editPanel = (
    <Form {...form}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Organización</FormLabel>
              <FormControl>
                <Input placeholder="Nombre de la organización" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
                <FormLabel>Estado Activo</FormLabel>
                  La organización está activa y sus miembros pueden acceder
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );

  const headerContent = (
    <FormModalHeader 
      title={organization ? 'Editar Organización' : 'Ver Organización'}
      icon={Building}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel="Guardar Cambios"
      onRightClick={form.handleSubmit(onSubmit)}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
      isEditing={true}
    />
  );
}