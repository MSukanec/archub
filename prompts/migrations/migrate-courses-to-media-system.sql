-- =====================================================
-- MIGRACIÓN: Cursos al Sistema MEDIA_FILES + MEDIA_LINKS
-- =====================================================
-- Este script migra las columnas de URLs directas en la tabla courses
-- al nuevo sistema unificado de media management.
--
-- COLUMNAS A MIGRAR:
-- - courses.cover_url → media_links (category: 'course_cover')
-- - courses.instructor_photo_url → media_links (category: 'instructor_photo')
-- - courses.og_image_url → media_links (category: 'og_image')
--
-- NOTA: Este script NO elimina las columnas antiguas automáticamente.
-- Primero verifica que la migración fue exitosa antes de eliminarlas.
-- =====================================================

BEGIN;

-- =====================================================
-- PASO 1: Agregar foreign keys a media_links si no existen
-- =====================================================

-- Agregar course_id si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'media_links' AND column_name = 'course_id'
  ) THEN
    ALTER TABLE public.media_links ADD COLUMN course_id uuid NULL;
  END IF;
END $$;

-- Agregar course_module_id si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'media_links' AND column_name = 'course_module_id'
  ) THEN
    ALTER TABLE public.media_links ADD COLUMN course_module_id uuid NULL;
  END IF;
END $$;

