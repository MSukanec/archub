// Temporary migration script to create movement_third_party_contributions table
// Run this once and then delete

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wtatvsgeivymcppowrfy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0YXR2c2dlaXZ5bWNwcG93cmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY2MTIzNDcsImV4cCI6MjAzMjE4ODM0N30.ib8hH0_U3eHPqBLOTEKnVwqYXMgzaHYUOdsBZc8hNy4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function runMigration() {
  try {
    console.log('Creating movement_third_party_contributions table...')
    
    // Create the table using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS movement_third_party_contributions (
          movement_id UUID NOT NULL,
          third_party_id UUID NOT NULL,
          receipt_number TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          PRIMARY KEY (movement_id, third_party_id),
          FOREIGN KEY (movement_id) REFERENCES movements(id) ON DELETE CASCADE,
          FOREIGN KEY (third_party_id) REFERENCES contacts(id) ON DELETE CASCADE
        );
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_movement_third_party_contributions_movement_id 
        ON movement_third_party_contributions(movement_id);
        
        CREATE INDEX IF NOT EXISTS idx_movement_third_party_contributions_third_party_id 
        ON movement_third_party_contributions(third_party_id);
      `
    })

    if (error) {
      console.error('Error creating table:', error)
    } else {
      console.log('Table created successfully!')
    }

    // Migrate existing data
    console.log('Migrating existing data...')
    const { data: migrateData, error: migrateError } = await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO movement_third_party_contributions (movement_id, third_party_id, created_at, updated_at)
        SELECT 
          id as movement_id,
          contact_id as third_party_id,
          created_at,
          updated_at
        FROM movements 
        WHERE contact_id IS NOT NULL
        ON CONFLICT (movement_id, third_party_id) DO NOTHING;
      `
    })

    if (migrateError) {
      console.error('Error migrating data:', migrateError)
    } else {
      console.log('Data migrated successfully!')
    }
    
  } catch (err) {
    console.error('Migration failed:', err)
  }
}

runMigration()