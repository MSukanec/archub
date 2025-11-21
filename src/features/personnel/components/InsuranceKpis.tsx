import React from 'react'
import { Card } from '@/components/ui/card'
import { Shield, ShieldAlert, ShieldX } from 'lucide-react'
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card 
        className={`p-3 cursor-pointer transition-all duration-200 ${
          activeFilter === 'vigente' ? 'ring-2 ring-green-500' : 'hover:shadow-md'
        }`}
        onClick={() => onFilterChange(activeFilter === 'vigente' ? null : 'vigente')}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Vigentes</p>
            <p className="text-lg font-semibold">{counts.vigente}</p>
          </div>
          <Shield className="h-4 w-4 text-green-600" />
        </div>
      </Card>

      <Card 
        className={`p-3 cursor-pointer transition-all duration-200 ${
          activeFilter === 'por_vencer' ? 'ring-2 ring-yellow-500' : 'hover:shadow-md'
        }`}
        onClick={() => onFilterChange(activeFilter === 'por_vencer' ? null : 'por_vencer')}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Por vencer</p>
            <p className="text-lg font-semibold">{counts.por_vencer}</p>
          </div>
          <ShieldAlert className="h-4 w-4 text-yellow-600" />
        </div>
      </Card>

      <Card 
        className={`p-3 cursor-pointer transition-all duration-200 ${
          activeFilter === 'vencido' ? 'ring-2 ring-red-500' : 'hover:shadow-md'
        }`}
        onClick={() => onFilterChange(activeFilter === 'vencido' ? null : 'vencido')}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Vencidos</p>
            <p className="text-lg font-semibold">{counts.vencido}</p>
          </div>
          <ShieldX className="h-4 w-4 text-red-600" />
        </div>
      </Card>
    </div>
  )
}