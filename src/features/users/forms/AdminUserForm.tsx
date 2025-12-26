import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
const userSchema = z.object({
  full_name: z.string().min(1, 'El nombre completo es requerido'),
  email: z.string().email('Email inválido'),
  first_name: z.string().min(1, 'El nombre es requerido'),
  last_name: z.string().min(1, 'El apellido es requerido'),
  is_active: z.boolean().default(true),
})
export type UserFormData = z.infer<typeof userSchema>
interface FormPanelProps {
  form: ReturnType<typeof useForm<UserFormData>>
}
export function FormPanel({ form }: FormPanelProps) {
  return (
    <Form {...form}>
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre" {...field} data-testid="input-user-first-name" />
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
                  <Input placeholder="Apellido" {...field} data-testid="input-user-last-name" />
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
                <Input placeholder="Nombre completo" {...field} data-testid="input-user-full-name" />
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
                <Input type="email" placeholder="email@ejemplo.com" {...field} data-testid="input-user-email" />
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
                  <SelectTrigger data-testid="select-user-status">
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
  )
}
interface ViewPanelProps {
  user: any
}
export function ViewPanel({ user }: ViewPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user?.avatar_url} />
          <AvatarFallback>
            {user?.full_name?.split('').map((n: string) => n[0]).join('') || 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-lg font-semibold" data-testid="text-user-full-name">{user?.full_name}</h3>
          <p className="text-sm text-muted-foreground" data-testid="text-user-email">{user?.email}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium">Nombre</p>
          <p className="text-sm text-muted-foreground" data-testid="text-user-first-name">
            {user?.user_data?.first_name || 'No especificado'}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium">Apellido</p>
          <p className="text-sm text-muted-foreground" data-testid="text-user-last-name">
            {user?.user_data?.last_name || 'No especificado'}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium">Estado</p>
          <p className="text-sm text-muted-foreground" data-testid="text-user-status">
            {user?.is_active ? 'Activo': 'Inactivo'}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium">Organizaciones</p>
          <p className="text-sm text-muted-foreground" data-testid="text-user-orgs-count">
            {user?.organizations_count || 0}
          </p>
        </div>
      </div>
    </div>
  )
}
interface UseUserFormOptions {
  user?: any
  onSuccess: () => void
}
export function useUserForm({ user, onSuccess }: UseUserFormOptions) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
      first_name: user?.user_data?.first_name || '',
      last_name: user?.user_data?.last_name || '',
      is_active: user?.is_active ?? true,
    }
  })
  useEffect(() => {
    if (user) {
      form.reset({
        full_name: user.full_name || '',
        email: user.email || '',
        first_name: user.user_data?.first_name || '',
        last_name: user.user_data?.last_name || '',
        is_active: user.is_active ?? true,
      })
    } else {
      form.reset({
        full_name: '',
        email: '',
        first_name: '',
        last_name: '',
        is_active: true,
      })
    }
  }, [user, form])
  const updateUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      if (!user?.id) throw new Error('User ID is required')
      const { error: userError } = await supabase!
        .from('users')
        .update({
          email: data.email,
          full_name: data.full_name,
          is_active: data.is_active
        })
        .eq('id', user.id)
      if (userError) throw userError
      const { error: userDataError } = await supabase!
        .from('user_data')
        .update({
          first_name: data.first_name,
          last_name: data.last_name
        })
        .eq('user_id', user.id)
      if (userDataError) throw userDataError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast({
        title: "Usuario actualizado",
        description: "El usuario ha sido actualizado exitosamente"
      })
      onSuccess()
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el usuario",
        variant: "destructive"
      })
    }
  })
  const onSubmit = async (data: UserFormData) => {
    await updateUserMutation.mutateAsync(data)
  }
  return {
    form,
    onSubmit,
    user,
    isSubmitting: updateUserMutation.isPending,
  }
}
