const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://aws-0-sa-east-1.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('SUPABASE_ANON_KEY not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  try {
    console.log('Creating design_phases table...');
    
    // Crear tabla design_phases
    const { error: phasesError } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS design_phases (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (phasesError) {
      console.error('Error creating design_phases table:', phasesError);
    } else {
      console.log('design_phases table created successfully');
    }

    console.log('Creating design_tasks table...');
    
    // Crear tabla design_tasks
    const { error: tasksError } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS design_tasks (
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

    if (tasksError) {
      console.error('Error creating design_tasks table:', tasksError);
    } else {
      console.log('design_tasks table created successfully');
    }

    console.log('Creating indexes...');
    
    // Crear índices
    const { error: indexError } = await supabase.rpc('sql', {
      query: `
        CREATE INDEX IF NOT EXISTS idx_design_phases_project_id ON design_phases(project_id);
        CREATE INDEX IF NOT EXISTS idx_design_tasks_design_phase_id ON design_tasks(design_phase_id);
        CREATE INDEX IF NOT EXISTS idx_design_tasks_assigned_to ON design_tasks(assigned_to);
      `
    });

    if (indexError) {
      console.error('Error creating indexes:', indexError);
    } else {
      console.log('Indexes created successfully');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

createTables();
