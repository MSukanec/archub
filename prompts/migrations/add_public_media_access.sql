-- Migration: Add public access for course media
-- Date: 2025-11-22
-- Purpose: Allow course images to be displayed on public pages without authentication

-- Step 1: Add is_public column to media_links (if not exists)
ALTER TABLE media_links 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Step 2: Mark all existing course media as public
-- This includes media linked to courses, course_modules, and course_lessons
UPDATE media_links 
SET is_public = true 
WHERE course_id IS NOT NULL 
   OR course_module_id IS NOT NULL 
   OR course_lesson_id IS NOT NULL;

-- Step 3: Add index for optimizing public media queries
CREATE INDEX IF NOT EXISTS idx_media_links_is_public 
ON media_links(is_public) 
WHERE is_public = true;

-- Step 4: Create RLS policy for public media links
DROP POLICY IF EXISTS "Public media links can be selected by anyone" ON media_links;
CREATE POLICY "Public media links can be selected by anyone"
ON media_links
FOR SELECT
USING (is_public = true);

-- Step 5: Create RLS policy for public media files
DROP POLICY IF EXISTS "Public media files can be selected by anyone" ON media_files;
CREATE POLICY "Public media files can be selected by anyone"
ON media_files
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM media_links 
    WHERE media_links.media_file_id = media_files.id 
    AND media_links.is_public = true
  )
);

-- Step 6: Verify existing RLS policies don't conflict
-- The new policies will work alongside existing organization-based policies
-- because RLS policies are combined with OR logic for SELECT operations

-- Verification query (uncomment to check results after migration)
-- SELECT 
--   ml.id,
--   ml.course_id,
--   ml.is_public,
--   mf.file_url,
--   mf.file_name
-- FROM media_links ml
-- JOIN media_files mf ON ml.media_file_id = mf.id
-- WHERE ml.is_public = true
-- LIMIT 10;
