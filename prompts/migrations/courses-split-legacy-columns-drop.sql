-- =====================================================
-- ELIMINAR COLUMNAS LEGACY DE COURSES
-- =====================================================
-- Este script elimina las columnas que fueron migradas
-- de COURSES a COURSE_DETAILS.
--
-- ⚠️ IMPORTANTE: Solo ejecutar DESPUÉS de verificar que:
-- 1. Todos los servicios frontend leen de course_details
-- 2. CourseFormModal y AdminCourseMarketingTab actualizan course_details
-- 3. No hay errores en producción
-- =====================================================

BEGIN;

-- Eliminar campos de instructor (migrados a course_details)
ALTER TABLE public.courses DROP COLUMN IF EXISTS instructor_name;
ALTER TABLE public.courses DROP COLUMN IF EXISTS instructor_title;
ALTER TABLE public.courses DROP COLUMN IF EXISTS instructor_bio;
ALTER TABLE public.courses DROP COLUMN IF EXISTS instructor_photo_url;

-- Eliminar campos de marketing (migrados a course_details)
ALTER TABLE public.courses DROP COLUMN IF EXISTS badge_text;
ALTER TABLE public.courses DROP COLUMN IF EXISTS highlights;
ALTER TABLE public.courses DROP COLUMN IF EXISTS preview_video_id;

-- Eliminar campos de SEO (migrados a course_details)
ALTER TABLE public.courses DROP COLUMN IF EXISTS seo_keywords;
ALTER TABLE public.courses DROP COLUMN IF EXISTS og_image_url;

-- Eliminar campo de landing sections (migrado a course_details)
ALTER TABLE public.courses DROP COLUMN IF EXISTS landing_sections;

-- Verificar que las columnas fueron eliminadas
SELECT 
  'COLUMNAS ELIMINADAS' as status,
  NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' 
    AND column_name IN (
      'instructor_name', 'instructor_title', 'instructor_bio', 'instructor_photo_url',
      'badge_text', 'highlights', 'preview_video_id',
      'seo_keywords', 'og_image_url', 'landing_sections'
    )
  ) as columnas_eliminadas;

COMMIT;

-- =====================================================
-- NOTAS:
-- =====================================================
-- Después de ejecutar este script:
-- 1. La tabla COURSES solo contendrá datos core del curso
-- 2. Toda la información de landing/marketing/SEO estará en COURSE_DETAILS
-- 3. NO hay rollback - las columnas se pierden permanentemente
-- 4. Hacer backup de la base de datos antes de ejecutar
--
-- ARCHIVOS QUE NECESITAN ACTUALIZACIÓN ANTES DE EJECUTAR ESTE SQL:
-- - src/components/modal/modals/admin/CourseFormModal.tsx
-- - src/pages/admin/courses/view/AdminCourseMarketingTab.tsx
-- =====================================================
