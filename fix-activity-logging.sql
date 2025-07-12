-- Agregar la columna faltante last_activity_at a la tabla organizations
-- Esta columna es necesaria para el sistema de activity logging

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Actualizar todas las organizaciones existentes con el timestamp actual
UPDATE organizations 
SET last_activity_at = NOW() 
WHERE last_activity_at IS NULL;

-- Comentario explicativo
COMMENT ON COLUMN organizations.last_activity_at IS 'Timestamp de la última actividad registrada en la organización - usado por el sistema de logging';

-- Crear índice para mejorar performance en consultas por actividad reciente
CREATE INDEX IF NOT EXISTS idx_organizations_last_activity_at 
ON organizations(last_activity_at);

-- Verificar que la columna se creó correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND column_name = 'last_activity_at';