import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { MovementForm } from '../MovementFormModal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Users } from "lucide-react"
import UserSelector from "@/components/ui-custom/UserSelector"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Button } from "@/components/ui/button"
import { Link } from "wouter"
import { useGlobalModalStore } from "@/components/modal/form/useGlobalModalStore"

interface Props {
  form: UseFormReturn<MovementForm>
  currencies: any[]
  wallets: any[]
  members: any[]
  concepts: any[]
  projectClients?: any[]
}

export function AportesFields({ form, currencies, wallets, members, concepts, projectClients }: Props) {
  const { userData } = useCurrentUser()
  const { closeModal } = useGlobalModalStore()
  

  
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
          
          // Mostrar estado vacío si no hay clientes
          if (!clientsData || clientsData.length === 0) {
            return (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <FormControl>
                  <div className="flex items-center justify-center p-4 border-accent border-dashed border-2 rounded-lg bg-muted/50">
                    <div className="text-center">
                      <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Aún no tienes Clientes, ¿quieres agregar uno?
                      </p>
                      <Link href="/finances/clients">
                        <Button variant="default" size="sm" onClick={closeModal}>
                          Agregar
                        </Button>
                      </Link>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )
          }

          return (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
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
                  {currencies?.map((orgCurrency) => (
                    <SelectItem key={orgCurrency.currency?.id} value={orgCurrency.currency?.id || ''}>
                      {orgCurrency.currency?.name || 'Sin nombre'} ({orgCurrency.currency?.symbol || '$'})
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