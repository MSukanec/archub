-- Crear tabla de categorías para materiales y tareas
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- "material" o "task"
  position INTEGER NOT NULL DEFAULT 0,
  parent_id INTEGER DEFAULT NULL REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear algunas categorías básicas para materiales
INSERT INTO categories (name, type, position) VALUES 
('Materiales de construcción', 'material', 1),
('Materiales eléctricos', 'material', 2),
('Materiales de plomería', 'material', 3),
('Acabados', 'material', 4),
('Herramientas', 'material', 5);

-- Crear algunas categorías básicas para tareas
INSERT INTO categories (name, type, position) VALUES 
('Obra gruesa', 'task', 1),
('Instalaciones eléctricas', 'task', 2),
('Instalaciones sanitarias', 'task', 3),
('Acabados', 'task', 4),
('Limpieza', 'task', 5);

-- Crear función para actualizar el timestamp de actualización
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar el timestamp
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);