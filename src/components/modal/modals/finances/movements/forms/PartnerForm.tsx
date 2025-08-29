import React, { forwardRef, useImperativeHandle } from 'react'
import { usePartners, Partner } from '@/hooks/use-partners'
import { useCurrentUser } from '@/hooks/use-current-user'
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField'

export interface PartnerItem {
  partner_id: string
  partner_name: string
}

export interface PartnerFormHandle {
  confirmPartner: () => void
}

interface PartnerFormProps {
  onClose: () => void
  onConfirm: (partner: PartnerItem | null) => void
  initialPartner?: PartnerItem
}

export const PartnerForm = forwardRef<PartnerFormHandle, PartnerFormProps>(
  ({ onClose, onConfirm, initialPartner }, ref) => {
    const { data: userData } = useCurrentUser()
    const organizationId = userData?.organization?.id

    const { data: partners = [], isLoading } = usePartners(
      organizationId,
      { enabled: !!organizationId }
    )

    const [selectedPartnerId, setSelectedPartnerId] = React.useState<string>(
      initialPartner?.partner_id || ''
    )

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

    // Handle confirm
    const handleConfirm = () => {
      if (selectedPartnerId) {
        const partner = partners.find((p: Partner) => p.id === selectedPartnerId)
        const partnerItem: PartnerItem = {
          partner_id: selectedPartnerId,
          partner_name: partner ? getPartnerDisplayName(partner) : 'Socio desconocido'
        }
        onConfirm(partnerItem)
      } else {
        onConfirm(null)
      }
      onClose()
    }

    // Expose the confirmPartner method via ref
    useImperativeHandle(ref, () => ({
      confirmPartner: handleConfirm
    }))

    return (
      <div className="space-y-4">
        {/* Partner Selector */}
        <div>
          <ComboBox
            value={selectedPartnerId}
            onValueChange={setSelectedPartnerId}
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
)

PartnerForm.displayName = 'PartnerForm'