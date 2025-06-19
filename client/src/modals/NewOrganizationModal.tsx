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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { apiRequest, queryClient } from '@/lib/queryClient'
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

  // Create organization mutation
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
    const user = userData?.user
    const userData_ = userData?.user_data
    
    if (!user) return { name: 'Usuario', initials: 'U', avatar: '' }
    
    // Prefer display names from user_data, fallback to user table
    let displayName = user.full_name || 'Usuario'
    if (userData_?.first_name && userData_?.last_name) {
      displayName = `${userData_.first_name} ${userData_.last_name}`
    } else if (userData_?.first_name) {
      displayName = userData_.first_name
    }
    
    const initials = displayName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
    
    return {
      name: displayName,
      initials,
      avatar: user.avatar_url || ''
    }
  }

  const creator = getCreatorInfo()

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      <CustomModalHeader
        title={editingOrganization ? "Editar organización" : "Nueva organización"}
        description={editingOrganization 
          ? "Modifica los datos de la organización" 
          : "Crea una nueva organización para tu cuenta"
        }
        onClose={onClose}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
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
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {format(field.value, "PPP", { locale: es })}
                              </div>
                            ) : (
                              <span>Selecciona una fecha</span>
                            )}
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

              {/* Creador (readonly) */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Creador</label>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={creator.avatar} alt={creator.name} />
                    <AvatarFallback className="text-xs">{creator.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{creator.name}</p>
                    <p className="text-xs text-muted-foreground">{userData?.user?.email}</p>
                  </div>
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
                        placeholder="Ingresa el nombre de la organización" 
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