-- Agregar foreign key constraint para course_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'media_links_course_fkey'
  ) THEN
    ALTER TABLE public.media_links 
    ADD CONSTRAINT media_links_course_fkey 
    FOREIGN KEY (course_id) 
    REFERENCES courses (id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Agregar foreign key constraint para course_module_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'media_links_course_module_fkey'
  ) THEN
    ALTER TABLE public.media_links 
    ADD CONSTRAINT media_links_course_module_fkey 
    FOREIGN KEY (course_module_id) 
    REFERENCES course_modules (id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- =====================================================
-- PASO 2: Crear índices para mejorar performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_media_links_course 
ON public.media_links USING btree (course_id) 
WHERE (course_id IS NOT NULL AND organization_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_media_links_course_module 
ON public.media_links USING btree (course_module_id) 
WHERE (course_module_id IS NOT NULL AND organization_id IS NOT NULL);

-- =====================================================
-- PASO 3: Actualizar CHECK constraint para nuevas categorías
-- =====================================================

-- Eliminar constraint antiguo si existe
ALTER TABLE public.media_links DROP CONSTRAINT IF EXISTS media_links_category_check;

-- Crear nuevo constraint con categorías de cursos
ALTER TABLE public.media_links ADD CONSTRAINT media_links_category_check CHECK (
  (category IS NULL) OR (
    category = ANY (ARRAY[
      'dni_front'::text,
      'dni_back'::text,
      'document'::text,
      'photo'::text,
      'other'::text,
      'general'::text,
      'technical'::text,
      'financial'::text,
      'legal'::text,
      'course_cover'::text,
      'instructor_photo'::text,
      'module_image'::text,
      'section_background'::text,
      'testimonial_logo'::text,
      'project_photo'::text,
      'og_image'::text
    ])
  )
);

-- =====================================================
-- PASO 4: Migrar datos existentes
-- =====================================================
-- IMPORTANTE: Este script crea "mock" media_files porque las URLs
-- existentes apuntan a archivos que NO están en Supabase Storage.
-- Los archivos físicos permanecen en su ubicación original.
-- =====================================================

-- Función auxiliar para extraer nombre de archivo de URL
CREATE OR REPLACE FUNCTION get_filename_from_url(url text) 
RETURNS text AS $$
BEGIN
  RETURN COALESCE(
    REVERSE(SPLIT_PART(REVERSE(url), '/', 1)),
    'unknown-file'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Migrar cover_url (imagen principal del curso)
INSERT INTO public.media_files (
  organization_id,
  created_by,
  bucket,
  file_path,
  file_name,
  file_url,
  file_type,
  file_size,
  is_public,
  is_deleted
)
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid, -- Placeholder organization (ajustar si necesario)
  created_by,
  'media',
  'legacy/courses/' || id || '/cover',
  get_filename_from_url(cover_url),
  cover_url,
  'image',
  NULL, -- file_size unknown
  true,
  false
FROM courses
WHERE cover_url IS NOT NULL AND cover_url != ''
ON CONFLICT DO NOTHING;

-- Crear media_links para cover_url
INSERT INTO public.media_links (
  media_file_id,
  organization_id,
  course_id,
  created_by,
  visibility,
  category,
  is_cover,
  description
)
SELECT 
  mf.id,
  '00000000-0000-0000-0000-000000000000'::uuid,
  c.id,
  c.created_by,
  'organization',
  'course_cover',
  true,
  'Course cover image (migrated from cover_url)'
FROM courses c
INNER JOIN media_files mf ON mf.file_url = c.cover_url
WHERE c.cover_url IS NOT NULL AND c.cover_url != '';

-- Migrar instructor_photo_url
INSERT INTO public.media_files (
  organization_id,
  created_by,
  bucket,
  file_path,
  file_name,
  file_url,
  file_type,
  file_size,
  is_public,
  is_deleted
)
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  created_by,
  'media',
  'legacy/courses/' || id || '/instructor',
  get_filename_from_url(instructor_photo_url),
  instructor_photo_url,
  'image',
  NULL,
  true,
  false
FROM courses
WHERE instructor_photo_url IS NOT NULL AND instructor_photo_url != ''
ON CONFLICT DO NOTHING;

-- Crear media_links para instructor_photo_url
INSERT INTO public.media_links (
  media_file_id,
  organization_id,
  course_id,
  created_by,
  visibility,
  category,
  is_cover,
  description
)
SELECT 
  mf.id,
  '00000000-0000-0000-0000-000000000000'::uuid,
  c.id,
  c.created_by,
  'organization',
  'instructor_photo',
  false,
  'Instructor photo (migrated from instructor_photo_url)'
FROM courses c
INNER JOIN media_files mf ON mf.file_url = c.instructor_photo_url
WHERE c.instructor_photo_url IS NOT NULL AND c.instructor_photo_url != '';

-- Migrar og_image_url
INSERT INTO public.media_files (
  organization_id,
  created_by,
  bucket,
  file_path,
  file_name,
  file_url,
  file_type,
  file_size,
  is_public,
  is_deleted
)
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  created_by,
  'media',
  'legacy/courses/' || id || '/og-image',
  get_filename_from_url(og_image_url),
  og_image_url,
  'image',
  NULL,
  true,
  false
FROM courses
WHERE og_image_url IS NOT NULL AND og_image_url != ''
ON CONFLICT DO NOTHING;

-- Crear media_links para og_image_url
INSERT INTO public.media_links (
  media_file_id,
  organization_id,
  course_id,
  created_by,
  visibility,
  category,
  is_cover,
  description
)
SELECT 
  mf.id,
  '00000000-0000-0000-0000-000000000000'::uuid,
  c.id,
  c.created_by,
  'organization',
  'og_image',
  false,
  'OG image for SEO (migrated from og_image_url)'
FROM courses c
INNER JOIN media_files mf ON mf.file_url = c.og_image_url
WHERE c.og_image_url IS NOT NULL AND c.og_image_url != '';

-- Limpiar función auxiliar
DROP FUNCTION IF EXISTS get_filename_from_url(text);

-- =====================================================
-- PASO 5: Verificar migración
-- =====================================================

-- Mostrar resumen de la migración
SELECT 
  'MIGRACIÓN COMPLETADA' as status,
  (SELECT COUNT(*) FROM media_files WHERE file_path LIKE 'legacy/courses/%') as total_files_migrated,
  (SELECT COUNT(*) FROM media_links WHERE course_id IS NOT NULL) as total_links_created,
  (SELECT COUNT(*) FROM courses WHERE cover_url IS NOT NULL OR instructor_photo_url IS NOT NULL OR og_image_url IS NOT NULL) as courses_with_urls;

-- =====================================================
-- PASO 6: (MANUAL) Eliminar columnas antiguas
-- =====================================================
-- ⚠️ SOLO EJECUTA ESTO DESPUÉS DE VERIFICAR QUE LA MIGRACIÓN FUE EXITOSA
-- ⚠️ Y QUE LA APLICACIÓN ESTÁ USANDO EL NUEVO SISTEMA
--
-- ALTER TABLE public.courses DROP COLUMN IF EXISTS cover_url;
-- ALTER TABLE public.courses DROP COLUMN IF EXISTS instructor_photo_url;
-- ALTER TABLE public.courses DROP COLUMN IF EXISTS og_image_url;

COMMIT;

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. Los archivos migrados mantienen sus URLs originales
-- 2. NO se suben a Supabase Storage (son "legacy")
-- 3. Nuevas subidas DEBEN usar uploadMediaFileV2
-- 4. organization_id usa placeholder '00000000-0000-0000-0000-000000000000'
--    AJUSTA ESTO si tus cursos pertenecen a organizaciones específicas
-- 5. Las columnas antiguas NO se eliminan automáticamente
--    Esto permite rollback si algo sale mal
