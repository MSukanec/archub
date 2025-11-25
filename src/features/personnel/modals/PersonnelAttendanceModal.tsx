import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { addDays } from 'date-fns'
import { Calendar, Users, Trash2 } from 'lucide-react'

import { FormModalLayout } from '@/components/modal'
import { FormModalHeader } from '@/components/modal'
import { FormModalFooter } from '@/components/modal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationMembers } from '@/features/organization'
import { useLocation } from 'wouter'
import { 
  useProjectPersonnel, 
  useCreatePersonnelAttendance, 
  useUpdatePersonnelAttendance 
} from '@/features/personnel/hooks'

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

  // Use feature hook to get project personnel
  const { data: projectPersonnel = [], isLoading: personnelLoading } = useProjectPersonnel(
    projectId,
    organizationId
  )

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

  const createAttendance = useCreatePersonnelAttendance()
  const updateAttendance = useUpdatePersonnelAttendance()
  
  // TODO: Create deletePersonnelAttendance service/hook when backend endpoint is available
  // For now, keeping minimal delete placeholder since it's referenced in the footer
  const deleteAttendanceMutation = { isPending: false }

  const handleSubmit = async (data: AttendanceForm) => {
    if (!currentUser?.organization?.id || !projectId) {
      toast({
        title: 'Error',
        description: 'No hay proyecto u organización seleccionada',
        variant: 'destructive'
      })
      return
    }

    try {
      if (isEditing) {
        const workerContactId = modalData?.editingData?.personnelId || attendance.workerId
        const attendanceDate = attendance.day || attendance.created_at?.split('T')[0]
        
        if (!workerContactId || !attendanceDate) {
          throw new Error('No se puede identificar la asistencia a actualizar')
        }

        await updateAttendance.mutateAsync({
          workerContactId,
          attendanceDate,
          data: {
            personnel_id: data.personnel_id,
            attendance_type: data.attendance_type,
            hours_worked: data.hours_worked,
            description: data.description,
          },
        })
      } else {
        const currentMember = membersRef.current.find((m: any) => m.user_id === currentUser.user.id)
        if (!currentMember) {
          throw new Error('No se encontró el miembro de la organización para el usuario actual')
        }

        await createAttendance.mutateAsync({
          personnel_id: data.personnel_id,
          attendance_type: data.attendance_type,
          hours_worked: data.hours_worked,
          description: data.description,
          created_by: currentMember.id,
          project_id: projectId,
          organization_id: currentUser.organization.id,
          created_at: data.attendance_date.toISOString(),
        })
      }
      onClose()
    } catch (error) {
      console.error('Error handling attendance:', error)
    }
  }

  const isLoading = createAttendance.isPending || updateAttendance.isPending

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
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="relative">
                        <Input
                          placeholder="Seleccionar fecha"
                          value={field.value ? format(field.value, 'dd/MM/yyyy', { locale: es }) : ''}
                          className="pr-10 cursor-pointer"
                          readOnly
                        />
                        <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
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