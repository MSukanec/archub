import { supabase } from '../server/supabase';

async function createTables() {
  console.log('Creando tablas en Supabase...');

  // Intentar crear la tabla users
  try {
    console.log('\nCreando tabla users...');
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: `
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
      `
    });

    if (error) {
      console.log('Error al crear tabla users:', error.message);
      console.log('Intentando verificar si ya existe la tabla...');
      
      const { error: checkError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
        
      if (checkError && checkError.code === '42P01') {
        console.log('La tabla users no existe. No se pudo crear automáticamente.');
        console.log('Por favor crea la tabla manualmente a través del SQL Editor de Supabase.');
      } else if (checkError) {
        console.log('Error al verificar tabla users:', checkError.message);
      } else {
        console.log('La tabla users ya existe.');
      }
    } else {
      console.log('Tabla users creada correctamente.');
    }
  } catch (error) {
    console.error('Error al crear tabla users:', error);
    console.log('Intentando un enfoque alternativo...');
    
    // Intentar crear un usuario como forma de verificar si la tabla existe
    try {
      const testUser = {
        username: 'testuser_' + Date.now(),
        password: 'testpassword',
        full_name: 'Test User',
        email: 'test@example.com'
      };
      
      const { error: insertError } = await supabase
        .from('users')
        .insert(testUser);
        
      if (insertError && insertError.code === '42P01') {
        console.log('La tabla users no existe. No se pudo crear automáticamente.');
      } else if (insertError) {
        console.log('Error al insertar usuario de prueba:', insertError.message);
      } else {
        console.log('Se pudo insertar un usuario - la tabla users existe.');
      }
    } catch (innerError) {
      console.error('Error secundario al verificar tabla users:', innerError);
    }
  }
  
  // Mostrar SQL para crear las tablas manualmente
  console.log('\nSi deseas crear las tablas manualmente, usa el siguiente SQL en el SQL Editor de Supabase:');
  console.log(`
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

  -- Índices para mejorar rendimiento
  CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
  CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
  CREATE INDEX IF NOT EXISTS idx_budgets_project_id ON public.budgets(project_id);
  CREATE INDEX IF NOT EXISTS idx_task_materials_task_id ON public.task_materials(task_id);
  CREATE INDEX IF NOT EXISTS idx_task_materials_material_id ON public.task_materials(material_id);
  CREATE INDEX IF NOT EXISTS idx_budget_tasks_budget_id ON public.budget_tasks(budget_id);
  CREATE INDEX IF NOT EXISTS idx_budget_tasks_task_id ON public.budget_tasks(task_id);
  `);
}

// Ejecutar la función principal
createTables()
  .catch(err => {
    console.error('Error fatal:', err);
  })
  .finally(() => {
    console.log('\nProceso completado.');
  });