import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { CustomModalLayout } from '@/components/ui-custom/CustomModalLayout'
import { CustomModalHeader } from '@/components/ui-custom/CustomModalHeader'
import { CustomModalBody } from '@/components/ui-custom/CustomModalBody'
import { CustomModalFooter } from '@/components/ui-custom/CustomModalFooter'

import { useCurrentUser } from '@/hooks/use-current-user'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

const createOrganizationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  created_at: z.date()
})

type CreateOrganizationForm = z.infer<typeof createOrganizationSchema>

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

  const form = useForm<CreateOrganizationForm>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: '',
      created_at: new Date(),
    }
  })

  // Initialize form when editing
  useEffect(() => {
    if (editingOrganization && open) {
      form.reset({
        name: editingOrganization.name,
        created_at: new Date(editingOrganization.created_at),
      })
    } else if (open) {
      form.reset({
        name: '',
        created_at: new Date(),
      })
    }
  }, [editingOrganization, open, form])

  const createOrganizationMutation = useMutation({
    mutationFn: async (formData: CreateOrganizationForm) => {
      if (editingOrganization) {
        // Update existing organization
        const { error } = await supabase
          .from('organizations')
          .update({
            name: formData.name,
          })
          .eq('id', editingOrganization.id)

        if (error) {
          console.error('Error updating organization:', error)
          throw new Error('Failed to update organization')
        }
      } else {
        // Create new organization
        const { error } = await supabase
          .from('organizations')
          .insert([{
            name: formData.name,
            created_at: formData.created_at.toISOString(),
            is_active: true,
            is_system: false,
          }])

        if (error) {
          console.error('Error creating organization:', error)
          throw new Error('Failed to create organization')
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: editingOrganization ? "Organización actualizada correctamente" : "Organización creada correctamente"
      })
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      onClose()
    },
    onError: (error: any) => {
      console.error('Error processing organization:', error)
      toast({
        title: "Error",
        description: editingOrganization ? "No se pudo actualizar la organización" : "No se pudo crear la organización",
        variant: "destructive"
      })
    }
  })

  const handleSubmit = (data: CreateOrganizationForm) => {
    createOrganizationMutation.mutate(data)
  }

  const header = (
    <CustomModalHeader
      title={editingOrganization ? 'Editar organización' : 'Nueva organización'}
      description={editingOrganization ? 'Actualiza la información de la organización' : 'Crea una nueva organización para tu equipo'}
    />
  )

  const body = (
    <CustomModalBody padding="lg">
      <Form {...form}>
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fecha de creación */}
            <div className="col-span-1">
              <FormField
                control={form.control}
                name="created_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Fecha de creación</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: es }) : "Seleccionar fecha"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Nombre de la organización */}
            <div className="col-span-1">
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
          </div>
        </form>
      </Form>
    </CustomModalBody>
  )

  const footer = (
    <CustomModalFooter
      onCancel={onClose}
      onSave={form.handleSubmit(handleSubmit)}
      saveText={editingOrganization ? 'Actualizar' : 'Crear organización'}
      saveLoading={createOrganizationMutation.isPending}
    />
  )

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      {{ header, body, footer }}
    </CustomModalLayout>
  )
}