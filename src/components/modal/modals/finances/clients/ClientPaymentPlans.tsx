import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, X } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Crear Plan de Cuotas</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="p-4 space-y-4">
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

            {/* Footer */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createInstallmentsMutation.isPending}
                className="flex-1"
              >
                {createInstallmentsMutation.isPending ? 'Creando...' : 'Crear Cuotas'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}