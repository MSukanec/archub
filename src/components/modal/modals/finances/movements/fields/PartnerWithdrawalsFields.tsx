import React from 'react'
import { TrendingDown } from 'lucide-react'
import { usePartners, Partner } from '@/hooks/use-partners'
import { useCurrentUser } from '@/hooks/use-current-user'
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField'
import { FormLabel } from '@/components/ui/form'
import type { PartnerItem } from '@/hooks/use-movement-partners'

// Re-export for compatibility
export type PartnerWithdrawalItem = PartnerItem

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

  // Function to get partner display name
  const getPartnerDisplayName = (partner: Partner): string => {
    if (!partner?.contacts) return 'Socio sin nombre'
    
    const { contacts } = partner
    
    // Priority 1: Company name
    if (contacts.company_name) {
      return contacts.company_name
    }
    
    // Priority 2: Full name
    const fullName = `${contacts.first_name || ''} ${contacts.last_name || ''}`.trim()
    if (fullName) {
      return fullName
    }
    
    // Priority 3: Extract name from email
    if (contacts.email) {
      const emailPart = contacts.email.split('@')[0]
      if (emailPart) {
        // Convert email username to a more readable format
        const friendlyName = emailPart
          .replace(/[._]/g, ' ') // Replace dots and underscores with spaces
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize each word
          .join(' ')
        return friendlyName || contacts.email
      }
      return contacts.email
    }
    
    return 'Socio sin nombre'
  }

  // Create options for ComboBox
  const partnerOptions = partners.map(partner => ({
    value: partner.id,
    label: getPartnerDisplayName(partner)
  }))

  // Handle partner change
  const handlePartnerChange = (partnerId: string) => {
    const selectedPartner = partners.find(p => p.id === partnerId)
    const partnerWithdrawal: PartnerWithdrawalItem = {
      partner_id: partnerId,
      partner_name: selectedPartner ? getPartnerDisplayName(selectedPartner) : 'Socio desconocido'
    }
    onPartnerWithdrawalsChange([partnerWithdrawal])
  }

  // Get current selected partner
  const currentSelectedPartner = selectedPartnerWithdrawals.length > 0 ? selectedPartnerWithdrawals[0] : null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-[var(--card-border)]">
        <TrendingDown className="h-4 w-4 text-[var(--accent)]" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-[var(--card-fg)]">Detalle de Retiro de Socios</h3>
          <p className="text-xs text-[var(--text-muted)] leading-tight">
            Selecciona el socio para el retiro
          </p>
        </div>
      </div>

      {/* Partner Selection Field */}
      <div>
        <FormLabel>Socio *</FormLabel>
        <ComboBox
          value={currentSelectedPartner?.partner_id || ''}
          onValueChange={handlePartnerChange}
          options={partnerOptions}
          placeholder="Seleccionar socio..."
          searchPlaceholder="Buscar socio..."
          emptyMessage={isLoading ? "Cargando..." : "No hay socios disponibles"}
          disabled={isLoading}
        />
      </div>
    </div>
  )
}