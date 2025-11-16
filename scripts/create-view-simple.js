import pkg from 'pg';
const { Pool } = pkg;
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read DATABASE_URL from environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function createView() {
  const client = await pool.connect();
  
  try {
    console.log('📖 Reading SQL file...');
    const sqlContent = readFileSync(join(__dirname, '../sql/views/client_list_view.sql'), 'utf-8');
    
    // Extract just the CREATE VIEW statement (ignore comments and index notes)
    const createViewMatch = sqlContent.match(/CREATE OR REPLACE VIEW[\s\S]+?;/i);
    
    if (!createViewMatch) {
      throw new Error('Could not find CREATE VIEW statement in SQL file');
    }
    
    const createViewSQL = createViewMatch[0];
    
    console.log('🚀 Creating client_list_view...');
    console.log('📝 SQL Preview:', createViewSQL.substring(0, 200) + '...');
    
    await client.query(createViewSQL);
    
    console.log('✅ View created successfully!');
    console.log('📊 Testing view...');
    
    const testResult = await client.query('SELECT COUNT(*) FROM client_list_view');
    console.log(`✅ View is working! Row count: ${testResult.rows[0].count}`);
    
    // Show sample of first row
    const sampleResult = await client.query('SELECT * FROM client_list_view LIMIT 1');
    if (sampleResult.rows.length > 0) {
      console.log('📋 Sample columns:', Object.keys(sampleResult.rows[0]).join(', '));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n📝 If this fails, execute the SQL manually:');
    console.error('   File: sql/views/client_list_view.sql');
    console.error('   Location: Supabase Dashboard > SQL Editor');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createView()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed to create view');
    process.exit(1);
  });
