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
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import UserSelector from '@/components/ui-custom/UserSelector'
import { CalendarIcon, DollarSign, User, Coins } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  movement_date: z.date({
    required_error: "Fecha es requerida",
  }),
  contact_id: z.string().min(1, 'Cliente es requerido'),
  type_id: z.string().min(1, 'Tipo es requerido'),
  category_id: z.string().min(1, 'Categoría es requerida'),
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
      movement_date: new Date(),
      contact_id: '',
      type_id: '',
      category_id: '',
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
      
      const aportesDeTerrcerosId = 'f3b96eda-15d5-4c96-ade7-6f53685115d3'
      
      // Buscar conceptos HIJOS del concepto de sistema "Aportes de Terceros"
      // Pueden ser conceptos de sistema (organization_id = null) o de organización específica
      const { data: systemChildren } = await supabase
        .from('movement_concepts')
        .select('id, name, parent_id, organization_id')
        .eq('parent_id', aportesDeTerrcerosId)
        .is('organization_id', null)
        .order('name')
      
      const { data: orgChildren } = await supabase
        .from('movement_concepts')
        .select('id, name, parent_id, organization_id')
        .eq('parent_id', aportesDeTerrcerosId)
        .eq('organization_id', organizationId)
        .order('name')
      
      // Combinar conceptos de sistema y organización
      const allChildren = [...(systemChildren || []), ...(orgChildren || [])]
      
      // Si no hay subcategorías, usar el concepto padre de sistema
      if (allChildren.length === 0) {
        const { data: parentConcept } = await supabase
          .from('movement_concepts')
          .select('id, name, parent_id, organization_id')
          .eq('id', aportesDeTerrcerosId)
          .is('organization_id', null)
          .single()
        

        return parentConcept ? [parentConcept] : []
      }
      

      return allChildren
    },
    enabled: !!organizationId && !!supabase
  })
  

  
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

      const installmentDate = editingInstallment.movement_date ? new Date(editingInstallment.movement_date) : new Date()
      
      form.reset({
        movement_date: installmentDate,
        contact_id: editingInstallment.contact_id || '',
        subcategory_id: editingInstallment.subcategory_id || '',
        currency_id: editingInstallment.currency_id || '',
        wallet_id: editingInstallment.wallet_id || '',
        amount: editingInstallment.amount || 0,
        exchange_rate: editingInstallment.exchange_rate || undefined,
        description: editingInstallment.description || '',
      })
    }
  }, [editingInstallment, form, currencies, supabase])

  // Inicializar valores por defecto
  React.useEffect(() => {
    if (!editingInstallment) {
      // Usar la primera moneda disponible por defecto
      if (currencies && currencies.length > 0) {
        const defaultCurrency = currencies.find(c => c.is_default)?.currency?.id
        if (defaultCurrency) {
          form.setValue('currency_id', defaultCurrency)
        } else {
          form.setValue('currency_id', currencies[0].currency?.id)
        }
      }
      
      // Usar la billetera por defecto
      if (wallets && wallets.length > 0) {
        const defaultWallet = wallets.find(w => w.is_default)
        if (defaultWallet && defaultWallet.wallets?.id) {
          form.setValue('wallet_id', defaultWallet.wallets.id)
        } else if (wallets[0].wallets?.id) {
          form.setValue('wallet_id', wallets[0].wallets.id)
        }
      }
    }
  }, [currencies, wallets, editingInstallment, form])

  // Mutación para crear/actualizar el compromiso
  const createInstallmentMutation = useMutation({
    mutationFn: async (data: InstallmentForm) => {
      
      if (!userData?.organization?.id) {
        throw new Error('Organization ID not found')
      }

      // Validar que la billetera existe
      if (!data.wallet_id) {
        throw new Error('Wallet ID is required')
      }

      const selectedWallet = wallets?.find(w => w.wallets?.id === data.wallet_id)
      if (!selectedWallet) {
        throw new Error(`Wallet with ID ${data.wallet_id} not found`)
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

      // Usar el ID conocido del tipo "Ingresos" (concepto de sistema)
      const typeId = '8862eee7-dd00-4f01-9335-5ea0070d3403'

      // El wallet_id del formulario es el ID real de la billetera, pero movements.wallet_id
      // referencia a organization_wallets.id, no a wallets.id
      const organizationWallet = wallets?.find(w => w.wallets?.id === data.wallet_id)
      if (!organizationWallet) {
        throw new Error(`Organization wallet not found for wallet ID: ${data.wallet_id}`)
      }

      const movementData = {
        organization_id: userData?.organization?.id,
        project_id: projectId,
        movement_date: data.movement_date.toISOString().split('T')[0],
        currency_id: data.currency_id,
        wallet_id: organizationWallet.id, // Usar el ID de organization_wallets
        amount: data.amount,
        description: data.description || null,
        exchange_rate: data.exchange_rate || null,
        type_id: typeId,
        category_id: subcategory.parent_id,
        subcategory_id: data.subcategory_id,
        contact_id: data.contact_id, // Campo contact_id directo
        created_by: userData?.memberships?.find(m => m.organization_id === userData?.organization?.id)?.id || null, // Usar el ID del miembro de la organización
      }



      if (editingInstallment) {
        // Actualizar el movimiento
        const { data: movement, error: movementError } = await supabase!
          .from('movements')
          .update(movementData)
          .eq('id', editingInstallment.id)
          .select()
          .single()

        if (movementError) throw movementError

        // No more third party contributions table

        return movement
      } else {
        // Crear el movimiento
        const { data: movement, error: movementError } = await supabase!
          .from('movements')
          .insert([movementData])
          .select()
          .single()

        if (movementError) throw movementError

        // No more third party contributions table

        return movement
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installments'] })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.invalidateQueries({ queryKey: ['movement-view'] })
      toast({
        title: editingInstallment ? 'Aporte actualizado' : 'Aporte registrado',
        description: editingInstallment 
          ? 'El aporte ha sido actualizado correctamente'
          : 'El aporte ha sido registrado correctamente',
      })
      onClose()
    },
    onError: (error) => {

      
      let errorMessage = error.message || 'Error desconocido'
      
      // Si es un error de Supabase, extraer información más detallada
      if ((error as any).code) {
        errorMessage = `Código ${(error as any).code}: ${error.message}`
        if ((error as any).details) {
          errorMessage += `\nDetalles: ${(error as any).details}`
        }
        if ((error as any).hint) {
          errorMessage += `\nSugerencia: ${(error as any).hint}`
        }
      }
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Error al ${editingInstallment ? 'actualizar' : 'registrar'} el aporte: ${errorMessage}`,
      })
    }
  })

  const onSubmit = async (data: InstallmentForm) => {
    console.log('🔄 Form submission started', data)
    console.log('🔄 Form errors:', form.formState.errors)
    console.log('🔄 Form isValid:', form.formState.isValid)
    
    try {
      await createInstallmentMutation.mutateAsync(data)
    } catch (error) {
      console.error('❌ Mutation error:', error)
    }
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
              <AvatarFallback>CL</AvatarFallback>
            </Avatar>
            <span className="text-sm">Cliente del aporte</span>
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
          {/* 1. Fecha - Concepto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* 2. Cliente */}
          <FormField
            control={form.control}
            name="contact_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente *</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectClients?.map((client) => (
                        <SelectItem key={client.contact.id} value={client.contact.id}>
                          {client.contact.company_name || client.contact.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 3. Moneda - Billetera */}
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
                        {currencies?.map((orgCurrency) => (
                          <SelectItem key={orgCurrency.currency?.id} value={orgCurrency.currency?.id}>
                            {orgCurrency.currency?.name} ({orgCurrency.currency?.symbol})
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
                        {wallets?.map((orgWallet) => (
                          <SelectItem 
                            key={orgWallet.wallets?.id} 
                            value={orgWallet.wallets?.id || ''}
                          >
                            {orgWallet.wallets?.name || 'Sin nombre'}
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

          {/* 4. Monto - Cotización */}
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
                      placeholder="Ej: 1000.00"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* 5. Descripción */}
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

  const handleSubmitClick = () => {
    console.log('🔘 Submit button clicked')
    console.log('🔘 Form values:', form.getValues())
    console.log('🔘 Form errors:', form.formState.errors)
    console.log('🔘 Form isValid:', form.formState.isValid)
    console.log('🔘 Form isDirty:', form.formState.isDirty)
    
    form.handleSubmit(onSubmit)()
  }

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={editingInstallment ? "Actualizar" : "Guardar Aporte"}
      onRightClick={handleSubmitClick}
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