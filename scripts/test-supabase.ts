import { supabase } from '../server/supabase';

async function testSupabase() {
  console.log('Iniciando prueba de conexión a Supabase...');

  try {
    // 1. Probar conexión básica
    console.log('1. Probando conexión básica a Supabase...');
    const { data: testData, error: testError } = await supabase.from('materiales').select('*').limit(5);
    
    if (testError) {
      console.error('Error al conectar con Supabase:', testError);
    } else {
      console.log('Conexión exitosa. Datos de la tabla materiales:');
      console.log(testData);
    }

    // 2. Intentar crear una tabla de prueba
    console.log('\n2. Intentando crear una tabla de prueba en Supabase...');
    const { error: createTableError } = await supabase.rpc('exec', {
      query: `
        CREATE TABLE IF NOT EXISTS supabase_test (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    });

    if (createTableError) {
      console.error('Error al crear tabla de prueba:', createTableError);
    } else {
      console.log('Tabla de prueba creada correctamente');
    }

    // 3. Insertar datos en la tabla de prueba
    console.log('\n3. Insertando datos en la tabla de prueba...');
    const { data: insertData, error: insertError } = await supabase
      .from('supabase_test')
      .insert({ name: 'Prueba desde Archub ' + new Date().toISOString() })
      .select();

    if (insertError) {
      console.error('Error al insertar datos:', insertError);
    } else {
      console.log('Datos insertados correctamente:');
      console.log(insertData);
    }

    // 4. Leer datos de la tabla de prueba
    console.log('\n4. Leyendo datos de la tabla de prueba...');
    const { data: readData, error: readError } = await supabase
      .from('supabase_test')
      .select('*')
      .order('id', { ascending: false })
      .limit(5);

    if (readError) {
      console.error('Error al leer datos:', readError);
    } else {
      console.log('Datos leídos correctamente:');
      console.log(readData);
    }

    console.log('\nPruebas con Supabase completadas.');
  } catch (error) {
    console.error('Error general durante las pruebas:', error);
  }
}

// Ejecutar las pruebas
testSupabase();