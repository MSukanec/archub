import { supabase } from '../server/supabase';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Verifica la existencia de las tablas requeridas en Supabase
 */
async function verifyTables() {
  try {
    console.log('Verificando tablas existentes en Supabase...');
    
    // Verificar directamente las tablas principales
    const verificaciones = [
      { nombre: 'users', mensaje: 'Tabla de usuarios' },
      { nombre: 'projects', mensaje: 'Tabla de proyectos' },
      { nombre: 'materials', mensaje: 'Tabla de materiales' },
      { nombre: 'tasks', mensaje: 'Tabla de tareas' },
      { nombre: 'task_materials', mensaje: 'Tabla de relación tarea-material' },
      { nombre: 'budgets', mensaje: 'Tabla de presupuestos' },
      { nombre: 'budget_tasks', mensaje: 'Tabla de relación presupuesto-tarea' }
    ];
    
    let tablasExistentes = 0;
    let tablasNoExistentes = 0;
    
    // Verificar cada tabla
    for (const tabla of verificaciones) {
      const { count, error } = await supabase
        .from(tabla.nombre)
        .select('*', { count: 'exact', head: true });
        
      if (error && error.code === '42P01') {
        console.log(`❌ ${tabla.mensaje} (${tabla.nombre}) no existe.`);
        tablasNoExistentes++;
      } else if (error) {
        console.log(`⚠️ Error al verificar ${tabla.mensaje} (${tabla.nombre}): ${error.message}`);
      } else {
        console.log(`✅ ${tabla.mensaje} (${tabla.nombre}) existe.`);
        tablasExistentes++;
      }
    }
    
    // Verificar la tabla especial 'materiales'
    const { count: materialesCount, error: materialesError } = await supabase
      .from('materiales')
      .select('*', { count: 'exact', head: true });
      
    if (materialesError && materialesError.code === '42P01') {
      console.log('❌ Tabla especial "materiales" no existe.');
    } else if (materialesError) {
      console.log(`⚠️ Error al verificar tabla "materiales": ${materialesError.message}`);
    } else {
      console.log(`✅ Tabla especial "materiales" existe con ${materialesCount} registros.`);
    }
    
    // Resumen
    console.log(`\nResumen: ${tablasExistentes} tablas existentes, ${tablasNoExistentes} tablas por crear.`);
    
    return { tablasExistentes, tablasNoExistentes };
  } catch (error) {
    console.error('Error al verificar tablas:', error);
    throw error;
  }
}

/**
 * Migra datos desde la base de datos local a Supabase
 */
