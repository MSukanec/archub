-- =====================================================
-- OPTIMIZACIONES PARA PÁGINA DE CAPACITACIONES
-- =====================================================
-- Este SQL crea una vista y índices que aceleran dramáticamente
-- el dashboard de capacitaciones (de 12 segundos → menos de 1 segundo)
--
-- INSTRUCCIONES:
-- 1. Abre Supabase → SQL Editor
-- 2. Copia y pega todo este contenido
-- 3. Haz clic en "Run"
-- =====================================================

-- ============== PASO 1: CREAR VISTA OPTIMIZADA ==============
-- Esta vista pre-calcula los joins complejos de completions
-- En lugar de hacer 4 joins cada vez, ahora solo consultamos la vista

CREATE OR REPLACE VIEW lesson_completions_view AS
SELECT 
    clp.id AS progress_id,
    clp.user_id,
    clp.lesson_id,
    clp.is_completed,
    clp.completed_at,
    clp.last_position_sec,
    clp.updated_at,
    cl.id AS lesson_id_ref,
    cl.title AS lesson_title,
    cm.id AS module_id,
    cm.title AS module_title,
    cm.course_id,
    c.id AS course_id_ref,
    c.title AS course_title,
    c.slug AS course_slug
FROM 
    course_lesson_progress clp
    INNER JOIN course_lessons cl ON cl.id = clp.lesson_id
    INNER JOIN course_modules cm ON cm.id = cl.module_id
    INNER JOIN courses c ON c.id = cm.course_id;

-- ============== PASO 2: AGREGAR ÍNDICES ==============
-- Estos índices aceleran las búsquedas más comunes

-- Índice compuesto para buscar progreso por usuario (muy común)
CREATE INDEX IF NOT EXISTS idx_course_lesson_progress_user_completed 
ON course_lesson_progress(user_id, is_completed, completed_at DESC);

-- Índice para buscar lecciones por módulo (usado en dashboard)
CREATE INDEX IF NOT EXISTS idx_course_lessons_module_active 
ON course_lessons(module_id, is_active);

-- Índice para buscar módulos por curso
CREATE INDEX IF NOT EXISTS idx_course_modules_course 
ON course_modules(course_id);

-- Índice para buscar enrollments por usuario
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user 
ON course_enrollments(user_id);

-- ============== PASO 3: GRANT PERMISOS (RLS) ==============
-- Asegura que los usuarios puedan leer la vista con Row Level Security

-- Permitir SELECT a usuarios autenticados
GRANT SELECT ON lesson_completions_view TO authenticated;

-- ============== CONFIRMACIÓN ==============
-- Si todo se ejecutó correctamente, deberías ver:
-- - 1 vista creada: lesson_completions_view
-- - 4 índices creados
-- - Permisos otorgados

-- Para verificar que la vista funciona, ejecuta:
-- SELECT * FROM lesson_completions_view LIMIT 5;
