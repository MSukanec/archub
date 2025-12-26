import { supabase } from '@/lib/supabase';
import type { PartnerContribution } from '../types';

export async function getPartnerContributions(
  organizationId: string,
  projectId?: string
): Promise<PartnerContribution[]> {
  if (!organizationId) return [];

  let query = supabase
    .from('partner_contributions')
    .select(`
      *,
      partner:capital_participants(
        id,
        created_at,
        contacts(id, full_name, first_name, last_name, email, phone, company_name)
      ),
      currency:currencies(id, name, symbol, code),
      organization_wallet:organization_wallets(
        id,
        wallets:wallet_id(id, name)
      )
    `)
    .eq('organization_id', organizationId)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('contribution_date', { ascending: false });

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data as PartnerContribution[]) || [];
}

export async function getPartnerContributionById(
  id: string,
  organizationId: string
): Promise<PartnerContribution | null> {
  if (!id || !organizationId) return null;

  const { data, error } = await supabase
    .from('partner_contributions')
    .select(`
      *,
      partner:capital_participants(
        id,
        created_at,
        contacts(id, full_name, first_name, last_name, email, phone, company_name)
      ),
      currency:currencies(id, name, symbol, code),
      media_links(
        id,
        media_file_id,
        media_file:media_files(
          id,
          file_name,
          file_url,
          file_type,
          file_size,
          bucket,
          file_path
        ),
        category,
        description,
        is_cover
      )
    `)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .single();

  if (error) throw error;
  return data as PartnerContribution;
}
