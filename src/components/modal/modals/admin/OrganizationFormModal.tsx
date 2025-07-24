import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { FormModalLayout } from '../../form/FormModalLayout'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Building } from 'lucide-react'

const organizationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  is_active: z.boolean(),
  plan_id: z.string().min(1, 'El plan es requerido')
})

type OrganizationFormData = z.infer<typeof organizationSchema>

interface Organization {
  id: string
  name: string
  is_active: boolean
  plan_id: string
}

interface OrganizationFormModalProps {
  modalData?: {
    organization?: Organization
    isEditing?: boolean
  }
  onClose: () => void
}

export function OrganizationFormModal({ modalData, onClose }: OrganizationFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const organization = modalData?.organization
  const isEditing = modalData?.isEditing || false

  // Fetch plans for select
  const { data: plans = [] } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { data, error } = await supabase
        .from('plans')
        .select('id, name')
        .order('name')
      
      if (error) throw error
      return data
    }
  })

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      is_active: true,
      plan_id: ''
    }
  })

  // Load organization data when editing
  useEffect(() => {
    if (isEditing && organization) {
      form.reset({
        name: organization.name,
        is_active: organization.is_active,
        plan_id: organization.plan_id
      })
    }
  }, [isEditing, organization, form])

  const updateOrganizationMutation = useMutation({
    mutationFn: async (data: OrganizationFormData) => {
      if (!supabase || !organization) throw new Error('Missing requirements')
      
      const { error } = await supabase
        .from('organizations')
        .update({
          name: data.name,
          is_active: data.is_active,
          plan_id: data.plan_id
        })
        .eq('id', organization.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] })
      toast({
        title: 'Organización actualizada',
        description: 'La organización ha sido actualizada correctamente.'
      })
      onClose()
    },
    onError: (error) => {
      console.error('Error updating organization:', error)
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la organización. Inténtalo de nuevo.',
        variant: 'destructive'
      })
    }
  })

  const onSubmit = async (data: OrganizationFormData) => {
    setIsLoading(true)
    try {
      updateOrganizationMutation.mutate(data)
    } finally {
      setIsLoading(false)
    }
  }

  const viewPanel = (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Nombre</label>
        <p className="text-sm text-muted-foreground mt-1">{organization?.name}</p>
      </div>
      <div>
        <label className="text-sm font-medium">Estado</label>
        <p className="text-sm text-muted-foreground mt-1">
          {organization?.is_active ? 'Activa' : 'Inactiva'}
        </p>
      </div>
    </div>
  )

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Organización</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Nombre de la organización" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="plan_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plan</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un plan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {plans.map((plan) => (
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

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Estado Activo</FormLabel>
                <div className="text-sm text-muted-foreground">
                  La organización está activa y sus miembros pueden acceder
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
  )

  const headerContent = (
    <div className="flex items-center space-x-2">
      <Building className="h-5 w-5" />
      <span>{isEditing ? 'Editar Organización' : 'Ver Organización'}</span>
    </div>
  )

  const footerContent = (
    <div className="flex justify-end space-x-2">
      <Button variant="secondary" onClick={onClose}>
        Cancelar
      </Button>
      {isEditing && (
        <Button 
          type="submit" 
          onClick={form.handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      )}
    </div>
  )

  return (
    <FormModalLayout
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
      isEditing={true}
    />
  )
}