export interface Partner {
  id: string
  created_at: string
  contacts: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
    company_name: string | null
  }
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
