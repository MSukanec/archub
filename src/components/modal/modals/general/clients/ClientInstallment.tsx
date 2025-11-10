import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import { Calendar } from 'lucide-react'
import { FormModalLayout } from '../../../form/FormModalLayout'
import { FormModalHeader } from '../../../form/FormModalHeader'
import { FormModalFooter } from '../../../form/FormModalFooter'
import { useModalPanelStore } from '../../../form/modalPanelStore'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import DatePicker from '@/components/ui-custom/fields/DatePickerField'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/hooks/use-current-user'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

const installmentSchema = z.object({
  date: z.date({
    required_error: 'Selecciona la fecha de vencimiento'
  }),
  number: z.number().min(1, 'El número debe ser mayor a 0'),
  index: z.number().min(0, 'El índice debe ser mayor o igual a 0')
})

type InstallmentForm = z.infer<typeof installmentSchema>

interface ClientInstallmentProps {
  modalData?: {
    projectId?: string
    organizationId?: string
    installmentId?: string
    isEditing?: boolean
    editingInstallment?: any
  }
  onClose: () => void
}

export default function ClientInstallment({ modalData, onClose }: ClientInstallmentProps) {
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { setPanel } = useModalPanelStore()

  const projectId = modalData?.projectId || userData?.preferences?.last_project_id
  const organizationId = modalData?.organizationId || userData?.organization?.id
  const installmentId = modalData?.installmentId
  const isEditing = modalData?.isEditing || !!installmentId
  const editingInstallment = modalData?.editingInstallment

  // Set initial panel based on editing mode
  useEffect(() => {
    if (isEditing) {
      setPanel('view')
    } else {
      setPanel('edit')
    }
  }, [isEditing, setPanel])

  // Get default values based on editing mode
  const getDefaultValues = (): InstallmentForm => {
    if (isEditing && editingInstallment) {
      return {
        date: new Date(editingInstallment.date),
        number: editingInstallment.number,
        index: editingInstallment.index_reference || 0
      }
    }
    return {
      date: new Date(),
      number: 1,
      index: 0
    }
  }

  const form = useForm<InstallmentForm>({
    resolver: zodResolver(installmentSchema),
    defaultValues: getDefaultValues()
  })

  // Mutation to create/update installment
  const saveInstallmentMutation = useMutation({
    mutationFn: async (data: InstallmentForm) => {
      if (!projectId || !organizationId || !supabase) {
        throw new Error('Faltan datos requeridos')
      }

      const installmentData = {
        project_id: projectId,
        organization_id: organizationId,
        number: data.number,
        index_reference: data.index,
        date: data.date.toISOString().split('T')[0] // Solo fecha, sin hora
      }

      if (isEditing && installmentId) {
        // Update existing installment
        const { data: result, error } = await supabase
          .from('project_installments')
          .update(installmentData)
          .eq('id', installmentId)
          .select()

        if (error) {
          console.error('Error updating installment:', error)
          throw new Error('Error actualizando la cuota: ' + error.message)
        }

        return result
      } else {
        // Create new installment
        const { data: result, error } = await supabase
          .from('project_installments')
          .insert([installmentData])
          .select()

        if (error) {
          console.error('Error creating installment:', error)
          throw new Error('Error creando la cuota: ' + error.message)
        }

        return result
      }
    },
    onSuccess: (data) => {
      toast({
        title: isEditing ? "Cuota actualizada" : "Cuota creada",
        description: `La cuota #${data?.[0]?.number} se ${isEditing ? 'actualizó' : 'creó'} exitosamente`,
      })
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['project-installments', projectId] })
      queryClient.invalidateQueries({ queryKey: ['client-monthly-installments', organizationId, projectId] })
      
      // IMPORTANTE: También invalidar la vista de pagos que usa InstallmentHeatmapChart
      queryClient.invalidateQueries({ queryKey: ['movement-payments-view', projectId, organizationId] })
      queryClient.invalidateQueries({ queryKey: ['movement-payments-view'] })
      
      // Invalidar análisis de clientes que también dependen de las cuotas
      queryClient.invalidateQueries({ queryKey: ['client-analysis'] })
      queryClient.invalidateQueries({ queryKey: ['client-payment-details'] })
      queryClient.invalidateQueries({ queryKey: ['client-obligations'] })
      
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Error ${isEditing ? 'actualizando' : 'creando'} la cuota`,
        variant: "destructive",
      })
    }
  })

  const handleSubmit = (data: InstallmentForm) => {
    saveInstallmentMutation.mutate(data)
  }

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Vencimiento</FormLabel>
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

          <FormField
            control={form.control}
            name="index"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Índice de Ajuste</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Ej: 50.00"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  )

  const headerContent = (
    <FormModalHeader
      icon={Calendar}
      title={isEditing ? "Editar Cuota" : "Nueva Cuota"}
      description={isEditing 
        ? "Modifica la fecha de vencimiento y el índice de ajuste de la cuota"
        : "Define una nueva cuota con su fecha de vencimiento e índice de ajuste"}
    />
  )

  const footerContent = (
    <FormModalFooter
      submitText="Guardar Cambios"
      onSubmit={form.handleSubmit(handleSubmit)}
      isSubmitting={saveInstallmentMutation.isPending}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      isEditing={isEditing}
      viewPanel={editPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
    />
  )
}