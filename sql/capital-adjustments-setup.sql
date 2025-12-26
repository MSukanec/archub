-- ============================================================================
-- CAPITAL ADJUSTMENTS SETUP
-- Populates partner_capital_balance and creates auto-update triggers
-- ============================================================================

-- 1. Populate partner_capital_balance with current balances
-- This calculates the balance for each partner as:
-- SUM(confirmed contributions) - SUM(confirmed withdrawals) + SUM(confirmed adjustments)
-- Only considering non-deleted records
INSERT INTO partner_capital_balance (partner_id, organization_id, balance_amount)
SELECT 
  cp.id as partner_id,
  cp.organization_id,
  COALESCE(
    (SELECT COALESCE(SUM(amount), 0) FROM partner_contributions 
     WHERE partner_id = cp.id AND status = 'confirmed' AND is_deleted = false),
    0
  ) - 
  COALESCE(
    (SELECT COALESCE(SUM(amount), 0) FROM partner_withdrawals 
     WHERE partner_id = cp.id AND status = 'confirmed' AND is_deleted = false),
    0
  ) +
  COALESCE(
    (SELECT COALESCE(SUM(amount), 0) FROM capital_adjustments 
     WHERE partner_id = cp.id AND status = 'confirmed' AND is_deleted = false),
    0
  ) as balance_amount
FROM capital_participants cp
WHERE cp.is_deleted = false
  AND cp.organization_id IS NOT NULL
ON CONFLICT (partner_id) 
DO UPDATE SET 
  balance_amount = EXCLUDED.balance_amount,
  updated_at = now();

-- 2. Create or replace function to update partner balance
CREATE OR REPLACE FUNCTION update_partner_balance_after_capital_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate the new balance for the affected partner
  WITH balance_calc AS (
    SELECT 
      COALESCE(
        (SELECT COALESCE(SUM(amount), 0) FROM partner_contributions 
         WHERE partner_id = COALESCE(NEW.partner_id, OLD.partner_id) 
           AND status = 'confirmed' AND is_deleted = false),
        0
      ) - 
      COALESCE(
        (SELECT COALESCE(SUM(amount), 0) FROM partner_withdrawals 
         WHERE partner_id = COALESCE(NEW.partner_id, OLD.partner_id) 
           AND status = 'confirmed' AND is_deleted = false),
        0
      ) +
      COALESCE(
        (SELECT COALESCE(SUM(amount), 0) FROM capital_adjustments 
         WHERE partner_id = COALESCE(NEW.partner_id, OLD.partner_id) 
           AND status = 'confirmed' AND is_deleted = false),
        0
      ) as new_balance
  )
  INSERT INTO partner_capital_balance (partner_id, organization_id, balance_amount)
  SELECT 
    COALESCE(NEW.partner_id, OLD.partner_id),
    COALESCE(NEW.organization_id, OLD.organization_id),
    balance_calc.new_balance
  FROM balance_calc
  ON CONFLICT (partner_id) 
  DO UPDATE SET 
    balance_amount = EXCLUDED.balance_amount,
    updated_at = now();
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. Attach triggers to partner_contributions
DROP TRIGGER IF EXISTS trigger_update_balance_after_contribution ON partner_contributions;
CREATE TRIGGER trigger_update_balance_after_contribution
AFTER INSERT OR UPDATE OR DELETE ON partner_contributions
FOR EACH ROW
EXECUTE FUNCTION update_partner_balance_after_capital_change();

-- 4. Attach triggers to partner_withdrawals
DROP TRIGGER IF EXISTS trigger_update_balance_after_withdrawal ON partner_withdrawals;
CREATE TRIGGER trigger_update_balance_after_withdrawal
AFTER INSERT OR UPDATE OR DELETE ON partner_withdrawals
FOR EACH ROW
EXECUTE FUNCTION update_partner_balance_after_capital_change();

-- 5. Attach triggers to capital_adjustments
DROP TRIGGER IF EXISTS trigger_update_balance_after_adjustment ON capital_adjustments;
CREATE TRIGGER trigger_update_balance_after_adjustment
AFTER INSERT OR UPDATE OR DELETE ON capital_adjustments
FOR EACH ROW
EXECUTE FUNCTION update_partner_balance_after_capital_change();
