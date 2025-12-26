import { useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatDateForDB } from '@/lib/date-utils'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarIcon, ArrowRight } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrgCurrencyContext } from '@/hooks/use-currencies'
import { useOrganizationWallets, useOrganizationMembers } from '@/features/organization'
import { useCreateWalletTransfer } from '../hooks/use-financial-operations'

const walletTransferSchema = z.object({
  operation_date: z.date({
    required_error: "Fecha es requerida",
  }),
  source_wallet_id: z.string().min(1, 'Billetera origen es requerida'),
  destination_wallet_id: z.string().min(1, 'Billetera destino es requerida'),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  amount: z.number().min(0.01, 'Monto debe ser mayor a 0'),
  description: z.string().optional(),
}).refine((data) => data.source_wallet_id !== data.destination_wallet_id, {
  message: "La billetera origen y destino deben ser diferentes",
  path: ["destination_wallet_id"],
})

type WalletTransferFormData = z.infer<typeof walletTransferSchema>

export interface WalletTransferFormFieldsProps {
  projectId?: string
  organizationId?: string
  mode: 'create' | 'edit' | 'view'
  onSuccess: () => void
  onCancel: () => void
  hideActions?: boolean
  formRef?: React.RefObject<HTMLFormElement>
}

export function WalletTransferFormFields({ 
  projectId, 
  organizationId,
  mode, 
  onSuccess, 
  onCancel,
  hideActions = false,
  formRef
}: WalletTransferFormFieldsProps) {
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()

  const { data: wallets = [], isLoading: walletsLoading } = useOrganizationWallets(organizationId || '')
  const { data: members = [], isLoading: membersLoading } = useOrganizationMembers(organizationId || '')
  
  const orgCurrencyContext = useOrgCurrencyContext(organizationId)

  const createMutation = useCreateWalletTransfer()

  const currentMember = useMemo(() => {
    return members.find(m => m.user_id === userData?.user?.id) || null
  }, [members, userData?.user?.id])

  const form = useForm<WalletTransferFormData>({
    resolver: zodResolver(walletTransferSchema),
    defaultValues: {
      operation_date: new Date(),
      source_wallet_id: '',
      destination_wallet_id: '',
      currency_id: '',
      amount: 0,
      description: '',
    }
  })

  const isLoading = walletsLoading || membersLoading || orgCurrencyContext.isLoading

  useEffect(() => {
    if (mode === 'create') {
      if (orgCurrencyContext.defaultCurrencyId && !orgCurrencyContext.isLoading) {
        form.setValue('currency_id', orgCurrencyContext.defaultCurrencyId)
      }
    }
  }, [orgCurrencyContext.defaultCurrencyId, orgCurrencyContext.isLoading, mode, form])

  useEffect(() => {
    if (mode === 'create' && !walletsLoading && wallets.length > 0) {
      form.setValue('source_wallet_id', wallets[0].id || '')
    }
  }, [wallets, walletsLoading, mode, form])

  const onSubmit = async (data: WalletTransferFormData) => {
    if (!organizationId || !currentMember) {
      toast({
        title: "Error",
        description: "No se encontró la organización o el usuario actual",
        variant: "destructive",
      })
      return
    }

    try {
      await createMutation.mutateAsync({
        organization_id: organizationId,
        project_id: projectId || null,
        operation_date: formatDateForDB(data.operation_date),
        description: data.description || null,
        source_wallet_id: data.source_wallet_id,
        destination_wallet_id: data.destination_wallet_id,
        currency_id: data.currency_id,
        amount: data.amount,
        created_by_user_id: currentMember.user_id,
        created_by_member_id: currentMember.id,
      })

      toast({
        title: "Transferencia registrada",
        description: "La transferencia entre billeteras se ha registrado correctamente",
      })

      onSuccess()
    } catch (error: any) {
      console.error('Error creating wallet transfer:', error)
      toast({
        title: "Error al registrar transferencia",
        description: error.message || "Ocurrió un error al registrar la transferencia",
        variant: "destructive",
      })
    }
  }

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

  const sourceWalletId = form.watch('source_wallet_id')
  const availableDestinationWallets = wallets.filter(w => w.id !== sourceWalletId)

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="operation_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Fecha <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="relative">
                        <Input
                          placeholder="Seleccionar fecha"
                          value={field.value ? format(field.value, 'dd/MM/yyyy', { locale: es }) : ''}
                          className="pr-10 cursor-pointer"
                          readOnly
                          data-testid="input-wallet-transfer-date"
                        />
                        <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        locale={es}
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
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Monto <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    data-testid="input-wallet-transfer-amount"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-end">
          <FormField
            control={form.control}
            name="source_wallet_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Billetera Origen <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange} disabled={walletsLoading}>
                    <SelectTrigger data-testid="select-wallet-transfer-source">
                      <SelectValue placeholder="Seleccionar origen" />
                    </SelectTrigger>
                    <SelectContent>
                      {wallets?.map((orgWallet) => (
                        <SelectItem 
                          key={orgWallet.id} 
                          value={orgWallet.id}
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

          <div className="hidden md:flex items-center justify-center pb-2">
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>

          <FormField
            control={form.control}
            name="destination_wallet_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Billetera Destino <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange} disabled={walletsLoading}>
                    <SelectTrigger data-testid="select-wallet-transfer-destination">
                      <SelectValue placeholder="Seleccionar destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDestinationWallets?.map((orgWallet) => (
                        <SelectItem 
                          key={orgWallet.id} 
                          value={orgWallet.id}
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

        <input type="hidden" {...form.register('currency_id')} />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Agregar descripción..."
                  rows={2}
                  {...field}
                  data-testid="textarea-wallet-transfer-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!hideActions && (
          <div className="flex gap-2 pt-4 border-t">
            <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 border rounded-md">
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={createMutation.isPending} 
              className="flex-[3] px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              {createMutation.isPending ? 'Registrando...' : 'Registrar Transferencia'}
            </button>
          </div>
        )}
      </form>
    </Form>
  )
}
