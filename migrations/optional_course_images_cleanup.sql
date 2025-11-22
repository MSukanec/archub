-- Optional SQL Migration for Course Cover Images System
-- Run this to cleanup legacy data and prevent future duplicates
-- Execute via Database pane in Replit

-- STEP 1: Backfill legacy cover links with proper flags
-- This ensures all existing course covers have the correct metadata
UPDATE media_links 
SET 
  category = 'course_cover', 
  is_cover = true, 
  is_public = true, 
  visibility = 'public'
WHERE 
  course_id IS NOT NULL 
  AND organization_id IS NULL
  AND (category IS NULL OR is_cover IS DISTINCT FROM true);

-- STEP 2: Collapse duplicates - keep newest per course, delete others
-- This CTE identifies and removes duplicate cover links
WITH ranked_covers AS (
  SELECT 
    id,
    media_file_id,
    course_id,
    ROW_NUMBER() OVER (
      PARTITION BY course_id 
      ORDER BY 
        CASE WHEN category = 'course_cover' THEN 0 ELSE 1 END,
        CASE WHEN is_cover = true THEN 0 ELSE 1 END,
        created_at DESC
    ) as rank
  FROM media_links
  WHERE 
    course_id IS NOT NULL 
    AND category = 'course_cover'
),
duplicates AS (
  SELECT id, media_file_id
  FROM ranked_covers
  WHERE rank > 1
)
-- Soft-delete media_files for duplicate links
UPDATE media_files
SET is_deleted = true
WHERE id IN (SELECT media_file_id FROM duplicates);

-- Delete duplicate media_links
DELETE FROM media_links
WHERE id IN (SELECT id FROM duplicates);

-- STEP 3: Add partial unique index to prevent future duplicates
-- This constraint ensures only ONE active cover link per course
CREATE UNIQUE INDEX IF NOT EXISTS media_links_course_cover_unique
ON media_links(course_id)
WHERE category = 'course_cover' AND COALESCE(is_cover, false) = true;

-- VERIFICATION QUERIES:
-- Run these to confirm cleanup worked correctly

-- Check: Should show only 1 cover link per course
SELECT 
  course_id, 
  COUNT(*) as cover_count
FROM media_links
WHERE category = 'course_cover' AND is_cover = true
GROUP BY course_id
HAVING COUNT(*) > 1;

-- Check: Should show no soft-deleted files linked to active covers
SELECT 
  ml.course_id,
  ml.id as link_id,
  mf.id as file_id,
  mf.is_deleted
FROM media_links ml
JOIN media_files mf ON ml.media_file_id = mf.id
WHERE 
  ml.category = 'course_cover' 
  AND ml.is_cover = true
  AND mf.is_deleted = true;
