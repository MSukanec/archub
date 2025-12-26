import { supabase } from '@/lib/supabase';

export interface PartnerCapitalKPI {
  partner_id: string;
  organization_id: string;
  total_balance: number;
  ownership_ratio: number | null;
}

interface RawKPIRow {
  partner_id: string;
  organization_id: string;
  total_balance: number | string | null;
  ownership_ratio: number | string | null;
}

export async function getPartnerCapitalKPI(organizationId: string): Promise<PartnerCapitalKPI[]> {
  const { data, error } = await supabase
    .from('partner_capital_kpi_view')
    .select('partner_id, organization_id, total_balance, ownership_ratio')
    .eq('organization_id', organizationId);

  if (error) {
    throw new Error(`Failed to fetch partner capital KPIs: ${error.message}`);
  }

  return ((data || []) as RawKPIRow[]).map(row => ({
    partner_id: row.partner_id,
    organization_id: row.organization_id,
    total_balance: Number(row.total_balance) || 0,
    ownership_ratio: row.ownership_ratio !== null ? Number(row.ownership_ratio) : null,
  }));
}
