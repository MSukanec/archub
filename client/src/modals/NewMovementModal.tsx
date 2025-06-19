import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Calendar, DollarSign } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { queryClient } from '@/lib/queryClient'
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
}

interface NewMovementModalProps {
  open: boolean
  onClose: () => void
  editingMovement?: Movement | null
}

export function NewMovementModal({ open, onClose, editingMovement }: NewMovementModalProps) {
  const { data: userData } = useCurrentUser()
  const { data: organizationMembers } = useOrganizationMembers(userData?.organization?.id)
  const { data: movementTypes } = useMovementConcepts('types')
  const { data: currencies } = useCurrencies()
  const { data: wallets } = useWallets(userData?.organization?.id)
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [selectedTypeId, setSelectedTypeId] = useState<string>('')
  const { data: movementCategories } = useMovementConcepts('categories', selectedTypeId)

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
      created_at: new Date()
    }
  })

  useEffect(() => {
    if (editingMovement) {
      console.log('Editing movement data:', editingMovement)
      
      form.reset({
        description: editingMovement.description,
        amount: editingMovement.amount,
        type_id: editingMovement.type_id || '',
        category_id: editingMovement.category_id || '',
        currency_id: editingMovement.currency_id || '',
        wallet_id: editingMovement.wallet_id || '',
        created_by: editingMovement.created_by || '',
        created_at: new Date(editingMovement.created_at)
      })
      setSelectedTypeId(editingMovement.type_id || '')
    } else {
      form.reset({
        description: '',
        amount: 0,
        type_id: '',
        category_id: '',
        currency_id: '',
        wallet_id: '',
        created_by: '',
        created_at: new Date()
      })
      setSelectedTypeId('')
    }
  }, [editingMovement, form, open])

  const createMovementMutation = useMutation({
    mutationFn: async (formData: CreateMovementForm) => {
      if (!userData?.user?.id) {
        throw new Error('Usuario no autenticado')
      }

      const movementData = {
        description: formData.description,
        amount: formData.amount,
        type_id: formData.type_id,
        category_id: formData.category_id,
        currency_id: formData.currency_id,
        wallet_id: formData.wallet_id,
        created_by: formData.created_by,
        organization_id: userData.organization?.id,
        project_id: userData.preferences?.last_project_id,
        created_at: formData.created_at.toISOString()
      }

      if (editingMovement) {
        // Update existing movement
        return await fetch(`/api/movements/${editingMovement.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(movementData)
        }).then(res => res.json())
      } else {
        // Create new movement
        return await fetch('/api/movements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(movementData)
        }).then(res => res.json())
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.refetchQueries({ queryKey: ['movements'] })
      
      toast({
        title: editingMovement ? "Movimiento actualizado" : "Movimiento creado",
        description: editingMovement 
          ? "El movimiento se ha actualizado correctamente." 
          : "El nuevo movimiento se ha creado correctamente."
      })
      
      onClose()
      form.reset()
    },
    onError: (error: any) => {
      console.error('Error saving movement:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar el movimiento"
      })
    }
  })

  const handleSubmit = (data: CreateMovementForm) => {
    createMovementMutation.mutate(data)
  }

  const handleTypeChange = (typeId: string) => {
    setSelectedTypeId(typeId)
    form.setValue('type_id', typeId)
    form.setValue('category_id', '') // Reset category when type changes
  }

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col h-full">
          <CustomModalHeader
            title={editingMovement ? "Editar movimiento" : "Nuevo movimiento"}
            description={editingMovement ? "Actualiza los datos del movimiento" : "Registra un nuevo movimiento financiero"}
            onClose={onClose}
          />

          <CustomModalBody padding="md">
            <div className="space-y-4">
              {/* Fecha del movimiento */}
              <FormField
                control={form.control}
                name="created_at"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-sm font-medium">Fecha del movimiento</FormLabel>
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
                              <span>Selecciona una fecha</span>
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

              {/* Creador */}
              <FormField
                control={form.control}
                name="created_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Creador</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un miembro" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Selecciona un miembro</SelectItem>
                        {organizationMembers?.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={member.users?.avatar_url || ''} />
                                <AvatarFallback className="text-xs">
                                  {member.users?.full_name ? member.users.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span>{member.users?.full_name || member.users?.email || 'Usuario'}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Descripción */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe el movimiento financiero"
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Monto */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Monto</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Moneda */}
              <FormField
                control={form.control}
                name="currency_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Moneda</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una moneda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Selecciona una moneda</SelectItem>
                        {currencies?.map((currency) => (
                          <SelectItem key={currency.id} value={currency.id}>
                            {currency.code} - {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tipo */}
              <FormField
                control={form.control}
                name="type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Tipo</FormLabel>
                    <Select onValueChange={handleTypeChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Selecciona un tipo</SelectItem>
                        {movementTypes?.map((type) => (
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

              {/* Categoría */}
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Categoría</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Selecciona una categoría</SelectItem>
                        {movementCategories?.map((category) => (
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

              {/* Billetera */}
              <FormField
                control={form.control}
                name="wallet_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Billetera</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una billetera" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Selecciona una billetera</SelectItem>
                        {wallets?.map((wallet) => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            {wallet.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CustomModalBody>

          <CustomModalFooter
            onCancel={onClose}
            onSubmit={() => form.handleSubmit(handleSubmit)()}
            cancelLabel="Cancelar"
            submitLabel={loading ? 'Guardando...' : (editingMovement ? 'Actualizar' : 'Crear movimiento')}
            disabled={loading || createMovementMutation.isPending}
          />
        </form>
      </Form>
    </CustomModalLayout>
  )
}