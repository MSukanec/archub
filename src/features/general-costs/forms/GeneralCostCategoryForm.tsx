import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { GeneralCostCategory } from '../types';

const categorySchema = z.object({
  name: z.string().min(1, 'El nombre de la categoría es requerido').max(100),
  description: z.string().max(500).nullable().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface GeneralCostCategoryFormProps {
  category?: GeneralCostCategory;
  onSubmit: (data: CategoryFormData) => void;
}

export default function GeneralCostCategoryForm({ category, onSubmit }: GeneralCostCategoryFormProps) {
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      description: category?.description || null,
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nombre <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ej: Servicios, Equipamiento, etc." 
                  {...field}
                  data-testid="input-category-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descripción opcional de la categoría" 
                  {...field}
                  value={field.value ?? ''}
                  data-testid="input-category-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
