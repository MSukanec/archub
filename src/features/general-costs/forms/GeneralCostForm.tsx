import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Receipt } from 'lucide-react'

import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { useCurrentUser } from '@/hooks/use-current-user'
import { useToast } from '@/hooks/use-toast'
import { useOrganizationMembers } from '@/features/organization'
import { useCreateGeneralCost } from '../hooks/use-create-general-cost'
import { useUpdateGeneralCost } from '../hooks/use-update-general-cost'
import { useGeneralCost } from '../hooks/use-general-cost'
import { generalCostSchema, type GeneralCostFormData } from '../schemas'

interface GeneralCostFormProps {
  modalData?: {
    organizationId?: string
    generalCostId?: string
  }
  onClose: () => void
  mode?: 'create' | 'edit'
}

export default function GeneralCostForm({ modalData, onClose, mode = 'create' }: GeneralCostFormProps) {
  const { toast } = useToast()
  const { data: userData } = useCurrentUser()

  const organizationId = modalData?.organizationId || userData?.organization?.id

  const { data: members = [] } = useOrganizationMembers(organizationId || undefined)
  const { data: existingGeneralCost, isLoading } = useGeneralCost(
    mode === 'edit' ? modalData?.generalCostId || null : null
  )

  const form = useForm<GeneralCostFormData>({
    resolver: zodResolver(generalCostSchema),
    defaultValues: { name: '', description: '' }
  })

  useEffect(() => {
    if (existingGeneralCost) {
      form.reset({
        name: existingGeneralCost.name || '',
        description: existingGeneralCost.description || ''
      })
    }
  }, [existingGeneralCost, form])

  const createMutation = useCreateGeneralCost()
  const updateMutation = useUpdateGeneralCost()

  const onSubmit = async (data: GeneralCostFormData) => {
    if (!organizationId) {
      toast({
        title: 'Error',
        description: 'Faltan datos de organización',
        variant: 'destructive'
      })
      return
    }

    try {
      if (mode === 'edit' && modalData?.generalCostId) {
        await updateMutation.mutateAsync({
          generalCostId: modalData.generalCostId,
          generalCost: {
            name: data.name,
            description: data.description || undefined
          }
        })
      } else {
        const currentMember = members.find((m: any) => m.user_id === userData?.user?.id)
        if (!currentMember) {
          toast({
            title: 'Error',
            description: 'No se encontró el miembro de la organización',
            variant: 'destructive'
          })
          return
        }

        await createMutation.mutateAsync({
          organization_id: organizationId,
          name: data.name,
          description: data.description || undefined,
          created_by: currentMember.id
        })
      }

      onClose()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar el gasto general',
        variant: 'destructive'
      })
    }
  }

  if (mode === 'edit' && isLoading) {
    return (
      <ModalLayout onClose={onClose} size="md">
        <ModalBody>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        </ModalBody>
      </ModalLayout>
    )
  }

  return (
    <ModalLayout onClose={onClose} size="md">
      <ModalHeader
        title={mode === 'edit' ? 'Editar Gasto General' : 'Nuevo Gasto General'}
        description={mode === 'edit' ? 'Modifica los datos del gasto general' : 'Agrega un nuevo concepto de gasto para tu organización'}
        icon={Receipt}
      />

      <ModalBody>
        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Servicios administrativos, Gastos de oficina..."
                      {...field}
                      data-testid="input-general-cost-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripción detallada del gasto general..."
                      rows={3}
                      {...field}
                      data-testid="textarea-general-cost-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </ModalBody>

      <ModalFooter
        leftLabel="Cancelar"
        onLeftClick={onClose}
        submitText={mode === 'create' ? 'Crear' : 'Actualizar'}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </ModalLayout>
  )
}
