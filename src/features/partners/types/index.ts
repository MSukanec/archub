export interface PartnerLinkedUser {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
}

export interface PartnerContact {
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
}

export interface Partner {
  id: string
  created_at: string
  updated_at: string | null
  contact_id: string
  organization_id: string
  notes: string | null
  status: 'active' | 'inactive' | 'deleted'
  created_by: string | null
  is_deleted: boolean
  deleted_at: string | null
  contacts: PartnerContact | null
}

export interface PartnerCreateInput {
  contact_id: string
  organization_id: string
  notes?: string | null
  status?: 'active' | 'inactive'
  created_by?: string | null
}

export interface PartnerUpdateInput {
  contact_id?: string
  notes?: string | null
  status?: 'active' | 'inactive' | 'deleted'
}

export interface PartnerContribution {
  id: string
  project_id: string | null
  organization_id: string
  partner_id: string | null
  amount: number
  currency_id: string
  exchange_rate: number
  contribution_date: string
  wallet_id: string | null
  status: 'confirmed' | 'pending' | 'rejected' | 'void'
  notes: string | null
  reference: string | null
  created_by: string | null
  created_at: string
  is_deleted?: boolean
  deleted_at?: string | null
  partner?: Partner
  currency?: { id: string; name: string; symbol: string; code: string }
}

export interface PartnerWithdrawal {
  id: string
  project_id: string | null
  organization_id: string
  partner_id: string | null
  amount: number
  currency_id: string
  exchange_rate: number
  withdrawal_date: string
  wallet_id: string | null
  status: 'confirmed' | 'pending' | 'rejected' | 'void'
  notes: string | null
  reference: string | null
  created_by: string | null
  created_at: string
  is_deleted?: boolean
  deleted_at?: string | null
  partner?: Partner
  currency?: { id: string; name: string; symbol: string; code: string }
}

export interface PartnerContributionCreateInput {
  organization_id: string
  project_id?: string | null
  partner_id: string
  amount: number
  currency_id: string
  exchange_rate?: number
  contribution_date: string
  wallet_id: string
  status: 'confirmed' | 'pending' | 'rejected' | 'void'
  reference?: string | null
  notes?: string | null
  created_by: string
}

export interface PartnerWithdrawalCreateInput {
  organization_id: string
  project_id?: string | null
  partner_id: string
  amount: number
  currency_id: string
  exchange_rate?: number
  withdrawal_date: string
  wallet_id: string
  status: 'confirmed' | 'pending' | 'rejected' | 'void'
  reference?: string | null
  notes?: string | null
  created_by: string
}
