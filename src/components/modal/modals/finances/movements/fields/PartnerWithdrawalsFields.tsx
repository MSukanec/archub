import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Plus, TrendingDown } from 'lucide-react'
import { usePartners, Partner } from '@/hooks/use-partners'
import { useCurrentUser } from '@/hooks/use-current-user'
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField'

export interface PartnerWithdrawalRow {
  partner_id: string
  amount: string
}

export interface PartnerWithdrawalItem {
  partner_id: string
  partner_name: string
  amount: number
}

interface PartnerWithdrawalsFieldsProps {
  selectedPartnerWithdrawals: PartnerWithdrawalItem[]
  onPartnerWithdrawalsChange: (partnerWithdrawals: PartnerWithdrawalItem[]) => void
}

export const PartnerWithdrawalsFields: React.FC<PartnerWithdrawalsFieldsProps> = ({
  selectedPartnerWithdrawals,
  onPartnerWithdrawalsChange
}) => {
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.organization?.id

  const { data: partners = [], isLoading } = usePartners(
    organizationId,
    { enabled: !!organizationId }
  )

  // Initialize rows from initial partner withdrawals or create one empty row
  const initializeRows = (): PartnerWithdrawalRow[] => {
    if (selectedPartnerWithdrawals.length > 0) {
      return selectedPartnerWithdrawals.map(partnerWithdrawal => ({
        partner_id: partnerWithdrawal.partner_id,
        amount: partnerWithdrawal.amount.toString()
      }))
    }
    return [{ partner_id: '', amount: '' }]
  }

  const [partnerWithdrawalRows, setPartnerWithdrawalRows] = useState<PartnerWithdrawalRow[]>(initializeRows())

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

  // Handle partner change
  const handlePartnerChange = (index: number, partnerId: string) => {
    const newRows = [...partnerWithdrawalRows]
    newRows[index] = { ...newRows[index], partner_id: partnerId }
    setPartnerWithdrawalRows(newRows)
    updateSelectedPartnerWithdrawals(newRows)
  }

  // Handle amount change
  const handleAmountChange = (index: number, amount: string) => {
    const newRows = [...partnerWithdrawalRows]
    newRows[index] = { ...newRows[index], amount }
    setPartnerWithdrawalRows(newRows)
    updateSelectedPartnerWithdrawals(newRows)
  }

  // Add new row
  const addNewRow = () => {
    const newRows = [...partnerWithdrawalRows, { partner_id: '', amount: '' }]
    setPartnerWithdrawalRows(newRows)
    updateSelectedPartnerWithdrawals(newRows)
  }

  // Remove row
  const removeRow = (index: number) => {
    if (partnerWithdrawalRows.length > 1) {
      const newRows = partnerWithdrawalRows.filter((_, i) => i !== index)
      setPartnerWithdrawalRows(newRows)
      updateSelectedPartnerWithdrawals(newRows)
    }
  }

  // Update selectedPartnerWithdrawals based on rows
  const updateSelectedPartnerWithdrawals = (rows: PartnerWithdrawalRow[]) => {
    const validPartnerWithdrawals = rows
      .filter(row => row.partner_id && row.amount && parseFloat(row.amount) > 0)
      .map(row => {
        const partner = partners.find((p: Partner) => p.id === row.partner_id)
        return {
          partner_id: row.partner_id,
          partner_name: partner ? getPartnerDisplayName(partner) : 'Socio desconocido',
          amount: parseFloat(row.amount)
        }
      })

    onPartnerWithdrawalsChange(validPartnerWithdrawals)
  }

  // Sync external changes with internal state
  useEffect(() => {
    const currentRows = partnerWithdrawalRows
    const expectedRows = selectedPartnerWithdrawals.length > 0
      ? selectedPartnerWithdrawals.map(partnerWithdrawal => ({
          partner_id: partnerWithdrawal.partner_id,
          amount: partnerWithdrawal.amount.toString()
        }))
      : [{ partner_id: '', amount: '' }]

    if (JSON.stringify(currentRows) !== JSON.stringify(expectedRows)) {
      setPartnerWithdrawalRows(expectedRows)
    }
  }, [selectedPartnerWithdrawals])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-[var(--card-border)]">
        <TrendingDown className="h-4 w-4 text-[var(--accent)]" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-[var(--card-fg)]">Detalle de Retiro de Socios</h3>
          <p className="text-xs text-[var(--text-muted)] leading-tight">
            Especifica los socios y montos de retiro
          </p>
        </div>
      </div>
      {/* Partner Withdrawal Rows - Default two columns */}
      {partnerWithdrawalRows.map((row, index) => (
        <div key={index} className="grid grid-cols-[3fr,1fr] gap-3 items-end">
          {/* Left Column - Partner Selector */}
          <div>
            <ComboBox
              value={row.partner_id}
              onValueChange={(value) => handlePartnerChange(index, value)}
              options={partnerOptions}
              placeholder="Seleccionar socio..."
              searchPlaceholder="Buscar socio..."
              emptyMessage={isLoading ? "Cargando..." : "No hay socios disponibles"}
              disabled={isLoading}
            />
          </div>
          
          {/* Right Column - Amount */}
          <div className="flex items-end gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                value={row.amount}
                onChange={(e) => handleAmountChange(index, e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="text-right pl-8"
              />
            </div>
            {partnerWithdrawalRows.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="default"
                onClick={() => removeRow(index)}
                className="h-10 w-10 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
      
      {/* Add New Row Button */}
      <div className="flex justify-center pt-2">
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={addNewRow}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Agregar Otro
        </Button>
      </div>
    </div>
  )
}