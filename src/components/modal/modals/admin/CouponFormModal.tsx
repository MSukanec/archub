import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tag, Plus, Trash2 } from 'lucide-react';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { FormModalLayout } from '../../form/FormModalLayout';
import { useModalPanelStore } from '../../form/modalPanelStore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { apiRequest } from '@/lib/queryClient';
import { useEffect, useState } from 'react';
import { Separator } from '@/components/ui/separator';
import DatePickerField from '@/components/ui-custom/fields/DatePickerField';

const couponSchema = z.object({
  code: z.string()
    .min(1, 'El código es requerido')
    .regex(/^[A-Z0-9-]+$/, 'Solo mayúsculas, números y guiones')
    .max(50, 'Máximo 50 caracteres'),
  type: z.enum(['percent', 'fixed'], {
    required_error: 'El tipo es requerido'
  }),
  amount: z.number()
    .min(0.01, 'El monto debe ser mayor a 0')
    .max(1000000, 'Monto demasiado alto'),
  is_active: z.boolean().default(true),
  starts_at: z.string().optional(),
  expires_at: z.string().optional(),
  max_redemptions: z.number().int().min(1).optional().nullable(),
  per_user_limit: z.number().int().min(1).optional().nullable(),
  min_order_total: z.number().min(0).optional().nullable(),
  currency: z.enum(['ARS', 'USD', 'EUR']).optional().nullable(),
  applies_to_all: z.boolean().default(true),
});

type CouponFormData = z.infer<typeof couponSchema>;

interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  amount: number;
  is_active: boolean;
  starts_at?: string;
  expires_at?: string;
  max_redemptions?: number;
  per_user_limit?: number;
  min_order_total?: number;
  currency?: string;
  applies_to_all: boolean;
  created_at: string;
}

interface Course {
  id: string;
  slug: string;
  title: string;
}

