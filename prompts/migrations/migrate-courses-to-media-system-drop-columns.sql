-- =====================================================
-- ELIMINAR COLUMNAS ANTIGUAS DE COURSES
-- =====================================================
-- Este script elimina las columnas de URLs directas ahora que
-- el sistema usa MEDIA_FILES + MEDIA_LINKS.
--
-- ⚠️ IMPORTANTE: Solo ejecutar DESPUÉS de verificar que:
-- 1. La migración de datos fue exitosa
-- 2. La aplicación está cargando imágenes desde media_links
-- 3. No hay errores en producción
-- =====================================================

BEGIN;

-- Eliminar cover_url
ALTER TABLE public.courses DROP COLUMN IF EXISTS cover_url;

-- Eliminar instructor_photo_url
ALTER TABLE public.courses DROP COLUMN IF EXISTS instructor_photo_url;

-- Eliminar og_image_url
ALTER TABLE public.courses DROP COLUMN IF EXISTS og_image_url;

-- Verificar que las columnas fueron eliminadas
SELECT 
  'COLUMNAS ELIMINADAS' as status,
  NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' 
    AND column_name IN ('cover_url', 'instructor_photo_url', 'og_image_url')
  ) as columnas_eliminadas;

COMMIT;

-- =====================================================
-- NOTAS:
-- =====================================================
-- Después de ejecutar este script:
-- 1. NO hay rollback - las columnas se pierden permanentemente
-- 2. La aplicación DEBE usar media_links para todas las imágenes
-- 3. Hacer backup de la base de datos antes de ejecutar
--=====================================================
