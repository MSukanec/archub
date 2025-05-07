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

    // 2. Intentar crear una tabla de prueba usando la API REST
    console.log('\n2. Intentando crear una tabla de prueba en Supabase...');
    // Nota: No podemos crear tablas directamente con la API REST de Supabase
    // pero podemos intentar comprobar si la tabla existe y luego crear registros
    
    console.log('Verificando si podemos usar la tabla de prueba...');
    const { data: checkTable, error: checkError } = await supabase
      .from('test_table')
      .select('*')
      .limit(1)
      .maybeSingle();
    
    if (checkError && checkError.code === '42P01') {
      console.log('La tabla test_table no existe en Supabase');
      console.log('Para crear tablas en Supabase, debes usar la interfaz de SQL Editor en el dashboard de Supabase');
      console.log('Por ahora, vamos a trabajar con las tablas existentes');
    } else if (checkError) {
      console.error('Error al verificar la tabla:', checkError);
    } else {
      console.log('La tabla test_table existe y podemos usarla');
    }

    // 3. Insertar datos en la tabla materiales con los campos correctos
    console.log('\n3. Intentando insertar datos en la tabla materiales...');
    // Basado en la respuesta anterior, parece que la tabla solo tiene id y nombre
    const { data: insertData, error: insertError } = await supabase
      .from('materiales')
      .insert({ 
        nombre: 'Material de prueba ' + new Date().toISOString().substring(0, 19)
        // Solo incluimos el campo nombre que sabemos existe
      })
      .select();

    if (insertError) {
      console.error('Error al insertar datos:', insertError);
      console.log('Esto podría deberse a que el esquema de la tabla no coincide con los campos que intentamos insertar');
      console.log('Por favor verifica el esquema de la tabla en el dashboard de Supabase');
    } else {
      console.log('Datos insertados correctamente en la tabla materiales:');
      console.log(insertData);
    }

    // 4. Leer los últimos datos de la tabla materiales
    console.log('\n4. Leyendo datos de la tabla materiales...');
    const { data: readData, error: readError } = await supabase
      .from('materiales')
      .select('*')
      .order('id', { ascending: false })
      .limit(5);

    if (readError) {
      console.error('Error al leer datos:', readError);
    } else {
      console.log('Datos leídos correctamente de materiales:');
      console.log(readData);
    }

    console.log('\nPruebas con Supabase completadas.');
  } catch (error) {
    console.error('Error general durante las pruebas:', error);
  }
}

// Ejecutar las pruebas
testSupabase();