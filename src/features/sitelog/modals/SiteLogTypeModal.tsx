import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tag } from 'lucide-react';
import { FormModalHeader } from '@/components/modal/form/FormModalHeader';
import { FormModalFooter } from '@/components/modal/form/FormModalFooter';
import { FormModalLayout } from '@/components/modal/form/FormModalLayout';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCreateSiteLogType, useUpdateSiteLogType } from '../hooks/use-sitelog-types';
import type { SiteLogType } from '../services/getSiteLogTypes';

// Schema de validación
const siteLogTypeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  code: z.string()
    .min(1, 'El código es requerido')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[A-Z0-9_-]+$/, 'Solo mayúsculas, números, guiones y guiones bajos'),
  description: z.string().max(500, 'Máximo 500 caracteres').optional(),
  icon: z.string().max(50, 'Máximo 50 caracteres').optional(),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Debe ser un color hexadecimal válido (#RRGGBB)')
    .optional(),
});

type SiteLogTypeFormData = z.infer<typeof siteLogTypeSchema>;

interface SiteLogTypeModalProps {
  modalData?: {
    siteLogType?: SiteLogType;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function SiteLogTypeModal({ modalData, onClose }: SiteLogTypeModalProps) {
  const { siteLogType, isEditing = false } = modalData || {};
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { data: userData } = useCurrentUser();

  const form = useForm<SiteLogTypeFormData>({
    resolver: zodResolver(siteLogTypeSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      icon: '',
      color: '#84cc16',
    }
  });

  // Cargar datos si es edición
  useEffect(() => {
    if (siteLogType) {
      form.reset({
        name: siteLogType.name || '',
        code: siteLogType.code || '',
        description: siteLogType.description || '',
        icon: siteLogType.icon || '',
        color: siteLogType.color || '#84cc16',
      });
    } else {
      form.reset({
        name: '',
        code: '',
        description: '',
        icon: '',
        color: '#84cc16',
      });
    }
  }, [siteLogType, form]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const createMutation = useCreateSiteLogType();
  const updateMutation = useUpdateSiteLogType();

  const onSubmit = async (data: SiteLogTypeFormData) => {
    if (!userData?.organization?.id) {
      toast({
        title: 'Error',
        description: 'No se pudo obtener la información de la organización',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isEditing && siteLogType) {
        await updateMutation.mutateAsync({
          typeId: siteLogType.id,
          organizationId: userData.organization.id,
          data: {
            name: data.name,
            code: data.code,
            description: data.description || null,
            icon: data.icon || null,
            color: data.color || null,
          }
        });

        toast({
          title: 'Tipo actualizado',
          description: 'El tipo de bitácora se actualizó correctamente'
        });
      } else {
        await createMutation.mutateAsync({
          name: data.name,
          code: data.code,
          description: data.description || null,
          icon: data.icon || null,
          color: data.color || null,
          organizationId: userData.organization.id,
        });

        toast({
          title: 'Tipo creado',
          description: 'El tipo de bitácora se creó correctamente'
        });
      }

      handleClose();
    } catch (error) {
      console.error('Error saving site log type:', error);
      toast({
        title: 'Error',
        description: isEditing 
          ? 'No se pudo actualizar el tipo de bitácora'
          : 'No se pudo crear el tipo de bitácora',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const editPanel = (
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
                  placeholder="Ej: Eventos Especiales" 
                  {...field}
                  data-testid="input-sitelog-type-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Código <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ej: EVENTOS_ESPECIALES" 
                  {...field}
                  onChange={(e) => {
                    const formatted = e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9\-_]/g, '');
                    field.onChange(formatted);
                  }}
                  data-testid="input-sitelog-type-code"
                  maxLength={50}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Solo mayúsculas, números, guiones y guiones bajos
              </p>
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
                  placeholder="Descripción del tipo de bitácora..."
                  {...field}
                  rows={3}
                  data-testid="textarea-sitelog-type-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Icono (opcional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ej: star" 
                    {...field}
                    data-testid="input-sitelog-type-icon"
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Nombre del icono de Lucide React
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input 
                      type="color" 
                      {...field}
                      className="w-16 h-10 p-1 cursor-pointer"
                      data-testid="input-sitelog-type-color"
                    />
                  </FormControl>
                  <FormControl>
                    <Input 
                      placeholder="#84cc16" 
                      {...field}
                      className="flex-1"
                      maxLength={7}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );

  const headerContent = (
    <FormModalHeader 
      title={isEditing ? 'Editar Tipo' : 'Nuevo Tipo'}
      description={isEditing 
        ? 'Modifica los detalles del tipo de bitácora'
        : 'Crea un nuevo tipo de bitácora personalizado para tu organización'
      }
      icon={Tag}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={isEditing ? 'Guardar Cambios' : 'Crear Tipo'}
      onRightClick={form.handleSubmit(onSubmit)}
      isSubmitting={isLoading}
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
