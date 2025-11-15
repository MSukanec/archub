-- Function to calculate proration adjustment based on member events during a billing period
-- This calculates the pro-rated amount to add or subtract based on mid-cycle member changes

CREATE OR REPLACE FUNCTION calculate_proration_adjustment(
  org_id UUID,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ
)
RETURNS NUMERIC AS $$
DECLARE
  total_adjustment NUMERIC := 0;
  event RECORD;
  days_remaining INTEGER;
  total_days INTEGER;
  price_per_seat NUMERIC;
  daily_rate NUMERIC;
BEGIN
  -- Obtener precio por seat del plan actual
  SELECT COALESCE(bc.amount_per_seat, 20) INTO price_per_seat
  FROM organization_billing_cycles bc
  WHERE bc.organization_id = org_id
    AND bc.period_start = current_period_start
  LIMIT 1;
  
  -- Calcular días totales del período
  total_days := EXTRACT(DAY FROM (current_period_end - current_period_start));
  daily_rate := price_per_seat / total_days;
  
  -- Iterar sobre eventos del período
  FOR event IN
    SELECT event_type, event_date, is_billable, was_billable
    FROM organization_member_events
    WHERE organization_id = org_id
      AND event_date >= current_period_start
      AND event_date < current_period_end
    ORDER BY event_date
  LOOP
    days_remaining := EXTRACT(DAY FROM (current_period_end - event.event_date));
    
    CASE event.event_type
      WHEN 'member_added' THEN
        IF event.is_billable THEN
          total_adjustment := total_adjustment + (daily_rate * days_remaining);
        END IF;
      WHEN 'member_removed' THEN
        IF event.was_billable THEN
          total_adjustment := total_adjustment - (daily_rate * days_remaining);
        END IF;
      WHEN 'billable_enabled' THEN
        total_adjustment := total_adjustment + (daily_rate * days_remaining);
      WHEN 'billable_disabled' THEN
        total_adjustment := total_adjustment - (daily_rate * days_remaining);
    END CASE;
  END LOOP;
  
  RETURN ROUND(total_adjustment, 2);
END;
$$ LANGUAGE plpgsql;
