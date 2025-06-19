import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useToast } from '@/hooks/use-toast'
import { CustomModalLayout } from './CustomModalLayout'
import { CustomModalHeader } from './CustomModalHeader'
import { CustomModalBody } from './CustomModalBody'
import { CustomModalFooter } from './CustomModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const createProjectSchema = z.object({
  name: z.string().min(1, 'El nombre del proyecto es requerido').max(100, 'El nombre no puede exceder 100 caracteres'),
  description: z.string().optional(),
  start_date: z.string().min(1, 'La fecha de inicio es requerida'),
  status: z.string().min(1, 'El estado es requerido'),
  budget: z.number().min(0, 'El presupuesto debe ser mayor o igual a 0').optional(),
  team_size: z.number().min(1, 'El tamaño del equipo debe ser al menos 1').optional()
})

type CreateProjectForm = z.infer<typeof createProjectSchema>

interface NewProjectModalProps {
  open: boolean
  onClose: () => void
}

export function NewProjectModal({ open, onClose }: NewProjectModalProps) {
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      description: '',
      start_date: new Date().toISOString().split('T')[0],
      status: 'active',
      budget: 0,
      team_size: 1
    }
  })

  const createProjectMutation = useMutation({
    mutationFn: async (formData: CreateProjectForm) => {
      if (!supabase || !userData?.organization?.id || !userData?.user?.id) {
        throw new Error('Datos de usuario u organización no disponibles')
      }

      // Create project in projects table
      const projectData = {
        name: formData.name,
        description: formData.description || null,
        status: formData.status,
        budget: formData.budget || 0,
        team_size: formData.team_size || 1,
        organization_id: userData.organization.id,
        start_date: formData.start_date,
        progress: 0
      }

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single()

      if (projectError) {
        console.error('Error creating project:', projectError)
        throw projectError
      }

      // Create basic project_data entry if the table exists
      try {
        const { error: projectDataError } = await supabase
          .from('project_data')
          .insert({
            project_id: project.id,
            created_by: userData.user.id,
            updated_by: userData.user.id
          })

        if (projectDataError) {
          // If project_data table doesn't exist or fails, continue anyway
          console.warn('Could not create project_data entry:', projectDataError)
        }
      } catch (error) {
        console.warn('Project_data table might not exist:', error)
      }

      // Update user's last_project_id to select this new project
      const { error: preferencesError } = await supabase
        .from('user_preferences')
        .update({ last_project_id: project.id })
        .eq('user_id', userData.user.id)

      if (preferencesError) {
        console.warn('Could not update user preferences:', preferencesError)
      }

      return project
    },
    onSuccess: (newProject) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      
      toast({
        title: 'Proyecto creado',
        description: `El proyecto "${newProject.name}" se creó exitosamente.`
      })
      
      form.reset()
      onClose()
    },
    onError: (error) => {
      console.error('Error creating project:', error)
      toast({
        title: 'Error al crear proyecto',
        description: 'No se pudo crear el proyecto. Intenta nuevamente.',
        variant: 'destructive'
      })
    }
  })

  const handleSubmit = (data: CreateProjectForm) => {
    createProjectMutation.mutate(data)
  }

  const handleCancel = () => {
    form.reset()
    onClose()
  }

  return (
    <CustomModalLayout open={open} onClose={handleCancel}>
      <CustomModalHeader
        title="Nuevo proyecto"
        description="Crea un nuevo proyecto para tu organización"
        onClose={handleCancel}
      />
      
      <CustomModalBody>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del proyecto</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Torre Residencial Norte"
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
                      placeholder="Descripción breve del proyecto..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de inicio</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="on-hold">En pausa</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Presupuesto (USD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="team_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamaño del equipo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="1"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </CustomModalBody>

      <CustomModalFooter
        onCancel={handleCancel}
        onSubmit={form.handleSubmit(handleSubmit)}
        submitLabel="Crear proyecto"
        disabled={createProjectMutation.isPending || !form.formState.isValid}
      />
    </CustomModalLayout>
  )
}