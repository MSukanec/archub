-- ============================================================================
-- CAPITAL MODULE - COMPLETE VIEWS SETUP
-- ============================================================================
-- This SQL drops problematic views and creates clean views that calculate
-- everything from the source tables (partner_contributions, partner_withdrawals,
-- capital_adjustments) without relying on the partner_capital_balance table.
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP EXISTING PROBLEMATIC VIEWS
-- ============================================================================

DROP VIEW IF EXISTS public.partner_capital_kpi_view CASCADE;
DROP VIEW IF EXISTS public.partner_balance_summary_view CASCADE;

-- ============================================================================
-- STEP 2: CREATE ORGANIZATION TOTALS VIEW
-- This view calculates totals for each organization from confirmed transactions
-- ============================================================================

CREATE OR REPLACE VIEW public.capital_organization_totals_view AS
SELECT
  org.id AS organization_id,
  COALESCE(contributions.total, 0) AS total_contributions,
  COALESCE(withdrawals.total, 0) AS total_withdrawals,
  COALESCE(adjustments.total, 0) AS total_adjustments,
  COALESCE(contributions.total, 0) - COALESCE(withdrawals.total, 0) + COALESCE(adjustments.total, 0) AS total_net_capital,
  COALESCE(contributions.count, 0) AS contributions_count,
  COALESCE(withdrawals.count, 0) AS withdrawals_count,
  COALESCE(adjustments.count, 0) AS adjustments_count
FROM organizations org
LEFT JOIN (
  SELECT 
    organization_id,
    SUM(amount) AS total,
    COUNT(*) AS count
  FROM partner_contributions
  WHERE status = 'confirmed' 
    AND (is_deleted = false OR is_deleted IS NULL)
  GROUP BY organization_id
) contributions ON contributions.organization_id = org.id
LEFT JOIN (
  SELECT 
    organization_id,
    SUM(amount) AS total,
    COUNT(*) AS count
  FROM partner_withdrawals
  WHERE status = 'confirmed' 
    AND (is_deleted = false OR is_deleted IS NULL)
  GROUP BY organization_id
) withdrawals ON withdrawals.organization_id = org.id
LEFT JOIN (
  SELECT 
    organization_id,
    SUM(amount) AS total,
    COUNT(*) AS count
  FROM capital_adjustments
  WHERE status = 'confirmed' 
    AND is_deleted = false
  GROUP BY organization_id
) adjustments ON adjustments.organization_id = org.id;

-- ============================================================================
-- STEP 3: CREATE PARTNER BALANCES VIEW
-- This view calculates the balance for each partner from confirmed transactions
-- Balance = Contributions - Withdrawals + Adjustments
-- ============================================================================

CREATE OR REPLACE VIEW public.capital_partner_balances_view AS
SELECT
  cp.id AS partner_id,
  cp.organization_id,
  cp.ownership_percentage,
  cp.status AS partner_status,
  COALESCE(contributions.total, 0) AS total_contributed,
  COALESCE(withdrawals.total, 0) AS total_withdrawn,
  COALESCE(adjustments.total, 0) AS total_adjusted,
  COALESCE(contributions.total, 0) - COALESCE(withdrawals.total, 0) + COALESCE(adjustments.total, 0) AS current_balance,
  COALESCE(contributions.count, 0) AS contributions_count,
  COALESCE(withdrawals.count, 0) AS withdrawals_count,
  COALESCE(adjustments.count, 0) AS adjustments_count,
  GREATEST(
    contributions.last_date,
    withdrawals.last_date,
    adjustments.last_date
  ) AS last_movement_date
