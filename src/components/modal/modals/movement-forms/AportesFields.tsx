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
  
  // Obtener categorías basadas en el tipo seleccionado
  const selectedTypeId = form.watch('type_id')
  const categories = React.useMemo(() => {
    if (!selectedTypeId || !concepts) return []
    return concepts.filter((concept: any) => concept.parent_id === selectedTypeId)
  }, [selectedTypeId, concepts])

  // Efecto para inicializar valores por defecto cuando están disponibles los datos
  React.useEffect(() => {
    if (!currencies || !wallets || !members) return
    
    const currentValues = form.getValues()
    
    // Inicializar billetera por defecto si no hay una seleccionada
    if (!currentValues.wallet_id && wallets.length > 0) {
      const defaultWallet = wallets.find(w => w.is_default) || wallets[0]
      if (defaultWallet) {
        form.setValue('wallet_id', defaultWallet.id)
      }
    }
    
    // Inicializar moneda por defecto si no hay una seleccionada
    if (!currentValues.currency_id && currencies.length > 0) {
      const defaultCurrency = currencies.find(c => c.is_default) || currencies[0]
      if (defaultCurrency) {
        form.setValue('currency_id', defaultCurrency.currency_id)
      }
    }
    
    // Inicializar creador si no hay uno seleccionado
    if (!currentValues.created_by && members.length > 0) {
      const currentMember = members.find(m => m.user_id === userData?.user?.id)
      if (currentMember) {
        form.setValue('created_by', currentMember.id)
      }
    }
  }, [currencies, wallets, members, userData?.user?.id, form])

  // Efecto para actualizar selectedCategoryId cuando cambia category_id en el form
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'category_id') {
        setSelectedCategoryId(value.category_id || '')
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  return (
    <>
      {/* Fila 1: Creador | Fecha */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="created_by"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Creador *</FormLabel>
              <FormControl>
                <UserSelector
                  users={members || []}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Seleccionar creador"
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
                <Input
                  type="date"
                  value={field.value ? field.value.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const localDate = new Date(e.target.value + 'T00:00:00');
                    field.onChange(localDate);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Tipo - mantiene interactivo para cambiar */}
      <FormField
        control={form.control}
        name="type_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {concepts?.filter((concept: any) => !concept.parent_id).map((concept: any) => (
                  <SelectItem key={concept.id} value={concept.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{concept.name}</span>
                      {concept.is_system && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs font-medium text-white bg-accent rounded">
                          Sistema
                        </span>
                      )}
                    </div>
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
            <FormLabel>Categoría *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{category.name}</span>
                      {category.is_system && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs font-medium text-white bg-accent rounded">
                          Sistema
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Descripción (full width) */}
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
    </>
  )
}