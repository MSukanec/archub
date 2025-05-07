-- Configuración de esquema para Archub (ConstructBudget)
-- Script para ejecutar en el SQL Editor de Supabase

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de proyectos
CREATE TABLE IF NOT EXISTS public.projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE
);

-- Hacer merge de tabla materiales existente a materials
ALTER TABLE IF EXISTS public.materiales RENAME TO materials;
ALTER TABLE IF EXISTS public.materials 
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'unidad',
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Renombrar la columna nombre a name si existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materials' AND column_name = 'nombre'
  ) THEN
    ALTER TABLE public.materials RENAME COLUMN nombre TO name;
  END IF;
END
$$;

-- Tabla de tareas
CREATE TABLE IF NOT EXISTS public.tasks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  unit_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación entre tareas y materiales
CREATE TABLE IF NOT EXISTS public.task_materials (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL,
  UNIQUE(task_id, material_id)
);

-- Tabla de presupuestos
CREATE TABLE IF NOT EXISTS public.budgets (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación entre presupuestos y tareas
CREATE TABLE IF NOT EXISTS public.budget_tasks (
  id SERIAL PRIMARY KEY,
  budget_id INTEGER NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  task_id INTEGER NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL,
  UNIQUE(budget_id, task_id)
);

-- Tabla para almacenar las sesiones
CREATE TABLE IF NOT EXISTS public.sessions (
  sid varchar NOT NULL COLLATE "default",
  sess json NOT NULL,
  expire timestamp(6) NOT NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (sid)
);
CREATE INDEX IF NOT EXISTS IDX_sessions_expire ON public.sessions (expire);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_project_id ON public.budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_task_materials_task_id ON public.task_materials(task_id);
CREATE INDEX IF NOT EXISTS idx_task_materials_material_id ON public.task_materials(material_id);
CREATE INDEX IF NOT EXISTS idx_budget_tasks_budget_id ON public.budget_tasks(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_tasks_task_id ON public.budget_tasks(task_id);

SELECT 'Tablas creadas correctamente' as resultado;