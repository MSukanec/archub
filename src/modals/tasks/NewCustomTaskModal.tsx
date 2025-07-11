import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout'
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader'
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody'
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const customTaskSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  unit_id: z.string().min(1, "La unidad es requerida"),
})

type CustomTaskFormData = z.infer<typeof customTaskSchema>

interface NewCustomTaskModalProps {
  open: boolean
  onClose: () => void
  onTaskCreated?: (taskId: string) => void
}

export function NewCustomTaskModal({ open, onClose, onTaskCreated }: NewCustomTaskModalProps) {
  const { toast } = useToast()
  const { data: userData } = useCurrentUser()
  const queryClient = useQueryClient()

  const form = useForm<CustomTaskFormData>({
    resolver: zodResolver(customTaskSchema),
    defaultValues: {
      name: "",
      description: "",
      unit_id: "",
    }
  })

  // Fetch units
  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      if (!supabase) return []
      
      const { data, error } = await supabase
        .from('units')
        .select('id, name, symbol')
        .order('name')

      if (error) throw error
      return data || []
    }
  })

  // Create custom task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (formData: CustomTaskFormData) => {
      if (!supabase || !userData?.user?.id || !userData?.preferences?.last_organization_id) {
        throw new Error('Datos de usuario no disponibles')
      }

      const { data, error } = await supabase
        .from('task_generated')
        .insert({
          name: formData.name,
          description: formData.description || null,
          unit_id: formData.unit_id,
          organization_id: userData.preferences.last_organization_id,
          template_id: null,
          code: `CUSTOM-${Date.now()}`, // Código temporal para tareas personalizadas
          param_values: {},
          is_public: false,
          is_system: false
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast({
        title: "Tarea personalizada creada",
        description: "La tarea se creó correctamente",
      })
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['task-search'] })
      queryClient.invalidateQueries({ queryKey: ['task-generated'] })
      
      // Call callback with task ID
      onTaskCreated?.(data.id)
      
      // Reset form and close
      form.reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error creating custom task:', error)
      toast({
        title: "Error",
        description: "No se pudo crear la tarea personalizada",
        variant: "destructive",
      })
    },
  })

  const handleSubmit = (data: CustomTaskFormData) => {
    createTaskMutation.mutate(data)
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }



  return (
    <CustomModalLayout
      open={open}
      onClose={handleClose}
      children={{
        header: (
          <CustomModalHeader
            title="Crear Tarea Personalizada"
            subtitle="Crea una tarea personalizada para este proyecto"
          />
        ),
        body: (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <CustomModalBody columns={1}>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la Tarea *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: Instalación de ventanas especiales"
                            {...field}
                          />
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
                            placeholder="Descripción detallada de la tarea (opcional)"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidad de Medida *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar unidad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {units?.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.name} ({unit.symbol})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CustomModalBody>
            </form>
          </Form>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleClose}
            onSave={form.handleSubmit(handleSubmit)}
            saveText="Crear Tarea Personalizada"
            saveDisabled={createTaskMutation.isPending}
            saveLoading={createTaskMutation.isPending}
          />
        )
      }}
    />
  )
}