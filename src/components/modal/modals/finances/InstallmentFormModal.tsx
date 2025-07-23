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
import UserSelector from '@/components/ui-custom/UserSelector'
import { CalendarIcon, DollarSign, User, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useProjectClients } from '@/hooks/use-project-clients'
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { useOrganizationWallets } from '@/hooks/use-organization-wallets'
import { useModalPanelStore } from '@/components/modal/form/modalPanelStore'
import { supabase } from '@/lib/supabase'

const installmentSchema = z.object({
  created_by: z.string().min(1, 'Creador es requerido'),
  movement_date: z.date({
    required_error: "Fecha es requerida",
  }),
  contact_id: z.string().min(1, 'Cliente es requerido'),
  subcategory_id: z.string().min(1, 'Subcategoría es requerida'),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  wallet_id: z.string().min(1, 'Billetera es requerida'),
  amount: z.number().min(0.01, 'Monto debe ser mayor a 0'),
  exchange_rate: z.number().optional(),
  description: z.string().optional(),
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
      created_by: '',
      movement_date: new Date(),
      contact_id: '',
      subcategory_id: '',
      currency_id: '',
      wallet_id: '',
      amount: 0,
      exchange_rate: undefined,
      description: '',
    }
  })

  // Hooks para obtener datos
  const { data: currencies, isLoading: currenciesLoading } = useOrganizationCurrencies(organizationId)
  const { data: projectClients, isLoading: clientsLoading } = useProjectClients(projectId)
  const { data: members, isLoading: membersLoading } = useOrganizationMembers(organizationId)
  const { data: wallets, isLoading: walletsLoading } = useOrganizationWallets(organizationId)
  
  // Hook para obtener subcategorías de "Aportes de Terceros"
  const { data: subcategories, isLoading: subcategoriesLoading } = useQuery({
    queryKey: ['aportes-terceros-subcategories', organizationId],
    queryFn: async () => {
      if (!supabase) return []
      
      // Buscar TODOS los conceptos de la organización
      const { data: allConcepts } = await supabase
        .from('movement_concepts')
        .select('id, name, parent_id')
        .eq('organization_id', organizationId)
        .order('name')
      
      console.log('All concepts in organization:', allConcepts)
      
      // Primero intentar buscar "Aportes de Terceros" por nombre
      let aportesDeTerrcerosId = 'f3b96eda-15d5-4c96-ade7-6f53685115d3'
      let aportesDeTerrcerosConcepto = allConcepts?.find(concept => concept.id === aportesDeTerrcerosId)
      
      // Si no existe por ID, buscar por nombre similar
      if (!aportesDeTerrcerosConcepto) {
        console.log('Aportes de Terceros ID not found, searching by name...')
        aportesDeTerrcerosConcepto = allConcepts?.find(concept => 
          concept.name.toLowerCase().includes('aporte') && 
          (concept.name.toLowerCase().includes('tercero') || concept.name.toLowerCase().includes('cliente'))
        )
        
        if (aportesDeTerrcerosConcepto) {
          aportesDeTerrcerosId = aportesDeTerrcerosConcepto.id
          console.log('Found similar concept:', aportesDeTerrcerosConcepto)
        } else {
          // Crear el concepto "Aportes de Terceros" 
          console.log('Creating Aportes de Terceros concept...')
          const ingresosId = allConcepts?.find(c => c.name === 'Ingresos')?.id || '8862eee7-dd00-4f01-9335-5ea0070d3403'
          
          const { data: newConcept, error } = await supabase
            .from('movement_concepts')
            .insert({
              id: 'f3b96eda-15d5-4c96-ade7-6f53685115d3',
              name: 'Aportes de Terceros',
              parent_id: ingresosId,
              organization_id: organizationId,
              view_mode: 'aportes'
            })
            .select()
            .single()
          
          if (error) {
            console.error('Error creating concept:', error)
            return []
          }
          
          aportesDeTerrcerosConcepto = newConcept
          console.log('Created new concept:', newConcept)
        }
      }
      
      // Buscar conceptos hijos
      const childConcepts = allConcepts?.filter(concept => concept.parent_id === aportesDeTerrcerosId) || []
      console.log('Child concepts found:', childConcepts)
      
      // Si no hay hijos, usar el concepto padre
      if (childConcepts.length === 0) {
        console.log('No children found, using parent concept')
        return aportesDeTerrcerosConcepto ? [aportesDeTerrcerosConcepto] : []
      }
      
      return childConcepts
    },
    enabled: !!organizationId && !!supabase
  })
  
  // Debug logs
  React.useEffect(() => {
    console.log('Currencies data:', currencies)
    console.log('Subcategories data:', subcategories)
  }, [currencies, subcategories])
  
  // Loading state for all necessary data
  const isLoading = currenciesLoading || clientsLoading || subcategoriesLoading || membersLoading || walletsLoading

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
    if (editingInstallment && currencies) {
      console.log('Loading editing installment:', editingInstallment)
      const installmentDate = editingInstallment.movement_date ? new Date(editingInstallment.movement_date) : new Date()
      
      form.reset({
        created_by: editingInstallment.created_by || '',
        movement_date: installmentDate,
        contact_id: editingInstallment.contact_id || '',
        subcategory_id: editingInstallment.subcategory_id || '',
        currency_id: editingInstallment.currency_id || '',
        wallet_id: editingInstallment.wallet_id || '',
        amount: editingInstallment.amount || 0,
        exchange_rate: editingInstallment.exchange_rate || undefined,
        description: editingInstallment.description || '',
      })
      
      console.log('Form reset with values:', {
        movement_date: installmentDate,
        contact_id: editingInstallment.contact_id,
        subcategory_id: editingInstallment.subcategory_id,
        currency_id: editingInstallment.currency_id,
        amount: editingInstallment.amount,
        description: editingInstallment.description,
        exchange_rate: editingInstallment.exchange_rate
      })
    }
  }, [editingInstallment, form, currencies])

  // Inicializar valores por defecto
  React.useEffect(() => {
    if (!editingInstallment) {
      // Seleccionar usuario actual como creador
      if (userData?.user?.id && members) {
        const currentMember = members.find(m => m.user_id === userData.user.id)
        if (currentMember) {
          form.setValue('created_by', currentMember.id)
        }
      }
      
      // Usar la primera moneda disponible por defecto
      if (currencies && currencies.length > 0) {
        form.setValue('currency_id', currencies[0].id)
      }
      
      // Usar la billetera por defecto
      if (wallets) {
        const defaultWallet = wallets.find(w => w.is_default)
        if (defaultWallet) {
          form.setValue('wallet_id', defaultWallet.id)
        } else if (wallets.length > 0) {
          form.setValue('wallet_id', wallets[0].id)
        }
      }
    }
  }, [currencies, wallets, members, userData, editingInstallment, form])

  // Mutación para crear/actualizar el compromiso
  const createInstallmentMutation = useMutation({
    mutationFn: async (data: InstallmentForm) => {
      if (!userData?.organization?.id) {
        throw new Error('Organization ID not found')
      }

      // Obtener la categoría padre de la subcategoría seleccionada
      const { data: subcategory } = await supabase!
        .from('movement_concepts')
        .select('parent_id')
        .eq('id', data.subcategory_id)
        .single()

      if (!subcategory) {
        throw new Error('Subcategoría no encontrada')
      }

      // Buscar el tipo "Ingresos" para este movimiento
      const { data: ingresosType } = await supabase!
        .from('movement_concepts')
        .select('id')
        .eq('organization_id', userData.organization.id)
        .eq('name', 'Ingresos')
        .maybeSingle()

      const typeId = ingresosType?.id



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
        type_id: typeId,
        category_id: subcategory.parent_id,
        subcategory_id: data.subcategory_id,
      }

      if (editingInstallment) {
        const { data: result, error } = await supabase!
          .from('movements')
          .update(movementData)
          .eq('id', editingInstallment.id)
          .select()
          .single()

        if (error) throw error
        return result
      } else {
        const { data: result, error } = await supabase!
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
          {/* 1. Creador - Fecha (inline) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="created_by"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <UserSelector
                      users={members || []}
                      value={field.value}
                      onChange={field.onChange}
                      label="Creador"
                      placeholder="Seleccionar creador"
                      required={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

          {/* 2. Cliente - Concepto (inline) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="contact_id"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <UserSelector
                      users={projectClients?.map(client => ({
                        id: client.contact.id,
                        full_name: client.contact?.full_name,
                        first_name: client.contact?.first_name,
                        last_name: client.contact?.last_name,
                        company_name: client.contact?.company_name,
                      })) || []}
                      value={field.value}
                      onChange={field.onChange}
                      label="Cliente"
                      placeholder="Seleccionar cliente"
                      required={true}
                      showCompany={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subcategory_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Concepto *</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar concepto" />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategories?.map((subcategory) => (
                          <SelectItem key={subcategory.id} value={subcategory.id}>
                            {subcategory.name}
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

        {/* 5. Moneda - Billetera */}
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

        {/* 6. Monto - Cotización */}
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
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
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
                    step="0.0001"
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

        {/* 7. Descripción */}
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
      title={editingInstallment ? "Editar Aporte" : "Nuevo Aporte"}
      icon={DollarSign}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={editingInstallment ? "Actualizar" : "Guardar Aporte"}
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