import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Receipt, Edit, Trash2 } from 'lucide-react'

import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { CustomTable } from '@/components/ui-custom/misc/CustomTable'
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useCurrentUser } from '@/hooks/use-current-user'
import { supabase } from '@/lib/supabase'
import { NewInstallmentModal } from '@/modals/finances/NewInstallmentModal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'

interface Contact {
  id: string
  first_name: string
  last_name: string
  company_name: string
}

interface Currency {
  id: string
  name: string
  code: string
  symbol: string
}

interface Wallet {
  id: string
  name: string
}

interface Installment {
  id: string
  movement_date: string
  amount: number
  description: string
  contact_id: string
  currency_id: string
  wallet_id: string
  project_id: string
  created_by: string
  created_at: string
  contact: Contact
  currency: Currency
  wallet: Wallet
}

export default function ProjectInstallmentsPage() {
  const { userData } = useCurrentUser()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [installmentToDelete, setInstallmentToDelete] = useState<Installment | null>(null)

  // Fetch installments data
  const { data: installments = [], isLoading } = useQuery({
    queryKey: ['installments', userData?.current_project?.id],
    queryFn: async () => {
      if (!userData?.current_project?.id || !userData?.organization?.id) {
        return []
      }

      console.log('Fetching installments for project:', userData.current_project.id)

      // First, get the "Cuotas" concept
      const { data: concepts } = await supabase
        .from('movement_concepts')
        .select('id, name')
        .eq('organization_id', userData.organization.id)
        .ilike('name', '%cuotas%')

      if (!concepts || concepts.length === 0) {
        console.log('No Cuotas concept found, looking for existing movements with subcategory_id e675eb59-3717-4451-89eb-0d838388238f')
        // Use hardcoded subcategory_id for Cuotas
        const cuotasSubcategoryId = 'e675eb59-3717-4451-89eb-0d838388238f'
        const ingresosCategoryId = '8862eee7-dd00-4f01-9335-5ea0070d3403'
        
        console.log('Found concepts:', {
          ingresos: ingresosCategoryId,
          cuotas: cuotasSubcategoryId
        })

        const conceptsData = {
          ingresos: ingresosCategoryId,
          cuotas: cuotasSubcategoryId
        }

        // Fetch movements with the Cuotas subcategory
        const { data: movements, error } = await supabase
          .from('movements')
          .select('*')
          .eq('project_id', userData.current_project.id)
          .eq('subcategory_id', conceptsData.cuotas)
          .order('movement_date', { ascending: false })

        if (error) {
          console.error('Error fetching installment movements:', error)
          return []
        }

        if (!movements || movements.length === 0) {
          return []
        }

        // Get unique contact IDs, currency IDs, wallet IDs, and user IDs
        const contactIds = [...new Set(movements.map(m => m.contact_id).filter(Boolean))]
        const currencyIds = [...new Set(movements.map(m => m.currency_id))]
        const walletIds = [...new Set(movements.map(m => m.wallet_id))]
        const userIds = [...new Set(movements.map(m => m.created_by))]

        console.log('Contact IDs to fetch:', contactIds)

        const promises = []
        
        // Only fetch contacts if there are contact IDs
        if (contactIds.length > 0) {
          promises.push(
            supabase
              .from('contacts')
              .select('id, first_name, last_name, company_name')
              .eq('organization_id', userData.organization.id)
              .in('id', contactIds)
          )
        } else {
          promises.push(Promise.resolve({ data: [], error: null }))
        }

        // Fetch currencies, wallets, and users
        promises.push(
          supabase
            .from('currencies')
            .select('id, name, code, symbol')
            .in('id', currencyIds)
        )

        promises.push(
          supabase
            .from('organization_wallets')
            .select('wallets(id, name)')
            .eq('organization_id', userData.organization.id)
            .in('wallet_id', walletIds)
        )

        promises.push(
          supabase
            .from('users')
            .select('id, full_name, email')
            .in('id', userIds)
        )

        const [contactsResult, currenciesResult, walletsResult, usersResult] = await Promise.all(promises)

        console.log('Contacts result:', contactsResult)
        console.log('Currencies result:', currenciesResult)
        console.log('Wallets result:', walletsResult)
        console.log('Users result:', usersResult)

        // Transform movements into installments format
        const installmentsData = movements.map(movement => ({
          id: movement.id,
          movement_date: movement.movement_date,
          amount: movement.amount,
          description: movement.description || '',
          contact_id: movement.contact_id,
          currency_id: movement.currency_id,
          wallet_id: movement.wallet_id,
          project_id: movement.project_id,
          created_by: movement.created_by,
          created_at: movement.created_at,
          contact: contactsResult.data?.find(c => c.id === movement.contact_id) || null,
          currency: currenciesResult.data?.find(c => c.id === movement.currency_id) || { id: movement.currency_id, name: 'Moneda', code: 'N/A', symbol: '$' },
          wallet: walletsResult.data?.find(w => w.wallets?.id === movement.wallet_id)?.wallets || { id: movement.wallet_id, name: 'Billetera' }
        }))

        console.log('Installments result:', installmentsData)

        // Create contact and user maps for easier lookup
        const contactsMap = {}
        const usersMap = {}
        
        contactsResult.data?.forEach(contact => {
          contactsMap[contact.id] = contact
        })
        
        usersResult.data?.forEach(user => {
          usersMap[user.id] = user
        })

        console.log('Contacts map:', contactsMap)
        console.log('Users map:', usersMap)

        return installmentsData
      }

      return []
    },
    enabled: !!userData?.current_project?.id && !!userData?.organization?.id
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (installmentId: string) => {
      console.log('Delete installment:', installmentId)
      
      const { error } = await supabase
        .from('movements')
        .delete()
        .eq('id', installmentId)

      if (error) {
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installments'] })
      toast({
        title: 'Aporte eliminado',
        description: 'El aporte ha sido eliminado correctamente.',
      })
      setDeleteDialogOpen(false)
      setInstallmentToDelete(null)
    },
    onError: (error) => {
      console.error('Error deleting installment:', error)
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el aporte. Inténtalo de nuevo.',
        variant: 'destructive',
      })
    }
  })

  const handleEdit = (installment: Installment) => {
    setEditingInstallment(installment)
    setIsModalOpen(true)
  }

  const handleDelete = (installment: Installment) => {
    setInstallmentToDelete(installment)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (installmentToDelete) {
      deleteMutation.mutate(installmentToDelete.id)
    }
  }

  const handleCardClick = (installment: Installment) => {
    handleEdit(installment)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingInstallment(null)
  }

  // Summary calculations
  const totalAmount = installments.reduce((sum, installment) => sum + installment.amount, 0)
  const totalInstallments = installments.length
  const uniqueContacts = new Set(installments.map(i => i.contact_id)).size

  // Table columns
  const detailColumns = [
    {
      key: 'movement_date',
      label: 'Fecha',
      width: "15%",
      sortable: true,
      sortType: 'date' as const,
      render: (item: Installment) => (
        <div className="text-sm">
          {format(new Date(item.movement_date), 'dd/MM/yyyy', { locale: es })}
        </div>
      )
    },
    {
      key: 'contact',
      label: 'Contacto',
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
      key: 'amount',
      label: 'Monto',
      width: "20%",
      sortable: true,
      sortType: 'number' as const,
      render: (item: Installment) => (
        <div className="text-sm font-medium text-green-600">
          {item.currency.symbol}{item.amount.toLocaleString('es-AR')}
        </div>
      )
    },
    {
      key: 'currency',
      label: 'Moneda',
      width: "15%",
      render: (item: Installment) => (
        <Badge variant="outline" className="text-xs">
          {item.currency.code}
        </Badge>
      )
    },
    {
      key: 'wallet',
      label: 'Billetera',
      width: "15%",
      render: (item: Installment) => (
        <div className="text-sm text-muted-foreground">
          {item.wallet.name}
        </div>
      )
    },
    {
      key: 'description',
      label: 'Descripción',
      width: "10%",
      render: (item: Installment) => (
        <div className="text-sm text-muted-foreground truncate" title={item.description}>
          {item.description || 'Sin descripción'}
        </div>
      )
    }
  ]

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando aportes...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Aportes del Proyecto</h1>
            <p className="text-muted-foreground">
              Gestiona los aportes financieros de inversionistas y contactos
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Nuevo Aporte
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card text-card-foreground rounded-lg border p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Total Aportado</div>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              ${totalAmount.toLocaleString('es-AR')}
            </div>
            <p className="text-xs text-muted-foreground">
              Suma de todos los aportes registrados
            </p>
          </div>

          <div className="bg-card text-card-foreground rounded-lg border p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Total Aportes</div>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{totalInstallments}</div>
            <p className="text-xs text-muted-foreground">
              Número de aportes registrados
            </p>
          </div>

          <div className="bg-card text-card-foreground rounded-lg border p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Contactos Únicos</div>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{uniqueContacts}</div>
            <p className="text-xs text-muted-foreground">
              Número de contactos distintos
            </p>
          </div>
        </div>

        {/* Installments Table */}
        <div className="bg-card rounded-lg border">
          <div className="p-6 border-b">
            <div>
              <h3 className="text-lg font-semibold">Detalle de Aportes</h3>
              <p className="text-sm text-muted-foreground">Todos los aportes registrados en el proyecto</p>
            </div>
            <CustomTable
              data={installments}
              columns={detailColumns}
              defaultSort={{ key: 'movement_date', direction: 'desc' }}
              onCardClick={handleCardClick}
              getRowActions={(item: Installment) => [
                {
                  icon: <Edit className="h-4 w-4" />,
                  label: 'Editar',
                  onClick: () => handleEdit(item),
                  variant: 'default' as const
                },
                {
                  icon: <Trash2 className="h-4 w-4" />,
                  label: 'Eliminar',
                  onClick: () => handleDelete(item),
                  variant: 'destructive' as const
                }
              ]}
              emptyState={
                <CustomEmptyState
                  icon={Receipt}
                  title="No hay aportes registrados"
                  description="Comienza agregando el primer aporte al proyecto"
                  actionLabel="Crear Primer Aporte"
                  onAction={() => setIsModalOpen(true)}
                />
              }
            />
          </div>
        </div>
      </div>

      {/* Modal */}
      <NewInstallmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        installment={editingInstallment}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar aporte?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El aporte será eliminado permanentemente del sistema.
              {installmentToDelete && (
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <div className="text-sm">
                    <strong>Monto:</strong> {installmentToDelete.currency.symbol}{installmentToDelete.amount.toLocaleString('es-AR')}
                  </div>
                  <div className="text-sm">
                    <strong>Fecha:</strong> {format(new Date(installmentToDelete.movement_date), 'dd/MM/yyyy', { locale: es })}
                  </div>
                  {installmentToDelete.contact && (
                    <div className="text-sm">
                      <strong>Contacto:</strong> {installmentToDelete.contact.company_name || 
                        `${installmentToDelete.contact.first_name} ${installmentToDelete.contact.last_name}`}
                    </div>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  )
}