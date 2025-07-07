import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumns() {
  try {
    console.log('Adding columns to task_parameters table...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE task_parameters 
        ADD COLUMN IF NOT EXISTS semantic_role TEXT,
        ADD COLUMN IF NOT EXISTS expression_template TEXT,
        ADD COLUMN IF NOT EXISTS unit_id TEXT;
      `
    });
    
    if (error) {
      console.error('Error adding columns:', error);
    } else {
      console.log('Columns added successfully:', data);
    }
  } catch (error) {
    console.error('Migration error:', error);
  }
}

addColumns();