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
  max_uses: z.number().int().min(1).optional().nullable(),
  max_uses_per_user: z.number().int().min(1).optional().nullable(),
  minimum_purchase: z.number().min(0).optional().nullable(),
  currency: z.enum(['ARS', 'USD', 'EUR']).optional().nullable(),
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
  max_uses?: number;
  max_uses_per_user?: number;
  minimum_purchase?: number;
  currency?: string;
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
      max_uses: coupon?.max_uses || null,
      max_uses_per_user: coupon?.max_uses_per_user || null,
      minimum_purchase: coupon?.minimum_purchase || null,
      currency: coupon?.currency as any || null,
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
        max_uses: coupon.max_uses || null,
        max_uses_per_user: coupon.max_uses_per_user || null,
        minimum_purchase: coupon.minimum_purchase || null,
        currency: coupon.currency as any || null,
      });
    } else {
      form.reset({
        code: '',
        type: 'percent',
        amount: 0,
        is_active: true,
        starts_at: undefined,
        expires_at: undefined,
        max_uses: null,
        max_uses_per_user: null,
        minimum_purchase: null,
        currency: null,
      });
    }
    setPanel('edit');
  }, [coupon, form, setPanel]);

  const handleClose = () => {
    form.reset();
    setSelectedCourses([]);
    onClose();
  };

  const updateCouponCourses = async (couponId: string) => {
    if (!supabase) return;

    // Eliminar todas las asociaciones existentes
    await supabase
      .from('coupon_courses')
      .delete()
      .eq('coupon_id', couponId);

    // Crear nuevas asociaciones si hay cursos seleccionados
    if (selectedCourses.length > 0) {
      const associations = selectedCourses.map(courseId => ({
        coupon_id: couponId,
        course_id: courseId
      }));

      await supabase
        .from('coupon_courses')
        .insert(associations);
    }
  };

  const createCouponMutation = useMutation({
    mutationFn: async (data: CouponFormData) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data: newCoupon, error } = await supabase
        .from('coupons')
        .insert({
          code: data.code.toUpperCase(),
          type: data.type,
          amount: data.amount,
          is_active: data.is_active,
          starts_at: data.starts_at || null,
          expires_at: data.expires_at || null,
          max_uses: data.max_uses || null,
          max_uses_per_user: data.max_uses_per_user || null,
          minimum_purchase: data.minimum_purchase || null,
          currency: data.currency || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Actualizar cursos asociados
      if (newCoupon) {
        await updateCouponCourses(newCoupon.id);
      }
      
      return newCoupon;
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
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase
        .from('coupons')
        .update({
          code: data.code.toUpperCase(),
          type: data.type,
          amount: data.amount,
          is_active: data.is_active,
          starts_at: data.starts_at || null,
          expires_at: data.expires_at || null,
          max_uses: data.max_uses || null,
          max_uses_per_user: data.max_uses_per_user || null,
          minimum_purchase: data.minimum_purchase || null,
          currency: data.currency || null,
        })
        .eq('id', coupon!.id);
      
      if (error) throw error;
      
      // Actualizar cursos asociados
      await updateCouponCourses(coupon!.id);
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
              name="max_uses"
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
                      data-testid="input-coupon-max-uses" 
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
              name="max_uses_per_user"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usos por Usuario</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number"
                      min="1"
                      placeholder="Sin límite"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      data-testid="input-coupon-max-uses-per-user" 
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
          name="minimum_purchase"
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
                  data-testid="input-coupon-minimum" 
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
      editPanel={editContent}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
      columns={1}
    />
  );
}
