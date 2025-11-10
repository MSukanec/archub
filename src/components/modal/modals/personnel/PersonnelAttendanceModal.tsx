import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { addDays } from 'date-fns'
import { Calendar, Users, Trash2 } from 'lucide-react'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import DatePickerField from '@/components/ui-custom/fields/DatePickerField'
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { useLocation } from 'wouter'

const attendanceSchema = z.object({
  attendance_date: z.date({
    required_error: 'La fecha es requerida'
  }),
  personnel_id: z.string().uuid('Selecciona personal'),
  attendance_type: z.string().min(1, 'Selecciona el tipo de horario'),
  hours_worked: z.number().min(0.5, 'Las horas deben ser al menos 0.5').max(24, 'Las horas no pueden ser más de 24'),
  description: z.string().optional()
})

type AttendanceForm = z.infer<typeof attendanceSchema>

interface PersonnelAttendanceModalProps {
  modalData?: {
    attendance?: any
    mode?: 'create' | 'edit'
    isEditing?: boolean
    editingData?: {
      personnelId: string
      contactName: string
      attendanceDate: Date
      existingRecord?: any
    }
  }
  onClose: () => void
}

export function PersonnelAttendanceModal({ modalData, onClose }: PersonnelAttendanceModalProps) {
  const { toast } = useToast()
  const { data: currentUser } = useCurrentUser()
  const organizationId = currentUser?.organization?.id
  const projectId = currentUser?.preferences?.last_project_id
  const queryClient = useQueryClient()
  const [, navigate] = useLocation()

  // Get project personnel only
  const { data: projectPersonnel = [], isLoading: personnelLoading } = useQuery({
    queryKey: ['project-personnel', projectId],
    queryFn: async () => {
      if (!projectId || !supabase) return [];
      
      const { data, error } = await supabase
        .from('project_personnel')
        .select(`
          id,
          contact_id,
          contact:contacts (
            id,
            first_name,
            last_name
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId
  })

  // Get organization members (siguiendo patrón de SiteLogModal)
  const { data: members = [] } = useOrganizationMembers(organizationId)
  
  // Mantener referencia actualizada de members para evitar stale closures
  const membersRef = React.useRef(members)
  React.useEffect(() => {
    membersRef.current = members
  }, [members])

  const isEditing = modalData?.isEditing || (modalData?.mode === 'edit' && modalData?.attendance)
  const attendance = modalData?.attendance || modalData?.editingData?.existingRecord



  const form = useForm<AttendanceForm>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      attendance_date: modalData?.editingData?.attendanceDate || (isEditing && attendance?.created_at ? new Date(attendance.created_at) : new Date()),
      personnel_id: modalData?.editingData?.personnelId || attendance?.personnel_id || '',
      attendance_type: attendance?.attendance_type || 'full', // Preseleccionar "Jornada Completa"
      hours_worked: attendance?.hours_worked || 8,
      description: attendance?.description || ''
    }
  })

  // Reset form when attendance data changes (for editing)
  React.useEffect(() => {
    if (isEditing && attendance) {
      // The workerId from the gradebook is actually a contact_id, we need to find the corresponding project_personnel id
      const workerContactId = modalData?.editingData?.personnelId || attendance.workerId || attendance.personnel_id || ''
      
      // Find the project_personnel record that matches this contact_id
      const matchingPersonnel = projectPersonnel.find((p: any) => p.contact?.id === workerContactId)
      const actualPersonnelId = matchingPersonnel?.id || ''
      
      // Fix date handling - ensure we use the correct date
      const attendanceDate = attendance.day ? new Date(attendance.day + 'T00:00:00') : 
                             (attendance.created_at ? new Date(attendance.created_at) : new Date())
      
      const mappedData = {
        attendance_date: attendanceDate,
        personnel_id: actualPersonnelId, // Use the correct project_personnel ID
        attendance_type: attendance.status || attendance.attendance_type || 'full',
        hours_worked: attendance.hours_worked || (attendance.status === 'half' ? 4 : 8),
        description: attendance.description || ''
      }
      

      
      form.reset(mappedData)
    }
  }, [attendance, isEditing, form, modalData, projectPersonnel])

  const createAttendanceMutation = useMutation({
    mutationFn: async (data: AttendanceForm) => {
      if (!supabase) throw new Error('Supabase not initialized')
      if (!currentUser?.organization?.id || !currentUser?.preferences?.last_project_id) {
        throw new Error('No hay proyecto u organización seleccionada')
      }
      
      // Obtener el organization_member.id del usuario actual (siguiendo patrón de SiteLogModal)
      // Usar membersRef.current para obtener el valor más reciente
      const currentMember = membersRef.current.find((m: any) => m.user_id === currentUser.user.id)
      if (!currentMember) {
        throw new Error('No se encontró el miembro de la organización para el usuario actual')
      }
      
      const { error } = await supabase
        .from('personnel_attendees')
        .insert({
          site_log_id: null, // Como especificaste, esto es null
          personnel_id: data.personnel_id, // Ahora usa el ID de project_personnel
          attendance_type: data.attendance_type,
          hours_worked: data.hours_worked,
          description: data.description,
          created_by: currentMember.id, // Usar el ID del organization member
          project_id: projectId,
          organization_id: currentUser.organization.id, // Nueva columna requerida
          created_at: data.attendance_date.toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['construction-attendance'] })
      toast({
        title: 'Asistencia registrada',
        description: 'La asistencia se ha registrado correctamente'
      })
      onClose()
    },
    onError: (error) => {
      console.error('Error creating attendance:', error)
      toast({
        title: 'Error',
        description: 'No se pudo registrar la asistencia',
        variant: 'destructive'
      })
    }
  })

  const updateAttendanceMutation = useMutation({
    mutationFn: async (data: AttendanceForm) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      // Ensure personnel_id is valid
      if (!data.personnel_id || data.personnel_id === 'undefined') {
        throw new Error('ID de personal requerido')
      }
      
      // Use the correct record identification - for gradebook we need to find by date and personnel
      const workerContactId = modalData?.editingData?.personnelId || attendance.workerId
      const attendanceDate = attendance.day || attendance.created_at?.split('T')[0]
      
      if (!workerContactId || !attendanceDate) {
        throw new Error('No se puede identificar la asistencia a actualizar')
      }
      
      const { error } = await supabase
        .from('personnel_attendees')
        .update({
          personnel_id: data.personnel_id,
          attendance_type: data.attendance_type,
          hours_worked: data.hours_worked,
          description: data.description,
          updated_at: new Date().toISOString()
        })
        .eq('personnel_id', workerContactId)
        .gte('created_at', attendanceDate)
        .lt('created_at', new Date(new Date(attendanceDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['construction-attendance'] })
      toast({
        title: 'Asistencia actualizada',
        description: 'La asistencia se ha actualizada correctamente'
      })
      onClose()
    },
    onError: (error) => {
      console.error('Error updating attendance:', error)
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la asistencia',
        variant: 'destructive'
      })
    }
  })

  // Delete attendance mutation
  const deleteAttendanceMutation = useMutation({
    mutationFn: async () => {
      if (!supabase) throw new Error('Supabase no inicializado')
      
      // For the gradebook structure, we need to find and delete the actual attendance record
      const personnelId = modalData?.editingData?.personnelId || attendance?.workerId
      const attendanceDate = modalData?.editingData?.attendanceDate || attendance?.day
      
      if (!personnelId || !attendanceDate) throw new Error('No se puede identificar la asistencia a eliminar')
      
      const { error } = await supabase
        .from('personnel_attendees')
        .delete()
        .eq('personnel_id', personnelId)
        .eq('created_at', new Date(attendanceDate).toISOString().split('T')[0])
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] })
      queryClient.invalidateQueries({ queryKey: ['project-attendances'] })
      queryClient.invalidateQueries({ queryKey: ['project-personnel-attendances'] })
      toast({
        title: 'Asistencia eliminada',
        description: 'La asistencia se ha eliminado correctamente'
      })
      onClose()
    },
    onError: (error) => {
      console.error('Error deleting attendance:', error)
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la asistencia',
        variant: 'destructive'
      })
    }
  })

  const handleDelete = () => {
    if (confirm('¿Estás seguro de que quieres eliminar esta asistencia? Esta acción no se puede deshacer.')) {
      deleteAttendanceMutation.mutate()
    }
  }

  const handleSubmit = (data: AttendanceForm) => {
    if (isEditing) {
      updateAttendanceMutation.mutate(data)
    } else {
      createAttendanceMutation.mutate(data)
    }
  }

  const isLoading = createAttendanceMutation.isPending || updateAttendanceMutation.isPending

  const attendanceTypes = [
    { value: 'full', label: 'Jornada Completa' },
    { value: 'half', label: 'Media Jornada' }
  ]

  const viewPanel = (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Vista de solo lectura - Usa el botón editar para modificar
      </div>
    </div>
  )

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Fecha y Personal - Inline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="attendance_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha</FormLabel>
                <FormControl>
                  <DatePickerField
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Seleccionar fecha"
                    disableFuture={true}
                    minDate={new Date("1900-01-01")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="personnel_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Personal</FormLabel>
                {projectPersonnel.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No hay personal asignado</h3>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Necesitas asignar personal al proyecto antes de registrar asistencia
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate('/construction/personnel');
                      }}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                      Gestionar Personal
                    </button>
                  </div>
                ) : (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar personal..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projectPersonnel
                        .filter((personnel: any) => personnel.contact && !Array.isArray(personnel.contact))
                        .map((personnel: any) => (
                        <SelectItem key={personnel.id} value={personnel.id}>
                          {personnel.contact.first_name || 'Sin nombre'} {personnel.contact.last_name || ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Solo mostrar el resto del formulario si hay personal disponible */}
        {projectPersonnel.length > 0 && (
          <>
        {/* Horario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="attendance_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horario</FormLabel>
                <Select onValueChange={(value) => {
                  field.onChange(value)
                  // Auto-set hours based on attendance type
                  if (value === 'full') form.setValue('hours_worked', 8)
                  else if (value === 'half') form.setValue('hours_worked', 4)
                }} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar horario" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {attendanceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
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
            name="hours_worked"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horas trabajadas</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Descripción */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detalles adicionales sobre la asistencia..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


          </>
        )}
      </form>
    </Form>
  )

  const headerContent = (
    <FormModalHeader
      title={isEditing ? "Editar Asistencia" : "Registrar Asistencia"}
      icon={Users}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      middleLabel={isEditing && attendance ? "Eliminar" : undefined}
      onMiddleClick={isEditing && attendance ? handleDelete : undefined}
      middleVariant="destructive"
      middleDisabled={deleteAttendanceMutation.isPending}
      rightLabel={isEditing ? "Guardar Cambios" : "Registrar Asistencia"}
      onRightClick={form.handleSubmit(handleSubmit)}
      submitDisabled={isLoading}
      showLoadingSpinner={isLoading}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
      isEditing={true}
    />
  )
}