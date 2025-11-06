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
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/hooks/use-current-user';

// Schema de validación
const paymentSchema = z.object({
  user_id: z.string().min(1, 'El usuario es requerido'),
  course_id: z.string().min(1, 'El curso es requerido'),
  amount: z.string().min(1, 'El monto es requerido').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'El monto debe ser un número mayor a 0'
  ),
  currency: z.enum(['ARS', 'USD'], {
    required_error: 'La moneda es requerida',
  }),
  provider: z.enum(['mercadopago', 'paypal', 'bank_transfer', 'manual'], {
    required_error: 'El proveedor es requerido',
  }),
  provider_payment_id: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentFormModalProps {
  modalData?: {
    payment?: any;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function PaymentFormModal({ modalData, onClose }: PaymentFormModalProps) {
  const { payment, isEditing = false } = modalData || {};
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = React.useState(false);
  const { data: userData } = useCurrentUser();

  // Fetch users for dropdown
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users-list'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available');

      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .order('full_name');

      if (error) throw error;
      return data;
    },
  });

  // Fetch courses for dropdown
  const { data: courses = [] } = useQuery({
    queryKey: ['admin-courses-list'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available');

      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      return data;
    },
  });

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      user_id: payment?.user_id || '',
      course_id: payment?.course_id || '',
      amount: payment?.amount?.toString() || '',
      currency: payment?.currency || 'ARS',
      provider: payment?.provider || 'manual',
      provider_payment_id: payment?.provider_payment_id || '',
    }
  });

  React.useEffect(() => {
    if (payment) {
      form.reset({
        user_id: payment.user_id || '',
        course_id: payment.course_id || '',
        amount: payment.amount?.toString() || '',
        currency: payment.currency || 'ARS',
        provider: payment.provider || 'manual',
        provider_payment_id: payment.provider_payment_id || '',
      });
    } else {
      form.reset({
        user_id: '',
        course_id: '',
        amount: '',
        currency: 'ARS',
        provider: 'manual',
        provider_payment_id: '',
      });
    }
  }, [payment, form]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const createMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      if (!supabase || !userData?.user?.id) {
        throw new Error('Supabase not initialized or user not found');
      }
      
      const { error } = await supabase
        .from('payments')
        .insert({
          user_id: data.user_id,
          course_id: data.course_id,
          amount: Number(data.amount),
          currency: data.currency,
          provider: data.provider,
          provider_payment_id: data.provider_payment_id || null,
          status: 'completed',
          approved_at: new Date().toISOString(),
          product_type: 'course',
          product_id: data.course_id,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-payments'] });
      toast({
        title: 'Pago creado exitosamente',
        description: 'El pago se registró correctamente en el sistema.'
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Error creating payment:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el pago. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase
        .from('payments')
        .update({
          user_id: data.user_id,
          course_id: data.course_id,
          amount: Number(data.amount),
          currency: data.currency,
          provider: data.provider,
          provider_payment_id: data.provider_payment_id || null,
        })
        .eq('id', payment!.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-payments'] });
      toast({
        title: 'Pago actualizado exitosamente',
        description: 'Los cambios se guardaron correctamente.'
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Error updating payment:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el pago. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  });

  const onSubmit = async (data: PaymentFormData) => {
    setIsLoading(true);
    try {
      if (payment) {
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
          name="user_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usuario</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un usuario" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
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
          name="course_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Curso</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un curso" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="1000" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Moneda" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ARS">ARS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="provider"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proveedor de Pago</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona proveedor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="bank_transfer">Transferencia Bancaria</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Método de pago utilizado por el usuario
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="provider_payment_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID de Transacción (Opcional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="ID de referencia del proveedor"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Identificador único de la transacción en el proveedor
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );

  const headerContent = (
    <FormModalHeader 
      title={payment ? 'Editar Pago' : 'Nuevo Pago Manual'}
      description={payment ? 'Actualiza la información del pago registrado' : 'Registra un pago manual que no pasó por el sistema automático'}
      icon={DollarSign}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={payment ? 'Actualizar' : 'Crear Pago'}
      onRightClick={form.handleSubmit(onSubmit)}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={<div></div>}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
      isEditing={true}
    />
  );
}