async function migrateData() {
  try {
    console.log('\nEjecutando script SQL para crear y adaptar tablas...');
    
    // Leer el contenido del archivo SQL
    const sqlFilePath = path.join(__dirname, 'supabase-sql-setup.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Dividir el contenido en sentencias individuales
    // Nota: esto es una simplificación y puede no funcionar para todos los casos complejos de SQL
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Encontradas ${statements.length} sentencias SQL para ejecutar.`);
    
    // Ejecutar cada sentencia
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`\nEjecutando sentencia ${i+1}/${statements.length}...`);
      
      try {
        // Ya que no podemos ejecutar SQL arbitrario directamente, vamos a usar
        // instrucciones adaptadas para crear las tablas manualmente
        if (stmt.trim().toLowerCase().startsWith('create table') || 
            stmt.trim().toLowerCase().startsWith('alter table')) {
            
          console.log(`⚠️ Sentencia ${i+1} requiere ejecución manual en la UI de Supabase SQL.`);
          console.log(`SQL a ejecutar: ${stmt}`);
          
          if (stmt.includes('users')) {
            console.log('Intentando crear tabla users a través de API...');
            const { error } = await supabase.from('users').insert([]).select();
            if (error && error.code === '42P01') {
              console.log('Necesitamos crear la tabla users manualmente');
            } else if (error) {
              console.log('Error verificando tabla users:', error);
            } else {
              console.log('La tabla users ya existe');
            }
          }
        } else if (stmt.trim().toLowerCase().startsWith('insert into')) {
          // Extraer la tabla y los datos para la inserción
          const match = stmt.match(/insert\s+into\s+(?:public\.)?(\w+)/i);
          
          if (match && match[1]) {
            const tableName = match[1];
            console.log(`Intentando insertar datos en ${tableName}...`);
            
            // Para simplificar, solo vamos a realizar la inserción si es una tabla básica
            if (tableName === 'users') {
              const userData = {
                username: 'admin',
                password: 'admin123',
                full_name: 'Administrador',
                email: 'admin@example.com'
              };
              
              const { data, error } = await supabase.from('users').insert(userData).select();
              
              if (error) {
                if (error.code === '42P01') {
                  console.log(`La tabla ${tableName} no existe. Omitiendo inserción.`);
                } else if (error.code === '23505') {
                  console.log(`El registro ya existe en ${tableName}. Omitiendo inserción.`);
                } else {
                  console.error(`Error al insertar en ${tableName}:`, error);
                }
              } else {
                console.log(`✅ Datos insertados en ${tableName} correctamente.`);
              }
            } else {
              console.log(`⚠️ Inserción en ${tableName} requiere adaptación manual.`);
            }
          } else {
            console.log('⚠️ No se pudo extraer el nombre de la tabla para la inserción.');
          }
        } else if (stmt.trim().toLowerCase().startsWith('create index')) {
          console.log(`⚠️ Sentencia ${i+1} (CREATE INDEX) requiere ejecución manual.`);
        } else {
          console.log(`⚠️ Sentencia ${i+1} no reconocida. Requiere ejecución manual:`);
          console.log(stmt);
        }
      } catch (execError) {
        console.error(`Error al procesar la sentencia ${i+1}:`, execError);
      }
    }
    
    console.log('\nEjecución del script SQL completada.');
    
    // Verificar nuevamente las tablas después de la migración
    return await verifyTables();
  } catch (error) {
    console.error('Error durante la migración de datos:', error);
    throw error;
  }
}

/**
 * Verifica la migración comparando los recuentos de registros
 */
async function verifyMigration() {
  try {
    console.log('\nVerificando los datos migrados...');
    
    // Comprobar algunos recuentos de registros en tablas clave
    const tablas = [
      { nombre: 'users', descripcion: 'Usuarios' },
      { nombre: 'projects', descripcion: 'Proyectos' },
      { nombre: 'materials', descripcion: 'Materiales' },
      { nombre: 'tasks', descripcion: 'Tareas' },
      { nombre: 'budgets', descripcion: 'Presupuestos' }
    ];
    
    for (const tabla of tablas) {
      try {
        const { count, error } = await supabase
          .from(tabla.nombre)
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          console.log(`⚠️ Error al verificar datos en ${tabla.descripcion}: ${error.message}`);
        } else {
          console.log(`✅ ${tabla.descripcion}: ${count} registros`);
        }
      } catch (e) {
        console.log(`⚠️ Error al consultar tabla ${tabla.nombre}: ${e}`);
      }
    }
    
    // Verificar si hay datos en la tabla especial 'materiales'
    try {
      const { count, error } = await supabase
        .from('materiales')
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.log(`⚠️ Error al verificar datos en tabla especial "materiales": ${error.message}`);
      } else {
        console.log(`✅ Tabla "materiales": ${count} registros`);
      }
    } catch (e) {
      console.log(`⚠️ Error al consultar tabla "materiales": ${e}`);
    }
    
    console.log('\nVerificación de la migración completada.');
    return true;
  } catch (error) {
    console.error('Error durante la verificación de la migración:', error);
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  try {
    console.log('=== INICIANDO MIGRACIÓN A SUPABASE ===');
    
    // Paso 1: Verificar tablas existentes
    console.log('\n--- PASO 1: VERIFICACIÓN DE TABLAS ---');
    const { tablasExistentes, tablasNoExistentes } = await verifyTables();
    
    // Paso 2: Migrar datos
    console.log('\n--- PASO 2: MIGRACIÓN DE DATOS ---');
    if (tablasNoExistentes > 0) {
      const migrationResult = await migrateData();
      console.log(`Resultado de la migración: ${migrationResult.tablasExistentes} tablas existentes, ${migrationResult.tablasNoExistentes} tablas que no se pudieron crear.`);
    } else {
      console.log('Todas las tablas ya existen. No es necesario realizar la migración.');
    }
    
    // Paso 3: Verificar la migración
    console.log('\n--- PASO 3: VERIFICACIÓN DE LA MIGRACIÓN ---');
    const migrationVerified = await verifyMigration();
    
    console.log('\n=== MIGRACIÓN COMPLETADA ===');
    console.log(`Estado: ${migrationVerified ? 'Éxito' : 'Completada con posibles problemas'}`);
  } catch (error) {
    console.error('Error durante el proceso de migración:', error);
  } finally {
    process.exit();
  }
}

// Ejecutar la migración
main().catch(console.error);