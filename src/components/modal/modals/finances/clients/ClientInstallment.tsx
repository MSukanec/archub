import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar } from 'lucide-react'
import { FormModalLayout } from '../../../form/FormModalLayout'
import { FormModalHeader } from '../../../form/FormModalHeader'
import { FormModalFooter } from '../../../form/FormModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import DatePicker from '@/components/ui-custom/DatePicker'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/hooks/use-current-user'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

const installmentSchema = z.object({
  due_date: z.date({
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
  }
  onClose: () => void
}

export default function ClientInstallment({ modalData, onClose }: ClientInstallmentProps) {
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const projectId = modalData?.projectId || userData?.preferences?.last_project_id
  const organizationId = modalData?.organizationId || userData?.organization?.id

  const form = useForm<InstallmentForm>({
    resolver: zodResolver(installmentSchema),
    defaultValues: {
      due_date: new Date(),
      number: 1,
      index: 0
    }
  })

  // Mutation to create installment
  const createInstallmentMutation = useMutation({
    mutationFn: async (data: InstallmentForm) => {
      if (!projectId || !organizationId || !supabase) {
        throw new Error('Faltan datos requeridos')
      }

      // Create single installment
      const installmentData = {
        project_id: projectId,
        organization_id: organizationId,
        number: data.number,
        index: data.index,
        due_date: data.due_date.toISOString(),
        created_by: userData?.user?.id
      }

      const { data: result, error } = await supabase
        .from('project_installments')
        .insert([installmentData])
        .select()

      if (error) {
        console.error('Error creating installment:', error)
        throw new Error('Error creando la cuota: ' + error.message)
      }

      return result
    },
    onSuccess: (data) => {
      toast({
        title: "Cuota creada",
        description: `La cuota #${data?.[0]?.number} se creó exitosamente`,
      })
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['project-installments', projectId] })
      queryClient.invalidateQueries({ queryKey: ['client-monthly-installments', organizationId, projectId] })
      
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error creando la cuota",
        variant: "destructive",
      })
    }
  })

  const handleSubmit = (data: InstallmentForm) => {
    createInstallmentMutation.mutate(data)
  }

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Vencimiento</FormLabel>
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

          <FormField
            control={form.control}
            name="number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Cuota</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Ej: 1"
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
            name="index"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Índice</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Ej: 0"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
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
      title="Nueva Cuota"
      description="Crea una cuota individual para el proyecto con fecha de vencimiento específica"
      icon={Calendar}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel="Crear Cuota"
      onRightClick={form.handleSubmit(handleSubmit)}
      submitDisabled={createInstallmentMutation.isPending}
      showLoadingSpinner={createInstallmentMutation.isPending}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      isEditing={true}
      viewPanel={editPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
    />
  )
}