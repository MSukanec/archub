import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Calendar, DollarSign, Upload, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { CustomModalLayout } from '@/components/ui-custom/CustomModalLayout'
import { CustomModalHeader } from '@/components/ui-custom/CustomModalHeader'
import { CustomModalBody } from '@/components/ui-custom/CustomModalBody'
import { CustomModalFooter } from '@/components/ui-custom/CustomModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { queryClient, apiRequest } from '@/lib/queryClient'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { useMovementConcepts } from '@/hooks/use-movement-concepts'
import { useCurrencies } from '@/hooks/use-currencies'
import { useWallets } from '@/hooks/use-wallets'

const createMovementSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida'),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  type_id: z.string().min(1, 'El tipo es requerido'),
  category_id: z.string().min(1, 'La categoría es requerida'),
  currency_id: z.string().min(1, 'La moneda es requerida'),
  wallet_id: z.string().min(1, 'La billetera es requerida'),
  created_by: z.string().min(1, 'El creador es requerido'),
  file_url: z.string().optional(),
  related_contact_id: z.string().optional(),
  related_task_id: z.string().optional(),
  is_conversion: z.boolean().default(false),
  created_at: z.date({
    required_error: "La fecha es requerida",
  })
})

type CreateMovementForm = z.infer<typeof createMovementSchema>

interface Movement {
  id: string
  description: string
  amount: number
  created_at: string
  created_by: string
  organization_id: string
  project_id: string
  type_id: string
  category_id: string
  currency_id: string
  wallet_id: string
  file_url?: string
  related_contact_id?: string
  related_task_id?: string
  is_conversion: boolean
}

interface NewMovementModalProps {
  open: boolean
  onClose: () => void
  editingMovement?: Movement | null
}

