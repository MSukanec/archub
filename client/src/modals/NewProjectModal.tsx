import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Calendar, CalendarDays } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { CustomModalLayout } from '@/components/ui-custom/CustomModalLayout'
import { CustomModalHeader } from '@/components/ui-custom/CustomModalHeader'
import { CustomModalBody } from '@/components/ui-custom/CustomModalBody'
import { CustomModalFooter } from '@/components/ui-custom/CustomModalFooter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectTypes } from '@/hooks/use-project-types'
import { useProjectModalities } from '@/hooks/use-project-modalities'
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { queryClient } from '@/lib/queryClient'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const createProjectSchema = z.object({
  name: z.string().min(1, 'El nombre del proyecto es requerido'),
  status: z.enum(['planning', 'active', 'completed', 'on-hold']),
  project_type_id: z.string().optional(),
  modality_id: z.string().optional(),
  created_by: z.string().min(1, 'El creador es requerido'),
  created_at: z.date()
})

type CreateProjectForm = z.infer<typeof createProjectSchema>

interface Project {
  id: string
  name: string
  status: string
  created_at: string
  created_by: string
  organization_id: string
  is_active: boolean
  project_data?: {
    project_type_id?: string
    modality_id?: string
    project_type?: {
      id: string
      name: string
    }
    modality?: {
      id: string
      name: string
    }
  }
  creator?: {
    id: string
    full_name?: string
    first_name?: string
    last_name?: string
    email: string
    avatar_url?: string
  }
}

interface NewProjectModalProps {
  open: boolean
  onClose: () => void
  editingProject?: Project | null
}

