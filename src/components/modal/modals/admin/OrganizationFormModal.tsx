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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/hooks/use-current-user';

const organizationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  is_active: z.boolean(),
  plan_id: z.string().min(1, 'El plan es requerido')
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

interface Organization {
  id: string;
  name: string;
  is_active: boolean;
  plan_id: string;
}

interface OrganizationFormModalProps {
  modalData?: {
    organization?: Organization;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function OrganizationFormModal({ modalData, onClose }: OrganizationFormModalProps) {
  const { organization, isEditing = false } = modalData || {};
  const { currentPanel, setPanel } = useModalPanelStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = React.useState(false);
  const { data: currentUser } = useCurrentUser();

  // Fetch plans for select
  const { data: plans = [] } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('plans')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: organization?.name || '',
      is_active: organization?.is_active ?? true,
      plan_id: organization?.plan_id || ''
    }
  });

  React.useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name || '',
        is_active: organization.is_active ?? true,
        plan_id: organization.plan_id || ''
      });
      setPanel('edit');
    } else {
      form.reset({
        name: '',
        is_active: true,
        plan_id: ''
      });
      setPanel('edit');
    }
  }, [organization, form, setPanel]);

  const handleClose = () => {
    form.reset();
    setPanel('view');
    onClose();
  };

  const organizationMutation = useMutation({
    mutationFn: async (data: OrganizationFormData) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      if (organization) {
        // Actualizar organización existente
        const { error } = await supabase
          .from('organizations')
          .update({
            name: data.name,
            is_active: data.is_active,
            plan_id: data.plan_id
          })
          .eq('id', organization.id);
        
        if (error) throw error;
      } else {
        // Crear nueva organización
        const { error } = await supabase
          .from('organizations')
          .insert({
            name: data.name,
            is_active: data.is_active,
            plan_id: data.plan_id,
            is_system: false,
            created_by: currentUser?.user?.id
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      toast({
        title: organization ? 'Organización actualizada' : 'Organización creada',
        description: organization ? 'Los cambios se guardaron correctamente.' : 'La organización se creó correctamente.'
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Error with organization:', error);
      toast({
        title: 'Error',
        description: organization ? 'No se pudo actualizar la organización. Inténtalo de nuevo.' : 'No se pudo crear la organización. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  });

  const onSubmit = async (data: OrganizationFormData) => {
    setIsLoading(true);
    try {
      await organizationMutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
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
          {organization?.is_active ? 'Activa' : 'Inactiva'}
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
          name="plan_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plan</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un plan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
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
      title={organization ? 'Editar Organización' : 'Nueva Organización'}
      icon={Building}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={organization ? 'Guardar Cambios' : 'Crear'}
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