import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createView() {
  try {
    console.log('📖 Reading SQL file...');
    const sqlContent = readFileSync(join(process.cwd(), 'sql/views/client_list_view.sql'), 'utf-8');
    
    console.log('🚀 Executing SQL to create client_list_view...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlContent
    });

    if (error) {
      // Si exec_sql no existe, intentar directamente con el PostgreSQL REST API
      console.log('⚠️  exec_sql RPC not found, trying direct approach...');
      
      // Dividir el SQL en statements individuales (las vistas se crean con CREATE OR REPLACE)
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.toLowerCase().includes('create')) {
          console.log('  Executing statement...');
          const result = await supabase.from('client_list_view').select('*').limit(0);
          
          // Si falla, significa que la vista no existe aún
          // Usaremos una alternativa: ejecutar via RPC personalizado
          throw new Error('Direct view creation not supported via Supabase client. Please execute SQL manually in Supabase Dashboard.');
        }
      }
    }

    console.log('✅ View created successfully!');
    console.log('📊 Testing view...');
    
    const { data: testData, error: testError } = await supabase
      .from('client_list_view')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ Error testing view:', testError);
      process.exit(1);
    }

    console.log('✅ View is working! Sample row count:', testData?.length || 0);
    process.exit(0);

  } catch (error: any) {
    console.error('❌ Error creating view:', error.message);
    console.log('\n📝 Manual steps required:');
    console.log('1. Open Supabase Dashboard SQL Editor');
    console.log('2. Copy and paste the contents of: sql/views/client_list_view.sql');
    console.log('3. Execute the SQL');
    process.exit(1);
  }
}

createView();
