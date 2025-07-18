import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CalendarIcon, DollarSign, User, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { useProjectClients } from '@/hooks/use-project-clients'
import { useOrganizationWallets } from '@/hooks/use-organization-wallets'
import { useModalPanelStore } from '@/components/modal/form/modalPanelStore'
import UserSelector from '@/components/ui-custom/UserSelector'
import { supabase } from '@/lib/supabase'

const installmentSchema = z.object({
  movement_date: z.date({
    required_error: "Fecha es requerida",
  }),
  created_by: z.string().min(1, 'Creador es requerido'),
  contact_id: z.string().min(1, 'Cliente es requerido'),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  wallet_id: z.string().min(1, 'Billetera es requerida'),
  amount: z.number().min(0.01, 'Monto debe ser mayor a 0'),
  description: z.string().optional(),
  exchange_rate: z.number().optional(),
})

type InstallmentForm = z.infer<typeof installmentSchema>

interface InstallmentFormModalProps {
  modalData: {
    projectId: string
    organizationId: string
    editingInstallment?: any
  }
  onClose: () => void
}

export function InstallmentFormModal({ modalData, onClose }: InstallmentFormModalProps) {
  const { projectId, organizationId, editingInstallment } = modalData
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { setPanel } = useModalPanelStore()

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
      exchange_rate: undefined,
    }
  })

  // Hooks para obtener datos
  const { data: currencies, isLoading: currenciesLoading } = useOrganizationCurrencies(organizationId)
  const { data: members, isLoading: membersLoading } = useOrganizationMembers(organizationId)
  const { data: projectClients, isLoading: clientsLoading } = useProjectClients(projectId)
  const { data: wallets, isLoading: walletsLoading } = useOrganizationWallets(organizationId)
  
  // Loading state for all necessary data
  const isLoading = currenciesLoading || membersLoading || clientsLoading || walletsLoading

  // Inicializar panel en modo edit para nuevos compromisos
  React.useEffect(() => {
    if (editingInstallment) {
      setPanel('view')
    } else {
      setPanel('edit')
    }
  }, [editingInstallment, setPanel])

  // Cargar datos del movimiento en edición
  React.useEffect(() => {
    if (editingInstallment && members && currencies && wallets) {
      const installmentDate = editingInstallment.movement_date ? new Date(editingInstallment.movement_date) : new Date()
      
      form.reset({
        movement_date: installmentDate,
        created_by: editingInstallment.created_by || '',
        contact_id: editingInstallment.contact_id || '',
        currency_id: editingInstallment.currency_id || '',
        wallet_id: editingInstallment.wallet_id || '',
        amount: editingInstallment.amount || 0,
        description: editingInstallment.description || '',
        exchange_rate: editingInstallment.exchange_rate || undefined,
      })
    }
  }, [editingInstallment, form, members, currencies, wallets])

  // Inicializar creador por defecto
  React.useEffect(() => {
    if (!editingInstallment && members && userData?.user?.id) {
      const currentMember = members.find(m => m.user_id === userData.user.id)
      
      if (currentMember?.id) {
        form.setValue('created_by', currentMember.id)
      }
    }
  }, [members, userData?.user?.id, editingInstallment, form])

  // Mutación para crear/actualizar el compromiso
  const createInstallmentMutation = useMutation({
    mutationFn: async (data: InstallmentForm) => {
      if (!userData?.organization?.id) {
        throw new Error('Organization ID not found')
      }

      // Buscar el tipo de concepto "Cuotas" o "Ingresos"
      const { data: concepts } = await supabase
        .from('movement_concepts')
        .select('*')
        .eq('organization_id', userData.organization.id)
        .eq('name', 'Cuotas')
        .maybeSingle()

      let conceptId = concepts?.id

      // Si no existe concepto "Cuotas", usar "Ingresos"
      if (!conceptId) {
        const { data: ingresosConcept } = await supabase
          .from('movement_concepts')
          .select('*')
          .or(`name.eq.Ingresos,parent_id.eq.${userData.organization.id}`)
          .maybeSingle()
        
        conceptId = ingresosConcept?.id
      }

      const movementData = {
        organization_id: userData.organization.id,
        project_id: projectId,
        movement_date: data.movement_date.toISOString().split('T')[0],
        created_by: data.created_by,
        contact_id: data.contact_id,
        currency_id: data.currency_id,
        wallet_id: data.wallet_id,
        amount: data.amount,
        description: data.description || null,
        exchange_rate: data.exchange_rate || null,
        type_id: conceptId,
        category_id: null,
        subcategory_id: null,
      }

      if (editingInstallment) {
        const { data: result, error } = await supabase
          .from('movements')
          .update(movementData)
          .eq('id', editingInstallment.id)
          .select()
          .single()

        if (error) throw error
        return result
      } else {
        const { data: result, error } = await supabase
          .from('movements')
          .insert([movementData])
          .select()
          .single()

        if (error) throw error
        return result
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installments'] })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      toast({
        title: editingInstallment ? 'Compromiso actualizado' : 'Compromiso registrado',
        description: editingInstallment 
          ? 'El compromiso ha sido actualizado correctamente'
          : 'El compromiso ha sido registrado correctamente',
      })
      onClose()
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Error al ${editingInstallment ? 'actualizar' : 'registrar'} el aporte: ${error.message}`,
      })
    }
  })

  const onSubmit = async (data: InstallmentForm) => {
    await createInstallmentMutation.mutateAsync(data)
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  // Panel de vista (solo lectura)
  const viewPanel = editingInstallment ? (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-foreground mb-2">Cliente</h4>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {editingInstallment.contact?.first_name?.[0]}
                {editingInstallment.contact?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{editingInstallment.contact?.full_name}</span>
          </div>
        </div>
        <div>
          <h4 className="font-medium text-foreground mb-2">Monto</h4>
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium">
              {editingInstallment.currency?.symbol} {editingInstallment.amount?.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      <div>
        <h4 className="font-medium text-foreground mb-2">Descripción</h4>
        <p className="text-sm text-muted-foreground">
          {editingInstallment.description || 'Sin descripción'}
        </p>
      </div>
    </div>
  ) : null

  // Panel de edición
  const editPanel = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Cargando datos del formulario...</p>
          </div>
        </div>
      )
    }

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Fila 1: Creador y Fecha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Creador *</label>
              <UserSelector
                users={members?.map(member => ({
                  id: member.id,
                  full_name: member.full_name || member.email || 'Usuario sin nombre',
                  email: member.email || '',
                  avatar_url: member.avatar_url || '',
                  user_id: member.user_id || ''
                })) || []}
                value={form.watch('created_by')}
                onChange={(value) => form.setValue('created_by', value)}
                placeholder="Seleccionar creador"
                emptyMessage="No hay miembros disponibles"
              />
              {form.formState.errors.created_by && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.created_by.message}
                </p>
              )}
            </div>

          <FormField
            control={form.control}
            name="movement_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha *</FormLabel>
                <FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Seleccionar fecha"
                            value={field.value ? format(field.value, 'dd/MM/yyyy', { locale: es }) : ''}
                            className="pl-10"
                            readOnly
                          />
                          <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Fila 2: Cliente */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Cliente *</label>
          <UserSelector
            users={projectClients?.map(client => ({
              id: client.contact_id,
              full_name: client.contact.full_name || client.contact.company_name || `${client.contact.first_name || ''} ${client.contact.last_name || ''}`.trim(),
              email: '',
              avatar_url: '',
              first_name: client.contact.first_name,
              last_name: client.contact.last_name
            })).sort((a, b) => a.full_name.localeCompare(b.full_name)) || []}
            value={form.watch('contact_id')}
            onChange={(value) => form.setValue('contact_id', value)}
            placeholder="Seleccionar cliente"
            emptyMessage="No hay clientes disponibles"
          />
          {form.formState.errors.contact_id && (
            <p className="text-sm text-red-500">
              {form.formState.errors.contact_id.message}
            </p>
          )}
        </div>

        {/* Fila 3: Moneda y Billetera */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="currency_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda *</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies?.map((currency) => (
                        <SelectItem key={currency.id} value={currency.id}>
                          {currency.name} ({currency.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="wallet_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Billetera *</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar billetera" />
                    </SelectTrigger>
                    <SelectContent>
                      {wallets?.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.wallets?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Fila 4: Monto y Cotización */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="exchange_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cotización (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Ej: 1.0000"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Fila 5: Descripción */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descripción del aporte..."
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
    )
  }

  const headerContent = (
    <FormModalHeader
      title={editingInstallment ? "Editar Compromiso" : "Nuevo Compromiso"}
      icon={DollarSign}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={editingInstallment ? "Actualizar" : "Guardar Compromiso"}
      onRightClick={form.handleSubmit(onSubmit)}
      showLoadingSpinner={createInstallmentMutation.isPending}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel()}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
    />
  )
}