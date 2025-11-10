import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, AlertTriangle } from 'lucide-react'
import { FormModalLayout } from '../../../form/FormModalLayout'
import { FormModalHeader } from '../../../form/FormModalHeader'
import { FormModalFooter } from '../../../form/FormModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import DatePicker from '@/components/ui-custom/fields/DatePickerField'
import { Callout } from '@/components/ui-custom/general/Callout'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/hooks/use-current-user'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { addDays, addMonths, addQuarters } from 'date-fns'

const paymentPlansSchema = z.object({
  payment_plan_id: z.string({
    required_error: 'Selecciona el tipo de plan de pagos'
  }),
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
    existingPaymentPlan?: any
  }
  onClose: () => void
}

export default function ClientPaymentPlans({ modalData, onClose }: ClientPaymentPlansProps) {
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const projectId = modalData?.projectId || userData?.preferences?.last_project_id
  const organizationId = modalData?.organizationId || userData?.organization?.id
  const existingPaymentPlan = modalData?.existingPaymentPlan
  const isChangingPlan = !!existingPaymentPlan

  // Get current member ID for created_by field
  const { data: currentMember } = useQuery({
    queryKey: ['current-member', organizationId, userData?.user?.id],
    queryFn: async () => {
      if (!userData?.user?.id || !organizationId) return null;
      
      if (!supabase) return null;
      
      const { data, error } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', userData.user.id)
        .single();

      if (error) {
        return null;
      }

      return data;
    },
    enabled: !!userData?.user?.id && !!organizationId
  });

  // Fetch available payment plans
  const { data: paymentPlans = [], isLoading: paymentPlansLoading } = useQuery({
    queryKey: ['payment-plans'],
    queryFn: async () => {
      if (!supabase) return []
      
      const { data, error } = await supabase
        .from('payment_plans')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        return []
      }

      return data || []
    }
  })

  const form = useForm<PaymentPlansForm>({
    resolver: zodResolver(paymentPlansSchema),
    defaultValues: {
      payment_plan_id: '',
      installments_count: 1,
      frequency: 'mensual',
      start_date: new Date()
    }
  })

  // Get selected payment plan for description
  const selectedPaymentPlan = paymentPlans.find(plan => plan.id === form.watch('payment_plan_id'))

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

      if (!currentMember?.id) {
        throw new Error('No se pudo obtener el ID del miembro de la organización')
      }

      // If changing plan, delete existing installments and payment plan
      if (isChangingPlan) {
        // Delete existing project payment plan
        const { error: deletePaymentPlanError } = await supabase
          .from('project_payment_plans')
          .delete()
          .eq('project_id', projectId)

        if (deletePaymentPlanError) {
          throw new Error('Error eliminando plan de pagos existente')
        }

        // Delete existing installments
        const { error: deleteInstallmentsError } = await supabase
          .from('project_installments')
          .delete()
          .eq('project_id', projectId)
          .eq('organization_id', organizationId)

        if (deleteInstallmentsError) {
          throw new Error('Error eliminando cuotas existentes')
        }
      } else {
        // First, check if installments already exist for this project
        const { data: existingInstallments, error: checkError } = await supabase
          .from('project_installments')
          .select('id')
          .eq('project_id', projectId)
          .eq('organization_id', organizationId)

        if (checkError) {
          throw new Error('Error verificando cuotas existentes')
        }

        if (existingInstallments && existingInstallments.length > 0) {
          throw new Error('Ya existen cuotas para este proyecto. Elimine las existentes antes de crear nuevas.')
        }
      }

      // First create the project payment plan record
      const { data: projectPaymentPlan, error: paymentPlanError } = await supabase
        .from('project_payment_plans')
        .insert({
          project_id: projectId,
          payment_plan_id: data.payment_plan_id,
          installments_count: data.installments_count,
          frequency: data.frequency
        })
        .select()
        .single()

      if (paymentPlanError) {
        throw new Error('Error creando el plan de pagos: ' + paymentPlanError.message)
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
          date: installmentDates[i - 1].toISOString().split('T')[0], // Solo fecha, sin hora
          project_payment_plan: projectPaymentPlan.id, // ID del registro en project_payment_plans
          created_by: currentMember?.id // ID del miembro de la organización
        })
      }

      // Insert all installments
      const { data: result, error } = await supabase
        .from('project_installments')
        .insert(installments)
        .select()

      if (error) {
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
      queryClient.invalidateQueries({ queryKey: ['project-payment-plan', projectId] })
      
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
        {isChangingPlan && (
          <Callout 
            icon={AlertTriangle}
            title="Cambio de Plan de Pagos"
            className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20"
          >
            Al crear un nuevo plan de pagos se eliminará el plan actual y todas las cuotas existentes. Esta acción no se puede deshacer.
          </Callout>
        )}
        
        <div className="space-y-6">
          {/* Primera fila: Tipo - Frecuencia */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="payment_plan_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Plan de Pagos</FormLabel>
                  <FormControl>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                      disabled={paymentPlansLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentPlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
          </div>

          {/* Segunda fila: Cantidad - Fecha */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                    <DatePickerField
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
          </div>
          
          {/* Resumen del Plan */}
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p className="font-medium">Resumen del Plan:</p>
            {selectedPaymentPlan && (
              <p className="mb-2 text-foreground">
                <span className="font-medium">{selectedPaymentPlan.name}:</span> {selectedPaymentPlan.description}
              </p>
            )}
            <p>• Se crearán {form.watch('installments_count') || 0} cuotas numeradas del 1 al {form.watch('installments_count') || 0}</p>
            <p>• Frecuencia: {
              form.watch('frequency') === 'quincenal' ? 'Cada 15 días' :
              form.watch('frequency') === 'mensual' ? 'Mensual' :
              form.watch('frequency') === 'trimestral' ? 'Trimestral (cada 3 meses)' : 'No seleccionado'
            }</p>
            <p>• Primera cuota: {form.watch('start_date') ? form.watch('start_date').toLocaleDateString('es-ES') : 'No seleccionada'}</p>
            {form.watch('start_date') && form.watch('installments_count') && (
              <p>• Última cuota: {(() => {
                const startDate = form.watch('start_date');
                const count = form.watch('installments_count');
                const frequency = form.watch('frequency');
                if (!startDate || !count) return 'No calculada';
                
                const lastDate = new Date(startDate);
                const monthsToAdd = frequency === 'quincenal' ? Math.floor((count - 1) * 0.5) : 
                                  frequency === 'mensual' ? (count - 1) : 
                                  frequency === 'trimestral' ? (count - 1) * 3 : 0;
                const daysToAdd = frequency === 'quincenal' ? ((count - 1) % 2) * 15 : 0;
                
                lastDate.setMonth(lastDate.getMonth() + monthsToAdd);
                lastDate.setDate(lastDate.getDate() + daysToAdd);
                
                return lastDate.toLocaleDateString('es-ES');
              })()}</p>
            )}
          </div>
        </div>
      </form>
    </Form>
  )

  const headerContent = (
    <FormModalHeader 
      title={isChangingPlan ? "Cambiar Plan de Pagos" : "Crear Plan de Pagos"}
      description={isChangingPlan 
        ? "Modifica el plan de pagos actual. Se eliminará el plan anterior y se crearán nuevas cuotas."
        : "Configure el tipo de plan, frecuencia, cantidad y fecha de inicio para generar automáticamente todas las cuotas del proyecto"
      }
      icon={Calendar}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isChangingPlan ? "Cambiar Plan" : "Crear Cuotas"}
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