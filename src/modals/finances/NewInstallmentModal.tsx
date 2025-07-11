import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'

import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout'
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader'
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody'
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import UserSelector from '@/components/ui-custom/misc/UserSelector'
import { supabase } from '@/lib/supabase'

const installmentSchema = z.object({
  movement_date: z.date({
    required_error: "Fecha es requerida",
  }),
  created_by: z.string().min(1, 'Creador es requerido'),
  contact_id: z.string().min(1, 'Contacto es requerido'),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  wallet_id: z.string().min(1, 'Billetera es requerida'),
  amount: z.number().min(0.01, 'Monto debe ser mayor a 0'),
  description: z.string().optional(),
})

type InstallmentForm = z.infer<typeof installmentSchema>

interface NewInstallmentModalProps {
  open: boolean
  onClose: () => void
  projectId: string
  organizationId: string
  editingInstallment?: any
}

export function NewInstallmentModal({
  open,
  onClose,
  projectId,
  organizationId,
  editingInstallment
}: NewInstallmentModalProps) {
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<InstallmentForm>({
    resolver: zodResolver(installmentSchema),
    defaultValues: {
      movement_date: new Date(),
      created_by: '',
      contact_id: '',
      currency_id: '',
      wallet_id: '',
      amount: 0,
      description: '',
    }
  })



  // Get organization currencies using existing hook
  const { data: organizationCurrencies } = useOrganizationCurrencies(organizationId)

  // Get movement concepts to find correct IDs
  const { data: movementConcepts } = useQuery({
    queryKey: ['movement-concepts'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized')
      
      const { data, error } = await supabase
        .from('movement_concepts')
        .select('id, name, parent_id')
        .order('name')

      if (error) throw error
      
      // Find the specific concepts we need
      const ingresos = data.find(c => c.name === 'Ingresos')
      const preventa = data.find(c => c.name === 'Preventa')
      const cuotas = data.find(c => c.name === 'Cuotas')
      
      console.log('Found concepts:', {
        ingresos: ingresos?.id,
        preventa: preventa?.id, 
        cuotas: cuotas?.id
      })
      
      return data || []
    }
  })

  // Get organization wallets
  const { data: wallets } = useQuery({
    queryKey: ['organization-wallets', organizationId],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized')
      
      const { data, error } = await supabase
        .from('organization_wallets')
        .select(`
          id,
          is_default,
          wallets (
            id,
            name
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)

      if (error) throw error
      return data || []
    }
  })

  // Get organization members (creators)
  const { data: organizationMembers } = useQuery({
    queryKey: ['organization-members', organizationId],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized')
      
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          users (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)

      if (error) throw error
      return data || []
    }
  })

  // Get organization contacts (not just project investors)
  const { data: organizationContacts } = useQuery({
    queryKey: ['organization-contacts', organizationId],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized')
      
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          id,
          first_name,
          last_name,
          company_name,
          email,
          full_name
        `)
        .eq('organization_id', organizationId)

      if (error) throw error
      return data || []
    },
    enabled: !!organizationId && !!supabase
  })

  // Create installment mutation
  const createInstallmentMutation = useMutation({
    mutationFn: async (data: InstallmentForm) => {
      if (!supabase) {
        throw new Error('Cliente Supabase no inicializado')
      }

      const movementData = {
        movement_date: format(data.movement_date, 'yyyy-MM-dd'),
        amount: data.amount,
        description: data.description || 'Aporte de proyecto',
        currency_id: data.currency_id,
        wallet_id: data.wallet_id,
        contact_id: data.contact_id,
        project_id: projectId,
        organization_id: organizationId,
        created_by: data.created_by,
        // Categorías automáticas para aportes: INGRESO > PREVENTA > CUOTAS
        type_id: '8862eee7-dd00-4f01-9335-5ea0070d3403', // INGRESO
        category_id: '5d5549d6-20d1-459b-a391-99295e65b6f2', // PREVENTA  
        subcategory_id: 'e675eb59-3717-4451-89eb-0d838388238f' // CUOTAS
      }

      const { error } = await supabase
        .from('movements')
        .insert(movementData)

      if (error) throw error
    },
    onSuccess: () => {
      toast({
        title: "Aporte registrado",
        description: "El aporte se ha guardado exitosamente",
      })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.invalidateQueries({ queryKey: ['installments'] })
      handleClose()
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo guardar el aporte",
        variant: "destructive",
      })
      console.error('Error creating installment:', error)
    }
  })

  // Update installment mutation
  const updateInstallmentMutation = useMutation({
    mutationFn: async (data: InstallmentForm) => {
      if (!supabase || !editingInstallment) {
        throw new Error('Cliente Supabase no inicializado o no hay aporte para editar')
      }

      const movementData = {
        movement_date: format(data.movement_date, 'yyyy-MM-dd'),
        amount: data.amount,
        description: data.description || 'Aporte de proyecto',
        currency_id: data.currency_id,
        wallet_id: data.wallet_id,
        contact_id: data.contact_id,
        created_by: data.created_by,
        // Categorías automáticas para aportes: INGRESO > PREVENTA > CUOTAS
        type_id: '8862eee7-dd00-4f01-9335-5ea0070d3403', // INGRESO
        category_id: '5d5549d6-20d1-459b-a391-99295e65b6f2', // PREVENTA  
        subcategory_id: 'e675eb59-3717-4451-89eb-0d838388238f' // CUOTAS
      }

      const { error } = await supabase
        .from('movements')
        .update(movementData)
        .eq('id', editingInstallment.id)

      if (error) throw error
    },
    onSuccess: () => {
      toast({
        title: "Aporte actualizado",
        description: "El aporte se ha actualizado exitosamente",
      })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.invalidateQueries({ queryKey: ['installments'] })
      handleClose()
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el aporte",
        variant: "destructive",
      })
      console.error('Error updating installment:', error)
    }
  })

  const handleClose = () => {
    form.reset()
    onClose()
  }

  const onSubmit = (data: InstallmentForm) => {
    if (editingInstallment) {
      updateInstallmentMutation.mutate(data)
    } else {
      createInstallmentMutation.mutate(data)
    }
  }

  // Set default values when data is loaded
  useEffect(() => {
    if (organizationCurrencies && organizationCurrencies.length > 0) {
      const defaultCurrency = organizationCurrencies[0]?.currency
      if (defaultCurrency && !form.getValues('currency_id')) {
        form.setValue('currency_id', defaultCurrency.id)
      }
    }
  }, [organizationCurrencies, form])

  useEffect(() => {
    if (wallets && wallets.length > 0) {
      const defaultWallet = wallets.find(w => w.is_default)?.wallets
      if (defaultWallet && !form.getValues('wallet_id')) {
        form.setValue('wallet_id', defaultWallet.id)
      }
    }
  }, [wallets, form])

  // Set current user as default creator
  useEffect(() => {
    if (organizationMembers && organizationMembers.length > 0 && userData?.user?.id) {
      const currentUserMember = organizationMembers.find(m => m.users?.id === userData.user.id)
      if (currentUserMember && !form.getValues('created_by')) {
        form.setValue('created_by', currentUserMember.id)
      }
    }
  }, [organizationMembers, userData, form])

  // Load editing data when modal opens for editing
  useEffect(() => {
    if (editingInstallment && open) {
      form.setValue('movement_date', new Date(editingInstallment.movement_date))
      form.setValue('amount', editingInstallment.amount)
      form.setValue('description', editingInstallment.description || '')
      form.setValue('contact_id', editingInstallment.contact_id)
      form.setValue('currency_id', editingInstallment.currency_id)
      form.setValue('wallet_id', editingInstallment.wallet_id)
      // Find the created_by member ID by matching the user ID
      if (organizationMembers) {
        const creatorMember = organizationMembers.find(m => m.users?.id === editingInstallment.created_by)
        if (creatorMember) {
          form.setValue('created_by', creatorMember.id)
        }
      }
    } else if (!editingInstallment && open) {
      // Reset form for new installment
      form.reset({
        movement_date: new Date(),
        amount: 0,
        description: '',
        contact_id: '',
        currency_id: '',
        wallet_id: '',
        created_by: ''
      })
    }
  }, [editingInstallment, open, form, organizationMembers])

  return (
    <CustomModalLayout 
      open={open} 
      onClose={handleClose}
      onEnterSubmit={form.handleSubmit(onSubmit)}
    >
      {{
        header: (
          <CustomModalHeader
            title={editingInstallment ? "Editar Aporte" : "Nuevo Aporte"}
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody columns={1}>
            <div className="space-y-2">
              <Label>Creador *</Label>
              <Select 
                value={form.watch('created_by')} 
                onValueChange={(value) => form.setValue('created_by', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar creador" />
                </SelectTrigger>
                <SelectContent>
                  {organizationMembers?.map((member, index) => {
                    const user = member.users
                    const displayName = user?.full_name || user?.email || 'Usuario sin nombre'
                    const initials = user?.full_name 
                      ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
                      : user?.email?.[0]?.toUpperCase() || 'U'
                    
                    return (
                      <SelectItem key={`member-${member.id || index}`} value={member.id || ''}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user?.avatar_url || ''} />
                            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                          </Avatar>
                          <span>{displayName}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {form.formState.errors.created_by && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.created_by.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="movement_date">Fecha *</Label>
              <Input
                id="movement_date"
                type="date"
                value={form.watch('movement_date') ? format(form.watch('movement_date'), 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const date = new Date(e.target.value + 'T00:00:00')
                  form.setValue('movement_date', date)
                }}
              />
              {form.formState.errors.movement_date && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.movement_date.message}
                </p>
              )}
            </div>

            <UserSelector
              users={organizationContacts?.map(contact => ({
                id: contact.id,
                full_name: contact.full_name || contact.company_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
                email: contact.email || '',
                avatar_url: contact.avatar_url,
                first_name: contact.first_name,
                last_name: contact.last_name
              })) || []}
              value={form.watch('contact_id')}
              onChange={(value) => form.setValue('contact_id', value)}
              label="Contacto"
              placeholder="Seleccionar contacto"
              required
            />
            {form.formState.errors.contact_id && (
              <p className="text-sm text-destructive">
                {form.formState.errors.contact_id.message}
              </p>
            )}

            <div className="space-y-2">
              <Label>Moneda *</Label>
              <Select 
                value={form.watch('currency_id')} 
                onValueChange={(value) => form.setValue('currency_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar moneda" />
                </SelectTrigger>
                <SelectContent>
                  {organizationCurrencies?.map((orgCurrency, index) => (
                    <SelectItem key={`currency-${orgCurrency.currency?.id || index}`} value={orgCurrency.currency?.id || ''}>
                      {orgCurrency.currency?.code || 'N/A'} - {orgCurrency.currency?.name || 'Sin nombre'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.currency_id && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.currency_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Billetera *</Label>
              <Select 
                value={form.watch('wallet_id')} 
                onValueChange={(value) => form.setValue('wallet_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar billetera" />
                </SelectTrigger>
                <SelectContent>
                  {wallets?.map((orgWallet, index) => (
                    <SelectItem key={`wallet-${orgWallet.wallets?.id || index}`} value={orgWallet.wallets?.id || ''}>
                      {orgWallet.wallets?.name || 'Billetera sin nombre'}
                      {orgWallet.is_default && ' (Por defecto)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.wallet_id && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.wallet_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...form.register('amount', { valueAsNumber: true })}
              />
              {form.formState.errors.amount && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>



            <div className="space-y-2">
              <Label htmlFor="description">Notas</Label>
              <Textarea
                id="description"
                placeholder="Descripción o notas adicionales..."
                {...form.register('description')}
              />
            </div>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleClose}
            onSubmit={form.handleSubmit(onSubmit)}
            submitText="Guardar Aporte"
            isLoading={createInstallmentMutation.isPending}
          />
        )
      }}
    </CustomModalLayout>
  )
}