FROM capital_participants cp
LEFT JOIN (
  SELECT 
    partner_id,
    SUM(amount) AS total,
    COUNT(*) AS count,
    MAX(contribution_date) AS last_date
  FROM partner_contributions
  WHERE status = 'confirmed' 
    AND (is_deleted = false OR is_deleted IS NULL)
  GROUP BY partner_id
) contributions ON contributions.partner_id = cp.id
LEFT JOIN (
  SELECT 
    partner_id,
    SUM(amount) AS total,
    COUNT(*) AS count,
    MAX(withdrawal_date) AS last_date
  FROM partner_withdrawals
  WHERE status = 'confirmed' 
    AND (is_deleted = false OR is_deleted IS NULL)
  GROUP BY partner_id
) withdrawals ON withdrawals.partner_id = cp.id
LEFT JOIN (
  SELECT 
    partner_id,
    SUM(amount) AS total,
    COUNT(*) AS count,
    MAX(adjustment_date) AS last_date
  FROM capital_adjustments
  WHERE status = 'confirmed' 
    AND is_deleted = false
  GROUP BY partner_id
) adjustments ON adjustments.partner_id = cp.id
WHERE cp.is_deleted = false;

-- ============================================================================
-- STEP 4: CREATE PARTNER KPI VIEW
-- This view calculates all KPIs for each partner including:
-- - Expected values based on ownership percentage
-- - Deviations (actual - expected)
-- - Status indicators
-- ============================================================================

CREATE OR REPLACE VIEW public.capital_partner_kpi_view AS
SELECT
  pb.partner_id,
  pb.organization_id,
  pb.ownership_percentage,
  pb.partner_status,
  
  -- Partner actuals
  pb.total_contributed,
  pb.total_withdrawn,
  pb.total_adjusted,
  pb.current_balance,
  
  -- Organization totals
  ot.total_contributions AS org_total_contributions,
  ot.total_withdrawals AS org_total_withdrawals,
  ot.total_adjustments AS org_total_adjustments,
  ot.total_net_capital AS org_total_net_capital,
  
  -- Expected values (based on ownership percentage)
  CASE 
    WHEN pb.ownership_percentage IS NOT NULL AND pb.ownership_percentage > 0 
    THEN ot.total_contributions * (pb.ownership_percentage / 100)
    ELSE NULL 
  END AS expected_contribution,
  
  CASE 
    WHEN pb.ownership_percentage IS NOT NULL AND pb.ownership_percentage > 0 
    THEN ot.total_net_capital * (pb.ownership_percentage / 100)
    ELSE NULL 
  END AS expected_net_capital,
  
  -- Deviations (actual - expected, with correct sign)
  CASE 
    WHEN pb.ownership_percentage IS NOT NULL AND pb.ownership_percentage > 0 
    THEN pb.total_contributed - (ot.total_contributions * (pb.ownership_percentage / 100))
    ELSE NULL 
  END AS deviation_contribution,
  
  CASE 
    WHEN pb.ownership_percentage IS NOT NULL AND pb.ownership_percentage > 0 
    THEN pb.current_balance - (ot.total_net_capital * (pb.ownership_percentage / 100))
    ELSE NULL 
  END AS deviation_net,
  
  -- Real ownership ratio (based on actual balance vs total)
  CASE 
    WHEN ot.total_net_capital > 0 
    THEN pb.current_balance / ot.total_net_capital
    ELSE NULL 
  END AS real_ownership_ratio,
  
  -- Contribution status
  CASE
    WHEN pb.ownership_percentage IS NULL OR pb.ownership_percentage = 0 THEN 'sin_porcentaje'
    WHEN pb.total_contributed - (ot.total_contributions * (pb.ownership_percentage / 100)) > 0 THEN 'sobre_aportado'
    WHEN pb.total_contributed - (ot.total_contributions * (pb.ownership_percentage / 100)) < 0 THEN 'bajo_aportado'
    ELSE 'equilibrado'
  END AS contribution_status,
  
  -- Net capital status
  CASE
    WHEN pb.ownership_percentage IS NULL OR pb.ownership_percentage = 0 THEN 'sin_porcentaje'
    WHEN pb.current_balance - (ot.total_net_capital * (pb.ownership_percentage / 100)) > 0 THEN 'arriba'
    WHEN pb.current_balance - (ot.total_net_capital * (pb.ownership_percentage / 100)) < 0 THEN 'abajo'
    ELSE 'equilibrado'
  END AS net_status,
  
  -- Metadata
  pb.contributions_count,
  pb.withdrawals_count,
  pb.adjustments_count,
  pb.last_movement_date

