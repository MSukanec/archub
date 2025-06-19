import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Building, Calendar, User } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { CustomModalLayout } from '@/components/ui-custom/CustomModalLayout'
import { CustomModalHeader } from '@/components/ui-custom/CustomModalHeader'
import { CustomModalBody } from '@/components/ui-custom/CustomModalBody'
import { CustomModalFooter } from '@/components/ui-custom/CustomModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { queryClient } from '@/lib/queryClient'
import { useCurrentUser } from '@/hooks/use-current-user'

const createOrganizationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  created_at: z.date()
})

type CreateOrganizationForm = z.infer<typeof createOrganizationSchema>

interface Organization {
  id: string
  name: string
  is_active: boolean
  is_system: boolean
  created_at: string
  plan?: {
    id: string
    name: string
    price: number
  } | null
}

interface NewOrganizationModalProps {
  open: boolean
  onClose: () => void
  editingOrganization?: Organization | null
}

export function NewOrganizationModal({ open, onClose, editingOrganization }: NewOrganizationModalProps) {
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const form = useForm<CreateOrganizationForm>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: '',
      created_at: new Date()
    }
  })

  // Update form when editing organization changes
  useEffect(() => {
    if (editingOrganization) {
      console.log('Editing organization data:', editingOrganization) // Debug log
      
      form.reset({
        name: editingOrganization.name,
        created_at: new Date(editingOrganization.created_at)
      })
    } else {
      form.reset({
        name: '',
        created_at: new Date()
      })
    }
  }, [editingOrganization, form])

  const createOrganizationMutation = useMutation({
    mutationFn: async (formData: CreateOrganizationForm) => {
      if (!userData?.user?.id) {
        throw new Error('Usuario no autenticado')
      }

      const organizationData = {
        name: formData.name,
        created_at: formData.created_at.toISOString()
      }

      if (editingOrganization) {
        // Update existing organization
        return await fetch(`/api/organizations/${editingOrganization.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(organizationData)
        }).then(res => res.json())
      } else {
        // Create new organization
        return await fetch('/api/organizations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(organizationData)
        }).then(res => res.json())
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      queryClient.refetchQueries({ queryKey: ['current-user'] })
      
      toast({
        title: editingOrganization ? "Organización actualizada" : "Organización creada",
        description: editingOrganization 
          ? "La organización se ha actualizado correctamente." 
          : "La nueva organización se ha creado correctamente."
      })
      
      onClose()
      form.reset()
    },
    onError: (error: any) => {
      console.error('Error saving organization:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar la organización"
      })
    }
  })

  const handleSubmit = (data: CreateOrganizationForm) => {
    createOrganizationMutation.mutate(data)
  }

  const getCreatorInfo = () => {
    if (userData?.user_data?.first_name && userData?.user_data?.last_name) {
      return `${userData.user_data.first_name} ${userData.user_data.last_name}`
    }
    return userData?.user?.full_name || userData?.user?.email || 'Usuario'
  }

  const getCreatorInitials = () => {
    const name = getCreatorInfo()
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CustomModalHeader
            title={editingOrganization ? "Editar organización" : "Nueva organización"}
            description={editingOrganization ? "Actualiza los datos de la organización" : "Crea una nueva organización para gestionar tus proyectos"}
            onClose={onClose}
          />

          <CustomModalBody padding="md">
            <div className="space-y-4">
              {/* Fecha de creación */}
              <FormField
                control={form.control}
                name="created_at"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
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
                              <span>Selecciona una fecha</span>
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

              {/* Creador */}
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Creador</label>
                <div className="flex items-center space-x-3 p-3 border rounded-md bg-muted/30">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userData?.user?.avatar_url || ''} />
                    <AvatarFallback className="text-xs">
                      {getCreatorInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    {getCreatorInfo()}
                  </span>
                </div>
              </div>

              {/* Nombre de la organización */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Nombre de la organización</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Mi empresa constructora"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CustomModalBody>

          <CustomModalFooter
            onCancel={onClose}
            onSubmit={form.handleSubmit(handleSubmit)}
            cancelText="Cancelar"
            submitText="Guardar"
            isSubmitting={createOrganizationMutation.isPending}
          />
        </form>
      </Form>
    </CustomModalLayout>
  )
}