import { supabase } from '@/lib/supabase';

export interface PartnerCapitalKPI {
  partner_id: string;
  organization_id: string;
  total_balance: number;
  ownership_ratio: number | null;
  ownership_percentage: number | null;
  capital_total: number;
  capital_esperado: number | null;
  desvio_capital: number | null;
  equilibrium_status: 'equilibrado' | 'sobre_aportado' | 'bajo_aportado' | 'sin_porcentaje';
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

export async function getPartnerCapitalKPI(organizationId: string): Promise<PartnerCapitalKPI[]> {
  const [kpiResult, participantsResult, contributionsResult] = await Promise.all([
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
      .select('amount')
      .eq('organization_id', organizationId)
      .eq('status', 'confirmed'),
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

  const kpiData = (kpiResult.data || []) as RawKPIRow[];
  const participants = (participantsResult.data || []) as RawParticipantRow[];
  const contributions = (contributionsResult.data || []) as Array<{ amount: number | string | null }>;

  const capital_total = contributions.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  const participantMap = new Map(participants.map(p => [p.id, p.ownership_percentage]));

  return kpiData.map(row => {
    const balance = Number(row.total_balance) || 0;
    const ownership_ratio = row.ownership_ratio !== null ? Number(row.ownership_ratio) : null;
    const ownership_percentage = participantMap.get(row.partner_id) ?? null;

    let capital_esperado: number | null = null;
    let desvio_capital: number | null = null;
    let equilibrium_status: PartnerCapitalKPI['equilibrium_status'] = 'sin_porcentaje';

    if (ownership_percentage !== null && ownership_percentage > 0) {
      capital_esperado = capital_total * (ownership_percentage / 100);
      desvio_capital = balance - capital_esperado;

      const desvio_porcentaje = capital_esperado !== 0 
        ? Math.abs(desvio_capital / capital_esperado) * 100 
        : (desvio_capital === 0 ? 0 : 100);

      if (desvio_porcentaje <= 5) {
        equilibrium_status = 'equilibrado';
      } else if (desvio_capital > 0) {
        equilibrium_status = 'sobre_aportado';
      } else {
        equilibrium_status = 'bajo_aportado';
      }
    }

    return {
      partner_id: row.partner_id,
      organization_id: row.organization_id,
      total_balance: balance,
      ownership_ratio,
      ownership_percentage,
      capital_total,
      capital_esperado,
      desvio_capital,
      equilibrium_status,
    };
  });
}
