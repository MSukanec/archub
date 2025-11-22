-- =====================================================
-- ELIMINAR COLUMNAS DE IMÁGENES DE COURSES Y COURSE_DETAILS
-- =====================================================
-- Este script elimina las columnas de URLs de imágenes
-- que ahora se manejan mediante MEDIA_FILES + MEDIA_LINKS.
--
-- ⚠️ IMPORTANTE: Solo ejecutar DESPUÉS de verificar que:
-- 1. La migración de imágenes a media_files/media_links fue exitosa
-- 2. Todas las imágenes de cursos están en media_links con categorías correctas
-- 3. Los servicios cargan imágenes desde media_links
-- 4. No hay errores en producción
-- =====================================================

BEGIN;

-- ==========================
-- TABLA: COURSES
-- ==========================
-- Eliminar cover_url (ahora en media_links con category='course_cover')
ALTER TABLE public.courses DROP COLUMN IF EXISTS cover_url;

-- ==========================
-- TABLA: COURSE_DETAILS
-- ==========================
-- Eliminar instructor_photo_url (ahora en media_links con category='instructor_photo')
ALTER TABLE public.course_details DROP COLUMN IF EXISTS instructor_photo_url;

-- Eliminar og_image_url (ahora en media_links con category='og_image')
ALTER TABLE public.course_details DROP COLUMN IF EXISTS og_image_url;

-- Verificar que las columnas fueron eliminadas
SELECT 
  'VERIFICACIÓN DE ELIMINACIÓN' as status;

-- Verificar COURSES
SELECT 
  'COURSES' as tabla,
  NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' 
    AND column_name = 'cover_url'
  ) as cover_url_eliminado;

-- Verificar COURSE_DETAILS
SELECT 
  'COURSE_DETAILS' as tabla,
  NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'course_details' 
    AND column_name IN ('instructor_photo_url', 'og_image_url')
  ) as imagenes_eliminadas;

COMMIT;

-- =====================================================
-- CATEGORÍAS DE MEDIA_LINKS PARA CURSOS
-- =====================================================
-- 
-- Las imágenes de cursos ahora usan estas categorías en media_links:
-- 
-- 1. course_cover        - Imagen de portada del curso (antes: courses.cover_url)
-- 2. instructor_photo    - Foto del instructor (antes: course_details.instructor_photo_url)
-- 3. og_image           - Imagen Open Graph para SEO (antes: course_details.og_image_url)
-- 4. module_image       - Imágenes de módulos (nueva funcionalidad)
-- 5. section_background - Fondos de secciones de landing (nueva funcionalidad)
-- 6. testimonial_logo   - Logos de testimonios (nueva funcionalidad)
-- 7. project_photo      - Fotos de proyectos de alumnos (nueva funcionalidad)
--
-- EJEMPLO DE CONSULTA PARA VERIFICAR:
-- SELECT c.title, ml.category, mf.file_url
-- FROM courses c
-- LEFT JOIN media_links ml ON ml.course_id = c.id
-- LEFT JOIN media_files mf ON mf.id = ml.media_file_id AND mf.is_deleted = false
-- WHERE ml.category IN ('course_cover', 'instructor_photo', 'og_image')
-- ORDER BY c.title, ml.category;
--
-- =====================================================
-- NOTAS:
-- =====================================================
-- Después de ejecutar este script:
-- 1. TODAS las imágenes de cursos DEBEN venir de media_links
-- 2. NO hay rollback - las columnas se pierden permanentemente
-- 3. Hacer backup de la base de datos antes de ejecutar
-- 4. Verificar que los servicios de subida de imágenes usan uploadMediaFileV2
--
-- SERVICIOS QUE YA ESTÁN ACTUALIZADOS:
-- - src/features/course-landing/services/courseLanding.ts ✓
-- - src/features/media/services/getCourseMedia.ts ✓
-- - src/features/media/services/uploadMediaFileV2.ts ✓
--
-- PENDIENTE DE ACTUALIZAR:
-- - src/components/modal/modals/admin/CourseFormModal.tsx (crear/editar curso)
-- - src/pages/admin/courses/view/AdminCourseMarketingTab.tsx (editar marketing)
-- =====================================================