interface CouponFormModalProps {
  modalData?: {
    coupon?: Coupon;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function CouponFormModal({ modalData, onClose }: CouponFormModalProps) {
  const { coupon, isEditing = false } = modalData || {};
  const { setPanel } = useModalPanelStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  // Query para obtener todos los cursos
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      if (!supabase) return [];
      
      const { data, error } = await supabase
        .from('courses')
        .select('id, slug, title')
        .order('title', { ascending: true });
      
      if (error) throw error;
      return data as Course[];
    }
  });

  // Query para obtener los cursos asociados al cupón
  const { data: couponCourses = [] } = useQuery({
    queryKey: ['coupon-courses', coupon?.id],
    queryFn: async () => {
      if (!coupon?.id || !supabase) return [];
      
      const { data, error } = await supabase
        .from('coupon_courses')
        .select('course_id')
        .eq('coupon_id', coupon.id);
      
      if (error) throw error;
      return data.map(cc => cc.course_id);
    },
    enabled: !!coupon?.id
  });

  useEffect(() => {
    if (couponCourses.length > 0) {
      setSelectedCourses(couponCourses);
    }
  }, [couponCourses]);

  const form = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: coupon?.code || '',
      type: coupon?.type || 'percent',
      amount: coupon?.amount || 0,
      is_active: coupon?.is_active ?? true,
      starts_at: coupon?.starts_at || undefined,
      expires_at: coupon?.expires_at || undefined,
      max_redemptions: coupon?.max_redemptions || null,
      per_user_limit: coupon?.per_user_limit || 1,
      min_order_total: coupon?.min_order_total || null,
      currency: coupon?.currency as any || null,
      applies_to_all: coupon?.applies_to_all ?? true,
    }
  });

  useEffect(() => {
    if (coupon) {
      form.reset({
        code: coupon.code || '',
        type: coupon.type || 'percent',
        amount: coupon.amount || 0,
        is_active: coupon.is_active ?? true,
        starts_at: coupon.starts_at || undefined,
        expires_at: coupon.expires_at || undefined,
        max_redemptions: coupon.max_redemptions || null,
        per_user_limit: coupon.per_user_limit || 1,
        min_order_total: coupon.min_order_total || null,
        currency: coupon.currency as any || null,
        applies_to_all: coupon.applies_to_all ?? true,
      });
    } else {
      form.reset({
        code: '',
        type: 'percent',
        amount: 0,
        is_active: true,
        starts_at: undefined,
        expires_at: undefined,
        max_redemptions: null,
        per_user_limit: 1,
        min_order_total: null,
        currency: null,
        applies_to_all: true,
      });
    }
    setPanel('edit');
  }, [coupon, form, setPanel]);

  const handleClose = () => {
    form.reset();
    setSelectedCourses([]);
    onClose();
  };

  const createCouponMutation = useMutation({
    mutationFn: async (data: CouponFormData) => {
      const response = await apiRequest('POST', '/api/admin/coupons', {
        couponData: data,
        selectedCourses
      });
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast({
        title: 'Cupón creado',
        description: 'El cupón se creó correctamente.'
      });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Error creating coupon:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el cupón. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  });

  const updateCouponMutation = useMutation({
    mutationFn: async (data: CouponFormData) => {
      const response = await apiRequest('PATCH', `/api/admin/coupons/${coupon!.id}`, {
        couponData: data,
        selectedCourses
      });
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      queryClient.invalidateQueries({ queryKey: ['coupon-courses', coupon?.id] });
      toast({
        title: 'Cupón actualizado',
        description: 'Los cambios se guardaron correctamente.'
      });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Error updating coupon:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el cupón. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  });

  const onSubmit = async (data: CouponFormData) => {
    setIsLoading(true);
    try {
      if (coupon) {
        await updateCouponMutation.mutateAsync(data);
      } else {
        await createCouponMutation.mutateAsync(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const headerContent = (
    <FormModalHeader 
      title={coupon ? 'Editar Cupón' : 'Nuevo Cupón'}
      icon={Tag}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={coupon ? 'Actualizar' : 'Crear Cupón'}
      onRightClick={form.handleSubmit(onSubmit)}
      showLoadingSpinner={isLoading}
    />
  );

  const editContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código *</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="VERANO2024" 
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    data-testid="input-coupon-code" 
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Solo mayúsculas, números y guiones
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Descuento *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-coupon-type">
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="percent">Porcentaje (%)</SelectItem>
                    <SelectItem value="fixed">Monto Fijo ($)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto del Descuento *</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="10.00" 
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    data-testid="input-coupon-amount" 
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  {form.watch('type') === 'percent' ? 'Porcentaje de descuento (ej: 10 = 10%)' : 'Monto fijo de descuento'}
                </FormDescription>
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
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-coupon-currency">
                      <SelectValue placeholder="Todas las monedas" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="null">Todas las monedas</SelectItem>
                    <SelectItem value="ARS">ARS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">
                  Deja en blanco para aplicar a todas las monedas
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-semibold mb-3">Fechas de Validez</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="starts_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Inicio</FormLabel>
                  <FormControl>
                    <DatePickerField
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={(date) => field.onChange(date?.toISOString())}
                      placeholder="Selecciona fecha"
                      data-testid="date-coupon-starts"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Opcional - Deja vacío para que sea válido desde ahora
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expires_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Vencimiento</FormLabel>
                  <FormControl>
                    <DatePickerField
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={(date) => field.onChange(date?.toISOString())}
                      placeholder="Selecciona fecha"
                      data-testid="date-coupon-expires"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Opcional - Deja vacío para que nunca venza
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-semibold mb-3">Límites de Uso</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="max_redemptions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usos Máximos Totales</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number"
                      min="1"
                      placeholder="Sin límite"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      data-testid="input-coupon-max-redemptions" 
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Cantidad total de veces que se puede usar el cupón
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="per_user_limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usos por Usuario</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number"
                      min="1"
                      placeholder="1"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 1)}
                      data-testid="input-coupon-per-user-limit" 
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Cantidad de veces que un usuario puede usar el cupón
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="min_order_total"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Compra Mínima</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                  data-testid="input-coupon-min-order-total" 
                />
              </FormControl>
              <FormDescription className="text-xs">
                Monto mínimo de compra requerido para usar el cupón
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <div>
          <h3 className="text-sm font-semibold mb-3">Cursos Aplicables</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Si no seleccionás ningún curso, el cupón será válido para todos los cursos
          </p>
          
          <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="flex items-center space-x-2 p-2 hover:bg-accent/5 rounded cursor-pointer"
                onClick={() => toggleCourse(course.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedCourses.includes(course.id)}
                  onChange={() => toggleCourse(course.id)}
                  className="h-4 w-4"
                />
                <label className="text-sm cursor-pointer flex-1">
                  {course.title}
                  <span className="text-xs text-muted-foreground ml-2">({course.slug})</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Cupón Activo</FormLabel>
                <FormDescription className="text-sm">
                  Permite que el cupón se pueda usar
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="switch-coupon-active"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={<div></div>}
      editPanel={editContent}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
      isEditing={true}
    />
  );
}