export function NewMovementModal({ open, onClose, editingMovement }: NewMovementModalProps) {
  const { toast } = useToast()
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.preferences?.last_organization_id
  const projectId = userData?.preferences?.last_project_id
  
  const { data: members = [] } = useOrganizationMembers(organizationId)
  const { data: types = [] } = useMovementConcepts('types')
  const { data: currencies = [] } = useCurrencies(organizationId)
  const { data: wallets = [] } = useWallets(organizationId)

  const [selectedTypeId, setSelectedTypeId] = useState<string>('')
  const { data: categories = [] } = useMovementConcepts('categories', selectedTypeId)

  const form = useForm<CreateMovementForm>({
    resolver: zodResolver(createMovementSchema),
    defaultValues: {
      description: '',
      amount: 0,
      type_id: '',
      category_id: '',
      currency_id: '',
      wallet_id: '',
      created_by: '',
      file_url: '',
      related_contact_id: '',
      related_task_id: '',
      is_conversion: false,
      created_at: new Date()
    }
  })

  // Set default creator when user data loads
  useEffect(() => {
    if (userData?.user?.id && members.length > 0) {
      const currentMember = members.find(member => member.user_id === userData.user.id)
      if (currentMember) {
        form.setValue('created_by', currentMember.id)
      }
    }
  }, [userData, members, form])

  // Set default currency and wallet
  useEffect(() => {
    if (currencies.length > 0) {
      const defaultCurrency = currencies.find(c => c.is_default) || currencies[0]
      form.setValue('currency_id', defaultCurrency.id)
    }
  }, [currencies, form])

  useEffect(() => {
    if (wallets.length > 0) {
      const defaultWallet = wallets.find(w => w.is_default) || wallets[0]
      form.setValue('wallet_id', defaultWallet.id)
    }
  }, [wallets, form])

  // Handle editing mode
  useEffect(() => {
    if (editingMovement) {
      setSelectedTypeId(editingMovement.type_id)
      form.reset({
        description: editingMovement.description,
        amount: editingMovement.amount,
        type_id: editingMovement.type_id,
        category_id: editingMovement.category_id,
        currency_id: editingMovement.currency_id,
        wallet_id: editingMovement.wallet_id,
        created_by: editingMovement.created_by,
        file_url: editingMovement.file_url || '',
        related_contact_id: editingMovement.related_contact_id || '',
        related_task_id: editingMovement.related_task_id || '',
        is_conversion: editingMovement.is_conversion,
        created_at: new Date(editingMovement.created_at)
      })
    } else {
      setSelectedTypeId('')
      form.reset({
        description: '',
        amount: 0,
        type_id: '',
        category_id: '',
        currency_id: '',
        wallet_id: '',
        created_by: '',
        file_url: '',
        related_contact_id: '',
        related_task_id: '',
        is_conversion: false,
        created_at: new Date()
      })
    }
  }, [editingMovement, form])

  const createMovementMutation = useMutation({
    mutationFn: async (formData: CreateMovementForm) => {
      const endpoint = editingMovement ? `/api/movements/${editingMovement.id}` : '/api/movements'
      const method = editingMovement ? 'PATCH' : 'POST'
      
      const movementData = {
        ...formData,
        organization_id: organizationId,
        project_id: projectId,
        created_at: formData.created_at.toISOString()
      }

      return await apiRequest(endpoint, {
        method,
        body: JSON.stringify(movementData)
      })
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: editingMovement ? "Movimiento actualizado correctamente" : "Movimiento creado correctamente"
      })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      onClose()
    },
    onError: (error: any) => {
      console.error('Error creating movement:', error)
      toast({
        title: "Error",
        description: "No se pudo crear el movimiento",
        variant: "destructive"
      })
    }
  })

  const handleSubmit = (data: CreateMovementForm) => {
    createMovementMutation.mutate(data)
  }

  const selectedMember = members.find(member => member.id === form.watch('created_by'))

  // Handle type change to reset category
  const handleTypeChange = (typeId: string) => {
    setSelectedTypeId(typeId)
    form.setValue('type_id', typeId)
    form.setValue('category_id', '') // Reset category when type changes
  }

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-0">
          <CustomModalHeader
            title={editingMovement ? "Editar Movimiento" : "Nuevo Movimiento"}
            description={editingMovement ? "Actualiza la información del movimiento" : "Registra un nuevo movimiento financiero"}
            onClose={onClose}
          />

          <CustomModalBody padding="md">
            <div className="space-y-4">
              {/* Date Field */}
              <FormField
                control={form.control}
                name="created_at"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-sm font-medium">Fecha de creación</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Creator Field */}
              <FormField
                control={form.control}
                name="created_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Creador</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <div className="flex items-center gap-2">
                            {selectedMember && (
                              <>
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={selectedMember.users?.avatar_url} />
                                  <AvatarFallback className="text-xs">
                                    {selectedMember.users?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 
                                     selectedMember.users?.email?.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate">
                                  {selectedMember.users?.full_name || selectedMember.users?.email}
                                </span>
                              </>
                            )}
                            {!selectedMember && <SelectValue placeholder="Seleccionar creador" />}
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={member.users?.avatar_url} />
                                <AvatarFallback className="text-xs">
                                  {member.users?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 
                                   member.users?.email?.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">
                                {member.users?.full_name || member.users?.email}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description Field */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe el movimiento financiero..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount Field */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Monto</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="pl-10"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Type Field */}
              <FormField
                control={form.control}
                name="type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Tipo</FormLabel>
                    <Select onValueChange={handleTypeChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {types.map((type) => (
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

              {/* Category Field */}
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Categoría</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedTypeId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Currency Field */}
              <FormField
                control={form.control}
                name="currency_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Moneda</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar moneda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.id} value={currency.id}>
                            {currency.id} {currency.is_default && "(Por defecto)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Wallet Field */}
              <FormField
                control={form.control}
                name="wallet_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Billetera</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar billetera" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {wallets.map((wallet) => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            {wallet.id} {wallet.is_default && "(Por defecto)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File URL Field */}
              <FormField
                control={form.control}
                name="file_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Archivo adjunto (URL)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="https://ejemplo.com/archivo.pdf"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Is Conversion Switch */}
              <FormField
                control={form.control}
                name="is_conversion"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium">Conversión de moneda</FormLabel>
                      <div className="text-xs text-muted-foreground">
                        Marca si este movimiento es una conversión entre monedas
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CustomModalBody>

          <CustomModalFooter
            onCancel={onClose}
            isLoading={createMovementMutation.isPending}
          />
        </form>
      </Form>
    </CustomModalLayout>
  )
}