FROM capital_partner_balances_view pb
LEFT JOIN capital_organization_totals_view ot ON ot.organization_id = pb.organization_id;

-- ============================================================================
-- STEP 5: CREATE UNIFIED LEDGER VIEW
-- This view combines all capital movements (contributions, withdrawals, adjustments)
-- into a single unified view for transaction history/ledger
-- ============================================================================

CREATE OR REPLACE VIEW public.capital_ledger_view AS
SELECT
  pc.id,
  pc.organization_id,
  pc.project_id,
  pc.partner_id,
  'contribution' AS movement_type,
  pc.amount AS signed_amount,
  pc.amount AS original_amount,
  pc.currency_id,
  pc.exchange_rate,
  pc.contribution_date AS movement_date,
  pc.notes,
  pc.reference,
  pc.wallet_id,
  pc.status,
  pc.created_by,
  pc.created_at,
  pc.is_deleted
FROM partner_contributions pc
WHERE pc.status = 'confirmed' 
  AND (pc.is_deleted = false OR pc.is_deleted IS NULL)

UNION ALL

SELECT
  pw.id,
  pw.organization_id,
  pw.project_id,
  pw.partner_id,
  'withdrawal' AS movement_type,
  -pw.amount AS signed_amount,
  pw.amount AS original_amount,
  pw.currency_id,
  pw.exchange_rate,
  pw.withdrawal_date AS movement_date,
  pw.notes,
  pw.reference,
  pw.wallet_id,
  pw.status,
  pw.created_by,
  pw.created_at,
  pw.is_deleted
FROM partner_withdrawals pw
WHERE pw.status = 'confirmed' 
  AND (pw.is_deleted = false OR pw.is_deleted IS NULL)

UNION ALL

SELECT
  ca.id,
  ca.organization_id,
  ca.project_id,
  ca.partner_id,
  'adjustment' AS movement_type,
  ca.amount AS signed_amount,
  ABS(ca.amount) AS original_amount,
  ca.currency_id,
  ca.exchange_rate,
  ca.adjustment_date AS movement_date,
  ca.notes,
  ca.reference,
  NULL AS wallet_id,
  ca.status,
  ca.created_by,
  ca.created_at,
  ca.is_deleted
FROM capital_adjustments ca
WHERE ca.status = 'confirmed' 
  AND ca.is_deleted = false;

-- ============================================================================
-- STEP 6: CREATE PARTICIPANT SUMMARY VIEW (for participant list)
-- This is a simpler view for the participants list showing basic info + balance
-- ============================================================================

CREATE OR REPLACE VIEW public.capital_participants_summary_view AS
SELECT
  cp.id AS partner_id,
  cp.organization_id,
  cp.contact_id,
  cp.ownership_percentage,
  cp.status,
  cp.notes,
  cp.created_at,
  COALESCE(pb.total_contributed, 0) AS total_contributed,
  COALESCE(pb.total_withdrawn, 0) AS total_withdrawn,
  COALESCE(pb.total_adjusted, 0) AS total_adjusted,
  COALESCE(pb.current_balance, 0) AS current_balance,
  COALESCE(pb.contributions_count, 0) AS contributions_count,
  COALESCE(pb.withdrawals_count, 0) AS withdrawals_count,
  pb.last_movement_date
FROM capital_participants cp
LEFT JOIN capital_partner_balances_view pb ON pb.partner_id = cp.id
WHERE cp.is_deleted = false;

-- ============================================================================
-- SUMMARY OF VIEWS CREATED:
-- ============================================================================
-- 1. capital_organization_totals_view
--    → Totals per organization (total_contributions, total_withdrawals, 
--      total_adjustments, total_net_capital)
--
-- 2. capital_partner_balances_view
--    → Balance per partner (total_contributed, total_withdrawn, total_adjusted,
--      current_balance)
--
-- 3. capital_partner_kpi_view
--    → Full KPIs per partner including expected values, deviations, and status
--
-- 4. capital_ledger_view
--    → Unified ledger of all capital movements with signed amounts
--
-- 5. capital_participants_summary_view
--    → Simple view for participant list with basic info + balance
-- ============================================================================
