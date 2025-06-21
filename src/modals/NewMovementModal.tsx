import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Calendar, DollarSign, FileText } from 'lucide-react'
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
import { queryClient } from '@/lib/queryClient'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { useMovementConcepts } from '@/hooks/use-movement-concepts'
import { useCurrencies } from '@/hooks/use-currencies'
import { useWallets } from '@/hooks/use-wallets'

const createMovementSchema = z.object({
  description: z.string().optional(),
  amount: z.number().min(0.01, 'La cantidad debe ser mayor a 0'),
  type_id: z.string().min(1, 'El tipo es requerido').refine(val => val !== 'none', 'El tipo es requerido'),
  category_id: z.string().min(1, 'La categoría es requerida').refine(val => val !== 'none', 'La categoría es requerida'),
  subcategory_id: z.string().optional().refine(val => !val || val !== 'none', 'Selección inválida'),
  currency_id: z.string().min(1, 'La moneda es requerida'),
  wallet_id: z.string().min(1, 'La billetera es requerida'),
  created_by: z.string().min(1, 'El creador es requerido'),
  file_url: z.string().optional(),
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
  subcategory_id?: string
  currency_id: string
  wallet_id: string
  file_url?: string
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

  const [selectedTypeId, setSelectedTypeId] = useState<string>(editingMovement?.type_id || 'none')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(editingMovement?.category_id || 'none')
  const { data: categories = [] } = useMovementConcepts('categories', selectedTypeId === 'none' ? undefined : selectedTypeId)
  const { data: subcategories = [] } = useMovementConcepts('categories', selectedCategoryId === 'none' ? undefined : selectedCategoryId)

  // Update selected IDs when editing movement changes
  useEffect(() => {
    if (editingMovement) {
      setSelectedTypeId(editingMovement.type_id || 'none')
      setSelectedCategoryId(editingMovement.category_id || 'none')
    } else {
      setSelectedTypeId('none')
      setSelectedCategoryId('none')
    }
  }, [editingMovement])

  const form = useForm<CreateMovementForm>({
    resolver: zodResolver(createMovementSchema),
    defaultValues: {
      created_at: new Date(),
      created_by: '',
      description: '',
      amount: 0,
      type_id: 'none',
      category_id: 'none',
      subcategory_id: 'none',
      currency_id: '',
      wallet_id: '',
      file_url: '',
    }
  })

  // Reset form when editing movement changes
  useEffect(() => {
    if (editingMovement) {
      form.reset({
        created_at: new Date(editingMovement.created_at),
        created_by: editingMovement.created_by || '',
        description: editingMovement.description || '',
        amount: editingMovement.amount || 0,
        type_id: editingMovement.type_id || 'none',
        category_id: editingMovement.category_id || 'none',
        subcategory_id: editingMovement.subcategory_id || 'none',
        currency_id: editingMovement.currency_id || '',
        wallet_id: editingMovement.wallet_id || '',
        file_url: editingMovement.file_url || '',
      })
      // Set selected IDs for dropdowns
      setSelectedTypeId(editingMovement.type_id || 'none')
      setSelectedCategoryId(editingMovement.category_id || 'none')
    } else {
      form.reset({
        created_at: new Date(),
        created_by: '',
        description: '',
        amount: 0,
        type_id: 'none',
        category_id: 'none',
        subcategory_id: 'none',
        currency_id: '',
        wallet_id: '',
        file_url: '',
      })
      setSelectedTypeId('none')
      setSelectedCategoryId('none')
    }
  }, [editingMovement, form])

  // Auto-select current user as creator for new movements only
  useEffect(() => {
    if (!editingMovement && userData?.user?.id && members.length > 0) {
      const currentMember = members.find(member => member.user_id === userData.user.id)
      if (currentMember && !form.getValues('created_by')) {
        form.setValue('created_by', currentMember.id)
      }
    }
  }, [userData, members, form, editingMovement])

  // Set default currency and wallet for new movements only
  useEffect(() => {
    if (!editingMovement && currencies.length > 0 && !form.getValues('currency_id')) {
      const defaultCurrency = currencies.find((c: any) => c.is_default) || currencies[0]
      if (defaultCurrency) {
        form.setValue('currency_id', defaultCurrency.currency_id)
      }
    }
  }, [currencies, form, editingMovement])

  useEffect(() => {
    if (!editingMovement && wallets.length > 0 && !form.getValues('wallet_id')) {
      const defaultWallet = wallets.find((w: any) => w.is_default) || wallets[0]
      if (defaultWallet) {
        form.setValue('wallet_id', defaultWallet.wallet_id)
      }
    }
  }, [wallets, form, editingMovement])

  const createMovementMutation = useMutation({
    mutationFn: async (formData: CreateMovementForm) => {
      console.log('Processing movement with data:', formData)
      
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      if (!organizationId || !projectId) {
        throw new Error('Organization and project must be selected')
      }

      if (editingMovement) {
        // Update existing movement
        const { error } = await supabase
          .from('movements')
          .update({
            description: formData.description || null,
            amount: formData.amount,
            type_id: formData.type_id === 'none' ? null : formData.type_id,
            category_id: formData.category_id === 'none' ? null : formData.category_id,
            subcategory_id: formData.subcategory_id === 'none' ? null : formData.subcategory_id,
            currency_id: formData.currency_id,
            wallet_id: formData.wallet_id,
            is_conversion: formData.is_conversion,
          })
          .eq('id', editingMovement.id)

        if (error) {
          console.error('Supabase error updating movement:', error)
          throw new Error(`Error updating movement: ${error.message}`)
        }

        console.log('Movement updated successfully')
      } else {
        // Create new movement
        const movementData = {
          description: formData.description || null,
          amount: formData.amount,
          type_id: formData.type_id || null,
          category_id: formData.category_id || null,
          subcategory_id: formData.subcategory_id || null,
          currency_id: formData.currency_id,
          wallet_id: formData.wallet_id,
          created_by: formData.created_by,
          file_url: formData.file_url || null,
          is_conversion: formData.is_conversion,
          created_at: formData.created_at.toISOString(),
          organization_id: organizationId,
          project_id: projectId
        }

        console.log('Submitting movement data to Supabase:', movementData)

        const { data, error } = await supabase
          .from('movements')
          .insert(movementData)
          .select()
          .single()

        if (error) {
          console.error('Supabase error:', error)
          throw new Error(`Error creating movement: ${error.message}`)
        }

        console.log('Movement created successfully:', data)
      }
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Movimiento creado correctamente"
      })
      queryClient.invalidateQueries({ queryKey: ['movements', organizationId, projectId] })
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

  const handleTypeChange = (typeId: string) => {
    setSelectedTypeId(typeId)
    setSelectedCategoryId('none')
    form.setValue('type_id', typeId)
    form.setValue('category_id', 'none')
    form.setValue('subcategory_id', 'none')
  }

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    form.setValue('category_id', categoryId)
    form.setValue('subcategory_id', 'none')
  }

  const header = (
    <CustomModalHeader
      title={editingMovement ? 'Editar movimiento' : 'Nuevo movimiento'}
      description={editingMovement ? 'Actualiza la información del movimiento' : 'Registra un nuevo movimiento financiero'}
      onClose={onClose}
    />
  )

  const body = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-0" id="movement-form">
        <CustomModalBody padding="md">
          {/* 1. Fecha */}
          <FormField
            control={form.control}
            name="created_at"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel className="text-sm font-medium">Fecha</FormLabel>
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

            {/* 2. Creador */}
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
                                <AvatarImage src={(selectedMember as any).users?.avatar_url} />
                                <AvatarFallback className="text-xs">
                                  {(selectedMember as any).users?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 
                                   (selectedMember as any).users?.email?.slice(0, 2).toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">
                                {(selectedMember as any).users?.full_name || (selectedMember as any).users?.email || 'Usuario'}
                              </span>
                            </>
                          )}
                          {!selectedMember && <SelectValue placeholder="Seleccionar creador" />}
                        </div>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {members.map((member: any) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={member.users?.avatar_url} />
                              <AvatarFallback className="text-xs">
                                {member.users?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 
                                 member.users?.email?.slice(0, 2).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">
                              {member.users?.full_name || member.users?.email || 'Usuario'}
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

          {/* 3. Tipo */}
          <FormField
            control={form.control}
            name="type_id"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel className="text-sm font-medium">Tipo</FormLabel>
                <Select onValueChange={handleTypeChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Seleccionar tipo</SelectItem>
                    {types.map((type: any) => (
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

          {/* 4. Categoría */}
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel className="text-sm font-medium">Categoría</FormLabel>
                <Select onValueChange={handleCategoryChange} value={field.value} disabled={!selectedTypeId || selectedTypeId === 'none'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Seleccionar categoría</SelectItem>
                    {categories.map((category: any) => (
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

          {/* 5. Subcategoría */}
          <FormField
            control={form.control}
            name="subcategory_id"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel className="text-sm font-medium">Subcategoría</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCategoryId || selectedCategoryId === 'none'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar subcategoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Seleccionar subcategoría</SelectItem>
                    {subcategories.map((subcategory: any) => (
                      <SelectItem key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 6. Moneda */}
          <FormField
            control={form.control}
            name="currency_id"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel className="text-sm font-medium">Moneda</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar moneda" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {currencies.map((currency: any) => (
                      <SelectItem key={currency.id} value={currency.currency_id}>
                        {currency.currencies?.name} ({currency.currencies?.code}) {currency.is_default && "(Por defecto)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 7. Billetera */}
          <FormField
            control={form.control}
            name="wallet_id"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel className="text-sm font-medium">Billetera</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar billetera" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {wallets.map((wallet: any) => (
                      <SelectItem key={wallet.id} value={wallet.wallet_id}>
                        {wallet.wallets?.name} {wallet.is_default && "(Por defecto)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 8. Cantidad */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel className="text-sm font-medium">Cantidad</FormLabel>
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

          {/* 9. Descripción */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="col-span-2">
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

          {/* 10. Archivo */}
          <FormField
            control={form.control}
            name="file_url"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel className="text-sm font-medium">Archivo</FormLabel>
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
        </CustomModalBody>
      </form>
    </Form>
  )

  const footer = (
    <CustomModalFooter
      onCancel={onClose}
      onSave={form.handleSubmit(handleSubmit)}
      saveText={editingMovement ? 'Actualizar' : 'Crear movimiento'}
      saveLoading={createMovementMutation.isPending}
    />
  )

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      {{ header, body, footer }}
    </CustomModalLayout>
  )
}