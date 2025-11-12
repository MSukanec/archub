import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { FormModalLayout } from '../../form/FormModalLayout';
import { useModalPanelStore } from '../../form/modalPanelStore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useEffect, useState } from 'react';
import { Separator } from '@/components/ui/separator';

const courseSchema = z.object({
  slug: z.string().min(1, 'El slug es requerido').regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  title: z.string().min(1, 'El título es requerido'),
  short_description: z.string().optional(),
  long_description: z.string().optional(),
  cover_url: z.string().optional(),
  visibility: z.enum(['public', 'private', 'draft'], {
    required_error: 'La visibilidad es requerida'
  }),
  is_active: z.boolean().default(true),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface Course {
  id: string;
  slug: string;
  title: string;
  short_description?: string;
  long_description?: string;
  cover_url?: string;
  visibility: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
}

interface CoursePrice {
  id: string;
  course_id: string;
  currency_code: string;
  amount: number;
  provider: string;
  is_active: boolean;
}

interface CourseFormModalProps {
  modalData?: {
    course?: Course;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function CourseFormModal({ modalData, onClose }: CourseFormModalProps) {
  const { course, isEditing = false } = modalData || {};
  const { setPanel } = useModalPanelStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const { data: userData } = useCurrentUser();
  const [newPriceProvider, setNewPriceProvider] = useState('any');
  const [newPriceCurrency, setNewPriceCurrency] = useState('ARS');
  const [newPriceAmount, setNewPriceAmount] = useState('');

  // Query para obtener los precios del curso
  const { data: prices = [], refetch: refetchPrices } = useQuery({
    queryKey: ['course-prices', course?.id],
    queryFn: async () => {
      if (!course?.id || !supabase) return [];
      
      const { data, error } = await supabase
        .from('course_prices')
        .select('*')
        .eq('course_id', course.id)
        .order('currency_code', { ascending: true });
      
      if (error) throw error;
      return data as CoursePrice[];
    },
    enabled: !!course?.id
  });

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      slug: course?.slug || '',
      title: course?.title || '',
      short_description: course?.short_description || '',
      long_description: course?.long_description || '',
      cover_url: course?.cover_url || '',
      visibility: (course?.visibility as any) || 'draft',
      is_active: course?.is_active ?? true,
    }
  });

  useEffect(() => {
    if (course) {
      form.reset({
        slug: course.slug || '',
        title: course.title || '',
        short_description: course.short_description || '',
        long_description: course.long_description || '',
        cover_url: course.cover_url || '',
        visibility: (course.visibility as any) || 'draft',
        is_active: course.is_active ?? true,
      });
    } else {
      form.reset({
        slug: '',
        title: '',
        short_description: '',
        long_description: '',
        cover_url: '',
        visibility: 'draft',
        is_active: true,
      });
    }
    setPanel('edit');
  }, [course, form, setPanel]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const createCourseMutation = useMutation({
    mutationFn: async (data: CourseFormData) => {
      if (!supabase || !userData?.user?.id) throw new Error('Supabase not initialized or user not found');
      
      const { error } = await supabase
        .from('courses')
        .insert({
          slug: data.slug,
          title: data.title,
          short_description: data.short_description,
          long_description: data.long_description,
          cover_url: data.cover_url,
          visibility: data.visibility,
          is_active: data.is_active,
          created_by: userData.user.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({
        title: 'Curso creado',
        description: 'El curso se creó correctamente.'
      });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Error creating course:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el curso. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  });

  const updateCourseMutation = useMutation({
    mutationFn: async (data: CourseFormData) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase
        .from('courses')
        .update({
          slug: data.slug,
          title: data.title,
          short_description: data.short_description,
          long_description: data.long_description,
          cover_url: data.cover_url,
          visibility: data.visibility,
          is_active: data.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', course!.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({
        title: 'Curso actualizado',
        description: 'Los cambios se guardaron correctamente.'
      });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Error updating course:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el curso. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  });

  // Mutación para crear precio
  const createPriceMutation = useMutation({
    mutationFn: async () => {
      if (!supabase || !course?.id) throw new Error('No course selected');
      if (!newPriceAmount || parseFloat(newPriceAmount) <= 0) {
        throw new Error('El monto debe ser mayor a 0');
      }

      const { error } = await supabase
        .from('course_prices')
        .insert({
          course_id: course.id,
          currency_code: newPriceCurrency,
          amount: parseFloat(newPriceAmount),
          provider: newPriceProvider,
          is_active: true
        });

      if (error) throw error;
    },
    onSuccess: () => {
      refetchPrices();
      setNewPriceAmount('');
      setNewPriceProvider('any');
      setNewPriceCurrency('ARS');
      toast({
        title: 'Precio agregado',
        description: 'El precio se agregó correctamente.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo agregar el precio.',
        variant: 'destructive'
      });
    }
  });

  // Mutación para eliminar precio
  const deletePriceMutation = useMutation({
    mutationFn: async (priceId: string) => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { error } = await supabase
        .from('course_prices')
        .delete()
        .eq('id', priceId);

      if (error) throw error;
    },
    onSuccess: () => {
      refetchPrices();
      toast({
        title: 'Precio eliminado',
        description: 'El precio se eliminó correctamente.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el precio.',
        variant: 'destructive'
      });
    }
  });

  const onSubmit = async (data: CourseFormData) => {
    setIsLoading(true);
    try {
      if (course) {
        await updateCourseMutation.mutateAsync(data);
      } else {
        await createCourseMutation.mutateAsync(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const headerContent = (
    <FormModalHeader 
      title={course ? 'Editar Curso' : 'Nuevo Curso'}
      icon={BookOpen}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={course ? 'Actualizar' : 'Crear Curso'}
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
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nombre del curso" data-testid="input-course-title" />
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
                <FormLabel>Slug *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="curso-ejemplo" data-testid="input-course-slug" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="short_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción Corta</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Breve descripción del curso" rows={2} data-testid="input-course-short-desc" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="long_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción Completa</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Descripción detallada del curso" rows={4} data-testid="input-course-long-desc" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cover_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de Portada</FormLabel>
              <FormControl>
                <Input {...field} placeholder="https://..." data-testid="input-course-cover" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="visibility"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visibilidad *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-course-visibility">
                      <SelectValue placeholder="Selecciona visibilidad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="public">Público</SelectItem>
                    <SelectItem value="private">Privado</SelectItem>
                    <SelectItem value="draft">Borrador</SelectItem>
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
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Curso Activo</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Permitir acceso al curso
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-course-active"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Sección de Precios - solo en edición */}
        {course && (
          <>
            <Separator className="my-6" />
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Precios del Curso</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configura los precios por moneda y proveedor de pago
                </p>
              </div>

              {/* Lista de precios existentes */}
              {prices.length > 0 && (
                <div className="space-y-2">
                  {prices.map((price) => (
                    <div
                      key={price.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="font-medium">
                          {price.currency_code} ${Number(price.amount).toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Provider: {price.provider}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePriceMutation.mutate(price.id)}
                        disabled={deletePriceMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulario para agregar nuevo precio */}
              <div className="grid grid-cols-4 gap-3 items-end">
                <div>
                  <label className="text-sm font-medium mb-1 block">Proveedor</label>
                  <Select value={newPriceProvider} onValueChange={setNewPriceProvider}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Cualquiera</SelectItem>
                      <SelectItem value="mercadopago">MercadoPago</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Moneda</label>
                  <Select value={newPriceCurrency} onValueChange={setNewPriceCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARS">ARS</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Monto</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newPriceAmount}
                    onChange={(e) => setNewPriceAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <Button
                  type="button"
                  onClick={() => createPriceMutation.mutate()}
                  disabled={createPriceMutation.isPending || !newPriceAmount}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </div>
            </div>
          </>
        )}
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
