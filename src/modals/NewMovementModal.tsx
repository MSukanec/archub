import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { useMovementConcepts } from '@/hooks/use-movement-concepts'
import { useCurrencies } from '@/hooks/use-currencies'
import { useOrganizationWallets } from '@/hooks/use-organization-wallets'
import { supabase } from '@/lib/supabase'
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout'
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader'
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody'
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useToast } from '@/hooks/use-toast'

const movementSchema = z.object({
  created_at: z.date(),
  created_by: z.string().min(1, 'Creador es requerido'),
  description: z.string().optional(),
  amount: z.number().min(0.01, 'Cantidad debe ser mayor a 0'),
  type_id: z.string().min(1, 'Tipo es requerido'),
  category_id: z.string().optional(),
  subcategory_id: z.string().optional(),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  wallet_id: z.string().min(1, 'Billetera es requerida')
})

type MovementForm = z.infer<typeof movementSchema>

interface Movement {
  id: string
  created_at: string
  created_by: string
  description?: string
  amount: number
  type_id: string
  category_id?: string
  subcategory_id?: string
  currency_id: string
  wallet_id: string
  organization_id: string
  project_id?: string
}

interface NewMovementModalProps {
  open: boolean
  onClose: () => void
  editingMovement?: Movement | null
}

export function NewMovementModal({ open, onClose, editingMovement }: NewMovementModalProps) {
  const { data: currentUser } = useCurrentUser()
  const organizationId = currentUser?.organization?.id
  const { data: members } = useOrganizationMembers(organizationId)
  const [selectedTypeId, setSelectedTypeId] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  
  const { data: types } = useMovementConcepts('types')
  const { data: categories } = useMovementConcepts('categories', selectedTypeId)
  const { data: subcategories } = useMovementConcepts('categories', selectedCategoryId)
  const { data: currencies } = useCurrencies(organizationId)
  const { data: wallets } = useOrganizationWallets(organizationId)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<MovementForm>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      created_at: new Date(),
      amount: 0,
      description: '',
      created_by: '',
      type_id: '',
      category_id: '',
      subcategory_id: '',
      currency_id: '',
      wallet_id: ''
    }
  })

  // Auto-select current user and defaults
  useEffect(() => {
    if (currentUser?.role?.id) {
      form.setValue('created_by', currentUser.role.id)
    }
    if (currencies && currencies.length > 0) {
      const defaultCurrency = currencies.find(c => c.is_default) || currencies[0]
      form.setValue('currency_id', defaultCurrency.id)
    }
    if (wallets && wallets.length > 0) {
      const defaultWallet = wallets.find(w => w.is_default) || wallets[0]
      form.setValue('wallet_id', defaultWallet.id)
    }
  }, [currentUser, currencies, wallets, form])

  // Load editing data
  useEffect(() => {
    if (editingMovement) {
      form.setValue('created_at', new Date(editingMovement.created_at))
      form.setValue('created_by', editingMovement.created_by)
      form.setValue('description', editingMovement.description || '')
      form.setValue('amount', editingMovement.amount)
      form.setValue('type_id', editingMovement.type_id)
      form.setValue('category_id', editingMovement.category_id || '')
      form.setValue('subcategory_id', editingMovement.subcategory_id || '')
      form.setValue('currency_id', editingMovement.currency_id)
      form.setValue('wallet_id', editingMovement.wallet_id)
    }
  }, [editingMovement, form])

  const createMovementMutation = useMutation({
    mutationFn: async (data: MovementForm) => {
      if (!supabase) throw new Error('Supabase no está disponible')
      if (!organizationId) throw new Error('No hay organización seleccionada')

      const movementData = {
        ...data,
        organization_id: organizationId,
        project_id: currentUser?.preferences?.last_project_id,
        created_at: data.created_at.toISOString()
      }

      if (editingMovement) {
        const { data: result, error } = await supabase
          .from('movements')
          .update(movementData)
          .eq('id', editingMovement.id)
          .select()
          .single()

        if (error) throw error
        return result
      } else {
        const { data: result, error } = await supabase
          .from('movements')
          .insert(movementData)
          .select()
          .single()

        if (error) throw error
        return result
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      toast({
        title: editingMovement ? 'Movimiento actualizado' : 'Movimiento creado',
        description: `El movimiento ha sido ${editingMovement ? 'actualizado' : 'creado'} exitosamente.`,
      })
      onClose()
      form.reset()
    },
    onError: (error) => {
      console.error('Error saving movement:', error)
      toast({
        title: 'Error',
        description: 'Hubo un error al guardar el movimiento. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: MovementForm) => {
    createMovementMutation.mutate(data)
  }

  // Get filtered concepts
  const typeOptions = types || []
  const categoryOptions = categories || []
  const subcategoryOptions = subcategories || []

  const selectedCreator = members?.find(m => m.id === form.watch('created_by'))

  if (!open) return null

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      {{
        header: (
          <CustomModalHeader
            title={editingMovement ? 'Editar Movimiento' : 'Nuevo Movimiento'}
            description="Gestiona los movimientos financieros del proyecto"
            onClose={onClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Accordion type="single" defaultValue="informacion-basica" collapsible>
                  <AccordionItem value="informacion-basica">
                    <AccordionTrigger>
                      Información Básica
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-3">
                      {/* Primera fila: Fecha y Creador */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="created_at"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Fecha
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  value={field.value ? field.value.toISOString().split('T')[0] : ''}
                                  onChange={(e) => field.onChange(new Date(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="created_by"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Creador
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar creador" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {members?.map((member: any) => (
                                    <SelectItem key={member.id} value={member.id}>
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                          <AvatarImage src={member.avatar_url} />
                                          <AvatarFallback>
                                            {member.full_name?.charAt(0) || member.email?.charAt(0) || '?'}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span>{member.full_name || member.email}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Segunda fila: Tipo y Categoría */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="type_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo</FormLabel>
                              <Select onValueChange={(value) => {
                                field.onChange(value)
                                setSelectedTypeId(value)
                                form.setValue('category_id', '')
                                form.setValue('subcategory_id', '')
                                setSelectedCategoryId('')
                              }} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar tipo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {typeOptions.map((type) => (
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

                        <FormField
                          control={form.control}
                          name="category_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Categoría</FormLabel>
                              <Select onValueChange={(value) => {
                                field.onChange(value)
                                setSelectedCategoryId(value)
                                form.setValue('subcategory_id', '')
                              }} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar categoría" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categoryOptions.map((category) => (
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
                      </div>

                      {/* Tercera fila: Subcategoría y Billetera */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="subcategory_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subcategoría</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar subcategoría" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {subcategoryOptions.map((subcategory) => (
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

                        <FormField
                          control={form.control}
                          name="wallet_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Billetera</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar billetera" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {wallets?.map((wallet: any) => (
                                    <SelectItem key={wallet.id} value={wallet.id}>
                                      {wallet.wallets?.name || 'Sin nombre'}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Cuarta fila: Moneda y Cantidad - misma altura */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="currency_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Moneda</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar moneda" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {currencies?.map((currency: any) => (
                                    <SelectItem key={currency.id} value={currency.id}>
                                      {currency.currencies?.name || 'Sin nombre'} ({currency.currencies?.symbol})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
                                Cantidad
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                    $
                                  </span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={field.value || ''}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    className="pl-8"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Quinta fila: Descripción */}
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descripción (opcional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Descripción del movimiento..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </form>
            </Form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={onClose}
            onSave={form.handleSubmit(onSubmit)}
            saveText={editingMovement ? 'Actualizar' : 'Crear'}
          />
        )
      }}
    </CustomModalLayout>
  )
}