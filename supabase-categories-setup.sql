-- Script para crear la tabla de categorías con soporte para estructura jerárquica
-- y capacidad de reordenamiento

-- Crear tabla categories si no existe
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL, 
    type TEXT NOT NULL, -- 'material' o 'task'
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_position ON categories(position);

-- Función para actualizar automáticamente updated_at cuando se modifica un registro
CREATE OR REPLACE FUNCTION update_categories_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar automáticamente updated_at
DROP TRIGGER IF EXISTS update_categories_modtime ON categories;
CREATE TRIGGER update_categories_modtime
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE PROCEDURE update_categories_modified_column();

-- Función para asignar posición automáticamente si no se especifica
CREATE OR REPLACE FUNCTION set_category_position()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.position = 0 THEN
        -- Si parent_id es NULL, encontrar la posición máxima en el nivel raíz del mismo tipo
        IF NEW.parent_id IS NULL THEN
            SELECT COALESCE(MAX(position) + 1, 1)
            INTO NEW.position
            FROM categories
            WHERE parent_id IS NULL AND type = NEW.type;
        ELSE
            -- Si tiene parent_id, encontrar la posición máxima entre los hermanos
            SELECT COALESCE(MAX(position) + 1, 1)
            INTO NEW.position
            FROM categories
            WHERE parent_id = NEW.parent_id AND type = NEW.type;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para asignar posición automáticamente
DROP TRIGGER IF EXISTS set_category_position_trigger ON categories;
CREATE TRIGGER set_category_position_trigger
BEFORE INSERT ON categories
FOR EACH ROW
EXECUTE PROCEDURE set_category_position();

-- Insertar algunas categorías de ejemplo para materiales
INSERT INTO categories (name, type, parent_id, position)
VALUES 
    ('Materiales Básicos', 'material', NULL, 1),
    ('Instalaciones Eléctricas', 'material', NULL, 2),
    ('Instalaciones Sanitarias', 'material', NULL, 3),
    ('Acabados', 'material', NULL, 4),
    ('Otros', 'material', NULL, 5)
ON CONFLICT (id) DO NOTHING;

-- Insertar algunas categorías de ejemplo para tareas
INSERT INTO categories (name, type, parent_id, position)
VALUES 
    ('Estructuras', 'task', NULL, 1),
    ('Instalaciones', 'task', NULL, 2),
    ('Acabados', 'task', NULL, 3),
    ('Limpieza', 'task', NULL, 4),
    ('Otros', 'task', NULL, 5)
ON CONFLICT (id) DO NOTHING;

-- Crear algunas subcategorías de ejemplo
INSERT INTO categories (name, type, parent_id, position)
VALUES 
    ('Cemento', 'material', 1, 1),
    ('Arena', 'material', 1, 2),
    ('Hierro', 'material', 1, 3),
    ('Cables', 'material', 2, 1),
    ('Tubería PVC', 'material', 3, 1)
ON CONFLICT (id) DO NOTHING;

-- Crear vistas para facilitar la consulta de categorías con su jerarquía
CREATE OR REPLACE VIEW category_hierarchy AS
WITH RECURSIVE hierarchy AS (
    -- Seleccionar todas las categorías de nivel superior (sin padre)
    SELECT 
        c.id, 
        c.name, 
        c.type,
        c.parent_id, 
        c.position,
        c.created_at,
        c.updated_at,
        1 AS level,
        ARRAY[c.position] AS path,
        c.name::text AS full_path
    FROM 
        categories c
    WHERE 
        c.parent_id IS NULL
    
    UNION ALL
    
    -- Unir con subcategorías recursivamente
    SELECT 
        c.id, 
        c.name, 
        c.type,
        c.parent_id, 
        c.position,
        c.created_at,
        c.updated_at,
        h.level + 1,
        h.path || c.position,
        h.full_path || ' > ' || c.name
    FROM 
        categories c
    JOIN 
        hierarchy h ON c.parent_id = h.id
)
SELECT 
    id, 
    name, 
    type,
    parent_id, 
    position,
    created_at,
    updated_at,
    level,
    path,
    full_path
FROM 
    hierarchy
ORDER BY 
    type, path;