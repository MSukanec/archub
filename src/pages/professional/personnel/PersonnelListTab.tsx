import { useMemo } from 'react'
import { EmptyState } from '@/components/shared/EmptyState'
import { Users } from 'lucide-react'
import { format } from 'date-fns'
import { Table } from "@/components/ui-custom/tables-and-trees/Table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, ShieldCheck, ShieldAlert, ShieldX, Shield, User } from "lucide-react"
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner'
import { useProjectPersonnel, useDeletePersonnel, useReplacePersonnel, usePersonnelPayments } from '@/features/personnel/hooks'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useToast } from '@/hooks/use-toast'
import { queryClient } from '@/lib/queryClient'

interface InsuranceStatus {
  status: 'sin_seguro' | 'vigente' | 'por_vencer' | 'vencido'
  expiryDate: string | null
  daysToExpiry: number | null
}

function getInsuranceStatus(contactId: string, insuranceData: any[]): InsuranceStatus {
  const contactInsurances = insuranceData.filter(insurance => insurance.contact_id === contactId)
  
  if (contactInsurances.length === 0) {
    return { status: 'sin_seguro', expiryDate: null, daysToExpiry: null }
  }

  let nearestExpiry: string | null = null
  let soonestDays = Infinity

  contactInsurances.forEach(insurance => {
    if (insurance.coverage_end && insurance.days_to_expiry !== null) {
      if (insurance.days_to_expiry < soonestDays) {
        soonestDays = insurance.days_to_expiry
        nearestExpiry = insurance.coverage_end
      }
    }
  })

  if (nearestExpiry === null) {
    return { status: 'sin_seguro', expiryDate: null, daysToExpiry: null }
  }

  let status: 'vigente' | 'por_vencer' | 'vencido' = 'vigente'
  if (soonestDays < 0) {
    status = 'vencido'
  } else if (soonestDays <= 30) {
    status = 'por_vencer'
  }

  return {
    status,
    expiryDate: nearestExpiry,
    daysToExpiry: soonestDays
  }
}

function renderInsuranceStatusBadge(status: string, daysToExpiry: number | null) {
  switch (status) {
    case 'vigente':
      return (
        <Badge variant="default" className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
          <ShieldCheck className="w-3 h-3 mr-1" />
          Vigente
        </Badge>
      )
    case 'por_vencer':
      return (
        <Badge variant="default" className="bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">
          <ShieldAlert className="w-3 h-3 mr-1" />
          {daysToExpiry !== null && daysToExpiry >= 0 ? `${daysToExpiry} días` : 'Por vencer'}
        </Badge>
      )
    case 'vencido':
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
          <ShieldX className="w-3 h-3 mr-1" />
          Vencido
        </Badge>
      )
    case 'sin_seguro':
    default:
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
          <Shield className="w-3 h-3 mr-1" />
          Sin seguro
        </Badge>
      )
  }
}

interface PersonnelListTabProps {
  openModal: any
  handleDeletePersonnel?: (personnelId: string) => Promise<void>
  insuranceData: any[]
  selectedProjectId: string | null
}

