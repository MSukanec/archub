import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { InsuranceStatusRow } from '@/services/insurances'

interface InsuranceKpisProps {
  data: InsuranceStatusRow[]
  activeFilter: string | null
  onFilterChange: (status: string | null) => void
}

export function InsuranceKpis({ data, activeFilter, onFilterChange }: InsuranceKpisProps) {
  const counts = {
    vigente: data.filter(item => item.status === 'vigente').length,
    por_vencer: data.filter(item => item.status === 'por_vencer').length,
    vencido: data.filter(item => item.status === 'vencido').length
  }

  const kpis = [
    {
      key: 'vigente',
      label: 'Vigentes',
      count: counts.vigente,
      variant: 'default' as const,
      className: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-950 dark:text-green-400 dark:border-green-800'
    },
    {
      key: 'por_vencer',
      label: 'Por vencer',
      count: counts.por_vencer,
      variant: 'secondary' as const,
      className: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800'
    },
    {
      key: 'vencido',
      label: 'Vencidos',
      count: counts.vencido,
      variant: 'destructive' as const,
      className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-950 dark:text-red-400 dark:border-red-800'
    }
  ]

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      {kpis.map(({ key, label, count, className }) => (
        <Card
          key={key}
          className={`p-4 cursor-pointer transition-all duration-200 ${className} ${
            activeFilter === key ? 'ring-2 ring-offset-2 ring-primary' : ''
          }`}
          onClick={() => onFilterChange(activeFilter === key ? null : key)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-2xl font-bold">{count}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}