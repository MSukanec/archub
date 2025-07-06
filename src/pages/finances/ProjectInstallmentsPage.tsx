import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Eye, Edit, Trash2, Receipt } from 'lucide-react'

import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { CustomTable } from '@/components/ui-custom/misc/CustomTable'
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useCurrentUser } from '@/hooks/use-current-user'
import { supabase } from '@/lib/supabase'
import { NewInstallmentModal } from '@/modals/finances/NewInstallmentModal'

interface Installment {
  id: string
  movement_date: string
  amount: number
  description: string
  contact_id: string
  currency_id: string
  wallet_id: string
  project_id: string
  created_at: string
  contact?: {
    id: string
    first_name: string
    last_name: string
    company_name?: string
    avatar_url?: string
  }
  currency?: {
    id: string
    name: string
    code: string
    symbol: string
  }
  wallet?: {
    id: string
    name: string
  }
}

export default function ProjectInstallmentsPage() {
  const { data: userData } = useCurrentUser()
  const [searchValue, setSearchValue] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null)

  const organizationId = userData?.preferences?.last_organization_id
  const projectId = userData?.preferences?.last_project_id

  // Get "Cuotas" concept ID (exact match)
  const { data: cuotasConcept } = useQuery({
    queryKey: ['movement-concepts', 'cuotas'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized')
      
      const { data, error } = await supabase
        .from('movement_concepts')
        .select('id, name')
        .eq('name', 'Cuotas')
        .limit(1)
        .single()

      if (error) {
        console.error('Error fetching cuotas concept:', error)
        return null
      }
      console.log('Found Cuotas concept:', data)
      return data
    }
  })

  // Get installments (movements with concept_id = CUOTAS)
  const { data: installments = [], isLoading } = useQuery({
    queryKey: ['installments', organizationId, projectId, cuotasConcept?.id],
    queryFn: async () => {
      if (!supabase || !organizationId || !projectId || !cuotasConcept?.id) {
        return []
      }

      // Get movements filtered by cuotas concept and project
      const { data: movements, error } = await supabase
        .from('movements')
        .select(`
          id,
          movement_date,
          amount,
          description,
          contact_id,
          currency_id,
          wallet_id,
          project_id,
          created_at
        `)
        .eq('organization_id', organizationId)
        .eq('project_id', projectId)
        .eq('subcategory_id', cuotasConcept.id)
        .order('movement_date', { ascending: false })

      if (error) {
        console.error('Error fetching installments:', error)
        throw error
      }

      if (!movements || movements.length === 0) {
        return []
      }

      // Get related data
      const contactIds = Array.from(new Set(movements.map(m => m.contact_id).filter(Boolean)))
      const currencyIds = Array.from(new Set(movements.map(m => m.currency_id).filter(Boolean)))
      const walletIds = Array.from(new Set(movements.map(m => m.wallet_id).filter(Boolean)))

      const promises = []
      
      // Only fetch contacts if there are contact IDs
      if (contactIds.length > 0) {
        promises.push(
          supabase
            .from('contacts')
            .select('id, first_name, last_name, company_name, avatar_url')
            .in('id', contactIds)
        )
      } else {
        promises.push(Promise.resolve({ data: [] }))
      }
      
      promises.push(
        supabase
          .from('currencies')
          .select('id, name, code, symbol')
          .in('id', currencyIds),
        
        supabase
          .from('organization_wallets')
          .select(`
            wallets!inner (
              id,
              name
            )
          `)
          .eq('organization_id', organizationId)
          .in('wallet_id', walletIds)
      )

      const [contactsResult, currenciesResult, walletsResult] = await Promise.all(promises)

      // Create lookup maps
      const contactsMap = new Map()
      contactsResult.data?.forEach((contact: any) => {
        contactsMap.set(contact.id, contact)
      })

      const currenciesMap = new Map()
      currenciesResult.data?.forEach((currency: any) => {
        currenciesMap.set(currency.id, currency)
      })

      const walletsMap = new Map()
      walletsResult.data?.forEach((item: any) => {
        if (item.wallets) {
          walletsMap.set(item.wallets.id, item.wallets)
        }
      })

      // Transform data with related information
      return movements.map(movement => ({
        ...movement,
        contact: contactsMap.get(movement.contact_id),
        currency: currenciesMap.get(movement.currency_id),
        wallet: walletsMap.get(movement.wallet_id)
      })) as Installment[]
    },
    enabled: !!organizationId && !!projectId && !!cuotasConcept?.id
  })

  // Calculate total contributed
  const totalContributed = installments.reduce((sum, installment) => {
    return sum + (installment.amount || 0)
  }, 0)

  // Filter installments based on search
  const filteredInstallments = installments.filter(installment => {
    const searchLower = searchValue.toLowerCase()
    const contactName = installment.contact?.company_name || 
                       `${installment.contact?.first_name || ''} ${installment.contact?.last_name || ''}`.trim()
    
    return contactName.toLowerCase().includes(searchLower) ||
           installment.description?.toLowerCase().includes(searchLower)
  })

  const handleEdit = (installment: Installment) => {
    setEditingInstallment(installment)
    setShowModal(true)
  }

  const handleDelete = (installment: Installment) => {
    // TODO: Implement delete functionality
    console.log('Delete installment:', installment.id)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingInstallment(null)
  }

  const tableColumns = [
    {
      key: "movement_date",
      label: "Fecha",
      width: "12%",
      sortable: true,
      sortType: "date" as const,
      render: (item: Installment) => {
        const date = new Date(item.movement_date)
        return (
          <div className="text-sm">
            {format(date, 'dd/MM/yyyy', { locale: es })}
          </div>
        )
      }
    },
    {
      key: "contact",
      label: "Contacto",
      width: "25%",
      render: (item: Installment) => {
        if (!item.contact) {
          return <div className="text-sm text-muted-foreground">Sin contacto</div>
        }

        const displayName = item.contact.company_name || 
                           `${item.contact.first_name || ''} ${item.contact.last_name || ''}`.trim()
        const initials = item.contact.company_name 
          ? item.contact.company_name.charAt(0).toUpperCase()
          : `${item.contact.first_name?.charAt(0) || ''}${item.contact.last_name?.charAt(0) || ''}`.toUpperCase()

        return (
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={item.contact.avatar_url || ''} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium">{displayName}</div>
              {item.contact.company_name && (
                <div className="text-xs text-muted-foreground">
                  {item.contact.first_name} {item.contact.last_name}
                </div>
              )}
            </div>
          </div>
        )
      }
    },
    {
      key: "amount",
      label: "Monto",
      width: "15%",
      sortable: true,
      sortType: "number" as const,
      render: (item: Installment) => {
        const symbol = item.currency?.symbol || '$'
        return (
          <div className="text-sm font-medium text-green-600">
            {symbol}{Math.abs(item.amount || 0).toLocaleString('es-AR')}
          </div>
        )
      }
    },
    {
      key: "currency",
      label: "Moneda",
      width: "10%",
      render: (item: Installment) => (
        <Badge variant="outline" className="text-xs">
          {item.currency?.code || 'N/A'}
        </Badge>
      )
    },
    {
      key: "wallet",
      label: "Billetera",
      width: "15%",
      render: (item: Installment) => (
        <div className="text-sm">{item.wallet?.name || 'Sin billetera'}</div>
      )
    },

    {
      key: "actions",
      label: "Acciones",
      width: "15%",
      render: (item: Installment) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(item)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(item)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ]

  const headerProps = {
    title: "Aportes al Proyecto",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    actions: [(
      <Button 
        key="add-installment"
        className="h-8 px-3 text-sm"
        onClick={() => setShowModal(true)}
      >
        Agregar Aporte
      </Button>
    )]
  }

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">Cargando aportes...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* Summary Card */}
        {installments.length > 0 && (
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                <Receipt className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Total Aportado</h3>
                <p className="text-2xl font-bold text-green-600">
                  ${Math.abs(totalContributed).toLocaleString('es-AR')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {installments.length} aporte{installments.length !== 1 ? 's' : ''} registrado{installments.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Table or Empty State */}
        {filteredInstallments.length > 0 ? (
          <CustomTable
            data={filteredInstallments}
            columns={tableColumns}
            defaultSort={{ key: 'movement_date', direction: 'desc' }}
          />
        ) : installments.length === 0 ? (
          <CustomEmptyState
            title="Aún no hay aportes registrados"
            description="Comienza registrando el primer aporte de un inversor al proyecto"
            action={
              <Button onClick={() => setShowModal(true)} className="mt-4">
                Agregar Primer Aporte
              </Button>
            }
          />
        ) : (
          <CustomEmptyState
            title="No se encontraron aportes"
            description="Intenta ajustar los términos de búsqueda"
          />
        )}
      </div>

      {/* Modal */}
      {showModal && organizationId && projectId && (
        <NewInstallmentModal
          open={showModal}
          onClose={handleCloseModal}
          projectId={projectId}
          organizationId={organizationId}
          editingInstallment={editingInstallment}
        />
      )}
    </Layout>
  )
}