export function NewProjectModal({ open, onClose, editingProject }: NewProjectModalProps) {
  const { data: userData } = useCurrentUser()
  const { data: projectTypes, isLoading: typesLoading } = useProjectTypes()
  const { data: projectModalities, isLoading: modalitiesLoading } = useProjectModalities()
  const { data: organizationMembers } = useOrganizationMembers(userData?.organization?.id)
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      status: 'planning',
      project_type_id: 'none',
      modality_id: 'none',
      created_by: '',
      created_at: new Date()
    }
  })

  // Update form when editing project changes
  useEffect(() => {
    if (editingProject) {
      console.log('Editing project data:', editingProject) // Debug log
      console.log('Project data structure:', editingProject.project_data) // Debug log
      
      form.reset({
        name: editingProject.name,
        status: editingProject.status as any,
        project_type_id: editingProject.project_data?.project_type_id || 'none',
        modality_id: editingProject.project_data?.modality_id || 'none',
        created_by: editingProject.created_by || '',
        created_at: new Date(editingProject.created_at)
      })
    } else {
      form.reset({
        name: '',
        status: 'planning',
        project_type_id: 'none',
        modality_id: 'none',
        created_by: '',
        created_at: new Date()
      })
    }
  }, [editingProject, form])

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (formData: CreateProjectForm) => {
      if (!supabase || !userData?.organization?.id) {
        throw new Error('User not authenticated or no organization selected')
      }

      // Find the user's membership in the current organization
      const currentOrgMembership = userData.memberships?.find(
        membership => membership.organization_id === userData.organization?.id
      )

      if (!currentOrgMembership) {
        console.log('Searching for membership in organization:', userData.organization.id)
        console.log('Available memberships:', userData.memberships)
        throw new Error('No se encontró la membresía del usuario en esta organización')
      }

      // Get the organization_member_id from the organization members table
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', userData.organization.id)
        .eq('user_id', userData.user.id)
        .single()

      if (memberError || !memberData) {
        console.error('Error finding organization member ID:', memberError)
        throw new Error('No se pudo obtener el ID de membresía de la organización')
      }

      const organizationMemberId = memberData.id
      console.log('Found organization member ID:', organizationMemberId)

      if (editingProject) {
        // Update existing project
        const { error: projectError } = await supabase
          .from('projects')
          .update({
            name: formData.name,
            status: formData.status,
            created_at: formData.created_at.toISOString()
          })
          .eq('id', editingProject.id)

        if (projectError) {
          throw projectError
        }

        // Update project_data (always upsert to handle adding/removing)
        const { error: dataError } = await supabase
          .from('project_data')
          .upsert({
            project_id: editingProject.id,
            project_type_id: formData.project_type_id === 'none' ? null : formData.project_type_id || null,
            modality_id: formData.modality_id === 'none' ? null : formData.modality_id || null
          }, {
            onConflict: 'project_id'
          })

        if (dataError) {
          throw dataError
        }

        return { id: editingProject.id, isEdit: true }
      } else {
        // Create new project
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .insert({
            name: formData.name,
            status: formData.status,
            created_by: organizationMemberId,
            organization_id: userData.organization.id,
            is_active: true,
            created_at: formData.created_at.toISOString()
          })
          .select('id')
          .single()

        if (projectError) {
          console.error('Error creating project:', projectError)
          throw projectError
        }

        const projectId = projectData.id

        // Create project_data entry if type or modality provided
        if (formData.project_type_id && formData.project_type_id !== 'none' || formData.modality_id && formData.modality_id !== 'none') {
          const { error: dataError } = await supabase
            .from('project_data')
            .insert({
              project_id: projectId,
              project_type_id: formData.project_type_id === 'none' ? null : formData.project_type_id || null,
              modality_id: formData.modality_id === 'none' ? null : formData.modality_id || null
            })

          if (dataError) {
            console.error('Error creating project data:', dataError)
            throw dataError
          }
        }

        // Update user preferences to select this project
        const { error: prefsError } = await supabase
          .from('user_preferences')
          .update({ last_project_id: projectId })
          .eq('user_id', userData.user.id)

        if (prefsError) {
          console.error('Error updating preferences:', prefsError)
          // Don't throw here, project creation was successful
        }

        return { id: projectId, isEdit: false }
      }
    },
    onSuccess: async (result) => {
      // Invalidate all related queries to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['projects'] })
      await queryClient.invalidateQueries({ queryKey: ['current-user'] })
      
      // Force refetch to ensure UI updates immediately
      if (result.isEdit) {
        await queryClient.refetchQueries({ queryKey: ['projects'] })
      }
      
      toast({
        title: result.isEdit ? 'Proyecto actualizado' : 'Proyecto creado',
        description: result.isEdit 
          ? 'El proyecto se actualizó exitosamente.' 
          : 'El proyecto se creó exitosamente.'
      })
      
      onClose()
    },
    onError: (error) => {
      console.error('Error creating project:', error)
      toast({
        title: 'Error al crear proyecto',
        description: error.message || 'No se pudo crear el proyecto. Intenta nuevamente.',
        variant: 'destructive'
      })
    }
  })

  const handleSubmit = (data: CreateProjectForm) => {
    setLoading(true)
    createProjectMutation.mutate(data, {
      onSettled: () => setLoading(false)
    })
  }

  const getCreatorInfo = () => {
    const creatorName = userData?.user?.full_name || 
      (userData?.user_data?.first_name && userData?.user_data?.last_name 
        ? `${userData.user_data.first_name} ${userData.user_data.last_name}`
        : userData?.user?.email) || 'Usuario'
    
    const creatorInitials = userData?.user?.full_name 
      ? userData.user.full_name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)
      : (userData?.user_data?.first_name && userData?.user_data?.last_name
          ? `${userData.user_data.first_name.charAt(0)}${userData.user_data.last_name.charAt(0)}`
          : userData?.user?.email?.charAt(0).toUpperCase()) || 'U'

    return { name: creatorName, initials: creatorInitials, avatar: userData?.user?.avatar_url || '' }
  }

  const creator = getCreatorInfo()

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      {{
        header: (
          <CustomModalHeader
            title={editingProject ? 'Editar proyecto' : 'Nuevo proyecto'}
            description={editingProject ? 'Actualiza la información del proyecto' : 'Crea un nuevo proyecto para tu organización'}
            onClose={onClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <Form {...form}>
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
                          <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
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
            <FormField
              control={form.control}
              name="created_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Creador</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || 'none'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el creador" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Selecciona un miembro</SelectItem>
                      {organizationMembers?.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={member.users?.avatar_url || ''} />
                              <AvatarFallback className="text-xs">
                                {member.users?.full_name ? member.users.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span>{member.users?.full_name || member.users?.email || 'Usuario'}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nombre del proyecto */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Nombre del proyecto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingresa el nombre del proyecto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipología */}
            <FormField
              control={form.control}
              name="project_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Tipología</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una tipología" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {typesLoading ? (
                        <SelectItem value="loading" disabled>Cargando...</SelectItem>
                      ) : (
                        <>
                          <SelectItem value="none">Sin tipología</SelectItem>
                          {projectTypes?.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Modalidad */}
            <FormField
              control={form.control}
              name="modality_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Modalidad</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una modalidad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {modalitiesLoading ? (
                        <SelectItem value="loading" disabled>Cargando...</SelectItem>
                      ) : (
                        <>
                          <SelectItem value="none">Sin modalidad</SelectItem>
                          {projectModalities?.map((modality) => (
                            <SelectItem key={modality.id} value={modality.id}>
                              {modality.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Estado */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="planning">Planificación</SelectItem>
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
        </CustomModalBody>
      </Form>

      <CustomModalFooter
        cancelLabel="Cancelar"
        submitLabel={loading ? 'Guardando...' : (editingProject ? 'Actualizar' : 'Crear proyecto')}
        onCancel={onClose}
        onSubmit={() => form.handleSubmit(handleSubmit)()}
        disabled={loading || createProjectMutation.isPending}
      />
    </CustomModalLayout>
  )
}