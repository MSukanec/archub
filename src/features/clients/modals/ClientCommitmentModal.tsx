import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DollarSign } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useOrganizationMembers } from '@/features/organization'
import { useModalPanelStore } from '@/components/modal/form/modalPanelStore'
import { formatContactName } from '@/utils/contacts'
import { 
  useProjectClients, 
  useClientCommitment, 
  useCreateClientCommitment, 
  useUpdateClientCommitment 
} from '@/features/clients/hooks'

const clientCommitmentSchema = z.object({
  created_by: z.string().min(1, 'Creador es requerido'),
  client_id: z.string().min(1, 'Cliente es requerido'),
  amount: z.number().min(0.01, 'Monto debe ser mayor a 0'),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  exchange_rate: z.number().optional(),
  commitment_method: z.enum(['fixed', 'installments', 'work_progress']),
})

type ClientCommitmentForm = z.infer<typeof clientCommitmentSchema>

interface ClientCommitmentModalProps {
  modalData: {
    projectId: string
    organizationId: string
    commitmentId?: string
    mode?: 'create' | 'edit' | 'view'
  }
  onClose: () => void
}

export function ClientCommitmentModal({ modalData, onClose }: ClientCommitmentModalProps) {
  const { projectId, organizationId, commitmentId, mode = 'create' } = modalData
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()
  const { setPanel } = useModalPanelStore()

  // Fetch existing commitment data for edit/view mode
  const { data: existingCommitment, isLoading: loadingCommitment } = useClientCommitment(
    commitmentId,
    organizationId
  )

  // Hooks para obtener datos
  const { data: currencies, isLoading: currenciesLoading } = useOrganizationCurrencies(organizationId)
  const { data: projectClients, isLoading: clientsLoading } = useProjectClients(projectId, organizationId)
  const { data: members = [], isLoading: membersLoading } = useOrganizationMembers(organizationId)

  // Find current member
  const currentMember = React.useMemo(() => {
    return members.find(m => m.user_id === userData?.user?.id) || null
  }, [members, userData?.user?.id])

  // Get default exchange rate for selected currency
  const getCurrencyExchangeRate = (currencyId: string) => {
    return 1 // Default exchange rate
  }

  const form = useForm<ClientCommitmentForm>({
    resolver: zodResolver(clientCommitmentSchema),
    defaultValues: {
      created_by: '',
      client_id: '',
      amount: 0,
      currency_id: '',
      exchange_rate: undefined,
      commitment_method: 'fixed',
    }
  })

  const isLoading = currenciesLoading || clientsLoading || membersLoading || ((mode === 'edit' || mode === 'view') && loadingCommitment)

  // Set panel mode based on the mode prop
  React.useEffect(() => {
    if (mode === 'view') {
      setPanel('view')
    } else if (mode === 'edit') {
      setPanel('edit')
    } else {
      setPanel('edit')
    }
  }, [setPanel, mode])

  // Load existing commitment data
  React.useEffect(() => {
    if (existingCommitment && (mode === 'edit' || mode === 'view')) {
      form.reset({
        created_by: existingCommitment.created_by || currentMember?.id || '',
        client_id: existingCommitment.client_id || '',
        amount: existingCommitment.amount || 0,
        currency_id: existingCommitment.currency_id || '',
        exchange_rate: existingCommitment.exchange_rate || undefined,
        commitment_method: existingCommitment.commitment_method || 'fixed',
      })
    }
  }, [existingCommitment, mode, form, currentMember?.id])

  // Initialize default values for create mode
  React.useEffect(() => {
    if (mode === 'create' && !commitmentId && currentMember?.id) {
      form.setValue('created_by', currentMember.id)
      
      // Set default currency
      if (currencies && currencies.length > 0) {
        const defaultCurrency = currencies.find(c => c.is_default)
        const currencyId = defaultCurrency?.currency?.id || currencies[0].currency?.id
        if (currencyId) {
          form.setValue('currency_id', currencyId)
        }
      }
    }
  }, [currencies, mode, commitmentId, currentMember?.id, form])

  // Mutations for create/update
  const createCommitmentMutation = useCreateClientCommitment()
  const updateCommitmentMutation = useUpdateClientCommitment()

  const onSubmit = async (data: ClientCommitmentForm) => {
    try {
      if (mode === 'edit' && commitmentId) {
        await updateCommitmentMutation.mutateAsync({
          commitmentId,
          updates: {
            client_id: data.client_id,
            amount: data.amount,
            currency_id: data.currency_id,
            exchange_rate: data.exchange_rate || 1,
            commitment_method: data.commitment_method,
          },
          organizationId,
        })
      } else {
        await createCommitmentMutation.mutateAsync({
          commitment: {
            client_id: data.client_id,
            amount: data.amount,
            currency_id: data.currency_id,
            exchange_rate: data.exchange_rate || 1,
            commitment_method: data.commitment_method,
          },
          projectId,
          organizationId,
          createdBy: data.created_by,
        })
      }
      
      toast({
        title: mode === 'edit' || mode === 'view' ? 'Compromiso actualizado' : 'Compromiso creado',
        description: mode === 'edit' || mode === 'view'
          ? 'El compromiso ha sido actualizado correctamente'
          : 'El compromiso ha sido creado correctamente',
      })
      onClose()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Error al ${mode === 'edit' ? 'actualizar' : 'crear'} el compromiso: ${error.message || 'Error desconocido'}`,
      })
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  // Helper function to translate commitment method
  const getCommitmentMethodLabel = (method: string) => {
    switch (method) {
      case 'fixed':
        return 'Monto fijo'
      case 'installments':
        return 'Cuotas'
      case 'work_progress':
        return 'Avance de obra'
      default:
        return method
    }
  }

  // View panel (read-only)
  const viewPanel = (mode === 'edit' || mode === 'view') && existingCommitment ? (
    <div className="space-y-6">
      {/* Información Principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Cliente</h4>
          <div className="flex flex-col">
            <span className="text-base font-semibold">
              {formatContactName(existingCommitment.project_client?.contact) || '-'}
            </span>
            {existingCommitment.project_client?.unit && (
              <span className="text-sm text-muted-foreground">Unidad: {existingCommitment.project_client.unit}</span>
            )}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Monto Comprometido</h4>
          <span className="text-base font-bold text-blue-600 dark:text-blue-500">
            {existingCommitment.currency?.symbol} {existingCommitment.amount?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <div className="text-xs text-muted-foreground mt-1">
            {existingCommitment.currency?.code} - Tipo de cambio: {existingCommitment.exchange_rate?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </div>
        </div>
      </div>

      {/* Método de Compromiso */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Método de Compromiso</h4>
        <span className="text-base font-medium">
          {getCommitmentMethodLabel(existingCommitment.commitment_method || 'fixed')}
        </span>
      </div>

      {/* Metadatos */}
      <div className="pt-4 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <span className="font-medium">Creado:</span> {format(new Date(existingCommitment.created_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
          </div>
          {existingCommitment.updated_at && existingCommitment.updated_at !== existingCommitment.created_at && (
            <div>
              <span className="font-medium">Actualizado:</span> {format(new Date(existingCommitment.updated_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null

  // Edit panel
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
          {/* Row 1: Cliente */}
          <FormField
            control={form.control}
            name="client_id"
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
                        <SelectItem key={client.id} value={client.id}>
                          {formatContactName(client.contact)}
                          {client.unit && ` - ${client.unit}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Row 2: Moneda / Monto Comprometido / Tipo de Cambio (3 columnas en desktop) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                          <SelectItem 
                            key={orgCurrency.currency?.id} 
                            value={orgCurrency.currency?.id || ''}
                          >
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
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto Comprometido *</FormLabel>
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
                  <FormLabel>Tipo de Cambio (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      placeholder="1.00"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Row 3: Método de Compromiso */}
          <FormField
            control={form.control}
            name="commitment_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Método de Compromiso *</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Monto fijo</SelectItem>
                      <SelectItem value="installments">Cuotas</SelectItem>
                      <SelectItem value="work_progress">Avance de obra</SelectItem>
                    </SelectContent>
                  </Select>
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
      title={mode === 'create' ? 'Nuevo Compromiso de Pago' : mode === 'edit' ? 'Editar Compromiso de Pago' : 'Compromiso de Pago'}
      icon={DollarSign}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={mode === 'create' ? 'Crear Compromiso' : 'Guardar Cambios'}
      onRightClick={form.handleSubmit(onSubmit)}
      submitDisabled={!form.formState.isValid || createCommitmentMutation.isPending || updateCommitmentMutation.isPending || !currentMember?.id}
      isSubmitting={createCommitmentMutation.isPending || updateCommitmentMutation.isPending}
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
      isEditing={mode !== 'view'}
    />
  )
}
