import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2 } from 'lucide-react'

import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import { FormModalLayout } from "@/components/modal/form/FormModalLayout"
import { FormModalHeader } from "@/components/modal/form/FormModalHeader"
import { FormModalFooter } from "@/components/modal/form/FormModalFooter"
import { useModalPanelStore } from "@/components/modal/form/modalPanelStore"

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

interface OrganizationFormModalProps {
  modalData: {
    open: boolean
    editingOrganization?: Organization | null
  }
  onClose: () => void
}

export function OrganizationFormModal({ modalData, onClose }: OrganizationFormModalProps) {
  const { open, editingOrganization } = modalData
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { setPanel } = useModalPanelStore()

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
      setPanel('view') // Para edición, comenzar en vista
    } else if (open) {
      form.reset({
        name: '',
      })
      setPanel('edit') // Para creación, comenzar en edición
    }
  }, [editingOrganization, open, form, setPanel])

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
        const { data, error } = await supabase.rpc('handle_new_organization', {
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

  const viewPanel = (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-muted/20 rounded-lg">
        <Building2 className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="font-medium">{editingOrganization?.name}</p>
          <p className="text-sm text-muted-foreground">
            Organización {editingOrganization?.is_active ? 'activa' : 'inactiva'}
          </p>
        </div>
      </div>
    </div>
  );

  const editPanel = (
    <Form {...form}>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la organización *</FormLabel>
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
  );

  const headerContent = (
    <FormModalHeader 
      title={editingOrganization ? 'Editar organización' : 'Nueva organización'}
      subtitle={editingOrganization ? 'Actualiza la información de la organización' : 'Crea una nueva organización para tu equipo'}
      icon={Building2}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={editingOrganization ? 'Actualizar' : 'Crear organización'}
      onRightClick={form.handleSubmit(handleSubmit)}
      rightLoading={organizationMutation.isPending}
      rightDisabled={organizationMutation.isPending}
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