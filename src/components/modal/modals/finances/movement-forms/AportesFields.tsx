import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { MovementForm } from '../MovementFormModal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { DollarSign } from "lucide-react"
import UserSelector from "@/components/ui-custom/UserSelector"
import { useProjectClients } from "@/hooks/use-project-clients"
import { useCurrentUser } from "@/hooks/use-current-user"

interface Props {
  form: UseFormReturn<MovementForm>
  currencies: any[]
  wallets: any[]
  members: any[]
  concepts: any[]
}

export function AportesFields({ form, currencies, wallets, members, concepts }: Props) {
  const { userData } = useCurrentUser()
  const { data: projectClients } = useProjectClients(userData?.preferences?.last_project_id || '')
  
  // Estados para la lógica jerárquica
  const [selectedCategoryId, setSelectedCategoryId] = React.useState(form.watch('category_id') || '')
  const [initialized, setInitialized] = React.useState(false)
  
  // Obtener categorías basadas en el tipo seleccionado
  const selectedTypeId = form.watch('type_id')
  const categories = React.useMemo(() => {
    if (!selectedTypeId || !concepts) return []
    return concepts.filter((concept: any) => concept.parent_id === selectedTypeId)
  }, [selectedTypeId, concepts])

  // Efecto para inicializar valores por defecto SOLO UNA VEZ cuando están disponibles los datos
  React.useEffect(() => {
    if (!currencies || !wallets || !members || initialized) return
    
    const currentValues = form.getValues()
    let hasChanges = false
    
    // Inicializar billetera por defecto si no hay una seleccionada
    if (!currentValues.wallet_id && wallets.length > 0) {
      const defaultWallet = wallets.find(w => w.is_default) || wallets[0]
      if (defaultWallet) {
        form.setValue('wallet_id', defaultWallet.id)
        hasChanges = true
      }
    }
    
    // Inicializar moneda por defecto si no hay una seleccionada
    if (!currentValues.currency_id && currencies.length > 0) {
      const defaultCurrency = currencies.find(c => c.is_default) || currencies[0]
      if (defaultCurrency) {
        form.setValue('currency_id', defaultCurrency.currency_id)
        hasChanges = true
      }
    }
    
    // Inicializar creador si no hay uno seleccionado
    if (!currentValues.created_by && members.length > 0) {
      const currentMember = members.find(m => m.user_id === userData?.user?.id)
      if (currentMember) {
        form.setValue('created_by', currentMember.id)
        hasChanges = true
      }
    }
    
    // Marcar como inicializado para evitar futuros resets
    if (hasChanges) {
      setInitialized(true)
    }
  }, [currencies, wallets, members, userData?.user?.id, form, initialized])

  // Efecto para actualizar selectedCategoryId cuando cambia category_id en el form
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'category_id') {
        setSelectedCategoryId(value.category_id || '')
      }
    })
    return () => subscription.unsubscribe()
  }, [form])
  
  // Efecto para mantener el valor de categoría cuando las categorías se cargan
  React.useEffect(() => {
    const currentCategoryId = form.getValues('category_id')
    if (currentCategoryId && categories.length > 0) {
      // Verificar si la categoría actual está en la lista de categorías disponibles
      const categoryExists = categories.find(cat => cat.id === currentCategoryId)
      if (categoryExists) {
        setSelectedCategoryId(currentCategoryId)
      }
    }
  }, [categories, form])

  return (
    <>
      {/* Separador y título de sección de aportes */}
      <div className="col-span-2">
        <Separator className="mb-4" />
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-8 h-8 bg-accent/10 rounded-lg">
            <DollarSign className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">Información del Aporte de Terceros</h3>
            <p className="text-xs text-muted-foreground">Datos específicos del aporte de cliente</p>
          </div>
        </div>
      </div>

      {/* Selector de Cliente (siempre para aportes de terceros) */}
      <FormField
        control={form.control}
        name="contact_id"
        render={({ field }) => {
          // Para aportes de terceros, siempre mostrar clientes del proyecto
          const clientsData = projectClients?.map((projectClient) => ({
            id: projectClient.contact.id,
            first_name: projectClient.contact.first_name,
            last_name: projectClient.contact.last_name,
            full_name: projectClient.contact.full_name,
            company_name: projectClient.contact.company_name,
            avatar_url: projectClient.contact.avatar_url
          })) || []
          
          return (
            <FormItem>
              <FormLabel>Cliente *</FormLabel>
              <FormControl>
                <UserSelector
                  users={clientsData}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Seleccionar cliente"
                  showCompany={true} // Mostrar empresa para clientes
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )
        }}
      />

      {/* Fila: Moneda | Billetera */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="currency_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Moneda *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {currencies?.map((currency) => (
                    <SelectItem key={currency.currency_id} value={currency.currency_id}>
                      {currency.currency?.name || 'Sin nombre'}
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
              <FormLabel>Billetera *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {wallets?.map((wallet) => (
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

      {/* Fila: Cantidad | Cotización */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cantidad *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
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
                  step="0.0001"
                  min="0"
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

      {/* Descripción al final (full width) */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descripción (opcional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Descripción del movimiento..."
                rows={3}
                {...field}
                value={field.value || ''} // Asegurar que inicie vacío
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}