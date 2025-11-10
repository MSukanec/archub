import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { DollarSign, Receipt } from 'lucide-react'
import { Table } from "@/components/ui-custom/tables-and-trees/Table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { convertCurrency } from '@/ai/utils/currencyConverter'

interface PersonnelPaymentsTabProps {
  openModal: any
  selectedProjectId: string | null
  currentOrganizationId: string | null
}

interface PaymentsByCurrency {
  [contactId: string]: {
    [currencyName: string]: number
  }
}

interface PaymentData {
  amount: number
  currency_name: string
  exchange_rate: number
}

interface PaymentsByContact {
  [contactId: string]: PaymentData[]
}

export default function PersonnelPaymentsTab({ 
  openModal, 
  selectedProjectId,
  currentOrganizationId
}: PersonnelPaymentsTabProps) {
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active')

  const { data: personnelData = [], isLoading: isPersonnelLoading } = useQuery({
    queryKey: ['project-personnel', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return []
      
      const { data, error } = await supabase
        .from('project_personnel')
        .select(`
          id,
          notes,
          created_at,
          contact:contacts(
            id,
            first_name,
            last_name,
            full_name
          ),
          labor_type:labor_types(
            id,
            name
          )
        `)
        .eq('project_id', selectedProjectId)

      if (error) throw error
      
      // Helper para obtener nombre
      const getDisplayName = (contact: any) => {
        if (!contact) return 'Sin nombre'
        if (contact.first_name || contact.last_name) {
          return `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
        }
        return contact.full_name || 'Sin nombre'
      }
      
      // Agregar campo displayName
      const withDisplayNames = (data || []).map((item: any) => ({
        ...item,
        displayName: getDisplayName(item.contact)
      }))
      
      return withDisplayNames
    },
    enabled: !!selectedProjectId
  })

  const { data: paymentsData = [], isLoading: isPaymentsLoading } = useQuery({
    queryKey: ['personnel-payments', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return []
      
      const { data, error } = await supabase
        .from('movement_payments_view')
        .select('*')
        .eq('project_id', selectedProjectId)
        .eq('movement_type', 'expense')
        .eq('contact_role', 'personnel')

      if (error) throw error
      
      return data || []
    },
    enabled: !!selectedProjectId
  })

  // Fetch active rates and pending payments for all personnel using batch endpoint
  const { data: batchData, isLoading: isBatchLoading } = useQuery({
    queryKey: ['personnel-batch-data', selectedProjectId, currentOrganizationId, personnelData.map((p: any) => p.id).join(',')],
    queryFn: async () => {
      if (!selectedProjectId || !currentOrganizationId || personnelData.length === 0) {
        return { rates: {}, pending: {} }
      }
      
      const personnelIds = personnelData.map((p: any) => p.id)
      const params = new URLSearchParams({
        organization_id: currentOrganizationId,
        project_id: selectedProjectId,
        date: new Date().toISOString().split('T')[0]
      })
      
      // Add personnelIds as array params
      personnelIds.forEach((id: string) => {
        params.append('personnelIds', id)
      })
      
      const url = `/api/personnel/batch?${params.toString()}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch batch data: ${response.statusText}`)
      }
      
      return await response.json()
    },
    enabled: !!selectedProjectId && !!currentOrganizationId && personnelData.length > 0
  })

  // Calcular la sumatoria de pagos por contact_id agrupados por moneda (para display)
  const paymentsByCurrency: PaymentsByCurrency = {}
  
  // Almacenar pagos con exchange_rate para ordenamiento correcto
  const paymentsByContact: PaymentsByContact = {}
  
  paymentsData.forEach((payment: any) => {
    const contactId = payment.contact_id
    const currencyName = payment.currency_name || 'ARS'
    const amount = payment.amount || 0
    const exchangeRate = payment.exchange_rate || 1
    
    // Para display: agrupar por moneda
    if (!paymentsByCurrency[contactId]) {
      paymentsByCurrency[contactId] = {}
    }
    
    if (!paymentsByCurrency[contactId][currencyName]) {
      paymentsByCurrency[contactId][currencyName] = 0
    }
    
    paymentsByCurrency[contactId][currencyName] += amount
    
    // Para sorting: almacenar con exchange_rate
    if (!paymentsByContact[contactId]) {
      paymentsByContact[contactId] = []
    }
    
    paymentsByContact[contactId].push({
      amount,
      currency_name: currencyName,
      exchange_rate: exchangeRate
    })
  })

  // Función para formatear el total de pagos (sin cambios, mantiene formato multi-moneda)
  const formatPaymentTotal = (contactId: string | undefined) => {
    if (!contactId || !paymentsByCurrency[contactId]) {
      return '-'
    }
    
    const currencies = paymentsByCurrency[contactId]
    const formattedAmounts = Object.entries(currencies).map(([currency, amount]) => {
      const formattedAmount = new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount)
      return `$${formattedAmount} ${currency}`
    })
    
    return formattedAmounts.join(', ')
  }

  // Función para obtener el total numérico para ordenamiento
  // CORREGIDO: Convierte todos los pagos a moneda base (ARS) antes de sumar
  const getPaymentTotalForSort = (contactId: string | undefined): number => {
    if (!contactId || !paymentsByContact[contactId]) {
      return 0
    }
    
    const BASE_EXCHANGE_RATE = 1.0 // ARS como moneda base
    
    // Convertir todos los pagos a moneda base y sumar
    const total = paymentsByContact[contactId].reduce((sum, payment) => {
      try {
        const convertedAmount = convertCurrency(
          payment.amount,
          payment.exchange_rate,
          BASE_EXCHANGE_RATE
        )
        return sum + convertedAmount
      } catch (error) {
        // Si hay error en conversión, usar el monto original
        return sum + payment.amount
      }
    }, 0)
    
    return total
  }

  // Helper para formatear tarifa activa
  const formatActiveRate = (personnelId: string | undefined): string => {
    if (!personnelId || !batchData?.rates) return '-'
    
    const rate = batchData.rates[personnelId]
    if (!rate) return 'Sin tarifa'
    
    const currency = rate.currency?.code || rate.currency_code || rate.currency_name || 'ARS'
    
    let amount = 0
    let label = ''
    
    if (rate.pay_type === 'hour' && rate.rate_hour) {
      amount = parseFloat(rate.rate_hour)
      label = '/h'
    } else if (rate.pay_type === 'day' && rate.rate_day) {
      amount = parseFloat(rate.rate_day)
      label = '/día'
    } else if (rate.pay_type === 'month' && rate.rate_month) {
      amount = parseFloat(rate.rate_month)
      label = '/mes'
    }
    
    if (amount === 0) return 'Sin tarifa'
    
    const formatted = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
    
    return `$${formatted} ${currency}${label}`
  }

  // Helper para formatear pagos pendientes
  const formatPendingPayment = (personnelId: string | undefined): string => {
    if (!personnelId || !batchData?.pending) return '-'
    
    const pendingData = batchData.pending[personnelId]
    if (!pendingData || !pendingData.pending_by_currency) {
      return '$0.00'
    }
    
    const pendingByCurrency = pendingData.pending_by_currency
    const currencies = Object.keys(pendingByCurrency)
    
    if (currencies.length === 0) {
      return '$0.00'
    }
    
    const formattedAmounts = currencies.map((currency) => {
      const amount = pendingByCurrency[currency] || 0
      const formatted = new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount)
      return `$${formatted} ${currency}`
    })
    
    return formattedAmounts.join(', ')
  }

  if (isPersonnelLoading || isPaymentsLoading || isBatchLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-muted-foreground">Cargando pagos...</div>
      </div>
    )
  }

  if (personnelData.length === 0) {
    return (
      <EmptyState
        icon={<Receipt className="h-8 w-8" />}
        title="Sin pagos registrados"
        description="Aquí verás el historial de pagos realizados al personal del proyecto."
      />
    )
  }

  // Agregar campo payment_total a cada registro para ordenamiento
  const personnelDataWithPayments = personnelData.map((record: any) => ({
    ...record,
    payment_total: getPaymentTotalForSort(record.contact?.id)
  }))

  return (
    <Table
      data={personnelDataWithPayments}
      defaultSort={{
        key: "displayName",
        direction: "asc"
      }}
      topBar={{
        tabsConfig: {
          tabs: [
            { value: 'active', label: 'Activos' },
            { value: 'inactive', label: 'Inactivos' },
            { value: 'all', label: 'Todos' }
          ],
          value: statusFilter,
          onValueChange: (value) => setStatusFilter(value as 'active' | 'inactive' | 'all')
        }
      }}
      columns={[
        {
          key: "displayName",
          label: "Nombre",
          width: "30%",
          sortable: true,
          sortType: "string",
          render: (record: any) => {
            const contact = record.contact
            if (!contact) {
              return <span className="text-muted-foreground">Sin datos</span>
            }
            
            // Lógica de nombre display consistente con PersonnelListTab
            const displayName = (contact.first_name || contact.last_name) 
              ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
              : contact.full_name || 'Sin nombre'
            
            // Iniciales
            let initials = '?'
            if (contact.first_name || contact.last_name) {
              initials = `${contact.first_name?.charAt(0) || ''}${contact.last_name?.charAt(0) || ''}`.toUpperCase()
            } else if (contact.full_name) {
              const parts = contact.full_name.trim().split(' ')
              if (parts.length >= 2) {
                initials = `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
              } else {
                initials = contact.full_name[0]?.toUpperCase() || '?'
              }
            }
            
            return (
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {displayName}
                  </p>
                  {record.notes && (
                    <p className="text-xs text-muted-foreground truncate">
                      {record.notes}
                    </p>
                  )}
                </div>
              </div>
            )
          }
        },
        {
          key: "payment_total",
          label: "Pago a la fecha",
          width: "20%",
          sortable: true,
          sortType: "number",
          render: (record: any) => {
            const paymentTotal = formatPaymentTotal(record.contact?.id)
            return (
              <span className="text-sm font-medium">
                {paymentTotal}
              </span>
            )
          }
        },
        {
          key: "active_rate",
          label: "Tarifa vigente",
          width: "18%",
          sortable: false,
          render: (record: any) => {
            const rateDisplay = formatActiveRate(record.id)
            return (
              <span className="text-sm">
                {rateDisplay}
              </span>
            )
          }
        },
        {
          key: "pending_payment",
          label: "Pendiente de pago",
          width: "17%",
          sortable: false,
          render: (record: any) => {
            const pendingDisplay = formatPendingPayment(record.id)
            const isPending = pendingDisplay !== '-' && pendingDisplay !== '$0.00'
            return (
              <span className={`text-sm font-medium ${isPending ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}`}>
                {pendingDisplay}
              </span>
            )
          }
        }
      ]}
      rowActions={(record: any) => [
        {
          label: 'Tarifas',
          icon: DollarSign,
          onClick: () => openModal('personnelRates', { personnelRecord: record })
        }
      ]}
      getItemId={(record: any) => record.id}
    />
  )
}
