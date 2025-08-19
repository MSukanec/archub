import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar } from 'lucide-react'
import { FormModalLayout } from '../../../form/FormModalLayout'
import { FormModalHeader } from '../../../form/FormModalHeader'
import { FormModalFooter } from '../../../form/FormModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import DatePicker from '@/components/ui-custom/DatePicker'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/hooks/use-current-user'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { addDays, addMonths, addQuarters } from 'date-fns'

const paymentPlansSchema = z.object({
  installments_count: z.number().min(1, 'Debe haber al menos 1 cuota').max(100, 'Máximo 100 cuotas'),
  frequency: z.enum(['quincenal', 'mensual', 'trimestral'], {
    required_error: 'Selecciona la frecuencia de pago'
  }),
  start_date: z.date({
    required_error: 'Selecciona la fecha de la primera cuota'
  })
})

type PaymentPlansForm = z.infer<typeof paymentPlansSchema>

interface ClientPaymentPlansProps {
  modalData?: {
    projectId?: string
    organizationId?: string
  }
  onClose: () => void
}

export default function ClientPaymentPlans({ modalData, onClose }: ClientPaymentPlansProps) {
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const projectId = modalData?.projectId || userData?.preferences?.last_project_id
  const organizationId = modalData?.organizationId || userData?.organization?.id

  const form = useForm<PaymentPlansForm>({
    resolver: zodResolver(paymentPlansSchema),
    defaultValues: {
      installments_count: 1,
      frequency: 'mensual',
      start_date: new Date()
    }
  })

  // Function to calculate installment dates
  const calculateInstallmentDates = (startDate: Date, frequency: string, count: number) => {
    const dates = []
    let currentDate = new Date(startDate)
    
    for (let i = 0; i < count; i++) {
      dates.push(new Date(currentDate))
      
      // Calculate next date based on frequency
      if (frequency === 'quincenal') {
        currentDate = addDays(currentDate, 15)
      } else if (frequency === 'mensual') {
        currentDate = addMonths(currentDate, 1)
      } else if (frequency === 'trimestral') {
        currentDate = addQuarters(currentDate, 1)
      }
    }
    
    return dates
  }

  // Mutation to create installments
  const createInstallmentsMutation = useMutation({
    mutationFn: async (data: PaymentPlansForm) => {
      if (!projectId || !organizationId || !supabase) {
        throw new Error('Faltan datos requeridos')
      }

      // First, check if installments already exist for this project
      const { data: existingInstallments, error: checkError } = await supabase
        .from('project_installments')
        .select('id')
        .eq('project_id', projectId)
        .eq('organization_id', organizationId)

      if (checkError) {
        console.error('Error checking existing installments:', checkError)
        throw new Error('Error verificando cuotas existentes')
      }

      if (existingInstallments && existingInstallments.length > 0) {
        throw new Error('Ya existen cuotas para este proyecto. Elimine las existentes antes de crear nuevas.')
      }

      // Calculate installment dates
      const installmentDates = calculateInstallmentDates(
        data.start_date, 
        data.frequency, 
        data.installments_count
      )

      // Create installments array
      const installments = []
      for (let i = 1; i <= data.installments_count; i++) {
        installments.push({
          project_id: projectId,
          organization_id: organizationId,
          number: i,
          due_date: installmentDates[i - 1].toISOString(),
          created_by: userData?.user?.id
        })
      }

      // Insert all installments
      const { data: result, error } = await supabase
        .from('project_installments')
        .insert(installments)
        .select()

      if (error) {
        console.error('Error creating installments:', error)
        throw new Error('Error creando las cuotas: ' + error.message)
      }

      return result
    },
    onSuccess: (data) => {
      toast({
        title: "Cuotas creadas",
        description: `Se crearon ${data?.length || 0} cuotas exitosamente`,
      })
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['project-installments', projectId] })
      queryClient.invalidateQueries({ queryKey: ['client-monthly-installments', organizationId, projectId] })
      
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error creando las cuotas",
        variant: "destructive",
      })
    }
  })

  const handleSubmit = (data: PaymentPlansForm) => {
    createInstallmentsMutation.mutate(data)
  }

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frecuencia de Pago</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange} defaultValue="mensual">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la frecuencia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quincenal">Quincenal (cada 15 días)</SelectItem>
                      <SelectItem value="mensual">Mensual</SelectItem>
                      <SelectItem value="trimestral">Trimestral (cada 3 meses)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="installments_count"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cantidad de Cuotas</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="Ej: 12"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Primera Cuota</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Selecciona la fecha"
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p className="font-medium">Resumen del Plan:</p>
            <p>• Se crearán {form.watch('installments_count') || 0} cuotas numeradas del 1 al {form.watch('installments_count') || 0}</p>
            <p>• Frecuencia: {
              form.watch('frequency') === 'quincenal' ? 'Cada 15 días' :
              form.watch('frequency') === 'mensual' ? 'Mensual' :
              form.watch('frequency') === 'trimestral' ? 'Trimestral (cada 3 meses)' : 'No seleccionado'
            }</p>
            <p>• Primera cuota: {form.watch('start_date') ? form.watch('start_date').toLocaleDateString('es-ES') : 'No seleccionada'}</p>
          </div>
        </div>
      </form>
    </Form>
  )

  const headerContent = (
    <FormModalHeader 
      title="Crear Plan de Cuotas"
      description="Configure la frecuencia, cantidad y fecha de inicio para generar automáticamente todas las cuotas del proyecto"
      icon={Calendar}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel="Crear Cuotas"
      onRightClick={form.handleSubmit(handleSubmit)}
      submitDisabled={createInstallmentsMutation.isPending}
      showLoadingSpinner={createInstallmentsMutation.isPending}
    />
  )

  return (
    <FormModalLayout
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
      isEditing={true}
      columns={1}
    />
  )
}