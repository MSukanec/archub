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
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
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
          users (
            id,
            full_name,
            email
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
          company_name
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
        type_id: '88ebeac7-6d00-4001-9535-6ae0704b3403', // INGRESO
        category_id: 'e7794e04-724a-47e9-bb61-ef1d644519e0', // PREVENTA  
        subcategory_id: '6d599e96-3041-4b9b-a391-995de4da0f6f' // CUOTAS
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

  const handleClose = () => {
    form.reset()
    onClose()
  }

  const onSubmit = (data: InstallmentForm) => {
    createInstallmentMutation.mutate(data)
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

  return (
    <CustomModalLayout open={open} onClose={handleClose}>
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
                  {organizationMembers?.map((member, index) => (
                    <SelectItem key={`member-${member.id || index}`} value={member.id || ''}>
                      {member.users?.full_name || member.users?.email || 'Usuario sin nombre'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.created_by && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.created_by.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Contacto *</Label>
              <Select 
                value={form.watch('contact_id')} 
                onValueChange={(value) => form.setValue('contact_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar contacto" />
                </SelectTrigger>
                <SelectContent>
                  {organizationContacts?.map((contact, index) => (
                    <SelectItem key={`contact-${contact.id || index}`} value={contact.id || ''}>
                      {contact.company_name || 
                       `${contact.first_name} ${contact.last_name}` || 'Contacto sin nombre'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.contact_id && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.contact_id.message}
                </p>
              )}
            </div>

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