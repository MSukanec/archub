import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { DollarSign } from 'lucide-react'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import FormModalBody from '@/components/modal/form/FormModalBody'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { useModalPanelStore } from '@/components/modal/form/modalPanelStore'
import UserSelector from '@/components/ui-custom/UserSelector'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { useMovementConcepts } from '@/hooks/use-movement-concepts'
import { useOrganizationCurrencies, useOrganizationDefaultCurrency } from '@/hooks/use-currencies'
import { useOrganizationWallets } from '@/hooks/use-organization-wallets'

const movementSchema = z.object({
  created_by: z.string().min(1, 'Creador es requerido'),
  movement_date: z.date(),
  type_id: z.string().min(1, 'Tipo es requerido'),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  wallet_id: z.string().min(1, 'Billetera es requerida'),
  amount: z.number().min(0, 'El monto debe ser mayor a 0'),
  exchange_rate: z.number().optional(),
  description: z.string().optional(),
})

type MovementForm = z.infer<typeof movementSchema>

interface Movement {
  id: string
  created_at: string
  movement_date: string
  created_by: string
  description?: string
  amount: number
  exchange_rate?: number
  type_id: string
  category_id?: string
  subcategory_id?: string
  currency_id: string
  wallet_id: string
  organization_id: string
  project_id?: string
}

interface MovementFormModalProps {
  modalData?: {
    editingMovement?: Movement | null
  }
  onClose: () => void
}

function MovementFormModalFunction({ modalData, onClose }: MovementFormModalProps) {
  const editingMovement = modalData?.editingMovement
  const { data: currentUser } = useCurrentUser()
  const organizationId = currentUser?.organization?.id
  const { data: members } = useOrganizationMembers(organizationId)
  const { data: types } = useMovementConcepts('types')
  const { data: organizationCurrencies } = useOrganizationCurrencies(organizationId)
  const { data: defaultCurrency } = useOrganizationDefaultCurrency(organizationId)
  const { data: wallets } = useOrganizationWallets(organizationId)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { setPanel } = useModalPanelStore()

  // Set panel to edit for new movements, view for editing
  useEffect(() => {
    if (!editingMovement) {
      setPanel('edit')
    } else {
      setPanel('view')
    }
  }, [editingMovement, setPanel])

  const form = useForm<MovementForm>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      movement_date: new Date(),
      amount: 0,
      exchange_rate: undefined,
      description: '',
      created_by: currentUser?.id || '',
      type_id: '',
      currency_id: '',
      wallet_id: ''
    }
  })

  // Set default values when data loads
  useEffect(() => {
    if (currentUser && !editingMovement) {
      form.setValue('created_by', currentUser.id)
    }
    if (defaultCurrency && !editingMovement) {
      form.setValue('currency_id', defaultCurrency.id)
    }
    // Set default wallet if available
    const defaultWallet = wallets?.find(w => w.is_default)
    if (defaultWallet && !editingMovement) {
      form.setValue('wallet_id', defaultWallet.wallets?.id || '')
    }
  }, [currentUser, defaultCurrency, wallets, editingMovement, form])

  // Also set values when form is reset
  useEffect(() => {
    if (currentUser && defaultCurrency && !editingMovement) {
      const defaultWallet = wallets?.find(w => w.is_default)
      form.reset({
        movement_date: new Date(),
        amount: 0,
        exchange_rate: undefined,
        description: '',
        created_by: currentUser.id,
        type_id: '',
        currency_id: defaultCurrency.id,
        wallet_id: defaultWallet?.wallets?.id || ''
      })
    }
  }, [currentUser, defaultCurrency, wallets, editingMovement, form])

  // Set values when editing
  useEffect(() => {
    if (editingMovement && members && organizationCurrencies && wallets && types) {
      form.reset({
        created_by: editingMovement.created_by,
        movement_date: new Date(editingMovement.movement_date),
        type_id: editingMovement.type_id,
        currency_id: editingMovement.currency_id,
        wallet_id: editingMovement.wallet_id,
        amount: editingMovement.amount,
        exchange_rate: editingMovement.exchange_rate,
        description: editingMovement.description || '',
      })
    }
  }, [editingMovement, members, organizationCurrencies, wallets, types, form])

  const createMovementMutation = useMutation({
    mutationFn: async (data: MovementForm) => {
      const response = await fetch('/api/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          organization_id: organizationId,
        }),
      })
      if (!response.ok) throw new Error('Error al crear movimiento')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      toast({ title: 'Movimiento creado exitosamente' })
      onClose()
    },
    onError: () => {
      toast({ 
        title: 'Error al crear movimiento',
        variant: 'destructive'
      })
    }
  })

  const updateMovementMutation = useMutation({
    mutationFn: async (data: MovementForm) => {
      const response = await fetch(`/api/movements/${editingMovement?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Error al actualizar movimiento')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      toast({ title: 'Movimiento actualizado exitosamente' })
      onClose()
    },
    onError: () => {
      toast({ 
        title: 'Error al actualizar movimiento',
        variant: 'destructive'
      })
    }
  })

  const onSubmit = async (data: MovementForm) => {
    if (editingMovement) {
      updateMovementMutation.mutate(data)
    } else {
      createMovementMutation.mutate(data)
    }
  }

  const isLoading = createMovementMutation.isPending || updateMovementMutation.isPending

  const viewPanel = (
    <div className="p-4">
      <p className="text-sm text-muted-foreground">Vista de movimiento no implementada</p>
    </div>
  )

  const editPanel = (
    <div className="p-6">
      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          {/* Creador */}
          <FormField
            control={form.control}
            name="created_by"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Creador</FormLabel>
                <FormControl>
                  <UserSelector
                    users={members || []}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Seleccionar creador"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Fecha */}
          <FormField
            control={form.control}
            name="movement_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha del Movimiento</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value ? field.value.toISOString().split('T')[0] : ''}
                    onChange={(e) => field.onChange(new Date(e.target.value + 'T00:00:00'))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tipo */}
          <FormField
            control={form.control}
            name="type_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {types?.map((type: any) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Moneda */}
          <FormField
            control={form.control}
            name="currency_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizationCurrencies?.map((orgCurrency: any) => (
                        <SelectItem key={orgCurrency.id} value={orgCurrency.id}>
                          {orgCurrency.currency.name} ({orgCurrency.currency.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Billetera */}
          <FormField
            control={form.control}
            name="wallet_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Billetera</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar billetera" />
                    </SelectTrigger>
                    <SelectContent>
                      {wallets?.map((wallet: any) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.wallets?.name || wallet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Monto */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Cotización */}
          <FormField
            control={form.control}
            name="exchange_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cotización (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.0001"
                    min="0"
                    placeholder="1.0000"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                  />
                </FormControl>
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
                <FormLabel>Descripción (opcional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Descripción del movimiento..."
                    {...field}
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  )

  const headerContent = (
    <FormModalHeader 
      title={editingMovement ? "Editar Movimiento" : "Nuevo Movimiento"}
      icon={DollarSign}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={editingMovement ? "Actualizar" : "Guardar"}
      onRightClick={() => form.handleSubmit(onSubmit)()}
    />
  )

  return (
    <FormModalLayout
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
      columns={1}
    />
  )
}

export function MovementFormModal({ modalData, onClose }: MovementFormModalProps) {
  return MovementFormModalFunction({ modalData, onClose })
}

export default MovementFormModal