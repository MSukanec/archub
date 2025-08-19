import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar } from 'lucide-react'
import { FormModalLayout } from '../../../form/FormModalLayout'
import { FormModalHeader } from '../../../form/FormModalHeader'
import { FormModalFooter } from '../../../form/FormModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/hooks/use-current-user'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

const paymentPlansSchema = z.object({
  installments_count: z.number().min(1, 'Debe haber al menos 1 cuota').max(100, 'Máximo 100 cuotas')
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
      installments_count: 1
    }
  })

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

      // Create installments array
      const installments = []
      for (let i = 1; i <= data.installments_count; i++) {
        installments.push({
          project_id: projectId,
          organization_id: organizationId,
          number: i,
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
          
          <div className="text-sm text-muted-foreground">
            Se crearán {form.watch('installments_count') || 0} cuotas numeradas del 1 al {form.watch('installments_count') || 0}.
          </div>
        </div>
      </form>
    </Form>
  )

  const headerContent = (
    <FormModalHeader 
      title="Crear Plan de Cuotas"
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
      viewPanel={null}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
      isEditing={true}
    />
  )
}