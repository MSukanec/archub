import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileText } from 'lucide-react';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { FormModalLayout } from '../../form/FormModalLayout';
import { useModalPanelStore } from '../../form/modalPanelStore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/hooks/use-current-user';

const changelogEntrySchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  type: z.enum(['Novedad', 'Mejora', 'Arreglo de Errores'], {
    required_error: 'El tipo es requerido'
  }),
  date: z.string().min(1, 'La fecha es requerida'),
  is_public: z.boolean().default(true),
});

type ChangelogEntryFormData = z.infer<typeof changelogEntrySchema>;

interface ChangelogEntry {
  id: string;
  title: string;
  description: string;
  type: string;
  date: string;
  is_public: boolean;
  created_at: string;
  created_by: string;
}

interface ChangelogFormModalProps {
  modalData?: {
    entry?: ChangelogEntry;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function ChangelogFormModal({ modalData, onClose }: ChangelogFormModalProps) {
  const { entry, isEditing = false } = modalData || {};
  const { currentPanel, setPanel } = useModalPanelStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = React.useState(false);
  const { data: userData } = useCurrentUser();

  const form = useForm<ChangelogEntryFormData>({
    resolver: zodResolver(changelogEntrySchema),
    defaultValues: {
      title: entry?.title || '',
      description: entry?.description || '',
      type: (entry?.type as any) || 'Novedad',
      date: entry?.date ? entry.date.split('T')[0] : new Date().toISOString().split('T')[0],
      is_public: entry?.is_public ?? true,
    }
  });

  React.useEffect(() => {
    if (entry) {
      form.reset({
        title: entry.title || '',
        description: entry.description || '',
        type: (entry.type as any) || 'Novedad',
        date: entry.date ? entry.date.split('T')[0] : new Date().toISOString().split('T')[0],
        is_public: entry.is_public ?? true,
      });
    } else {
      form.reset({
        title: '',
        description: '',
        type: 'Novedad',
        date: new Date().toISOString().split('T')[0],
        is_public: true,
      });
    }
  }, [entry, form]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const createChangelogEntryMutation = useMutation({
    mutationFn: async (data: ChangelogEntryFormData) => {
      if (!supabase || !userData?.user?.id) throw new Error('Supabase not initialized or user not found');
      
      const { error } = await supabase
        .from('changelog_entries')
        .insert({
          title: data.title,
          description: data.description,
          type: data.type,
          date: data.date,
          is_public: data.is_public,
          created_by: userData.user.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-changelog-entries'] });
      toast({
        title: 'Entrada creada',
        description: 'La entrada del changelog se creó correctamente.'
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Error creating changelog entry:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la entrada. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  });

  const updateChangelogEntryMutation = useMutation({
    mutationFn: async (data: ChangelogEntryFormData) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase
        .from('changelog_entries')
        .update({
          title: data.title,
          description: data.description,
          type: data.type,
          date: data.date,
          is_public: data.is_public
        })
        .eq('id', entry!.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-changelog-entries'] });
      toast({
        title: 'Entrada actualizada',
        description: 'Los cambios se guardaron correctamente.'
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Error updating changelog entry:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la entrada. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  });

  const onSubmit = async (data: ChangelogEntryFormData) => {
    setIsLoading(true);
    try {
      if (entry) {
        await updateChangelogEntryMutation.mutateAsync(data);
      } else {
        await createChangelogEntryMutation.mutateAsync(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'Novedad':
        return 'default';
      case 'Mejora':
        return 'secondary';
      case 'Arreglo de Errores':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const viewPanel = (
      <div>
      </div>
      <div>
      </div>
      <div>
      </div>
      <div>
      </div>
      <div>
          {entry?.is_public ? 'Pública' : 'Privada'}
        </p>
      </div>
    </div>
  );

  const editPanel = (
    <Form {...form}>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Título de la entrada" {...field} />
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
                  placeholder="Descripción detallada del cambio"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Novedad">🔹 Novedad</SelectItem>
                  <SelectItem value="Mejora">🔧 Mejora</SelectItem>
                  <SelectItem value="Arreglo de Errores">🐛 Arreglo de Errores</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha del Cambio</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_public"
          render={({ field }) => (
                <FormLabel>Entrada Pública</FormLabel>
                  La entrada será visible para todos los usuarios
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
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
      title={entry ? 'Editar Entrada del Changelog' : 'Nueva Entrada del Changelog'}
      icon={FileText}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={entry ? 'Actualizar' : 'Crear Entrada'}
      onRightClick={form.handleSubmit(onSubmit)}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
      isEditing={true}
    />
  );
}