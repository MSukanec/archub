import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, X, Users, Info } from 'lucide-react'
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField'
import { useProjectClients } from '@/hooks/use-project-clients'
import { useProjectInstallments } from '@/hooks/use-project-installments'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export interface CommitmentItem {
  project_client_id: string
  client_name: string
  unit: string
  project_installment_id: string
  installment_display: string
}

interface ClientRow {
  commitment_id: string
  installment_id: string
}

interface ClientsFieldsProps {
  selectedClients: CommitmentItem[]
  onClientsChange: (clientsList: CommitmentItem[]) => void
}

export function ClientsFields({ selectedClients, onClientsChange }: ClientsFieldsProps) {
  const { data: userData } = useCurrentUser()
  const projectId = userData?.preferences?.last_project_id
  const organizationId = userData?.organization?.id

  const { data: projectClients = [], isLoading: clientsLoading } = useProjectClients(
    projectId,
    { enabled: !!projectId && !!organizationId }
  )

  const { data: projectInstallments = [], isLoading: installmentsLoading } = useProjectInstallments(
    projectId,
    { enabled: !!projectId && !!organizationId }
  )

  // Convert selectedClients back to rows for internal management
  const [commitmentRows, setCommitmentRows] = useState<ClientRow[]>(() => {
    if (selectedClients.length > 0) {
      return selectedClients.map(client => ({
        commitment_id: client.project_client_id,
        installment_id: client.project_installment_id || ''
      }))
    }
    return [{ commitment_id: '', installment_id: '' }]
  })

  // Function to get commitment display name (unit + client)
  const getCommitmentDisplayName = (projectClient: any): string => {
    if (!projectClient?.contact) return 'Cliente sin nombre'
    
    const { contact } = projectClient
    let clientName = ''
    
    if (contact.company_name) {
      clientName = contact.company_name
    } else if (contact.full_name) {
      clientName = contact.full_name
    } else {
      clientName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Cliente sin nombre'
    }
    
    if (projectClient.unit) {
      return `${projectClient.unit} - ${clientName}`
    }
    return clientName
  }

  // Create options for ComboBox - sorted by unit
  const commitmentOptions = projectClients
    .sort((a, b) => {
      const unitA = a.unit || 'ZZZ'
      const unitB = b.unit || 'ZZZ'
      return unitA.localeCompare(unitB)
    })
    .map(client => ({
      value: client.id,
      label: getCommitmentDisplayName(client)
    }))

  // Create options for installments
  const installmentOptions = projectInstallments
    .sort((a, b) => a.number - b.number)
    .map(installment => {
      const formattedDate = installment.date 
        ? new Date(installment.date).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        : 'Sin fecha'
      return {
        value: installment.id,
        label: `Cuota ${installment.number.toString().padStart(2, '0')} - ${formattedDate}`
      }
    })

  const handleCommitmentChange = (index: number, commitmentId: string) => {
    const updatedRows = commitmentRows.map((row, i) => 
      i === index ? { ...row, commitment_id: commitmentId, installment_id: '' } : row
    )
    setCommitmentRows(updatedRows)
    updateSelectedClients(updatedRows)
  }

  const handleInstallmentChange = (index: number, installmentId: string) => {
    const updatedRows = commitmentRows.map((row, i) => 
      i === index ? { ...row, installment_id: installmentId } : row
    )
    setCommitmentRows(updatedRows)
    updateSelectedClients(updatedRows)
  }

  const updateSelectedClients = (rows: ClientRow[]) => {
    const commitments: CommitmentItem[] = rows
      .filter(row => row.commitment_id)
      .map(row => {
        const client = projectClients.find(pc => pc.id === row.commitment_id)
        const installment = projectInstallments.find(pi => pi.id === row.installment_id)
        
        let installmentDisplay = ''
        if (installment) {
          const formattedDate = installment.date 
            ? new Date(installment.date).toLocaleDateString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })
            : 'Sin fecha'
          installmentDisplay = `Cuota ${installment.number.toString().padStart(2, '0')} - ${formattedDate}`
        }

        return {
          project_client_id: row.commitment_id,
          client_name: client ? getCommitmentDisplayName(client) : 'Cliente sin nombre',
          unit: client?.unit || '',
          project_installment_id: row.installment_id,
          installment_display: installmentDisplay
        }
      })
    
    onClientsChange(commitments)
  }

  const addCommitmentRow = () => {
    const newRows = [...commitmentRows, { commitment_id: '', installment_id: '' }]
    setCommitmentRows(newRows)
    updateSelectedClients(newRows)
  }

  const removeCommitmentRow = (index: number) => {
    if (commitmentRows.length > 1) {
      const updatedRows = commitmentRows.filter((_, i) => i !== index)
      setCommitmentRows(updatedRows)
      updateSelectedClients(updatedRows)
    }
  }

  return (
    <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        <h3 className="font-medium text-sm">Gestión de Compromisos de Clientes</h3>
      </div>
      
      {commitmentRows.map((row, index) => (
        <div key={index} className="space-y-3">
          <div className="grid grid-cols-[2fr,2fr,auto] gap-3 items-end">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Cliente/Unidad
              </label>
              <ComboBox
                options={commitmentOptions}
                value={row.commitment_id}
                onValueChange={(value) => handleCommitmentChange(index, value)}
                placeholder="Seleccionar cliente..."
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Cuota (opcional)
              </label>
              <ComboBox
                options={installmentOptions}
                value={row.installment_id}
                onValueChange={(value) => handleInstallmentChange(index, value)}
                placeholder="Seleccionar cuota..."
              />
            </div>
            
            <div className="flex gap-1">
              {index === commitmentRows.length - 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={addCommitmentRow}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
              {commitmentRows.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => removeCommitmentRow(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Show client info if selected */}
          {row.commitment_id && (
            <Card className="p-3 bg-background/50">
              <div className="flex items-start gap-3">
                <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                <div className="flex-1 space-y-2">
                  {(() => {
                    const clientInfo = projectClients.find(pc => pc.id === row.commitment_id)
                    if (!clientInfo) return null
                    
                    return (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            ${(clientInfo.committed_amount || 0).toFixed(2)} comprometido
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {clientInfo.contact?.company_name || 
                           `${clientInfo.contact?.first_name || ''} ${clientInfo.contact?.last_name || ''}`.trim() || 
                           'Cliente sin nombre'}
                        </p>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </Card>
          )}
        </div>
      ))}
    </div>
  )
}