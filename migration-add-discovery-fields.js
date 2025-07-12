// Temporary migration script to add missing discovery fields to user_data table
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addDiscoveryFields() {
  try {
    console.log('Adding discovery fields to user_data table...');
    
    // Add columns using raw SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE user_data 
        ADD COLUMN IF NOT EXISTS main_use TEXT,
        ADD COLUMN IF NOT EXISTS user_role TEXT,
        ADD COLUMN IF NOT EXISTS user_role_other TEXT,
        ADD COLUMN IF NOT EXISTS team_size TEXT;
      `
    });

    if (error) {
      console.error('Error adding columns:', error);
    } else {
      console.log('Successfully added discovery fields to user_data table');
    }
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

addDiscoveryFields();