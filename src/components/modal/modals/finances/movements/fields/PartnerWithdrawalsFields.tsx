import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X, Users } from 'lucide-react'
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField'
import { usePartners, Partner } from '@/hooks/use-partners'
import { useCurrentUser } from '@/hooks/use-current-user'

interface PartnerWithdrawalsFieldsProps {
  selectedPartnerWithdrawals: Array<{partner_id: string, partner_name: string, amount: number}>
  onPartnerWithdrawalsChange: (partnerWithdrawalsList: Array<{partner_id: string, partner_name: string, amount: number}>) => void
}

export function PartnerWithdrawalsFields({ selectedPartnerWithdrawals, onPartnerWithdrawalsChange }: PartnerWithdrawalsFieldsProps) {
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.organization?.id
  const { data: partners = [], isLoading } = usePartners(organizationId, { enabled: !!organizationId })

  // Function to get partner display name
  const getPartnerDisplayName = (partner: Partner): string => {
    if (!partner?.contacts) return 'Socio sin nombre'
    
    const { contacts } = partner
    if (contacts.company_name) {
      return contacts.company_name
    } else {
      const fullName = `${contacts.first_name || ''} ${contacts.last_name || ''}`.trim()
      if (fullName) {
        return fullName
      } else if (contacts.email) {
        return contacts.email
      } else {
        return 'Socio sin nombre'
      }
    }
  }

  // Create options for ComboBox
  const partnerOptions = partners.map(partner => ({
    value: partner.id,
    label: getPartnerDisplayName(partner)
  }))

  const handlePartnerChange = (index: number, partnerId: string) => {
    const selectedPartner = partners.find(p => p.id === partnerId)
    const partnerName = selectedPartner ? getPartnerDisplayName(selectedPartner) : 'Sin nombre'

    const updatedPartnerWithdrawals = selectedPartnerWithdrawals.map((row, i) => 
      i === index 
        ? { ...row, partner_id: partnerId, partner_name: partnerName }
        : row
    )
    onPartnerWithdrawalsChange(updatedPartnerWithdrawals)
  }

  const handleAmountChange = (index: number, amount: string) => {
    const updatedPartnerWithdrawals = selectedPartnerWithdrawals.map((row, i) => 
      i === index 
        ? { ...row, amount: parseFloat(amount) || 0 }
        : row
    )
    onPartnerWithdrawalsChange(updatedPartnerWithdrawals)
  }

  const addPartnerWithdrawalRow = () => {
    onPartnerWithdrawalsChange([...selectedPartnerWithdrawals, { partner_id: '', partner_name: '', amount: 0 }])
  }

  const removePartnerWithdrawalRow = (index: number) => {
    if (selectedPartnerWithdrawals.length > 1) {
      const updatedPartnerWithdrawals = selectedPartnerWithdrawals.filter((_, i) => i !== index)
      onPartnerWithdrawalsChange(updatedPartnerWithdrawals)
    }
  }

  const totalAmount = selectedPartnerWithdrawals.reduce((sum, partnerWithdrawal) => sum + (partnerWithdrawal.amount || 0), 0)

  return (
    <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        <h3 className="font-medium text-sm">Gestión de Retiros de Socios</h3>
      </div>
      
      {selectedPartnerWithdrawals.map((partnerWithdrawal, index) => (
        <div key={index} className="grid grid-cols-[2fr,1fr,auto] gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Socio
            </label>
            <ComboBox
              options={partnerOptions}
              value={partnerWithdrawal.partner_id}
              onValueChange={(value) => handlePartnerChange(index, value)}
              placeholder="Seleccionar socio..."
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
              value={partnerWithdrawal.amount || ''}
              onChange={(e) => handleAmountChange(index, e.target.value)}
            />
          </div>
          
          <div className="flex gap-1">
            {index === selectedPartnerWithdrawals.length - 1 && (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={addPartnerWithdrawalRow}
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
            {selectedPartnerWithdrawals.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => removePartnerWithdrawalRow(index)}
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