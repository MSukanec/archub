import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import { CustomModalLayout } from '@/components/modal/legacy/CustomModalLayout'
import { CustomModalHeader } from '@/components/modal/legacy/CustomModalHeader'
import { CustomModalBody } from '@/components/modal/legacy/CustomModalBody'
import { CustomModalFooter } from '@/components/modal/legacy/CustomModalFooter'

import { useCurrentUser } from '@/hooks/use-current-user'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

const organizationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido')
})

type OrganizationFormData = z.infer<typeof organizationSchema>

interface Organization {
  id: string
  name: string
  created_at: string
  is_active: boolean
  is_system: boolean
}

interface NewOrganizationModalProps {
  open: boolean
  onClose: () => void
  editingOrganization?: Organization | null
}

export function NewOrganizationModal({ open, onClose, editingOrganization }: NewOrganizationModalProps) {
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
    }
  })

  useEffect(() => {
    if (editingOrganization && open) {
      form.reset({
        name: editingOrganization.name,
      })
    } else if (open) {
      form.reset({
        name: '',
      })
    }
  }, [editingOrganization, open, form])

  const organizationMutation = useMutation({
    mutationFn: async (formData: OrganizationFormData) => {
      if (editingOrganization) {
        const { error } = await supabase
          .from('organizations')
          .update({
            name: formData.name,
          })
          .eq('id', editingOrganization.id)

        if (error) {
          throw new Error('No se pudo actualizar la organización')
        }
      } else {
        const { data, error } = await supabase.rpc('archub_new_organization', {
          _organization_name: formData.name,
          _user_id: userData?.user?.id
        })

        if (error) {
          throw new Error(error.message || 'No se pudo crear la organización')
        }
        
        return data // Devuelve el ID de la nueva organización
      }
    },
    onSuccess: async (result) => {
      toast({
        title: "Éxito",
        description: editingOrganization ? "Organización actualizada correctamente" : "Organización creada correctamente"
      })
      
      // Si es una nueva organización, seleccionarla automáticamente
      if (!editingOrganization && result) {
        try {
          const { error } = await supabase
            .from('user_preferences')
            .update({ last_organization_id: result })
            .eq('user_id', userData?.user.id)
          
          if (error) console.error('Error selecting new organization:', error)
        } catch (err) {
          console.error('Error updating organization selection:', err)
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      handleClose()
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive"
      })
    }
  })

  const handleSubmit = (data: OrganizationFormData) => {
    organizationMutation.mutate(data)
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <CustomModalLayout open={open} onClose={handleClose}>
      {{
        header: (
          <CustomModalHeader
            title={editingOrganization ? 'Editar organización' : 'Nueva organización'}
            description={editingOrganization ? 'Actualiza la información de la organización' : 'Crea una nueva organización para tu equipo'}
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody>
            <Form {...form}>
              <div className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la organización</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ingresá el nombre de la organización"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleClose}
            onSave={form.handleSubmit(handleSubmit)}
            saveText={editingOrganization ? 'Actualizar' : 'Crear organización'}
            saveLoading={organizationMutation.isPending}
          />
        )
      }}
    </CustomModalLayout>
  )
}