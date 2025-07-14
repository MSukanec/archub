import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarDays, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CustomModalLayout } from '@/components/modal/legacy/CustomModalLayout';
import { CustomModalHeader } from '@/components/modal/legacy/CustomModalHeader';
import { CustomModalBody } from '@/components/modal/legacy/CustomModalBody';
import { CustomModalFooter } from '@/components/modal/legacy/CustomModalFooter';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCreateMaterialCategory, useUpdateMaterialCategory, MaterialCategory } from '@/hooks/use-material-categories';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const materialCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  created_at: z.date(),
  created_by: z.string().min(1, 'El creador es requerido'),
});

type MaterialCategoryFormData = z.infer<typeof materialCategorySchema>;

interface NewAdminMaterialCategoryModalProps {
  open: boolean;
  onClose: () => void;
  category?: MaterialCategory;
}

export function NewAdminMaterialCategoryModal({ 
  open, 
  onClose, 
  category 
}: NewAdminMaterialCategoryModalProps) {
  const { data: currentUser } = useCurrentUser();
  const createCategory = useCreateMaterialCategory();
  const updateCategory = useUpdateMaterialCategory();
  const [showCalendar, setShowCalendar] = useState(false);

  const form = useForm<MaterialCategoryFormData>({
    resolver: zodResolver(materialCategorySchema),
    defaultValues: {
      name: '',
      description: '',
      created_at: new Date(),
      created_by: '',
    },
  });

  const isEditing = !!category;

  useEffect(() => {
    if (currentUser?.user?.id) {
      form.setValue('created_by', currentUser.user.id);
    }
  }, [currentUser, form]);

  useEffect(() => {
    if (category && isEditing) {
      form.reset({
        name: category.name || '',
        created_at: new Date(category.created_at),
      });
    } else if (!isEditing) {
      form.reset({
        name: '',
        created_at: new Date(),
      });
    }
  }, [category, isEditing, form, currentUser]);

  const onSubmit = async (data: MaterialCategoryFormData) => {
    try {
      const categoryData = {
        name: data.name,
        description: data.description || undefined,
        created_by: data.created_by,
      };

      if (isEditing && category) {
        await updateCategory.mutateAsync({
          id: category.id,
          data: categoryData,
        });
      } else {
        await createCategory.mutateAsync(categoryData);
      }
      
      onClose();
      form.reset();
    } catch (error) {
      console.error('Error saving material category:', error);
    }
  };

  const handleClose = () => {
    onClose();
    form.reset();
  };

  if (!open) return null;

  const isLoading = createCategory.isPending || updateCategory.isPending;

  return (
    <CustomModalLayout open={open} onClose={handleClose}>
      {{
        header: (
          <CustomModalHeader
            title={isEditing ? "Editar Categoría de Material" : "Nueva Categoría de Material"}
            description={isEditing ? "Modifica los datos de la categoría de material" : "Completa los siguientes campos para crear una nueva categoría de material"}
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <form id="material-category-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Fecha de creación */}
              <div className="space-y-1">
                <Label htmlFor="created_at" className="required-asterisk">
                  Fecha de creación
                </Label>
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.watch('created_at') && "text-muted-foreground"
                      )}
                      disabled={isEditing}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {form.watch('created_at') ? (
                        format(form.watch('created_at'), "PPP")
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.watch('created_at')}
                      onSelect={(date) => {
                        if (date) {
                          form.setValue('created_at', date);
                          setShowCalendar(false);
                        }
                      }}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Creador */}
              <div className="space-y-1">
                <Label htmlFor="created_by" className="required-asterisk">
                  Creador
                </Label>
                <div className="flex items-center space-x-3 px-3 py-2 border rounded-lg bg-muted">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUser?.user?.avatar_url || ''} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {currentUser?.user?.full_name || 'Usuario'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {currentUser?.user?.email || ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Nombre */}
              <div className="space-y-1">
                <Label htmlFor="name" className="required-asterisk">
                  Nombre de la categoría
                </Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="Ingresa el nombre de la categoría..."
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-1">
                <Label htmlFor="description">
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  placeholder="Descripción opcional de la categoría..."
                  rows={3}
                />
              </div>
            </form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleClose}
            onSave={() => form.handleSubmit(onSubmit)()}
            saveText={isEditing ? "Actualizar" : "Crear categoría"}
            cancelText="Cancelar"
            saveLoading={isLoading}
            saveDisabled={isLoading}
          />
        ),
      }}
    </CustomModalLayout>
  );
}