import React from 'react'
import { Selector } from '@/components/ui-custom/Selector'

interface TimePeriodSelectorProps {
  value: string
  onValueChange: (value: string) => void
  className?: string
}

export function TimePeriodSelector({ 
  value, 
  onValueChange, 
  className 
}: TimePeriodSelectorProps) {
  const timePeriodOptions = [
    { value: 'desde-siempre', label: 'Desde Siempre' },
    { value: 'ultimo-mes', label: 'Último Mes' },
    { value: 'trimestre', label: 'Trimestre' },
    { value: 'semestre', label: 'Semestre' },
    { value: 'año', label: 'Año' }
  ]

  return (
    <div className="w-64">
      <Selector
        options={timePeriodOptions}
        value={value}
        onValueChange={onValueChange}
        placeholder="Selecciona un período"
        className={className}
      />
    </div>
  )
}