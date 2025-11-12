import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DollarSign } from 'lucide-react';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { FormModalLayout } from '../../form/FormModalLayout';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/hooks/use-current-user';

const planPriceSchema = z.object({
  plan_id: z.string().min(1, 'El plan es requerido'),
  currency_code: z.string().min(1, 'La moneda es requerida'),
  monthly_amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: 'Debe ser un número válido mayor o igual a 0'
  }),
  annual_amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: 'Debe ser un número válido mayor o igual a 0'
  }),
  provider: z.string().min(1, 'El proveedor es requerido'),
  is_active: z.boolean(),
});

type PlanPriceFormData = z.infer<typeof planPriceSchema>;

interface PlanPrice {
  id: string;
  plan_id: string;
  currency_code: string;
  monthly_amount: number;
  annual_amount: number;
  provider: string;
  is_active: boolean;
}

interface PlanPriceFormModalProps {
  modalData?: {
    planPrice?: PlanPrice;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function PlanPriceFormModal({ modalData, onClose }: PlanPriceFormModalProps) {
  const { planPrice, isEditing = false } = modalData || {};
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = React.useState(false);
  const { data: userData } = useCurrentUser();

  // Fetch available plans
  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('plans')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const form = useForm<PlanPriceFormData>({
    resolver: zodResolver(planPriceSchema),
    defaultValues: {
      plan_id: planPrice?.plan_id || '',
      currency_code: planPrice?.currency_code || 'ARS',
      monthly_amount: planPrice?.monthly_amount?.toString() || '0',
      annual_amount: planPrice?.annual_amount?.toString() || '0',
      provider: planPrice?.provider || 'any',
      is_active: planPrice?.is_active ?? true,
    }
  });

  React.useEffect(() => {
    if (planPrice) {
      form.reset({
        plan_id: planPrice.plan_id || '',
        currency_code: planPrice.currency_code || 'ARS',
        monthly_amount: planPrice.monthly_amount?.toString() || '0',
        annual_amount: planPrice.annual_amount?.toString() || '0',
        provider: planPrice.provider || 'any',
        is_active: planPrice.is_active ?? true,
      });
    } else {
      form.reset({
        plan_id: '',
        currency_code: 'ARS',
        monthly_amount: '0',
        annual_amount: '0',
        provider: 'any',
        is_active: true,
      });
    }
  }, [planPrice, form]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const createMutation = useMutation({
    mutationFn: async (data: PlanPriceFormData) => {
      if (!supabase || !userData?.user?.id) {
        throw new Error('Supabase not initialized or user not found');
      }
      
      const { error } = await supabase
        .from('plan_prices')
        .insert({
          plan_id: data.plan_id,
          currency_code: data.currency_code,
          monthly_amount: Number(data.monthly_amount),
          annual_amount: Number(data.annual_amount),
          provider: data.provider,
          is_active: data.is_active,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-prices'] });
      toast({
        title: 'Precio creado',
        description: 'El precio del plan se creó correctamente.'
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Error creating plan price:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el precio del plan. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: PlanPriceFormData) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase
        .from('plan_prices')
        .update({
          plan_id: data.plan_id,
          currency_code: data.currency_code,
          monthly_amount: Number(data.monthly_amount),
          annual_amount: Number(data.annual_amount),
          provider: data.provider,
          is_active: data.is_active,
        })
        .eq('id', planPrice!.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-prices'] });
      toast({
        title: 'Precio actualizado',
        description: 'Los cambios se guardaron correctamente.'
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Error updating plan price:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el precio del plan. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  });

  const onSubmit = async (data: PlanPriceFormData) => {
    setIsLoading(true);
    try {
      if (planPrice) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="plan_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plan</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-plan">
                    <SelectValue placeholder="Selecciona un plan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {plans.map((plan: any) => (
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
          name="currency_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Moneda</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-currency">
                    <SelectValue placeholder="Selecciona una moneda" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                  <SelectItem value="USD">USD - Dólar Estadounidense</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="monthly_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Precio Mensual</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  data-testid="input-monthly-amount"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Precio de la suscripción mensual
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="annual_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Precio Anual</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  data-testid="input-annual-amount"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Precio de la suscripción anual
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="provider"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proveedor de Pago</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-provider">
                    <SelectValue placeholder="Selecciona un proveedor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="any">Cualquiera</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Proveedor que procesará el pago
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
                <FormLabel className="text-base">Activo</FormLabel>
                <FormDescription>
                  Indica si este precio está disponible para suscripciones
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="switch-is-active"
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
      title={planPrice ? 'Editar Precio de Plan' : 'Nuevo Precio de Plan'}
      description={planPrice ? 'Actualiza la información del precio del plan' : 'Configura un nuevo precio para un plan de suscripción'}
      icon={DollarSign}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={planPrice ? 'Guardar Cambios' : 'Crear Precio'}
      onRightClick={form.handleSubmit(onSubmit)}
      isRightLoading={isLoading}
      isRightDisabled={isLoading}
    />
  );

  return (
    <FormModalLayout
      header={headerContent}
      body={editPanel}
      footer={footerContent}
      onClose={handleClose}
    />
  );
}
