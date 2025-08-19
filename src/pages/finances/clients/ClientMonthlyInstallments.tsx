import React from 'react'

interface ClientMonthlyInstallmentsProps {
  projectId: string
  organizationId: string
}

export function ClientMonthlyInstallments({ projectId, organizationId }: ClientMonthlyInstallmentsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">
          Contenido de cuotas mensuales en desarrollo...
        </div>
      </div>
    </div>
  )
}