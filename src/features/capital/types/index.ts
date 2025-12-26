export interface CapitalParticipantLinkedUser {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
}
export interface CapitalParticipantContact {
  id: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  email: string | null
  phone: string | null
  company_name: string | null
  linked_user_id: string | null
  image_bucket: string | null
  image_path: string | null
  linked_user: CapitalParticipantLinkedUser | CapitalParticipantLinkedUser[] | null
}
export interface CapitalParticipant {
  id: string
  created_at: string
  updated_at: string | null
  contact_id: string
  organization_id: string
  notes: string | null
  status: 'active'| 'inactive'| 'deleted'
  created_by: string | null
  is_deleted: boolean
  deleted_at: string | null
  ownership_percentage: number | null
  contacts: CapitalParticipantContact | null
}
export interface CapitalParticipantCreateInput {
  contact_id: string
  organization_id: string
  notes?: string | null
  status?: 'active'| 'inactive'
  created_by?: string | null
  ownership_percentage?: number | null
}
export interface CapitalParticipantUpdateInput {
  contact_id?: string
  notes?: string | null
  status?: 'active'| 'inactive'| 'deleted'
  ownership_percentage?: number | null
}
export interface MediaFile {
  id: string
  file_name: string | null
  file_url: string | null
  file_type: string
  file_size: number | null
  bucket: string
  file_path: string
}
export interface MediaLink {
  id: string
  media_file_id: string
  media_file: MediaFile
  category: string | null
  description: string | null
  is_cover: boolean | null
}
export interface CapitalContribution {
  id: string
  project_id: string | null
  organization_id: string
  partner_id: string | null
  amount: number
  currency_id: string
  exchange_rate: number
  contribution_date: string
  wallet_id: string | null
  status: 'confirmed'| 'pending'| 'rejected'| 'void'
  notes: string | null
  reference: string | null
  created_by: string | null
  created_at: string
  is_deleted?: boolean
  deleted_at?: string | null
  partner?: CapitalParticipant
  currency?: { id: string; name: string; symbol: string; code: string }
  media_links?: MediaLink[]
}
export interface CapitalWithdrawal {
  id: string
  project_id: string | null
  organization_id: string
  partner_id: string | null
  amount: number
  currency_id: string
  exchange_rate: number
  withdrawal_date: string
  wallet_id: string | null
  status: 'confirmed'| 'pending'| 'rejected'| 'void'
  notes: string | null
  reference: string | null
  created_by: string | null
  created_at: string
  is_deleted?: boolean
  deleted_at?: string | null
  partner?: CapitalParticipant
  currency?: { id: string; name: string; symbol: string; code: string }
  media_links?: MediaLink[]
}
export interface CapitalContributionCreateInput {
  organization_id: string
  project_id?: string | null
  partner_id: string
  amount: number
  currency_id: string
  exchange_rate?: number
  contribution_date: string
  wallet_id: string
  status: 'confirmed'| 'pending'| 'rejected'| 'void'
  reference?: string | null
  notes?: string | null
  created_by: string
}
export interface CapitalWithdrawalCreateInput {
  organization_id: string
  project_id?: string | null
  partner_id: string
  amount: number
  currency_id: string
  exchange_rate?: number
  withdrawal_date: string
  wallet_id: string
  status: 'confirmed'| 'pending'| 'rejected'| 'void'
  reference?: string | null
  notes?: string | null
  created_by: string
}
export interface CapitalAdjustment {
  id: string
  organization_id: string
  partner_id: string | null
  project_id: string | null
  currency_id: string
  exchange_rate: number
  amount: number // SIGNED: can be + or -
  adjustment_date: string
  reason: string | null
  notes: string | null
  reference: string | null
  status: 'confirmed'| 'pending'| 'rejected'| 'void'
  created_by: string | null
  created_at: string
  updated_at: string
  is_deleted: boolean
  deleted_at: string | null
  partner?: CapitalParticipant
  currency?: { id: string; name: string; symbol: string; code: string }
}
export interface CapitalAdjustmentCreateInput {
  organization_id: string
  partner_id?: string | null
  project_id?: string | null
  currency_id: string
  exchange_rate?: number
  amount: number // SIGNED
  adjustment_date: string
  reason?: string | null
  notes?: string | null
  reference?: string | null
  status: 'confirmed'| 'pending'| 'rejected'| 'void'
  created_by: string
}
export interface CapitalAdjustmentUpdateInput {
  amount?: number
  adjustment_date?: string
  reason?: string
  notes?: string | null
  reference?: string | null
  status?: 'confirmed'| 'pending'| 'rejected'| 'void'
}
// Unified ledger (union of all 3 movement types)
export type LedgerEntry = 
  | (CapitalContribution & { type: 'contribution'; signedAmount: number })
  | (CapitalWithdrawal & { type: 'withdrawal'; signedAmount: number })
  | (CapitalAdjustment & { type: 'adjustment'; signedAmount: number })
// Backward compatibility aliases (to be removed later)
export type Partner = CapitalParticipant
export type PartnerContact = CapitalParticipantContact
export type PartnerLinkedUser = CapitalParticipantLinkedUser
export type PartnerCreateInput = CapitalParticipantCreateInput
export type PartnerUpdateInput = CapitalParticipantUpdateInput
export type PartnerContribution = CapitalContribution
export type PartnerWithdrawal = CapitalWithdrawal
export type PartnerContributionCreateInput = CapitalContributionCreateInput
export type PartnerWithdrawalCreateInput = CapitalWithdrawalCreateInput
