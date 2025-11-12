import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package } from 'lucide-react';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { FormModalLayout } from '../../form/FormModalLayout';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/hooks/use-current-user';

const planSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  slug: z.string().min(1, 'El slug es requerido'),
  features: z.string().optional(),
  billing_type: z.enum(['per_user', 'flat_rate'], {
    required_error: 'El tipo de facturación es requerido'
  }),
  is_active: z.boolean(),
});

type PlanFormData = z.infer<typeof planSchema>;

interface Plan {
  id: string;
  name: string;
  slug: string;
  features: any;
  billing_type: string;
  is_active: boolean;
}

interface PlanFormModalProps {
  modalData?: {
    plan?: Plan;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function PlanFormModal({ modalData, onClose }: PlanFormModalProps) {
  const { plan, isEditing = false } = modalData || {};
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = React.useState(false);
  const { data: userData } = useCurrentUser();

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: plan?.name || '',
      slug: plan?.slug || '',
      features: plan?.features ? JSON.stringify(plan.features, null, 2) : '',
      billing_type: (plan?.billing_type as 'per_user' | 'flat_rate') || 'per_user',
      is_active: plan?.is_active ?? true,
    }
  });

  React.useEffect(() => {
    if (plan) {
      form.reset({
        name: plan.name || '',
        slug: plan.slug || '',
        features: plan.features ? JSON.stringify(plan.features, null, 2) : '',
        billing_type: (plan.billing_type as 'per_user' | 'flat_rate') || 'per_user',
        is_active: plan.is_active ?? true,
      });
    } else {
      form.reset({
        name: '',
        slug: '',
        features: '',
        billing_type: 'per_user',
        is_active: true,
      });
    }
  }, [plan, form]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const createMutation = useMutation({
    mutationFn: async (data: PlanFormData) => {
      if (!supabase || !userData?.user?.id) {
        throw new Error('Supabase not initialized or user not found');
      }

      let featuresData = null;
      if (data.features && data.features.trim()) {
        try {
          featuresData = JSON.parse(data.features);
        } catch (e) {
          throw new Error('El formato JSON de features es inválido');
        }
      }
      
      const { error } = await supabase
        .from('plans')
        .insert({
          name: data.name,
          slug: data.slug,
          features: featuresData,
          billing_type: data.billing_type,
          is_active: data.is_active,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast({
        title: 'Plan creado',
        description: 'El plan se creó correctamente.'
      });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Error creating plan:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el plan. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: PlanFormData) => {
      if (!supabase) throw new Error('Supabase not initialized');

      let featuresData = null;
      if (data.features && data.features.trim()) {
        try {
          featuresData = JSON.parse(data.features);
        } catch (e) {
          throw new Error('El formato JSON de features es inválido');
        }
      }
      
      const { error } = await supabase
        .from('plans')
        .update({
          name: data.name,
          slug: data.slug,
          features: featuresData,
          billing_type: data.billing_type,
          is_active: data.is_active,
        })
        .eq('id', plan!.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast({
        title: 'Plan actualizado',
        description: 'Los cambios se guardaron correctamente.'
      });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Error updating plan:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el plan. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  });

  const onSubmit = async (data: PlanFormData) => {
    setIsLoading(true);
    try {
      if (plan) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const watchName = form.watch('name');

  React.useEffect(() => {
    if (!isEditing && watchName) {
      const slug = generateSlug(watchName);
      form.setValue('slug', slug);
    }
  }, [watchName, isEditing, form]);

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Plan</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="Ej: Free, Pro, Teams"
                  data-testid="input-plan-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="ej: free, pro, teams"
                  className="font-mono"
                  data-testid="input-plan-slug"
                />
              </FormControl>
              <FormDescription>
                Se genera automáticamente del nombre. Debe ser único.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="billing_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Facturación</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-billing-type">
                    <SelectValue placeholder="Selecciona el tipo de facturación" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="per_user">Por Usuario</SelectItem>
                  <SelectItem value="flat_rate">Tarifa Fija</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="features"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Features (JSON)</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder='{"max_projects": 10, "max_users": 5}'
                  className="font-mono text-sm min-h-[120px]"
                  data-testid="textarea-plan-features"
                />
              </FormControl>
              <FormDescription>
                Formato JSON opcional. Ejemplo: {`{"max_projects": 10}`}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Activo
                </FormLabel>
                <FormDescription>
                  El plan estará disponible para suscripciones
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="switch-plan-active"
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
      title={isEditing ? 'Editar Plan' : 'Nuevo Plan'}
      description={isEditing ? 'Modifica los detalles del plan de suscripción' : 'Crea un nuevo plan de suscripción'}
      icon={Package}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={isEditing ? 'Guardar Cambios' : 'Crear Plan'}
      onRightClick={form.handleSubmit(onSubmit)}
      isSubmitting={isLoading}
      submitDisabled={isLoading}
    />
  );

  return (
    <FormModalLayout
      headerContent={headerContent}
      editPanel={editPanel}
      footerContent={footerContent}
      onClose={handleClose}
    />
  );
}
