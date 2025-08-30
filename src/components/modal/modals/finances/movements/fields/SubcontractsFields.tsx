import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X, FileText } from 'lucide-react'
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField'
import { useProjectSubcontracts } from '@/hooks/use-project-subcontracts'
import { useCurrentUser } from '@/hooks/use-current-user'

interface SubcontractsFieldsProps {
  selectedSubcontracts: Array<{subcontract_id: string, contact_name: string, amount: number}>
  onSubcontractsChange: (subcontractsList: Array<{subcontract_id: string, contact_name: string, amount: number}>) => void
}

export function SubcontractsFields({ selectedSubcontracts, onSubcontractsChange }: SubcontractsFieldsProps) {
  const { data: userData } = useCurrentUser()
  const projectId = userData?.preferences?.last_project_id
  const { data: projectSubcontracts = [], isLoading } = useProjectSubcontracts(projectId)

  // Transform subcontracts data for ComboBox  
  const subcontractsOptions = projectSubcontracts.map((subcontract: any) => {
    const contact = Array.isArray(subcontract.contact) ? subcontract.contact[0] : subcontract.contact
    const contactName = contact?.full_name || `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim() || contact?.company_name || 'Sin nombre'
    return {
      value: subcontract.id,
      label: subcontract.title || contactName
    }
  })

  const handleSubcontractChange = (index: number, subcontractId: string) => {
    const selectedSubcontract = projectSubcontracts.find(s => s.id === subcontractId)
    let contactName = 'Sin nombre'
    
    if (selectedSubcontract) {
      const contact = Array.isArray(selectedSubcontract.contact) ? selectedSubcontract.contact[0] : selectedSubcontract.contact
      const fullContactName = contact?.full_name || `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim() || contact?.company_name || 'Sin nombre'
      contactName = selectedSubcontract.title || fullContactName
    }

    const updatedSubcontracts = selectedSubcontracts.map((row, i) => 
      i === index 
        ? { ...row, subcontract_id: subcontractId, contact_name: contactName }
        : row
    )
    onSubcontractsChange(updatedSubcontracts)
  }

  const handleAmountChange = (index: number, amount: string) => {
    const updatedSubcontracts = selectedSubcontracts.map((row, i) => 
      i === index 
        ? { ...row, amount: parseFloat(amount) || 0 }
        : row
    )
    onSubcontractsChange(updatedSubcontracts)
  }

  const addSubcontractRow = () => {
    onSubcontractsChange([...selectedSubcontracts, { subcontract_id: '', contact_name: '', amount: 0 }])
  }

  const removeSubcontractRow = (index: number) => {
    if (selectedSubcontracts.length > 1) {
      const updatedSubcontracts = selectedSubcontracts.filter((_, i) => i !== index)
      onSubcontractsChange(updatedSubcontracts)
    }
  }

  const totalAmount = selectedSubcontracts.reduce((sum, subcontract) => sum + (subcontract.amount || 0), 0)

  return (
    <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        <h3 className="font-medium text-sm">Gestión de Subcontratos</h3>
      </div>
      
      {selectedSubcontracts.map((subcontract, index) => (
        <div key={index} className="grid grid-cols-[2fr,1fr,auto] gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Subcontrato
            </label>
            <ComboBox
              options={subcontractsOptions}
              value={subcontract.subcontract_id}
              onValueChange={(value) => handleSubcontractChange(index, value)}
              placeholder="Seleccionar subcontrato..."
            />
          </div>
          
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Monto
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={subcontract.amount || ''}
              onChange={(e) => handleAmountChange(index, e.target.value)}
            />
          </div>
          
          <div className="flex gap-1">
            {index === selectedSubcontracts.length - 1 && (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={addSubcontractRow}
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
            {selectedSubcontracts.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => removeSubcontractRow(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      ))}
      
      {totalAmount > 0 && (
        <div className="flex justify-between items-center pt-3 border-t border-border">
          <span className="text-sm font-medium">Total:</span>
          <span className="text-sm font-bold">${totalAmount.toFixed(2)}</span>
        </div>
      )}
    </div>
  )
}