import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building } from 'lucide-react';
import { FormModalHeader } from '@/components/modal';
import { FormModalFooter } from '@/components/modal';
import { FormModalLayout } from '@/components/modal';
import { useModalPanelStore } from '@/components/modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { useOptimisticMutation } from '@/core/save-engine/useOptimisticMutation';
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
  const { mutate: updateOrganization, isPending: isLoading } = useOptimisticMutation({
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
      
      handleClose();
    },
    queryKey: ['current-user'],
    optimisticUpdate: (oldData: any, data: OrganizationFormData) => {
      if (!oldData) return oldData;
      return oldData;
    },
    onSuccessMessage: "Organización actualizada",
    onErrorMessage: "No se pudo actualizar la organización",
    additionalQueryKeys: [['user-organizations'], ['organizations']],
  });
  const onSubmit = (data: OrganizationFormData) => {
    updateOrganization(data);
  };
  const viewPanel = (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Nombre de la Organización</label>
        <p className="text-sm text-muted-foreground mt-1">{organization?.name}</p>
      </div>
      <div>
        <label className="text-sm font-medium">Estado</label>
        <p className="text-sm text-muted-foreground mt-1">
          {organization?.is_active ? 'Activa': 'Inactiva'}
        </p>
      </div>
    </div>
  );
  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Estado Activo</FormLabel>
                <div className="text-xs text-muted-foreground">
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
      title={organization ? 'Editar Organización': 'Ver Organización'}
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