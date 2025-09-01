import React from 'react'
import { TrendingUp } from 'lucide-react'
import { usePartners, Partner } from '@/hooks/use-partners'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/use-current-user'
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField'
import { FormLabel } from '@/components/ui/form'
import type { PartnerItem } from '@/hooks/use-movement-partners'

// Re-export for compatibility
export type PartnerContributionItem = PartnerItem

interface PartnerContributionsFieldsProps {
  selectedPartnerContributions: PartnerContributionItem[]
  onPartnerContributionsChange: (partnerContributions: PartnerContributionItem[]) => void
}

export const PartnerContributionsFields: React.FC<PartnerContributionsFieldsProps> = ({
  selectedPartnerContributions,
  onPartnerContributionsChange
}) => {
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.organization?.id

  const { data: partners = [], isLoading } = usePartners(
    organizationId,
    { enabled: !!organizationId }
  )

  // Get user data for all organization members to map contact_id to user names
  const { data: organizationMembers = [] } = useQuery({
    queryKey: ['organization-members-for-names', organizationId],
    queryFn: async () => {
      if (!organizationId || !supabase) return []
      
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          user_id,
          user:users(
            id,
            full_name,
            email
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching organization members for names:', error)
        return []
      }
      
      return data || []
    },
    enabled: !!organizationId && !!supabase,
  })

  // Function to get partner display name using the correct flow: partners → contacts → organization_members → user_data
  const getPartnerDisplayName = (partner: Partner): string => {
    if (!partner?.contacts) return 'Socio sin nombre'
    
    const { contacts } = partner
    
    // Find the user data using contact_id as user_id in organization_members
    const memberWithUser = organizationMembers.find(member => member.user_id === contacts.id)
    
    if (memberWithUser?.user?.full_name) {
      return memberWithUser.user.full_name
    }
    
    // Fallback 1: Company name from contacts
    if (contacts.company_name) {
      return contacts.company_name
    }
    
    // Fallback 2: Full name from contacts
    const fullName = `${contacts.first_name || ''} ${contacts.last_name || ''}`.trim()
    if (fullName) {
      return fullName
    }
    
    // Fallback 3: Extract name from email (user email or contact email)
    const email = memberWithUser?.user?.email || contacts.email
    if (email) {
      const emailPart = email.split('@')[0]
      if (emailPart) {
        // Convert email username to a more readable format
        const friendlyName = emailPart
          .replace(/[._]/g, ' ') // Replace dots and underscores with spaces
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize each word
          .join(' ')
        return friendlyName || email
      }
      return email
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
    const partnerContribution: PartnerContributionItem = {
      partner_id: partnerId,
      partner_name: selectedPartner ? getPartnerDisplayName(selectedPartner) : 'Socio desconocido'
    }
    onPartnerContributionsChange([partnerContribution])
  }

  // Get current selected partner
  const currentSelectedPartner = selectedPartnerContributions.length > 0 ? selectedPartnerContributions[0] : null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-[var(--card-border)]">
        <TrendingUp className="h-4 w-4 text-[var(--accent)]" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-[var(--card-fg)]">Detalle de Aporte de Socios</h3>
          <p className="text-xs text-[var(--text-muted)] leading-tight">
            Selecciona el socio para el aporte
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