export default function PersonnelListTab({ 
  openModal, 
  insuranceData,
  selectedProjectId 
}: PersonnelListTabProps) {
  const { data: currentUser } = useCurrentUser()
  const organizationId = currentUser?.organization?.id
  const { toast } = useToast()

  const { data: personnelData = [], isLoading: isPersonnelLoading } = useProjectPersonnel(
    selectedProjectId || undefined,
    organizationId
  )

  const { data: paymentsData = [] } = usePersonnelPayments(selectedProjectId || undefined, organizationId)
  const deletePersonnelMutation = useDeletePersonnel(organizationId || null)
  const replacePersonnelMutation = useReplacePersonnel(organizationId || null)

  const handleEditContact = (record: any) => {
    if (!record.contact) {
      toast({
        title: 'Error',
        description: 'Este personal no tiene un contacto asociado',
        variant: 'destructive',
      });
      return;
    }

    // Prefetch contact data before opening modal
    if (organizationId && record.contact.id) {
      queryClient.prefetchQuery({
        queryKey: [`/api/contacts/${record.contact.id}?organization_id=${organizationId}`],
        staleTime: 2 * 60 * 1000,
      });
    }

    openModal('contact', {
      contactId: record.contact.id,
      mode: 'edit',
    });
  }

  const getDisplayName = (contact: any) => {
    if (!contact) return 'Sin nombre'
    if (contact.first_name || contact.last_name) {
      return `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
    }
    return contact.full_name || 'Sin nombre'
  }

  const processedPersonnelData = useMemo(() => {
    return personnelData.map((item: any) => ({
      ...item,
      displayName: getDisplayName(item.contact)
    })).sort((a: any, b: any) => {
      // Sort active first, then by name
      const aStatus = a.status || 'active'
      const bStatus = b.status || 'active'
      const aIsInactive = aStatus === 'inactive' || aStatus === 'absent'
      const bIsInactive = bStatus === 'inactive' || bStatus === 'absent'
      
      if (aIsInactive !== bIsInactive) {
        return aIsInactive ? 1 : -1
      }
      return (a.displayName || '').toLowerCase().localeCompare((b.displayName || '').toLowerCase())
    })
  }, [personnelData])

  if (isPersonnelLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  if (processedPersonnelData.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-8 w-8" />}
        title="Sin personal asignado"
        description="Vincula contactos de tu organización como mano de obra del proyecto para gestionar asistencias y seguimiento de personal."
        action={
          <Button onClick={() => openModal('personnel')}>
            Agregar Personal
          </Button>
        }
      />
    )
  }

  const handleDelete = (record: any) => {
    if (!organizationId) return
    
    // Pagos relacionados a este personal
    const associatedPayments = paymentsData.filter((p: any) => p.personnel_id === record.id)
    
    // Otros personal disponibles para reemplazo (excluir el que se va a eliminar)
    // Usar processedPersonnelData que tiene displayName ya calculado
    const otherPersonnel = processedPersonnelData.filter((p: any) => p.id !== record.id)
    
    // Determinar si es posible reemplazar
    const canReplace = associatedPayments.length > 0 && otherPersonnel.length > 0
    
    // Consecuencias
    const consequences = []
    if (associatedPayments.length > 0) {
      consequences.push(
        `${associatedPayments.length} pago${associatedPayments.length === 1 ? '' : 's'} será${associatedPayments.length === 1 ? 'á' : 'n'} afectado${associatedPayments.length === 1 ? '' : 's'}`
      )
      if (canReplace) {
        consequences.push('Puedes reemplazarlos con otro o dejarlos sin referencia')
      } else {
        consequences.push('Los pagos quedarán sin referencia')
      }
    }
    
    // Opciones de reemplazo
    const replacementOptions = otherPersonnel
      .sort((a: any, b: any) => (a.displayName || '').localeCompare(b.displayName || ''))
      .map((p: any) => ({
        label: p.displayName || 'Sin nombre',
        value: p.id
      }))
    
    openModal('delete-confirmation', {
      mode: canReplace ? 'replace' : 'delete',
      title: 'Eliminar Personal',
      description: `¿Estás seguro de que deseas eliminar a ${record.displayName} del proyecto?`,
      itemName: record.displayName,
      consequences: consequences.length > 0 ? consequences : undefined,
      replacementOptions: canReplace ? replacementOptions : undefined,
      currentId: record.id,
      onDelete: () => {
        deletePersonnelMutation.mutate({
          personnelId: record.id,
          organizationId
        })
      },
      onReplace: (newId: string) => {
        replacePersonnelMutation.mutate({
          oldId: record.id,
          newId
        })
      }
    })
  }

  return (
    <Table
      data={processedPersonnelData}
      defaultSort={{
        key: "displayName",
        direction: "asc"
      }}
      getIsInactive={(record: any) => {
        const status = record.status || 'active'
        return status === 'inactive' || status === 'absent'
      }}
      inactiveSeparatorLabel="Personal Inactivo"
      columns={[
        {
          key: "displayName",
          label: "Nombre",
          width: "28%",
          sortable: true,
          sortType: "string",
          render: (record: any) => {
            const contact = record.contact
            if (!contact) {
              return <span className="text-muted-foreground">Sin datos</span>
            }
            
            const displayName = record.displayName
            
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
                  <p className="font-semibold text-sm truncate">
                    {displayName}
                  </p>
                  {record.labor_type?.name && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {record.labor_type.name}
                    </p>
                  )}
                </div>
              </div>
            )
          }
        },
        {
          key: "start_date",
          label: "Fecha de inicio",
          width: "28%",
          sortable: true,
          sortType: "date",
          render: (record: any) => {
            if (!record.start_date) {
              return <span className="text-sm text-muted-foreground">-</span>
            }
            return (
              <span className="text-sm">
                {format(new Date(record.start_date), 'dd/MM/yyyy')}
              </span>
            )
          }
        },
        {
          key: "insurance_status",
          label: "Estado Seguro",
          width: "28%",
          sortable: true,
          sortType: "string",
          render: (record: any) => {
            const insuranceStatus = getInsuranceStatus(record.contact?.id, insuranceData)
            return renderInsuranceStatusBadge(insuranceStatus.status, insuranceStatus.daysToExpiry)
          }
        }
      ]}
      rowActions={(record: any) => [
        {
          label: 'Editar Personal',
          icon: Edit,
          onClick: () => openModal('personnel-data', { personnelRecord: record })
        },
        {
          label: 'Editar Contacto',
          icon: User,
          onClick: () => handleEditContact(record)
        },
        {
          label: 'Eliminar',
          icon: Trash2,
          onClick: () => handleDelete(record),
          variant: 'destructive' as const
        }
      ]}
      getItemId={(record: any) => record.id}
    />
  )
}
