-- Agregar columna last_activity_at a la tabla organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Crear índice para mejorar performance en consultas por actividad reciente
CREATE INDEX IF NOT EXISTS idx_organizations_last_activity_at 
ON organizations(last_activity_at);

-- Comentario de la columna
COMMENT ON COLUMN organizations.last_activity_at IS 'Timestamp de la última actividad registrada en la organización';
