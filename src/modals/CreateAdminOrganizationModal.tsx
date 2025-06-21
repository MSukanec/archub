import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, Avatar, AvatarFallback, AvatarImage } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { CustomModalLayout } from '@/components/ui-custom/CustomModalLayout'
import { CustomModalHeader } from '@/components/ui-custom/CustomModalHeader'
import { CustomModalBody } from '@/components/ui-custom/CustomModalBody'
import { CustomModalFooter } from '@/components/ui-custom/CustomModalFooter'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { queryClient } from '@/lib/queryClient'
import { supabase } from '@/lib/supabase'

const createOrganizationSchema = z.object({
  created_at: z.date(),
  created_by: z.string().min(1, "Creador es requerido"),
  name: z.string().min(1, "El nombre es requerido"),
  plan_id: z.string().optional(),
  is_active: z.boolean(),
})

type CreateOrganizationForm = z.infer<typeof createOrganizationSchema>

interface Organization {
  id: string
  name: string
  created_at: string
  is_active: boolean
  created_by: string
  plan_id?: string
  plan?: {
    name: string
  }
  creator?: {
    full_name?: string
    email: string
  }
}

interface CreateAdminOrganizationModalProps {
  open: boolean
  onClose: () => void
  editingOrganization?: Organization | null
}

export function CreateAdminOrganizationModal({ open, onClose, editingOrganization }: CreateAdminOrganizationModalProps) {
  const { toast } = useToast()

  // Fetch users for creator dropdown
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url')
        .order('full_name', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: open
  })

  // Fetch plans for plan dropdown
  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data, error } = await supabase
        .from('plans')
        .select('id, name, description')
        .order('name', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: open
  })

  const form = useForm<CreateOrganizationForm>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      created_at: new Date(),
      created_by: '',
      name: '',
      plan_id: '',
      is_active: true,
    }
  })

  // Reset form when editing organization changes
  useEffect(() => {
    if (editingOrganization) {
      form.reset({
        created_at: new Date(editingOrganization.created_at),
        created_by: editingOrganization.created_by || '',
        name: editingOrganization.name || '',
        plan_id: editingOrganization.plan_id || '',
        is_active: editingOrganization.is_active ?? true,
      })
    } else {
      form.reset({
        created_at: new Date(),
        created_by: '',
        name: '',
        plan_id: '',
        is_active: true,
      })
    }
  }, [editingOrganization, form])

  const createOrganizationMutation = useMutation({
    mutationFn: async (formData: CreateOrganizationForm) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const organizationData = {
        name: formData.name,
        created_at: formData.created_at.toISOString(),
        created_by: formData.created_by,
        plan_id: formData.plan_id || null,
        is_active: formData.is_active,
      }

      if (editingOrganization) {
        const { data, error } = await supabase
          .from('organizations')
          .update(organizationData)
          .eq('id', editingOrganization.id)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        const { data, error } = await supabase
          .from('organizations')
          .insert([organizationData])
          .select()
          .single()

        if (error) throw error
        return data
      }
    },
    onSuccess: () => {
      toast({
        title: editingOrganization ? "Organización actualizada" : "Organización creada",
        description: editingOrganization 
          ? "La organización ha sido actualizada exitosamente." 
          : "La nueva organización ha sido creada exitosamente.",
      })
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] })
      onClose()
    },
    onError: (error) => {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: `Error al ${editingOrganization ? 'actualizar' : 'crear'} la organización: ${error.message}`,
        variant: "destructive",
      })
    },
  })

  const handleSubmit = (data: CreateOrganizationForm) => {
    createOrganizationMutation.mutate(data)
  }

  const selectedUser = users.find(user => user.id === form.watch('created_by'))

  const header = (
    <CustomModalHeader
      title={editingOrganization ? "Editar organización" : "Nueva organización"}
      description={editingOrganization ? "Actualiza la información de la organización" : "Crea una nueva organización en el sistema"}
      onClose={onClose}
    />
  )

  const body = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-0" id="organization-form">
        <CustomModalBody padding="md">
          {/* 1. Fecha de creación */}
          <FormField
            control={form.control}
            name="created_at"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel className="text-sm font-medium">Fecha de creación</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                        <Calendar className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 2. Creador */}
          <FormField
            control={form.control}
            name="created_by"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel className="text-sm font-medium">Creador</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar creador" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {user.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 
                               user.email?.slice(0, 2).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span>{user.full_name || user.email || 'Usuario'}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 3. Nombre de la organización */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel className="text-sm font-medium">Nombre de la organización</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ingresa el nombre de la organización"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 4. Plan */}
          <FormField
            control={form.control}
            name="plan_id"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel className="text-sm font-medium">Plan</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar plan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Sin plan</SelectItem>
                    {plans.map((plan: any) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 5. Estado activo */}
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="col-span-1 flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-medium">Estado activo</FormLabel>
                  <div className="text-xs text-muted-foreground">
                    Marca si la organización está activa
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
        </CustomModalBody>
      </form>
    </Form>
  )

  const footer = (
    <CustomModalFooter
      cancelText="Cancelar"
      confirmText={editingOrganization ? "Actualizar" : "Crear"}
      onCancel={onClose}
      onConfirm={() => form.handleSubmit(handleSubmit)()}
      isLoading={createOrganizationMutation.isPending}
      formId="organization-form"
    />
  )

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      {{ header, body, footer }}
    </CustomModalLayout>
  )
}