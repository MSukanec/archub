import { supabase } from '@/lib/supabase';

export async function createDesignTables() {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }

  try {
    // Crear tabla design_phases
    console.log('Creating design_phases table...');
    const { error: phasesError } = await supabase
      .from('design_phases')
      .select('id')
      .limit(1);

    if (phasesError && phasesError.code === '42P01') {
      // Tabla no existe, intentar crearla usando SQL raw
      const { error: createPhasesError } = await supabase
        .rpc('exec_sql', {
          sql: `
            CREATE TABLE design_phases (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              project_id UUID NOT NULL,
              name TEXT NOT NULL,
              description TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        });

      if (createPhasesError) {
        console.error('Error creating design_phases table:', createPhasesError);
      } else {
        console.log('design_phases table created successfully');
      }
    }

    // Crear tabla design_tasks
    console.log('Creating design_tasks table...');
    const { error: tasksError } = await supabase
      .from('design_tasks')
      .select('id')
      .limit(1);

    if (tasksError && tasksError.code === '42P01') {
      const { error: createTasksError } = await supabase
        .rpc('exec_sql', {
          sql: `
            CREATE TABLE design_tasks (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              design_phase_id UUID NOT NULL,
              name TEXT NOT NULL,
              description TEXT,
              start_date TEXT,
              end_date TEXT,
              status TEXT NOT NULL DEFAULT 'pending',
              assigned_to UUID,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        });

      if (createTasksError) {
        console.error('Error creating design_tasks table:', createTasksError);
      } else {
        console.log('design_tasks table created successfully');
      }
    }

    return true;
  } catch (error) {
    console.error('Error in createDesignTables:', error);
    return false;
  }
}