import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { Users } from 'lucide-react'
import { format } from 'date-fns'
import { Table } from "@/components/ui-custom/tables-and-trees/Table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, ShieldCheck, ShieldAlert, ShieldX, Shield } from "lucide-react"

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
  handleDeletePersonnel: (personnelId: string) => Promise<void>
  insuranceData: any[]
  selectedProjectId: string | null
}

export default function PersonnelListTab({ 
  openModal, 
  handleDeletePersonnel, 
  insuranceData,
  selectedProjectId 
}: PersonnelListTabProps) {
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active')
  const [refreshKey, setRefreshKey] = useState(0)

  const { data: personnelData = [], isLoading: isPersonnelLoading } = useQuery({
    queryKey: ['project-personnel', selectedProjectId, refreshKey],
    queryFn: async () => {
      if (!selectedProjectId) return []
      
      const { data, error } = await supabase
        .from('project_personnel')
        .select(`
          id,
          notes,
          start_date,
          end_date,
          status,
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

      console.log('🔍 RAW PERSONNEL DATA:', JSON.stringify(data, null, 2))
      if (error) throw error
      
      // Helper para obtener nombre
      const getDisplayName = (contact: any) => {
        if (!contact) return 'Sin nombre'
        if (contact.first_name || contact.last_name) {
          return `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
        }
        return contact.full_name || 'Sin nombre'
      }
      
      // Agregar campo displayName y ordenar alfabéticamente
      const withDisplayNames = (data || []).map((item: any) => ({
        ...item,
        displayName: getDisplayName(item.contact)
      }))
      
      const sorted = withDisplayNames.sort((a: any, b: any) => {
        return a.displayName.toLowerCase().localeCompare(b.displayName.toLowerCase())
      })
      
      console.log('✅ PROCESSED PERSONNEL DATA (after sort):', JSON.stringify(sorted, null, 2))
      return sorted
    },
    enabled: !!selectedProjectId
  })

  if (isPersonnelLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-muted-foreground">Cargando personal...</div>
      </div>
    )
  }

  // Mostrar EmptyState si no hay personal en el proyecto
  if (personnelData.length === 0) {
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

  // Filtrar datos según el statusFilter
  const filteredPersonnelData = personnelData.filter((person: any) => {
    if (statusFilter === 'all') return true
    // Tratar NULL como 'active' por defecto (para registros antiguos)
    const personStatus = person.status || 'active'
    
    if (statusFilter === 'active') return personStatus === 'active'
    if (statusFilter === 'inactive') return personStatus === 'inactive' || personStatus === 'absent'
    return true
  })

  return (
    <Table
      data={filteredPersonnelData}
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
            
            // Lógica de nombre display consistente con PersonnelFormModal
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
          width: "12%",
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
          width: "15%",
          sortable: true,
          sortType: "string",
          render: (record: any) => {
            const insuranceStatus = getInsuranceStatus(record.contact?.id, insuranceData)
            return renderInsuranceStatusBadge(insuranceStatus.status, insuranceStatus.daysToExpiry)
          }
        },
        {
          key: "actions",
          label: "Acciones",
          width: "17%",
          sortable: false,
          render: (record: any) => (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openModal('personnel-data', { personnelRecord: record })}
                data-testid={`button-edit-personnel-${record.id}`}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openModal('delete-confirmation', {
                  title: 'Eliminar Personal',
                  message: `¿Estás seguro de que deseas eliminar a ${record.contact?.first_name} ${record.contact?.last_name} del proyecto?`,
                  onConfirm: () => handleDeletePersonnel(record.id)
                })}
                className=" text-destructive hover:text-destructive"
                data-testid={`button-delete-personnel-${record.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        }
      ]}
      getItemId={(record: any) => record.id}
    />
  )
}
