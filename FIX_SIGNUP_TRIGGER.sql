-- ============================================
-- SCRIPT PARA SOLUCIONAR EL PROBLEMA DE REGISTRO
-- ============================================
-- Ejecuta este script en Supabase SQL Editor
-- ============================================

-- PASO 1: Listar todos los triggers en auth.users
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- PASO 2: Listar todos los triggers en public.users
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public' 
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- PASO 3: Buscar funciones que contengan 'gpt_l' o 'components'
SELECT 
    routine_name,
    routine_schema,
    routine_definition
FROM information_schema.routines
WHERE routine_definition ILIKE '%gpt_l%'
   OR routine_definition ILIKE '%components%'
ORDER BY routine_schema, routine_name;

-- ============================================
-- DESPUÉS DE IDENTIFICAR EL TRIGGER PROBLEMÁTICO:
-- ============================================

-- OPCIÓN A: DESACTIVAR temporalmente el trigger (RECOMENDADO)
-- Reemplaza 'NOMBRE_DEL_TRIGGER' con el nombre real del trigger
-- ALTER TABLE auth.users DISABLE TRIGGER NOMBRE_DEL_TRIGGER;

-- OPCIÓN B: ELIMINAR el trigger completamente
-- DROP TRIGGER IF EXISTS NOMBRE_DEL_TRIGGER ON auth.users;
-- DROP TRIGGER IF EXISTS NOMBRE_DEL_TRIGGER ON public.users;

-- ============================================
-- NOTAS:
-- ============================================
-- 1. Ejecuta primero los SELECT para ver qué triggers existen
-- 2. Identifica el trigger que menciona 'components.gpt_l'
-- 3. Usa OPCIÓN A para desactivarlo temporalmente
-- 4. Intenta registrar un nuevo usuario
-- 5. Si funciona, puedes decidir si reparar o eliminar el trigger permanentemente
