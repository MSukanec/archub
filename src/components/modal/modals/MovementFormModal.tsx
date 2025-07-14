import React, { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { DollarSign } from 'lucide-react'

import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import FormModalBody from '@/components/modal/form/FormModalBody'
import UserSelector from '@/components/ui-custom/UserSelector'
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useOrganizationWallets } from '@/hooks/use-organization-wallets'
import { useMovementConcepts } from '@/hooks/use-movement-concepts'

const movementFormSchema = z.object({
  movement_date: z.date(),
  amount: z.number().min(0, 'El monto debe ser mayor a 0'),
  exchange_rate: z.number().optional(),
  description: z.string().optional(),
  created_by: z.string().min(1, 'Debe seleccionar un creador'),
  type_id: z.string().min(1, 'Debe seleccionar un tipo'),
  currency_id: z.string().min(1, 'Debe seleccionar una moneda'),
  wallet_id: z.string().min(1, 'Debe seleccionar una billetera')
})

type MovementForm = z.infer<typeof movementFormSchema>

interface MovementFormModalProps {
  editingMovement?: any
  onClose: () => void
}

export default function MovementFormModal({ editingMovement, onClose }: MovementFormModalProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentUser()
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.preferences?.last_organization_id

  // Data hooks
  const { data: members } = useOrganizationMembers(organizationId)
  const { data: currencies } = useOrganizationCurrencies(organizationId)
  const { data: wallets } = useOrganizationWallets(organizationId)
  const { data: movementTypes } = useMovementConcepts('types')

  // Default currency (first one)
  const defaultCurrency = currencies?.[0]

  const form = useForm<MovementForm>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: {
      movement_date: new Date(),
      amount: 0,
      exchange_rate: undefined,
      description: '',
      created_by: '',
      type_id: '',
      currency_id: '',
      wallet_id: ''
    }
  })

  // Set default values when data loads
  useEffect(() => {
    if (currentUser && !editingMovement) {
      console.log('Setting current user:', currentUser.user.id)
      form.setValue('created_by', currentUser.user.id)
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

  const createMovementMutation = useMutation({
    mutationFn: async (data: MovementForm) => {
      const response = await fetch('/api/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          organization_id: organizationId,
          project_id: userData?.preferences?.last_project_id,
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

  const editPanel = (
    <FormModalBody columns={1}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Creador */}
        <FormField
          control={form.control}
          name="created_by"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Creador <span className="text-[var(--accent)]">*</span></FormLabel>
              <FormControl>
                <UserSelector
                  users={members?.map(member => ({
                    id: member.user_id,
                    full_name: member.full_name,
                    email: member.email,
                    avatar_url: member.avatar_url,
                    first_name: member.full_name.split(' ')[0] || '',
                    last_name: member.full_name.split(' ').slice(1).join(' ') || ''
                  })) || []}
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
              <FormLabel>Fecha del Movimiento <span className="text-[var(--accent)]">*</span></FormLabel>
              <FormControl>
                <Input 
                  type="date" 
                  value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                  onChange={(e) => field.onChange(new Date(e.target.value))}
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
              <FormLabel>Tipo <span className="text-[var(--accent)]">*</span></FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {movementTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <FormLabel>Moneda <span className="text-[var(--accent)]">*</span></FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar moneda" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {currencies?.map((currency) => (
                    <SelectItem key={currency.id} value={currency.id}>
                      {currency.currency.symbol} {currency.currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <FormLabel>Billetera <span className="text-[var(--accent)]">*</span></FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar billetera" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {wallets?.map((wallet) => (
                    <SelectItem key={wallet.wallets?.id} value={wallet.wallets?.id || ''}>
                      {wallet.wallets?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <FormLabel>Monto <span className="text-[var(--accent)]">*</span></FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01"
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
                  step="0.01"
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
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        </form>
      </Form>
    </FormModalBody>
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
      onRightClick={form.handleSubmit(onSubmit)}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      viewPanel={null}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
    />
  )
}