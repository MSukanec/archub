-- SQL para crear las tablas del sistema de Diseño
-- Ejecutar en la consola SQL de Supabase

-- Crear tabla design_phases
CREATE TABLE IF NOT EXISTS design_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla design_tasks  
CREATE TABLE IF NOT EXISTS design_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_phase_id UUID NOT NULL REFERENCES design_phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_design_phases_project_id ON design_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_design_tasks_design_phase_id ON design_tasks(design_phase_id);
CREATE INDEX IF NOT EXISTS idx_design_tasks_assigned_to ON design_tasks(assigned_to);

-- Crear funciones para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para updated_at
CREATE TRIGGER update_design_phases_updated_at BEFORE UPDATE ON design_phases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_design_tasks_updated_at BEFORE UPDATE ON design_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos de ejemplo (opcional)
INSERT INTO design_phases (project_id, name, description) VALUES 
('0f2f3891-f463-47f8-b863-93a55f20963a', 'Anteproyecto', 'Fase inicial de diseño conceptual'),
('0f2f3891-f463-47f8-b863-93a55f20963a', 'Proyecto Ejecutivo', 'Desarrollo detallado del proyecto');

INSERT INTO design_tasks (design_phase_id, name, description, status) VALUES 
((SELECT id FROM design_phases WHERE name = 'Anteproyecto' LIMIT 1), 'Relevamiento del terreno', 'Análisis topográfico y del sitio', 'completed'),
((SELECT id FROM design_phases WHERE name = 'Anteproyecto' LIMIT 1), 'Diseño conceptual', 'Primeras ideas y bocetos', 'in_progress'),
((SELECT id FROM design_phases WHERE name = 'Proyecto Ejecutivo' LIMIT 1), 'Planos técnicos', 'Desarrollo de planos constructivos', 'pending');