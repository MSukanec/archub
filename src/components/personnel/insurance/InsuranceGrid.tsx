import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { InsuranceActions } from './InsuranceActions'
import { AttachmentBadge } from '@/components/attachments/AttachmentBadge'
import { InsuranceStatusRow } from '@/services/insurances'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface InsuranceGridProps {
  data: InsuranceStatusRow[]
  isLoading: boolean
}

const INSURANCE_TYPE_LABELS = {
  'ART': 'ART',
  'vida': 'Vida',
  'accidentes': 'Accidentes',
  'responsabilidad_civil': 'RC',
  'salud': 'Salud',
  'otro': 'Otro'
} as const

const getStatusBadge = (status: string, daysToExpiry: number) => {
  switch (status) {
    case 'vigente':
      return (
        <Badge className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800">
          Vigente
        </Badge>
      )
    case 'por_vencer':
      return (
        <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800">
          Por vencer ({daysToExpiry}d)
        </Badge>
      )
    case 'vencido':
      return (
        <Badge className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800">
          Vencido
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function InsuranceGrid({ data, isLoading }: InsuranceGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-muted-foreground">Cargando seguros...</div>
      </div>
    )
  }

  return (
    <Table
      data={data}
      columns={[
        {
          key: "contact",
          label: "Persona",
          width: "14.28%", // 100% / 7 columnas = 14.28%
          render: (record: InsuranceStatusRow) => (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarFallback className="text-xs">
                  {record.first_name?.charAt(0) || 'N'}{record.last_name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium truncate">
                {record.first_name && record.last_name 
                  ? `${record.first_name} ${record.last_name}`
                  : record.full_name || 'Sin nombre'
                }
              </span>
            </div>
          )
        },
        {
          key: "insurance_type",
          label: "Tipo",
          width: "14.28%",
          render: (record: InsuranceStatusRow) => (
            <span className="text-sm">
              {INSURANCE_TYPE_LABELS[record.insurance_type]}
            </span>
          )
        },
        {
          key: "policy_number",
          label: "Nº de póliza",
          width: "14.28%",
          render: (record: InsuranceStatusRow) => (
            <span className="text-sm text-muted-foreground">
              {record.policy_number || 'Sin número'}
            </span>
          )
        },
        {
          key: "provider",
          label: "Aseguradora",
          width: "14.28%",
          render: (record: InsuranceStatusRow) => (
            <span className="text-sm">
              {record.provider || 'No especificada'}
            </span>
          )
        },
        {
          key: "coverage",
          label: "Vigencia",
          width: "14.28%",
          render: (record: InsuranceStatusRow) => (
            <div className="text-sm">
              <div>
                {format(new Date(record.coverage_start), 'dd/MM/yyyy', { locale: es })} - 
              </div>
              <div className="text-muted-foreground">
                {format(new Date(record.coverage_end), 'dd/MM/yyyy', { locale: es })}
              </div>
            </div>
          )
        },
        {
          key: "status",
          label: "Estado",
          width: "14.28%",
          render: (record: InsuranceStatusRow) => getStatusBadge(record.status, record.days_to_expiry)
        },
        {
          key: "actions",
          label: "Acciones",
          width: "14.36%", // Resto para llegar a 100%
          sortable: false,
          render: (record: InsuranceStatusRow) => (
            <InsuranceActions insurance={record} />
          )
        }
      ]}
      getItemId={(record: InsuranceStatusRow) => record.id}
    />
  )
}