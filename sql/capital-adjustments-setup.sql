-- This file contains the SQL setup for capital adjustments and balance tracking
-- Execute this in Supabase SQL Editor to activate triggers and auto-balance updates

-- Create function to update partner balance after capital changes
CREATE OR REPLACE FUNCTION update_partner_balance_after_capital_change()
RETURNS TRIGGER AS $$
DECLARE
  v_partner_id uuid;
  v_organization_id uuid;
  v_signed_amount numeric;
BEGIN
  -- Determine the partner_id and organization_id based on the operation
  IF TG_TABLE_NAME = 'capital_adjustments' THEN
    v_partner_id := NEW.partner_id;
    v_organization_id := NEW.organization_id;
    v_signed_amount := CASE 
      WHEN TG_OP = 'DELETE' THEN -(OLD.amount)
      ELSE NEW.amount
    END;
  ELSIF TG_TABLE_NAME = 'partner_contributions' THEN
    v_partner_id := NEW.partner_id;
    v_organization_id := NEW.organization_id;
    v_signed_amount := CASE 
      WHEN TG_OP = 'DELETE' THEN -(OLD.amount)
      ELSE NEW.amount
    END;
  ELSIF TG_TABLE_NAME = 'partner_withdrawals' THEN
    v_partner_id := NEW.partner_id;
    v_organization_id := NEW.organization_id;
    v_signed_amount := CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.amount
      ELSE -(NEW.amount)
    END;
  END IF;

  -- Only update if we have a partner_id
  IF v_partner_id IS NOT NULL THEN
    INSERT INTO partner_capital_balance (partner_id, organization_id, balance_amount, balance_date, is_deleted)
    VALUES (v_partner_id, v_organization_id, v_signed_amount, CURRENT_DATE, false)
    ON CONFLICT (partner_id, organization_id) 
    DO UPDATE SET 
      balance_amount = partner_capital_balance.balance_amount + EXCLUDED.balance_amount,
      updated_at = NOW();
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers to recreate them
DROP TRIGGER IF EXISTS trg_update_balance_adjustment ON capital_adjustments;
DROP TRIGGER IF EXISTS trg_update_balance_contribution ON partner_contributions;
DROP TRIGGER IF EXISTS trg_update_balance_withdrawal ON partner_withdrawals;

-- Recreate all triggers
CREATE TRIGGER trg_update_balance_adjustment
AFTER INSERT OR DELETE OR UPDATE ON capital_adjustments
FOR EACH ROW
EXECUTE FUNCTION update_partner_balance_after_capital_change();

CREATE TRIGGER trg_update_balance_contribution
AFTER INSERT OR DELETE OR UPDATE ON partner_contributions
FOR EACH ROW
EXECUTE FUNCTION update_partner_balance_after_capital_change();

CREATE TRIGGER trg_update_balance_withdrawal
AFTER INSERT OR DELETE OR UPDATE ON partner_withdrawals
FOR EACH ROW
EXECUTE FUNCTION update_partner_balance_after_capital_change();

-- Verify the constraint exists
ALTER TABLE partner_capital_balance 
DROP CONSTRAINT IF EXISTS partner_capital_balance_unique;

ALTER TABLE partner_capital_balance 
ADD CONSTRAINT partner_capital_balance_unique 
UNIQUE (partner_id, organization_id);

-- Populate initial balances (run this once)
-- This recalculates all partner balances from scratch
DELETE FROM partner_capital_balance WHERE is_deleted = false;

INSERT INTO partner_capital_balance (partner_id, organization_id, balance_amount, balance_date)
SELECT 
  COALESCE(pc.partner_id, pw.partner_id, ca.partner_id) as partner_id,
  COALESCE(pc.organization_id, pw.organization_id, ca.organization_id) as organization_id,
  COALESCE(SUM(CASE 
    WHEN ca.id IS NOT NULL THEN ca.amount
    WHEN pc.id IS NOT NULL THEN pc.amount
    WHEN pw.id IS NOT NULL THEN -pw.amount
  END), 0) as balance_amount,
  CURRENT_DATE
FROM (
  SELECT DISTINCT partner_id, organization_id FROM capital_adjustments WHERE partner_id IS NOT NULL AND is_deleted = false
  UNION ALL
  SELECT DISTINCT partner_id, organization_id FROM partner_contributions WHERE partner_id IS NOT NULL AND (is_deleted IS NULL OR is_deleted = false)
  UNION ALL
  SELECT DISTINCT partner_id, organization_id FROM partner_withdrawals WHERE partner_id IS NOT NULL AND (is_deleted IS NULL OR is_deleted = false)
) AS combined
LEFT JOIN capital_adjustments ca ON ca.partner_id = combined.partner_id AND ca.organization_id = combined.organization_id AND ca.is_deleted = false
LEFT JOIN partner_contributions pc ON pc.partner_id = combined.partner_id AND pc.organization_id = combined.organization_id AND (pc.is_deleted IS NULL OR pc.is_deleted = false)
LEFT JOIN partner_withdrawals pw ON pw.partner_id = combined.partner_id AND pw.organization_id = combined.organization_id AND (pw.is_deleted IS NULL OR pw.is_deleted = false)
GROUP BY COALESCE(pc.partner_id, pw.partner_id, ca.partner_id), COALESCE(pc.organization_id, pw.organization_id, ca.organization_id)
ON CONFLICT (partner_id, organization_id) 
DO UPDATE SET balance_amount = EXCLUDED.balance_amount;
