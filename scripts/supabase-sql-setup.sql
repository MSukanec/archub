-- Instrucciones SQL para configurar las tablas en Supabase
-- Estas instrucciones deben ejecutarse en el SQL Editor de Supabase

-- Tabla de usuarios (si no existe)
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT,
  email TEXT,
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

-- Verificar si existe la tabla materiales (en español)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'materiales'
  ) THEN
    -- Si ya existe la tabla materiales, la renombramos a materials
    ALTER TABLE IF EXISTS public.materiales RENAME TO materials;
    
    -- Verificamos si la tabla materials tiene las columnas necesarias
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'materials' 
      AND column_name = 'category'
    ) THEN
      -- Si la tabla materials no tiene la columna category, la agregamos
      ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Materiales básicos';
    END IF;
    
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'materials' 
      AND column_name = 'unit'
    ) THEN
      -- Si la tabla materials no tiene la columna unit, la agregamos
      ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'unidad';
    END IF;
    
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'materials' 
      AND column_name = 'unit_price'
    ) THEN
      -- Si la tabla materials no tiene la columna unit_price, la agregamos
      ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS unit_price NUMERIC NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'materials' 
      AND column_name = 'created_at'
    ) THEN
      -- Si la tabla materials no tiene la columna created_at, la agregamos
      ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'materials' 
      AND column_name = 'updated_at'
    ) THEN
      -- Si la tabla materials no tiene la columna updated_at, la agregamos
      ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- Si existe la columna nombre pero no la columna name, renombramos nombre a name
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'materials' 
      AND column_name = 'nombre'
    ) AND NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'materials' 
      AND column_name = 'name'
    ) THEN
      ALTER TABLE public.materials RENAME COLUMN nombre TO name;
    END IF;
    
  ELSE
    -- Si no existe la tabla materiales, creamos la tabla materials desde cero
    CREATE TABLE IF NOT EXISTS public.materials (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      unit_price NUMERIC NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  END IF;
END $$;

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

-- Creación de índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_project_id ON public.budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_task_materials_task_id ON public.task_materials(task_id);
CREATE INDEX IF NOT EXISTS idx_task_materials_material_id ON public.task_materials(material_id);
CREATE INDEX IF NOT EXISTS idx_budget_tasks_budget_id ON public.budget_tasks(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_tasks_task_id ON public.budget_tasks(task_id);

-- Datos de ejemplo para usuario admin (si no existe)
INSERT INTO public.users (username, password, full_name, email)
SELECT 'admin', 'admin123', 'Administrador', 'admin@example.com'
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE username = 'admin');

-- Datos de ejemplo para un proyecto (si no hay proyectos)
INSERT INTO public.projects (name, description, status, user_id)
SELECT 'Casa de Ejemplo', 'Proyecto de construcción de casa de ejemplo', 'in_progress', u.id
FROM public.users u
WHERE u.username = 'admin'
AND NOT EXISTS (SELECT 1 FROM public.projects);

-- Datos de ejemplo para materiales (si no hay materiales)
INSERT INTO public.materials (name, category, unit, unit_price)
SELECT 'Cemento', 'Materiales básicos', 'kg', 5.50
WHERE NOT EXISTS (SELECT 1 FROM public.materials WHERE name = 'Cemento');

INSERT INTO public.materials (name, category, unit, unit_price)
SELECT 'Arena', 'Materiales básicos', 'm³', 20.00
WHERE NOT EXISTS (SELECT 1 FROM public.materials WHERE name = 'Arena');

INSERT INTO public.materials (name, category, unit, unit_price)
SELECT 'Ladrillo', 'Materiales básicos', 'unidad', 1.20
WHERE NOT EXISTS (SELECT 1 FROM public.materials WHERE name = 'Ladrillo');

INSERT INTO public.materials (name, category, unit, unit_price)
SELECT 'Varilla de acero', 'Hierros', 'unidad', 15.00
WHERE NOT EXISTS (SELECT 1 FROM public.materials WHERE name = 'Varilla de acero');

INSERT INTO public.materials (name, category, unit, unit_price)
SELECT 'Pintura', 'Acabados', 'litro', 8.75
WHERE NOT EXISTS (SELECT 1 FROM public.materials WHERE name = 'Pintura');

-- Datos de ejemplo para tareas (si no hay tareas)
INSERT INTO public.tasks (name, category, unit, unit_price)
SELECT 'Cimientos', 'Estructura', 'm³', 120.00
WHERE NOT EXISTS (SELECT 1 FROM public.tasks WHERE name = 'Cimientos');

INSERT INTO public.tasks (name, category, unit, unit_price)
SELECT 'Levantamiento de muros', 'Albañilería', 'm²', 85.00
WHERE NOT EXISTS (SELECT 1 FROM public.tasks WHERE name = 'Levantamiento de muros');

INSERT INTO public.tasks (name, category, unit, unit_price)
SELECT 'Instalación eléctrica', 'Instalaciones', 'punto', 45.00
WHERE NOT EXISTS (SELECT 1 FROM public.tasks WHERE name = 'Instalación eléctrica');

INSERT INTO public.tasks (name, category, unit, unit_price)
SELECT 'Instalación sanitaria', 'Instalaciones', 'punto', 60.00
WHERE NOT EXISTS (SELECT 1 FROM public.tasks WHERE name = 'Instalación sanitaria');

INSERT INTO public.tasks (name, category, unit, unit_price)
SELECT 'Pintura interior', 'Acabados', 'm²', 12.00
WHERE NOT EXISTS (SELECT 1 FROM public.tasks WHERE name = 'Pintura interior');

-- Nota: Las relaciones entre tareas-materiales y presupuestos-tareas
-- se deberían agregar después de verificar los IDs generados