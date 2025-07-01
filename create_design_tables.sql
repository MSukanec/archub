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
