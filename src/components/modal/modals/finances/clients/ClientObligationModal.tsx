import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus } from 'lucide-react'
import { FormModalLayout } from '../../../form/FormModalLayout'
import { FormModalHeader } from '../../../form/FormModalHeader'
import { FormModalFooter } from '../../../form/FormModalFooter'
import { useModalPanelStore } from '../../../form/modalPanelStore'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface Contact {
  id: string
  first_name: string
  last_name: string
  company_name: string
  email: string
  phone: string
  full_name: string
}

interface ProjectClient {
  id: string
  project_id: string
  client_id: string
  contact: Contact
}

const clientObligationSchema = z.object({
  client_id: z.string().min(1, 'Cliente es requerido'),
  unit: z.string().optional(),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  committed_amount: z.number().min(0.01, 'Cantidad debe ser mayor a 0')
})

type ClientObligationForm = z.infer<typeof clientObligationSchema>

interface ClientObligationModalProps {
  modalData?: {
    projectId?: string
    organizationId?: string
    editingClient?: any
    isEditing?: boolean
  }
  onClose: () => void
}

export default function ClientObligationModal({ modalData, onClose }: ClientObligationModalProps) {
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { setPanel } = useModalPanelStore()

  const projectId = modalData?.projectId || userData?.preferences?.last_project_id
  const organizationId = modalData?.organizationId || userData?.organization?.id
  const editingClient = modalData?.editingClient
  const isEditing = modalData?.isEditing || !!editingClient

  const form = useForm<ClientObligationForm>({
    resolver: zodResolver(clientObligationSchema),
    defaultValues: {
      client_id: editingClient?.client_id || '',
      unit: editingClient?.unit || '',
      currency_id: editingClient?.currency_id || userData?.organization_preferences?.default_currency || '',
      committed_amount: editingClient?.committed_amount || 0
    }
  })

  // Get organization currencies
  const { data: currencies } = useOrganizationCurrencies(organizationId)

  // Set default currency when currencies are loaded
  useEffect(() => {
    if (currencies && currencies.length > 0 && !isEditing) {
      const defaultCurrency = userData?.organization_preferences?.default_currency || currencies[0]?.currency?.id
      if (defaultCurrency && !form.watch('currency_id')) {
        form.setValue('currency_id', defaultCurrency)
      }
    }
  }, [currencies, userData?.organization_preferences?.default_currency, form, isEditing])

  // Initialize panel to edit mode when modal opens
  useEffect(() => {
    setPanel('edit')
  }, [])

  // Get organization contacts
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
          phone,
          full_name
        `)
        .eq('organization_id', organizationId)
        .order('first_name', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!organizationId && !!supabase
  })

  // Get project clients to filter available contacts
  const { data: projectClients } = useQuery({
    queryKey: ['project-clients', projectId],
    queryFn: async () => {
      if (!supabase || !projectId || !organizationId) throw new Error('Missing required parameters')
      
      const { data, error } = await supabase
        .from('project_clients')
        .select(`
          *,
          contact:contacts!inner(
            id,
            first_name,
            last_name,
            company_name,
            email,
            phone,
            full_name
          )
        `)
        .eq('project_id', projectId)
        .eq('contact.organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!projectId && !!organizationId && !!supabase
  })

  // Mutation for create/update client
  const saveClientMutation = useMutation({
    mutationFn: async (data: ClientObligationForm) => {
      if (!supabase || !organizationId) throw new Error('Supabase client not initialized or missing organization ID')
      
      if (isEditing && editingClient) {
        // Update existing client
        const { data: result, error } = await supabase
          .from('project_clients')
          .update({
            client_id: data.client_id,
            unit: data.unit || null,
            committed_amount: data.committed_amount,
            currency_id: data.currency_id
          })
          .eq('id', editingClient.id)
          .select()

        if (error) throw error
        return result
      } else {
        // Create new client
        const { data: result, error } = await supabase
          .from('project_clients')
          .insert({
            project_id: projectId,
            client_id: data.client_id,
            unit: data.unit || null,
            committed_amount: data.committed_amount,
            currency_id: data.currency_id,
            organization_id: organizationId
          })
          .select()

        if (error) throw error
        return result
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Compromiso actualizado" : "Compromiso creado",
        description: isEditing 
          ? "El compromiso de pago ha sido actualizado exitosamente"
          : "El compromiso de pago del cliente ha sido registrado exitosamente",
      })
      queryClient.invalidateQueries({ queryKey: ['project-clients', organizationId, projectId] })
      form.reset()
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: isEditing ? "Error al actualizar" : "Error al crear compromiso",
        description: error.message || "Hubo un problema al procesar el compromiso",
        variant: "destructive",
      })
    }
  })

  // Reset form when editing client changes
  useEffect(() => {
    if (editingClient) {
      form.reset({
        client_id: editingClient.client_id || '',
        unit: editingClient.unit || '',
        currency_id: editingClient.currency_id || userData?.organization_preferences?.default_currency || '',
        committed_amount: editingClient.committed_amount || 0
      })
    }
  }, [editingClient, form])

  const onSubmit = async (data: ClientObligationForm) => {
    await saveClientMutation.mutateAsync(data)
  }

  // Get available contacts (not already clients, but include current client if editing)
  const availableContacts = organizationContacts?.filter(contact => {
    if (isEditing && editingClient?.client_id === contact.id) {
      return true // Allow current client when editing
    }
    return !projectClients?.some(client => client.client_id === contact.id)
  }) || []

  const viewPanel = (
    <div>
      <p className="text-muted-foreground">
        {isEditing 
          ? "Modifica los datos del compromiso de pago del cliente."
          : "Crea un nuevo compromiso de pago especificando el cliente, la moneda y el monto comprometido."
        }
      </p>
    </div>
  )

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        {/* Fila: Cliente | Unidad Funcional */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Cliente */}
          <FormField
            control={form.control}
            name="client_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">Cliente</FormLabel>
                <FormControl>
                  {organizationContacts === undefined ? (
                    <div className="text-sm text-muted-foreground">Cargando contactos...</div>
                  ) : (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un contacto disponible" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableContacts.length === 0 ? (
                          <SelectItem value="" disabled>
                            No hay contactos disponibles
                          </SelectItem>
                        ) : (
                          availableContacts.map(contact => {
                            const displayName = contact.company_name || 
                                             `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                            return (
                              <SelectItem key={contact.id} value={contact.id}>
                                {displayName}
                              </SelectItem>
                            )
                          })
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Unidad Funcional */}
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">Unidad Funcional (Opcional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Departamento 1A, Local 101, etc."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Fila: Moneda | Cantidad */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Moneda */}
          <FormField
            control={form.control}
            name="currency_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">Moneda</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies?.map(currency => (
                        <SelectItem key={currency.currency.id} value={currency.currency.id}>
                          {currency.currency.symbol} - {currency.currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Cantidad */}
          <FormField
            control={form.control}
            name="committed_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">Cantidad</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

      </form>
    </Form>
  )

  const headerContent = (
    <FormModalHeader
      title={isEditing ? "Editar Compromiso de Pago" : "Nuevo Compromiso de Pago"}
      icon={UserPlus}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isEditing ? "Actualizar Compromiso" : "Crear Compromiso"}
      onRightClick={() => form.handleSubmit(onSubmit)()}
      submitDisabled={!form.formState.isValid || availableContacts.length === 0}
      showLoadingSpinner={saveClientMutation.isPending}
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