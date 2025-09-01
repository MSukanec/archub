import React from 'react'
import { TrendingDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
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

interface OrganizationMember {
  id: string
  user_id: string
  user: {
    id: string
    full_name: string
    email: string
  }
}

export const PartnerWithdrawalsFields: React.FC<PartnerWithdrawalsFieldsProps> = ({
  selectedPartnerWithdrawals,
  onPartnerWithdrawalsChange
}) => {
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.organization?.id

  // Get organization members with user data
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['organization-members', organizationId],
    queryFn: async (): Promise<OrganizationMember[]> => {
      if (!organizationId || !supabase) return []
      
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
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
        console.error('Error fetching organization members:', error)
        throw error
      }
      
      return (data as OrganizationMember[]) || []
    },
    enabled: !!organizationId && !!supabase,
  })

  // Function to get member display name
  const getMemberDisplayName = (member: OrganizationMember): string => {
    if (!member?.user) return 'Socio sin nombre'
    
    const { user } = member
    
    // Priority 1: Full name from user data
    if (user.full_name) {
      return user.full_name
    }
    
    // Priority 2: Extract name from email
    if (user.email) {
      const emailPart = user.email.split('@')[0]
      if (emailPart) {
        // Convert email username to a more readable format
        const friendlyName = emailPart
          .replace(/[._]/g, ' ') // Replace dots and underscores with spaces
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize each word
          .join(' ')
        return friendlyName || user.email
      }
      return user.email
    }
    
    return 'Socio sin nombre'
  }

  // Create options for ComboBox
  const memberOptions = members.map(member => ({
    value: member.id,
    label: getMemberDisplayName(member)
  }))

  // Handle member change
  const handlePartnerChange = (memberId: string) => {
    const selectedMember = members.find(m => m.id === memberId)
    const partnerWithdrawal: PartnerWithdrawalItem = {
      partner_id: memberId,
      partner_name: selectedMember ? getMemberDisplayName(selectedMember) : 'Socio desconocido'
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
          options={memberOptions}
          placeholder="Seleccionar socio..."
          searchPlaceholder="Buscar socio..."
          emptyMessage={isLoading ? "Cargando..." : "No hay socios disponibles"}
          disabled={isLoading}
        />
      </div>
    </div>
  )
}