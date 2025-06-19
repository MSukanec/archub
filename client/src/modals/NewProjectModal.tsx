import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useToast } from '@/hooks/use-toast'
import { CustomModalLayout } from '@/components/ui-custom/CustomModalLayout'
import { CustomModalHeader } from '@/components/ui-custom/CustomModalHeader'
import { CustomModalBody } from '@/components/ui-custom/CustomModalBody'
import { CustomModalFooter } from '@/components/ui-custom/CustomModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

const createProjectSchema = z.object({
  name: z.string().min(1, 'El nombre del proyecto es requerido').max(100, 'El nombre no puede exceder 100 caracteres'),
  status: z.enum(['planning', 'active', 'completed'], { required_error: 'El estado es requerido' }),
  created_at: z.string().min(1, 'La fecha de creación es requerida')
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
      status: 'planning',
      created_at: new Date().toISOString().split('T')[0]
    }
  })

  const createProjectMutation = useMutation({
    mutationFn: async (formData: CreateProjectForm) => {
      if (!supabase || !userData?.organization?.id || !userData?.user?.id) {
        throw new Error('Datos de usuario u organización no disponibles')
      }

      // Get the organization member ID for the current user
      const orgMemberId = userData.memberships?.find(
        m => m.organization_id === userData.organization.id
      )?.id

      if (!orgMemberId) {
        throw new Error('No se encontró la membresía del usuario en la organización')
      }

      // Create project in projects table
      const projectData = {
        name: formData.name,
        status: formData.status,
        is_active: true,
        organization_id: userData.organization.id,
        created_at: formData.created_at,
        created_by: orgMemberId
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

      // Create project_data entry
      try {
        const { error: projectDataError } = await supabase
          .from('project_data')
          .insert({
            project_id: project.id,
            created_by: orgMemberId,
            updated_by: orgMemberId
          })

        if (projectDataError) {
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

  // Get user display info
  const userDisplayName = userData?.user_data?.first_name && userData?.user_data?.last_name 
    ? `${userData.user_data.first_name} ${userData.user_data.last_name}`
    : userData?.user?.email || 'Usuario'
  
  const userInitials = userData?.user_data?.first_name && userData?.user_data?.last_name
    ? `${userData.user_data.first_name.charAt(0)}${userData.user_data.last_name.charAt(0)}`
    : userData?.user?.email?.charAt(0).toUpperCase() || 'U'

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
              name="created_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-muted-foreground">
                    Fecha de creación
                  </FormLabel>
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

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Miembro creador
              </label>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md border">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userData?.user?.avatar_url || ''} />
                  <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{userDisplayName}</span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-muted-foreground">
                    Nombre del proyecto
                  </FormLabel>
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-muted-foreground">
                    Estado
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="planning">Planificación</SelectItem>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="completed">Completado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CustomModalBody>

      <CustomModalFooter
        onCancel={handleCancel}
        onSubmit={form.handleSubmit(handleSubmit)}
        submitText="Crear proyecto"
        isSubmitting={createProjectMutation.isPending}
        submitDisabled={!form.formState.isValid}
      />
    </CustomModalLayout>
  )
}