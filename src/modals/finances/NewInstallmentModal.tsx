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
import { supabase } from '@/lib/supabase'

const installmentSchema = z.object({
  movement_date: z.date({
    required_error: "Fecha es requerida",
  }),
  amount: z.number().min(0.01, 'Monto debe ser mayor a 0'),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  wallet_id: z.string().min(1, 'Billetera es requerida'),
  contact_id: z.string().min(1, 'Contacto es requerido'),
  installment_number: z.string().optional(),
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
      amount: 0,
      currency_id: '',
      wallet_id: '',
      contact_id: '',
      installment_number: '',
      description: '',
    }
  })

  // Get "Cuotas" concept ID
  const { data: cuotasConcept } = useQuery({
    queryKey: ['movement-concepts', 'cuotas'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized')
      
      const { data, error } = await supabase
        .from('movement_concepts')
        .select('id, name')
        .ilike('name', '%cuota%')
        .limit(1)
        .single()

      if (error) throw error
      return data
    }
  })

  // Get organization currencies
  const { data: currencies } = useQuery({
    queryKey: ['organization-currencies', organizationId],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized')
      
      const { data, error } = await supabase
        .from('organization_currencies')
        .select(`
          id,
          is_default,
          currencies (
            id,
            name,
            code,
            symbol
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)

      if (error) throw error
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

  // Get project investors (contacts)
  const { data: projectInvestors } = useQuery({
    queryKey: ['project-investors', projectId],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized')
      
      const { data, error } = await supabase
        .from('project_investors')
        .select(`
          contact_id,
          contacts (
            id,
            first_name,
            last_name,
            company_name
          )
        `)
        .eq('project_id', projectId)

      if (error) throw error
      return data || []
    }
  })

  // Create installment mutation
  const createInstallmentMutation = useMutation({
    mutationFn: async (data: InstallmentForm) => {
      if (!supabase || !userData?.user?.id || !cuotasConcept?.id) {
        throw new Error('Datos requeridos faltantes')
      }

      // Get current user's organization member ID
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('id')
        .eq('user_id', userData.user.id)
        .eq('organization_id', organizationId)
        .single()

      if (memberError) throw memberError

      const movementData = {
        movement_date: format(data.movement_date, 'yyyy-MM-dd'),
        amount: data.amount,
        description: data.description || `Aporte ${data.installment_number ? `cuota ${data.installment_number}` : ''}`.trim(),
        type_id: cuotasConcept.id, // Using "Cuotas" concept
        currency_id: data.currency_id,
        wallet_id: data.wallet_id,
        contact_id: data.contact_id,
        project_id: projectId,
        organization_id: organizationId,
        created_by: memberData.id,
        installment_number: data.installment_number,
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

  // Set default values when currencies and wallets are loaded
  useEffect(() => {
    if (currencies && currencies.length > 0) {
      const defaultCurrency = currencies.find(c => c.is_default)?.currencies
      if (defaultCurrency && !form.getValues('currency_id')) {
        form.setValue('currency_id', defaultCurrency.id)
      }
    }
  }, [currencies, form])

  useEffect(() => {
    if (wallets && wallets.length > 0) {
      const defaultWallet = wallets.find(w => w.is_default)?.wallets
      if (defaultWallet && !form.getValues('wallet_id')) {
        form.setValue('wallet_id', defaultWallet.id)
      }
    }
  }, [wallets, form])

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
          <CustomModalBody columns={2}>
            <div className="col-span-1 space-y-2">
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

            <div className="col-span-1 space-y-2">
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

            <div className="col-span-1 space-y-2">
              <Label>Moneda *</Label>
              <Select 
                value={form.watch('currency_id')} 
                onValueChange={(value) => form.setValue('currency_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar moneda" />
                </SelectTrigger>
                <SelectContent>
                  {currencies?.map((orgCurrency) => (
                    <SelectItem key={orgCurrency.currencies?.id} value={orgCurrency.currencies?.id || ''}>
                      {orgCurrency.currencies?.code} - {orgCurrency.currencies?.name}
                      {orgCurrency.is_default && ' (Por defecto)'}
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

            <div className="col-span-1 space-y-2">
              <Label>Billetera *</Label>
              <Select 
                value={form.watch('wallet_id')} 
                onValueChange={(value) => form.setValue('wallet_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar billetera" />
                </SelectTrigger>
                <SelectContent>
                  {wallets?.map((orgWallet) => (
                    <SelectItem key={orgWallet.wallets?.id} value={orgWallet.wallets?.id || ''}>
                      {orgWallet.wallets?.name}
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

            <div className="col-span-1 space-y-2">
              <Label>Contacto *</Label>
              <Select 
                value={form.watch('contact_id')} 
                onValueChange={(value) => form.setValue('contact_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar contacto" />
                </SelectTrigger>
                <SelectContent>
                  {projectInvestors?.map((investor) => (
                    <SelectItem key={investor.contacts?.id} value={investor.contacts?.id || ''}>
                      {investor.contacts?.company_name || 
                       `${investor.contacts?.first_name} ${investor.contacts?.last_name}`}
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

            <div className="col-span-1 space-y-2">
              <Label htmlFor="installment_number">Número de cuota</Label>
              <Input
                id="installment_number"
                placeholder="Ej: 1, 2, 3..."
                {...form.register('installment_number')}
              />
            </div>

            <div className="col-span-2 space-y-2">
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
            isSubmitting={createInstallmentMutation.isPending}
          />
        )
      }}
    </CustomModalLayout>
  )
}