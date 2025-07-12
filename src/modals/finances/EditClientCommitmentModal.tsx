import React, { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout'
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader'
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody'
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface EditClientCommitmentModalProps {
  open: boolean
  onClose: () => void
  clientData: {
    contact_id: string
    contact?: {
      id: string
      first_name: string
      last_name: string
      company_name?: string
      avatar_url?: string
    }
    client?: {
      currency_id?: string
      committed_amount?: number
    }
  } | null
  organizationId: string
  projectId: string
}

export function EditClientCommitmentModal({
  open,
  onClose,
  clientData,
  organizationId,
  projectId
}: EditClientCommitmentModalProps) {
  const [currencyId, setCurrencyId] = useState('')
  const [committedAmount, setCommittedAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Get organization currencies
  const { data: currencies = [] } = useQuery({
    queryKey: ['organization-currencies', organizationId],
    queryFn: async () => {
      if (!supabase || !organizationId) {
        console.log('Missing supabase or organizationId:', { supabase: !!supabase, organizationId })
        return []
      }
      
      console.log('Fetching currencies for organizationId:', organizationId)
      
      const { data, error } = await supabase
        .from('organization_currencies')
        .select(`
          currencies!inner(
            id,
            name,
            code,
            symbol
          )
        `)
        .eq('organization_id', organizationId)

      if (error) {
        console.error('Error fetching currencies:', error)
        throw error
      }
      
      const mappedCurrencies = data?.map(item => item.currencies) || []
      console.log('Mapped currencies:', mappedCurrencies)
      return mappedCurrencies
    },
    enabled: !!organizationId && !!supabase && open
  })

  // Initialize form when modal opens or clientData changes
  useEffect(() => {
    if (open && clientData) {
      console.log('Modal opened with clientData:', clientData)
      console.log('Setting currency_id:', clientData.client?.currency_id)
      console.log('Setting committed_amount:', clientData.client?.committed_amount)
      setCurrencyId(clientData.client?.currency_id || '')
      setCommittedAmount(clientData.client?.committed_amount?.toString() || '')
    }
  }, [open, clientData])

  // Debug currencies
  useEffect(() => {
    console.log('Currencies loaded:', currencies)
  }, [currencies])

  const handleSave = async () => {
    if (!clientData || !currencyId || !committedAmount) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('project_clients')
        .update({
          currency_id: currencyId,
          committed_amount: parseFloat(committedAmount)
        })
        .eq('project_id', projectId)
        .eq('client_id', clientData.contact_id)

      if (error) throw error

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['project-clients'] })
      queryClient.invalidateQueries({ queryKey: ['installments'] })

      toast({
        title: "Éxito",
        description: "Compromiso actualizado correctamente"
      })

      onClose()
    } catch (error) {
      console.error('Error updating client commitment:', error)
      toast({
        title: "Error",
        description: "Error al actualizar el compromiso",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setCurrencyId('')
    setCommittedAmount('')
    onClose()
  }

  if (!clientData || !open) return null

  const displayName = clientData.contact?.company_name || 
                     `${clientData.contact?.first_name || ''} ${clientData.contact?.last_name || ''}`.trim()
  const initials = clientData.contact?.company_name 
    ? clientData.contact.company_name.charAt(0).toUpperCase()
    : `${clientData.contact?.first_name?.charAt(0) || ''}${clientData.contact?.last_name?.charAt(0) || ''}`.toUpperCase()

  return (
    <CustomModalLayout open={open} onClose={handleClose}>
      {{
        header: (
          <CustomModalHeader
            title="Editar Compromiso"
            description={`Modificar compromiso financiero del cliente`}
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody columns={1}>
            {/* Client Info */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Cliente</label>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={clientData.contact?.avatar_url || ''} />
                  <AvatarFallback className="text-sm">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium">{displayName}</div>
                  {clientData.contact?.company_name && (
                    <div className="text-xs text-muted-foreground">
                      {clientData.contact.first_name} {clientData.contact.last_name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Currency Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Moneda <span className="text-destructive">*</span>
              </label>
              <Select value={currencyId} onValueChange={setCurrencyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una moneda" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency, index) => (
                    <SelectItem key={`currency-${currency.id}-${index}`} value={currency.id}>
                      {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Committed Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Monto Comprometido <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                value={committedAmount}
                onChange={(e) => setCommittedAmount(e.target.value)}
                placeholder="Ingresa el monto comprometido"
                min="0"
                step="0.01"
              />
              {currencyId && (
                <div className="text-xs text-muted-foreground">
                  {currencies.find(c => c.id === currencyId)?.symbol} {parseFloat(committedAmount || '0').toLocaleString('es-AR')}
                </div>
              )}
            </div>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleClose}
            onSubmit={handleSave}
            isLoading={isLoading}
            saveDisabled={isLoading || !currencyId || !committedAmount}
            submitText="Guardar"
            cancelText="Cancelar"
          />
        )
      }}
    </CustomModalLayout>
  )
}