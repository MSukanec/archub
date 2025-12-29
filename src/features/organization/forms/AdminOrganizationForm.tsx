import { useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/features/users/hooks';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';
import { useOptimisticMutation } from '@/core/save-engine/useOptimisticMutation';

const organizationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  is_active: z.boolean(),
  plan_id: z.string().min(1, 'El plan es requerido'),
  is_founder: z.boolean()
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

interface Organization {
  id: string;
  name: string;
  is_active: boolean;
  plan_id: string;
  settings?: {
    is_founder?: boolean;
    [key: string]: any;
  } | null;
}

export interface OrganizationFormProps {
  organizationId?: string;
  organization?: Organization;
  mode: 'create' | 'edit' | 'view';
  onSuccess: () => void;
  onCancel: () => void;
  hideActions?: boolean;
  formRef?: React.RefObject<HTMLFormElement>;
}

export function AdminOrganizationForm({
  organizationId,
  organization,
  mode,
  onSuccess,
  onCancel,
  hideActions = false,
  formRef,
}: OrganizationFormProps) {
  const { data: currentUser } = useCurrentUser();
  const internalFormRef = useRef<HTMLFormElement>(null);
  const actualFormRef = formRef || internalFormRef;

  const { data: plans = [], isLoading: isLoadingPlans } = useQuery({
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
      plan_id: organization?.plan_id || '',
      is_founder: organization?.settings?.is_founder ?? false
    }
  });

  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name || '',
        is_active: organization.is_active ?? true,
        plan_id: organization.plan_id || '',
        is_founder: organization.settings?.is_founder ?? false
      });
    }
  }, [organization, form]);

  const { mutate: createOrganization, isPending: isCreating } = useOptimisticMutation({
    mutationFn: async (data: OrganizationFormData) => {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear la organización');
      }
      
      const { id: orgId } = await response.json();
      
      // Update plan, founder, and active status if needed
      if (supabase && orgId && (data.plan_id || data.is_founder || !data.is_active)) {
        const updates: Record<string, any> = {};
        if (data.plan_id) updates.plan_id = data.plan_id;
        if (!data.is_active) updates.is_active = false;
        if (data.is_founder) updates.settings = { is_founder: true };
        
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('organizations')
            .update(updates)
            .eq('id', orgId);
          
          if (updateError) console.error('Error updating organization settings:', updateError);
        }
      }
      
      onSuccess();
      return orgId;
    },
    queryKey: ['admin-organizations'],
    optimisticUpdate: (oldData: any, variables: OrganizationFormData) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return oldData;
      const optimisticOrg = {
        id: 'temp-' + Date.now(),
        name: variables.name,
        is_active: variables.is_active,
        plan_id: variables.plan_id,
        settings: { is_founder: variables.is_founder }
      };
      return [...oldData, optimisticOrg];
    },
    onSuccessMessage: "Organización creada",
    onErrorMessage: "No se pudo crear la organización",
    additionalQueryKeys: [['current-user']],
  });

  const { mutate: updateOrganization, isPending: isUpdating } = useOptimisticMutation({
    mutationFn: async (data: OrganizationFormData) => {
      if (!supabase || !organization) throw new Error('Supabase not initialized or no organization');
      
      const { data: currentOrg } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', organization.id)
        .single();
      
      const updatedSettings = {
        ...(currentOrg?.settings || {}),
        is_founder: data.is_founder
      };
      
      const { error } = await supabase
        .from('organizations')
        .update({
          name: data.name,
          is_active: data.is_active,
          plan_id: data.plan_id,
          settings: updatedSettings
        })
        .eq('id', organization.id);
      
      if (error) throw error;
      
      onSuccess();
    },
    queryKey: ['admin-organizations'],
    optimisticUpdate: (oldData: any, variables: OrganizationFormData) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return oldData;
      return oldData.map((org: any) => 
        org.id === organization?.id 
          ? { ...org, ...variables, settings: { ...org.settings, is_founder: variables.is_founder } }
          : org
      );
    },
    onSuccessMessage: "Organización actualizada",
    onErrorMessage: "No se pudo actualizar la organización",
    additionalQueryKeys: [['current-user']],
  });

  const isSubmitting = isCreating || isUpdating;

  const onSubmit = (data: OrganizationFormData) => {
    if (mode === 'edit' && organization) {
      updateOrganization(data);
    } else {
      createOrganization(data);
    }
  };

  if (isLoadingPlans) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (mode === 'view' && organization) {
    return (
      <div className="w-full space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nombre de la Organización</label>
            <p className="text-sm text-muted-foreground mt-1">{organization.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Estado</label>
            <p className="text-sm text-muted-foreground mt-1">
              {organization.is_active ? 'Activa' : 'Inactiva'}
            </p>
          </div>
        </div>
        {!hideActions && (
          <div className="flex justify-end pt-4 border-t">
            <Button variant="secondary" onClick={onCancel}>
              Cerrar
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Form {...form}>
      <form 
        ref={actualFormRef}
        onSubmit={form.handleSubmit(onSubmit)} 
        className="w-full space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Organización</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Nombre de la organización" 
                  {...field} 
                  data-testid="input-organization-name"
                />
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
                  <SelectTrigger data-testid="select-organization-plan">
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
          name="is_founder"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel className="text-amber-600 dark:text-amber-400">Organización Fundadora</FormLabel>
                <div className="text-xs text-muted-foreground">
                  Acceso al Portal de Fundadores y beneficios exclusivos
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="switch-organization-founder"
                />
              </FormControl>
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
                  data-testid="switch-organization-active"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {!hideActions && (
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={onCancel} 
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="flex-[3]"
              data-testid="button-submit"
            >
              {isSubmitting ? 'Guardando...' : mode === 'edit' ? 'Guardar Cambios' : 'Crear'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}