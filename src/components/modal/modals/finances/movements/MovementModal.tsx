import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DollarSign } from 'lucide-react'
import { Form } from '@/components/ui/form'
import { FormModalLayout } from "@/components/modal/form/FormModalLayout"
import { FormModalHeader } from "@/components/modal/form/FormModalHeader"
import { FormModalFooter } from "@/components/modal/form/FormModalFooter"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import DatePicker from '@/components/ui-custom/DatePicker'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useWallets } from '@/hooks/use-wallets'
import { useOrganizationMovementConcepts } from '@/hooks/use-organization-movement-concepts'
import { DefaultMovementFields } from './fields/DefaultFields'

// Schema básico para el modal simple
const basicMovementSchema = z.object({
  movement_date: z.date(),
  type_id: z.string().min(1, 'Tipo de movimiento es requerido'),
  description: z.string().min(1, 'Descripción es requerida'),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  wallet_id: z.string().min(1, 'Billetera es requerida'),
  amount: z.number().min(0.01, 'Cantidad debe ser mayor a 0'),
  exchange_rate: z.number().optional()
})

type BasicMovementForm = z.infer<typeof basicMovementSchema>

interface MovementModalProps {
  modalData?: any
  onClose: () => void
}

export function MovementModal({ modalData, onClose }: MovementModalProps) {
  // Hooks
  const { data: userData } = useCurrentUser()
  const { data: currencies } = useOrganizationCurrencies(userData?.organization?.id)
  const { data: wallets } = useWallets(userData?.organization?.id)
  const { data: movementConcepts } = useOrganizationMovementConcepts(userData?.organization?.id)

  // Form setup
  const form = useForm<BasicMovementForm>({
    resolver: zodResolver(basicMovementSchema),
    defaultValues: {
      movement_date: new Date(),
      type_id: '',
      description: '',
      currency_id: userData?.organization?.preferences?.default_currency || '',
      wallet_id: userData?.organization?.preferences?.default_wallet || '',
      amount: 0
    }
  })

  // Función de envío simple
  const onSubmit = (values: BasicMovementForm) => {
    console.log('Valores del formulario:', values)
    // TODO: Implementar lógica de creación
    onClose()
  }

  // Panel de edición/creación
  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Fecha */}
        <FormField
          control={form.control}
          name="movement_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha *</FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value}
                  onDateChange={field.onChange}
                  placeholder="Seleccionar fecha..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tipo de Movimiento */}
        <FormField
          control={form.control}
          name="type_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Movimiento *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {movementConcepts?.map((concept) => (
                    <SelectItem key={concept.id} value={concept.id}>
                      {concept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Descripción */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descripción del movimiento..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campos por defecto */}
        <DefaultMovementFields
          form={form}
          currencies={currencies || []}
          wallets={wallets || []}
        />
      </form>
    </Form>
  )

  // Panel de vista (por ahora igual al de edición)
  const viewPanel = editPanel

  // Header del modal
  const headerContent = (
    <FormModalHeader 
      title="Nuevo Movimiento"
      icon={DollarSign}
    />
  )

  // Footer del modal
  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel="Guardar"
      onRightClick={form.handleSubmit(onSubmit)}
      showLoadingSpinner={false}
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
    />
  )
}