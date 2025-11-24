-- Migration: Add image_bucket and image_path to project_data
-- Purpose: Support new 3-bucket storage architecture with metadata persistence
-- Date: 2025-01-24

-- Step 1: Add new columns
ALTER TABLE project_data
ADD COLUMN IF NOT EXISTS image_bucket TEXT,
ADD COLUMN IF NOT EXISTS image_path TEXT;

-- Step 2: Backfill existing data (OPTIONAL - depends on your current bucket structure)
-- If you have existing project_image_url values that follow the old pattern, you can backfill:
-- 
-- Example backfill for old 'project-image' bucket:
-- UPDATE project_data
-- SET 
--   image_bucket = 'social-assets',
--   image_path = 'projects/' || organization_id || '/' || id || '/gallery/' || 
--                REGEXP_REPLACE(project_image_url, '^.*/([^/]+)$', '\1')
-- WHERE project_image_url IS NOT NULL 
--   AND image_bucket IS NULL
--   AND project_image_url LIKE '%project-image%';
--
-- NOTE: The above backfill is commented out because it depends on your specific
-- URL structure. If needed, customize the path extraction logic to match your
-- existing URLs before running.

-- Step 3: Add indexes for performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_project_data_image_bucket 
ON project_data(image_bucket) 
WHERE image_bucket IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_project_data_image_metadata 
ON project_data(organization_id, image_bucket, image_path) 
WHERE image_bucket IS NOT NULL;

-- Step 4: Add comments for documentation
COMMENT ON COLUMN project_data.image_bucket IS 'Storage bucket name (public-assets, private-assets, or social-assets)';
COMMENT ON COLUMN project_data.image_path IS 'Full storage path within the bucket. Used to generate signed URLs on-demand.';

-- Migration complete
-- Next steps:
-- 1. Run this migration on your database
-- 2. For existing projects with images, you may need to re-upload covers OR customize the backfill query above
-- 3. New uploads will automatically use the new metadata system
