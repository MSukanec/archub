import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function fixPaymentsSchema() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log('Making course_id nullable in payments table...');
  
  // Esta query hará course_id nullable para soportar suscripciones
  const { error } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE payments ALTER COLUMN course_id DROP NOT NULL;'
  });
  
  if (error) {
    console.error('Error:', error);
    
    // Si no existe la función RPC, intentemos con una query directa
    console.log('Trying direct query...');
    const { error: directError } = await supabase
      .from('payments')
      .select('id')
      .limit(0); // Solo para verificar conexión
    
    if (directError) {
      console.error('Cannot connect to database:', directError);
    } else {
      console.log('Connected to database, but cannot run ALTER TABLE via RPC');
      console.log('Please run this SQL manually in Supabase SQL Editor:');
      console.log('ALTER TABLE payments ALTER COLUMN course_id DROP NOT NULL;');
    }
  } else {
    console.log('✅ course_id is now nullable!');
  }
}

fixPaymentsSchema();
