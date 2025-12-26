import { supabase } from '@/lib/supabase';

/**
 * Partner withdrawal from Supabase with all relations
 */
export interface PartnerWithdrawalWithRelations {
  id: string;
  organization_id: string;
  project_id: string | null;
  partner_id: string | null;
  amount: number;
  currency_id: string;
  exchange_rate: number;
  withdrawal_date: string;
  notes: string | null;
  reference: string | null;
  wallet_id: string | null;
  status: 'confirmed' | 'pending' | 'rejected' | 'void';
  created_by: string | null;
  file_url: string | null;
  created_at: string;
  updated_at: string;
  
  partner: {
    id: string;
    contacts: {
      id: string;
      full_name: string | null;
      first_name: string | null;
      last_name: string | null;
      email: string | null;
      phone: string | null;
      company_name: string | null;
    } | null;
  } | null;
  
  currency: {
    id: string;
    code: string;
    symbol: string;
    name: string;
  } | null;
  
  wallet: {
    id: string;
    organization_id: string;
    wallet_id: string;
    is_active: boolean;
    is_default: boolean;
    wallets: {
      id: string;
      name: string;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    } | null;
  } | null;
  
  creator: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  
  project: {
    id: string;
    name: string;
    code: string | null;
    color: string;
  } | null;
}

/**
 * Get all partner withdrawals for an organization with optional project filtering.
 * 
 * @param organizationId - Organization ID
 * @param projectId - Optional project ID for filtering
 * @returns Array of partner withdrawals with relations
 * @throws {Error} If the Supabase query fails
 */
export async function getPartnerWithdrawals(
  organizationId: string,
  projectId?: string
): Promise<PartnerWithdrawalWithRelations[]> {
  if (!supabase || !organizationId) {
    return [];
  }

  let query = supabase
    .from('partner_withdrawals')
    .select(`
      *,
      partner:capital_participants(
        id,
        contacts(
          id,
          full_name,
          first_name,
          last_name,
          email,
          phone,
          company_name
        )
      ),
      currency:currencies(
        id,
        code,
        symbol,
        name
      ),
      wallet:organization_wallets(
        id,
        organization_id,
        wallet_id,
        is_active,
        is_default,
        wallets:wallet_id(
          id,
          name,
          is_active,
          created_at,
          updated_at
        )
      ),
      creator:organization_members!created_by(
        id,
        user:users(
          id,
          email,
          full_name,
          avatar_url
        )
      ),
      project:projects(
        id,
        name,
        code,
        color
      )
    `)
    .eq('organization_id', organizationId)
    .or('is_deleted.is.null,is_deleted.eq.false');

  // Filter by project if provided
  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query.order('withdrawal_date', { ascending: false });

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Transform the data to match the expected structure
  return data.map(withdrawal => ({
    ...withdrawal,
    partner: withdrawal.partner || null,
    currency: withdrawal.currency || null,
    wallet: withdrawal.wallet || null,
    creator: withdrawal.creator?.user ? {
      id: withdrawal.creator.user.id,
      email: withdrawal.creator.user.email,
      full_name: withdrawal.creator.user.full_name,
      avatar_url: withdrawal.creator.user.avatar_url,
    } : null,
    project: withdrawal.project || null,
  }));
}
