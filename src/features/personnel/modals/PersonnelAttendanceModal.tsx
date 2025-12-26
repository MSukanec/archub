import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Users } from 'lucide-react'
import { FormModalLayout, FormModalHeader, FormModalFooter } from '@/components/modal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { formatDateForDB, parseLocalDate } from '@/lib/date-utils'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationMembers } from '@/features/organization'
import { 
  useProjectPersonnel, 
  useCreatePersonnelAttendance, 
  useUpdatePersonnelAttendance 
} from '@/features/personnel/hooks'
import { logActivity, ACTIVITY_ACTIONS, TARGET_TABLES } from '@/utils/logActivity'
const attendanceSchema = z.object({
  attendance_date: z.date({
    required_error: 'La fecha es requerida'
  }),
  personnel_id: z.string().uuid('Personal requerido'),
  attendance_type: z.string().min(1, 'Selecciona el tipo de asistencia'),
  description: z.string().optional()
})
type AttendanceForm = z.infer<typeof attendanceSchema>
interface PersonnelAttendanceModalProps {
  modalData?: {
    attendance?: any
    mode?: 'create'| 'edit'
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
  // Use feature hook to get project personnel
  const { data: projectPersonnel = [] } = useProjectPersonnel(
    projectId,
    organizationId
  )
  // Get organization members (siguiendo patrón de SiteLogModal)
  const { data: members = [] } = useOrganizationMembers(organizationId)
  
  // Mantener referencia actualizada de members para evitar stale closures
  const membersRef = useRef(members)
  useEffect(() => {
    membersRef.current = members
  }, [members])
  const attendance = modalData?.attendance || modalData?.editingData?.existingRecord
  // Check if there's actually an existing attendance record (not just editing mode)
  const hasExistingRecord = attendance && (attendance.day || attendance.id || attendance.workerId)
  const isCreatingNew = !hasExistingRecord
  const isEditing = modalData?.isEditing || (modalData?.mode === 'edit'&& hasExistingRecord)
  // Get the personnel_id from editingData (contact_id) and map to project_personnel.id
  const getPersonnelIdFromContactId = (contactId: string | undefined) => {
    if (!contactId) return ''
    const matchingPersonnel = projectPersonnel.find((p: any) => p.contact?.id === contactId)
    return matchingPersonnel?.id || ''
  }
  const form = useForm<AttendanceForm>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      attendance_date: modalData?.editingData?.attendanceDate || (isEditing && attendance?.created_at ? new Date(attendance.created_at) : new Date()),
      personnel_id: getPersonnelIdFromContactId(modalData?.editingData?.personnelId) || attendance?.personnel_id || '',
      attendance_type: attendance?.attendance_type || attendance?.status || 'full',
      description: attendance?.description || ''
    }
  })
  // Reset form when attendance data changes (for editing) or when projectPersonnel loads
  useEffect(() => {
    if (projectPersonnel.length > 0) {
      const workerContactId = modalData?.editingData?.personnelId || attendance?.workerId || attendance?.personnel_id || ''
      const matchingPersonnel = projectPersonnel.find((p: any) => p.contact?.id === workerContactId)
      const actualPersonnelId = matchingPersonnel?.id || ''
      
      // Use parseLocalDate for proper timezone handling
      const attendanceDate = attendance?.day ? parseLocalDate(attendance.day) : 
                             modalData?.editingData?.attendanceDate ||
                             (attendance?.created_at ? parseLocalDate(attendance.created_at) : new Date())
      
      const mappedData = {
        attendance_date: attendanceDate || new Date(),
        personnel_id: actualPersonnelId,
        attendance_type: attendance?.status || attendance?.attendance_type || 'full',
        description: attendance?.description || ''
      }
      
      form.reset(mappedData)
    }
  }, [attendance, isEditing, form, modalData, projectPersonnel])
  const createAttendance = useCreatePersonnelAttendance()
  const updateAttendance = useUpdatePersonnelAttendance()
  // Calculate hours worked based on attendance type
  const getHoursWorked = (type: string) => {
    switch (type) {
      case 'full': return 8
      case 'half': return 4
      case 'absent': return 0
      case 'sick': return 0
      default: return 8
    }
  }
  const handleSubmit = async (data: AttendanceForm) => {
    if (!currentUser?.organization?.id || !projectId) {
      toast({
        title: 'Error',
        description: 'No hay proyecto u organización seleccionada',
        variant: 'destructive'
      })
      return
    }
    const hoursWorked = getHoursWorked(data.attendance_type)
    try {
      // Use formatDateForDB to avoid timezone issues
      const workDate = formatDateForDB(data.attendance_date)
      
      if (hasExistingRecord) {
        const workerContactId = modalData?.editingData?.personnelId || attendance?.workerId
        const attendanceDate = attendance?.day || workDate
        
        if (!workerContactId || !attendanceDate) {
          throw new Error('No se puede identificar la asistencia a actualizar')
        }
        await updateAttendance.mutateAsync({
          workerContactId,
          attendanceDate,
          data: {
            personnel_id: data.personnel_id,
            attendance_type: data.attendance_type,
            hours_worked: hoursWorked,
            description: data.description,
          },
        })
      } else {
        const currentMember = membersRef.current.find((m: any) => m.user_id === currentUser.user.id)
        if (!currentMember) {
          throw new Error('No se encontró el miembro de la organización para el usuario actual')
        }
        
        const result = await createAttendance.mutateAsync({
          personnel_id: data.personnel_id,
          attendance_type: data.attendance_type,
          hours_worked: hoursWorked,
          description: data.description,
          created_by: currentMember.id,
          project_id: projectId,
          organization_id: currentUser.organization.id,
          work_date: workDate,
        })
        const personnelName = getContactName()
        await logActivity({
          organization_id: currentUser.organization.id,
          user_id: currentUser.user.id,
          action: ACTIVITY_ACTIONS.REGISTER_ATTENDANCE,
          target_table: TARGET_TABLES.PERSONNEL_ATTENDANCE,
          target_id: result?.id || data.personnel_id,
          metadata: { 
            personnel_name: personnelName, 
            attendance_type: data.attendance_type,
            date: workDate
          }
        })
      }
      onClose()
    } catch (error: any) {
      console.error('Error handling attendance:', error)
      console.error('Error message:', error?.message)
      console.error('Error stack:', error?.stack)
    }
  }
  const isLoading = createAttendance.isPending || updateAttendance.isPending
  const attendanceTypes = [
    { value: 'full', label: 'Jornada Completa'},
    { value: 'half', label: 'Media Jornada'},
    { value: 'absent', label: 'Ausente'},
    { value: 'sick', label: 'Enfermedad/Accidente'}
  ]
  const viewPanel = (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Vista de solo lectura - Usa el botón editar para modificar
      </div>
    </div>
  )
  // Get the contact name for display
  const getContactName = () => {
    const personnelId = form.watch('personnel_id')
    const personnel = projectPersonnel.find((p: any) => p.id === personnelId)
    if (personnel?.contact) {
      return `${personnel.contact.first_name || ''} ${personnel.contact.last_name || ''}`.trim() || 'Sin nombre'
    }
    return modalData?.editingData?.contactName || 'Personal'
  }
  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Show contact name as info */}
        {modalData?.editingData?.contactName && (
          <div className="text-sm text-muted-foreground mb-2">
            Asistencia para: <span className="font-medium text-foreground">{getContactName()}</span>
          </div>
        )}
        {/* Fecha y Asistencia - Inline */}
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
            name="attendance_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asistencia</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
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
      </form>
    </Form>
  )
  const headerContent = (
    <FormModalHeader
      title={isCreatingNew ? "Registrar Asistencia" : "Editar Asistencia"}
      description="Registra la asistencia del personal al proyecto para el seguimiento de jornadas laborales."
      icon={Users}
    />
  )
  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isCreatingNew ? "Registrar Asistencia" : "Guardar Cambios"}
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