import { supabase } from '@/lib/supabase';

export interface PartnerCapitalKPI {
  partner_id: string;
  organization_id: string;
  ownership_percentage: number | null;
  partner_status: string;
  total_contributed: number;
  total_withdrawn: number;
  total_adjusted: number;
  current_balance: number;
  org_total_contributions: number;
  org_total_withdrawals: number;
  org_total_adjustments: number;
  org_total_net_capital: number;
  expected_contribution: number | null;
  expected_net_capital: number | null;
  deviation_contribution: number | null;
  deviation_net: number | null;
  real_ownership_ratio: number | null;
  contribution_status: 'sobre_aportado' | 'equilibrado' | 'bajo_aportado' | 'sin_porcentaje';
  net_status: 'arriba' | 'equilibrado' | 'abajo' | 'sin_porcentaje';
  contributions_count: number;
  withdrawals_count: number;
  adjustments_count: number;
  last_movement_date: string | null;
}

export async function getPartnerCapitalKPI(organizationId: string): Promise<PartnerCapitalKPI[]> {
  if (!organizationId) {
    return [];
  }

  const { data, error } = await supabase
    .from('capital_partner_kpi_view')
    .select('*')
    .eq('organization_id', organizationId);

  if (error) {
    throw new Error(`Failed to fetch partner capital KPIs: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map(row => ({
    partner_id: row.partner_id,
    organization_id: row.organization_id,
    ownership_percentage: row.ownership_percentage !== null ? Number(row.ownership_percentage) : null,
    partner_status: row.partner_status || 'active',
    total_contributed: Number(row.total_contributed) || 0,
    total_withdrawn: Number(row.total_withdrawn) || 0,
    total_adjusted: Number(row.total_adjusted) || 0,
    current_balance: Number(row.current_balance) || 0,
    org_total_contributions: Number(row.org_total_contributions) || 0,
    org_total_withdrawals: Number(row.org_total_withdrawals) || 0,
    org_total_adjustments: Number(row.org_total_adjustments) || 0,
    org_total_net_capital: Number(row.org_total_net_capital) || 0,
    expected_contribution: row.expected_contribution !== null ? Number(row.expected_contribution) : null,
    expected_net_capital: row.expected_net_capital !== null ? Number(row.expected_net_capital) : null,
    deviation_contribution: row.deviation_contribution !== null ? Number(row.deviation_contribution) : null,
    deviation_net: row.deviation_net !== null ? Number(row.deviation_net) : null,
    real_ownership_ratio: row.real_ownership_ratio !== null ? Number(row.real_ownership_ratio) : null,
    contribution_status: row.contribution_status || 'sin_porcentaje',
    net_status: row.net_status || 'sin_porcentaje',
    contributions_count: Number(row.contributions_count) || 0,
    withdrawals_count: Number(row.withdrawals_count) || 0,
    adjustments_count: Number(row.adjustments_count) || 0,
    last_movement_date: row.last_movement_date || null,
  }));
}
