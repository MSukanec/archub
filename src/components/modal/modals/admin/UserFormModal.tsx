import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User } from 'lucide-react';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { FormModalLayout } from '../../form/FormModalLayout';
import { useModalPanelStore } from '../../form/modalPanelStore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const userSchema = z.object({
  full_name: z.string().min(1, 'El nombre completo es requerido'),
  email: z.string().email('Email inválido'),
  first_name: z.string().min(1, 'El nombre es requerido'),
  last_name: z.string().min(1, 'El apellido es requerido'),
  avatar_url: z.string().optional(),
  country_id: z.string().min(1, 'El país es requerido'),
  birthdate: z.date().optional(),
  is_active: z.boolean().default(true),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormModalProps {
  modalData?: {
    user?: any;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function UserFormModal({ modalData, onClose }: UserFormModalProps) {
  const { user, isEditing = false } = modalData || {};
  const { currentPanel, setPanel } = useModalPanelStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
      first_name: user?.user_data?.first_name || '',
      last_name: user?.user_data?.last_name || '',
      avatar_url: user?.avatar_url || '',
      country_id: user?.user_data?.country || '',
      birthdate: user?.user_data?.birthdate ? new Date(user.user_data.birthdate) : undefined,
      is_active: user?.is_active ?? true,
    }
  });

  // Fetch countries for dropdown
  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const { data, error } = await supabase!
        .from('countries')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const { data: authUser, error: authError } = await supabase!.auth.admin.createUser({
        email: data.email,
        password: Math.random().toString(36).slice(-8), // Temporary password
        email_confirm: true
      });

      if (authError) throw authError;

      // Create user record
      const { data: userData, error: userError } = await supabase!
        .from('users')
        .insert({
          auth_id: authUser.user.id,
          email: data.email,
          full_name: data.full_name,
          avatar_url: data.avatar_url || '',
          is_active: data.is_active
        })
        .select()
        .single();

      if (userError) throw userError;

      // Create user_data record
      const { error: userDataError } = await supabase!
        .from('user_data')
        .insert({
          user_id: userData.id,
          first_name: data.first_name,
          last_name: data.last_name,
          country: data.country_id,
          birthdate: data.birthdate?.toISOString().split('T')[0] || null
        });

      if (userDataError) throw userDataError;

      return userData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado exitosamente"
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear el usuario",
        variant: "destructive"
      });
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      if (!user?.id) throw new Error('User ID is required');

      // Update user record
      const { error: userError } = await supabase!
        .from('users')
        .update({
          email: data.email,
          full_name: data.full_name,
          avatar_url: data.avatar_url || '',
          is_active: data.is_active
        })
        .eq('id', user.id);

      if (userError) throw userError;

      // Update user_data record
      const { error: userDataError } = await supabase!
        .from('user_data')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          country: data.country_id,
          birthdate: data.birthdate?.toISOString().split('T')[0] || null
        })
        .eq('user_id', user.id);

      if (userDataError) throw userDataError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: "Usuario actualizado",
        description: "El usuario ha sido actualizado exitosamente"
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el usuario",
        variant: "destructive"
      });
    }
  });

  React.useEffect(() => {
    if (user) {
      form.reset({
        full_name: user.full_name || '',
        email: user.email || '',
        first_name: user.user_data?.first_name || '',
        last_name: user.user_data?.last_name || '',
        avatar_url: user.avatar_url || '',
        country_id: user.user_data?.country || '',
        birthdate: user.user_data?.birthdate ? new Date(user.user_data.birthdate) : undefined,
        is_active: user.is_active ?? true,
      });
      setPanel('edit');
    } else {
      form.reset({
        full_name: '',
        email: '',
        first_name: '',
        last_name: '',
        avatar_url: '',
        country_id: '',
        birthdate: undefined,
        is_active: true,
      });
      setPanel('edit');
    }
  }, [user, form, setPanel]);

  const handleClose = () => {
    form.reset();
    setPanel('view');
    onClose();
  };

  const onSubmit = async (data: UserFormData) => {
    setIsLoading(true);
    try {
      if (isEditing) {
        await updateUserMutation.mutateAsync(data);
      } else {
        await createUserMutation.mutateAsync(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const viewPanel = (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user?.avatar_url} />
          <AvatarFallback>
            {user?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-lg font-semibold">{user?.full_name}</h3>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium">Nombre</p>
          <p className="text-sm text-muted-foreground">{user?.user_data?.first_name || 'No especificado'}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Apellido</p>
          <p className="text-sm text-muted-foreground">{user?.user_data?.last_name || 'No especificado'}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Estado</p>
          <p className="text-sm text-muted-foreground">{user?.is_active ? 'Activo' : 'Inactivo'}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Organizaciones</p>
          <p className="text-sm text-muted-foreground">{user?.organizations_count || 0}</p>
        </div>
      </div>
    </div>
  );

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido</FormLabel>
                <FormControl>
                  <Input placeholder="Apellido" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo</FormLabel>
              <FormControl>
                <Input placeholder="Nombre completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@ejemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="country_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>País</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un país" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.name}
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
          name="birthdate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fecha de Nacimiento</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: es })
                      ) : (
                        <span>Selecciona una fecha</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="avatar_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL del Avatar (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="https://ejemplo.com/avatar.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <Select onValueChange={(value) => field.onChange(value === 'true')} value={field.value.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );

  const headerContent = (
    <FormModalHeader 
      title={isEditing ? "Editar Usuario" : "Crear Usuario"}
      icon={User}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={isEditing ? "Guardar Cambios" : "Crear Usuario"}
      onRightClick={form.handleSubmit(onSubmit)}
      isRightLoading={isLoading || createUserMutation.isPending || updateUserMutation.isPending}
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
    />
  );
}