-- Fix typo in personnel_insurances table column name
-- Change personnnel_id (3 n's) to personnel_id (2 n's)

-- First, check if the wrong column exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'personnel_insurances' 
        AND column_name = 'personnnel_id'
    ) THEN
        -- Rename the column
        ALTER TABLE personnel_insurances 
        RENAME COLUMN personnnel_id TO personnel_id;
        
        RAISE NOTICE 'Column personnnel_id renamed to personnel_id successfully';
    ELSE
        RAISE NOTICE 'Column personnnel_id does not exist, no changes needed';
    END IF;
END $$;

-- Update the view if it exists
DROP VIEW IF EXISTS personnel_insurance_view;

-- Recreate the view with correct column name and better contact relationship
CREATE OR REPLACE VIEW personnel_insurance_view AS
SELECT 
    pi.*,
    pp.contact_id,
    CASE 
        WHEN pi.coverage_end < CURRENT_DATE THEN 'vencido'
        WHEN pi.coverage_end <= CURRENT_DATE + INTERVAL '30 days' THEN 'por_vencer'
        ELSE 'vigente'
    END as status,
    (pi.coverage_end - CURRENT_DATE) as days_to_expiry,
    c.first_name,
    c.last_name,
    c.full_name,
    c.avatar_attachment_id
FROM personnel_insurances pi
LEFT JOIN project_personnel pp ON pi.personnel_id = pp.id
LEFT JOIN contacts c ON pp.contact_id = c.id;