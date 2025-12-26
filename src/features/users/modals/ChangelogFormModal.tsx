import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileText, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FormModalHeader } from '@/components/modal';
import { FormModalFooter } from '@/components/modal';
import { FormModalLayout } from '@/components/modal';
import { useModalPanelStore } from '@/components/modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Título</label>
        <p className="text-sm text-muted-foreground mt-1">{entry?.title}</p>
      </div>
      <div>
        <label className="text-sm font-medium">Descripción</label>
        <p className="text-sm text-muted-foreground mt-1">{entry?.description}</p>
      </div>
      <div>
        <label className="text-sm font-medium">Tipo</label>
        <p className="text-sm text-muted-foreground mt-1">{entry?.type}</p>
      </div>
      <div>
        <label className="text-sm font-medium">Fecha</label>
        <p className="text-sm text-muted-foreground mt-1">{entry?.date}</p>
      </div>
      <div>
        <label className="text-sm font-medium">Visibilidad</label>
        <p className="text-sm text-muted-foreground mt-1">
          {entry?.is_public ? 'Pública' : 'Privada'}
        </p>
      </div>
    </div>
  );

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  className="min-h-[100px]"
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
          render={({ field }) => {
            const dateValue = field.value ? new Date(field.value) : undefined;
            return (
              <FormItem>
                <FormLabel>Fecha del Cambio</FormLabel>
                <FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Seleccionar fecha"
                            value={dateValue ? format(dateValue, 'dd/MM/yyyy', { locale: es }) : ''}
                            className="pr-10 cursor-pointer"
                            readOnly
                          />
                          <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateValue}
                        onSelect={(date) => {
                          if (date) {
                            field.onChange(date.toISOString().split('T')[0]);
                          }
                        }}
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="is_public"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Entrada Pública</FormLabel>
                <div className="text-xs text-muted-foreground">
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