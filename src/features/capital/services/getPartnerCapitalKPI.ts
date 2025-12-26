import { supabase } from '@/lib/supabase';

export interface PartnerCapitalKPI {
  partner_id: string;
  organization_id: string;
  total_balance: number;
  ownership_ratio: number | null;
  ownership_percentage: number | null;
  // Totals (for reference)
  total_contributions: number;
  total_withdrawals: number;
  total_adjustments: number;
  total_net_capital: number;
  // Partner contributions breakdown
  partner_contributed: number;
  partner_withdrawn: number;
  partner_adjusted: number;
  // Expected values
  expected_contribution: number | null;
  expected_net_capital: number | null;
  // Deviations
  deviation_contribution: number | null;
  deviation_net: number | null;
  // Status
  contribution_status: 'sobre_aportado' | 'equilibrado' | 'bajo_aportado' | 'sin_porcentaje';
  net_status: 'arriba' | 'equilibrado' | 'abajo' | 'sin_porcentaje';
}

interface RawKPIRow {
  partner_id: string;
  organization_id: string;
  total_balance: number | string | null;
  ownership_ratio: number | string | null;
}

interface RawParticipantRow {
  id: string;
  ownership_percentage: number | null;
}

interface RawMovementRow {
  partner_id: string;
  amount: number | string | null;
}

interface RawAdjustmentRow {
  partner_id: string;
  amount: number | string | null;
}

export async function getPartnerCapitalKPI(organizationId: string): Promise<PartnerCapitalKPI[]> {
  const [kpiResult, participantsResult, contributionsResult, withdrawalsResult, adjustmentsResult] = await Promise.all([
    supabase
      .from('partner_capital_kpi_view')
      .select('partner_id, organization_id, total_balance, ownership_ratio')
      .eq('organization_id', organizationId),
    supabase
      .from('capital_participants')
      .select('id, ownership_percentage')
      .eq('organization_id', organizationId)
      .eq('is_deleted', false),
    supabase
      .from('partner_contributions')
      .select('partner_id, amount')
      .eq('organization_id', organizationId)
      .eq('status', 'confirmed'),
    supabase
      .from('partner_withdrawals')
      .select('partner_id, amount')
      .eq('organization_id', organizationId)
      .eq('status', 'confirmed'),
    supabase
      .from('capital_adjustments')
      .select('partner_id, amount')
      .eq('organization_id', organizationId)
      .eq('status', 'confirmed')
      .eq('is_deleted', false),
  ]);

  if (kpiResult.error) {
    throw new Error(`Failed to fetch partner capital KPIs: ${kpiResult.error.message}`);
  }

  if (participantsResult.error) {
    throw new Error(`Failed to fetch participants: ${participantsResult.error.message}`);
  }

  if (contributionsResult.error) {
    throw new Error(`Failed to fetch partner contributions: ${contributionsResult.error.message}`);
  }

  if (withdrawalsResult.error) {
    throw new Error(`Failed to fetch partner withdrawals: ${withdrawalsResult.error.message}`);
  }

  if (adjustmentsResult.error) {
    throw new Error(`Failed to fetch capital adjustments: ${adjustmentsResult.error.message}`);
  }

  const kpiData = (kpiResult.data || []) as RawKPIRow[];
  const participants = (participantsResult.data || []) as RawParticipantRow[];
  const contributions = (contributionsResult.data || []) as RawMovementRow[];
  const withdrawals = (withdrawalsResult.data || []) as RawMovementRow[];
  const adjustments = (adjustmentsResult.data || []) as RawAdjustmentRow[];

  // Calculate totals from confirmed movements only
  const total_contributions = contributions.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const total_withdrawals = withdrawals.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const total_adjustments = adjustments.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const total_net_capital = total_contributions - total_withdrawals + total_adjustments;

  const participantMap = new Map(participants.map(p => [p.id, p.ownership_percentage]));

  // Build maps for per-partner calculations
  const partnerContributions = new Map<string, number>();
  const partnerWithdrawals = new Map<string, number>();
  const partnerAdjustments = new Map<string, number>();

  contributions.forEach(row => {
    const partnerId = row.partner_id;
    partnerContributions.set(partnerId, (partnerContributions.get(partnerId) || 0) + (Number(row.amount) || 0));
  });

  withdrawals.forEach(row => {
    const partnerId = row.partner_id;
    partnerWithdrawals.set(partnerId, (partnerWithdrawals.get(partnerId) || 0) + (Number(row.amount) || 0));
  });

  adjustments.forEach(row => {
    const partnerId = row.partner_id;
    partnerAdjustments.set(partnerId, (partnerAdjustments.get(partnerId) || 0) + (Number(row.amount) || 0));
  });

  return kpiData.map(row => {
    const balance = Number(row.total_balance) || 0;
    const ownership_ratio = row.ownership_ratio !== null ? Number(row.ownership_ratio) : null;
    const ownership_percentage = participantMap.get(row.partner_id) ?? null;

    const partner_contributed = partnerContributions.get(row.partner_id) || 0;
    const partner_withdrawn = partnerWithdrawals.get(row.partner_id) || 0;
    const partner_adjusted = partnerAdjustments.get(row.partner_id) || 0;

    let expected_contribution: number | null = null;
    let expected_net_capital: number | null = null;
    let deviation_contribution: number | null = null;
    let deviation_net: number | null = null;
    let contribution_status: PartnerCapitalKPI['contribution_status'] = 'sin_porcentaje';
    let net_status: PartnerCapitalKPI['net_status'] = 'sin_porcentaje';

    if (ownership_percentage !== null && ownership_percentage > 0) {
      const p = ownership_percentage / 100;
      
      // Expected contribution = total_contributions * percentage
      expected_contribution = total_contributions * p;
      expected_net_capital = total_net_capital * p;
      
      // Deviations with proper sign
      deviation_contribution = partner_contributed - expected_contribution;
      deviation_net = balance - expected_net_capital;

      // Contribution status
      if (Math.abs(deviation_contribution) <= 5) {
        contribution_status = 'equilibrado';
      } else if (deviation_contribution > 0) {
        contribution_status = 'sobre_aportado';
      } else {
        contribution_status = 'bajo_aportado';
      }

      // Net status (only check absolute deviation for threshold)
      if (Math.abs(deviation_net) <= 5) {
        net_status = 'equilibrado';
      } else if (deviation_net > 0) {
        net_status = 'arriba';
      } else {
        net_status = 'abajo';
      }
    }

    return {
      partner_id: row.partner_id,
      organization_id: row.organization_id,
      total_balance: balance,
      ownership_ratio,
      ownership_percentage,
      total_contributions,
      total_withdrawals,
      total_adjustments,
      total_net_capital,
      partner_contributed,
      partner_withdrawn,
      partner_adjusted,
      expected_contribution,
      expected_net_capital,
      deviation_contribution,
      deviation_net,
      contribution_status,
      net_status,
    };
  });
}
