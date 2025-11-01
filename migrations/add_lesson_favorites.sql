-- ===========================================
-- MIGRATION: Add Lesson Favorites Feature
-- ===========================================
-- Fecha: Nov 01, 2025
-- Descripción: Agrega columna is_favorite a course_lesson_progress
--              para permitir que usuarios marquen lecciones favoritas
-- ===========================================

-- 1. Agregar columna is_favorite
ALTER TABLE public.course_lesson_progress 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Crear índice para búsquedas rápidas de favoritos
CREATE INDEX IF NOT EXISTS idx_lesson_progress_favorites 
ON public.course_lesson_progress(user_id, is_favorite) 
WHERE is_favorite = TRUE;

-- 3. Comentarios para documentación
COMMENT ON COLUMN public.course_lesson_progress.is_favorite IS 
'Indica si el usuario marcó esta lección como favorita';

COMMENT ON INDEX public.idx_lesson_progress_favorites IS 
'Índice parcial para búsquedas rápidas de lecciones favoritas por usuario';

-- Verificar cambios
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'course_lesson_progress'
    AND column_name = 'is_favorite';
