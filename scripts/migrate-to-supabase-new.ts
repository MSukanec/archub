import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '../shared/schema';
import { supabase } from '../server/supabase';

// Configuración para la conexión a la base de datos
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL no está definido. La base de datos no está configurada correctamente.');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

/**
 * Verifica la existencia de las tablas requeridas en Supabase
 */
async function verifyTables() {
  try {
    console.log('Verificando existencia de tablas en Supabase...');
    
    // Lista de tablas a verificar
    const tablesToCheck = [
      'users', 'projects', 'materials', 'tasks', 
      'task_materials', 'budgets', 'budget_tasks'
    ];
    
    let allTablesExist = true;
    
    // Verificar cada tabla
    for (const tableName of tablesToCheck) {
      const { error } = await supabase.from(tableName).select('id').limit(1);
      const exists = !error || error.code !== '42P01';
      console.log(`Tabla ${tableName}: ${exists ? 'existe' : 'no existe'}`);
      
      if (!exists) {
        allTablesExist = false;
      }
    }
    
    if (!allTablesExist) {
      console.log('\nATENCIÓN: Algunas tablas no existen en Supabase.');
      console.log('Por favor, ejecuta el script SQL proporcionado en "scripts/supabase-sql-setup.sql"');
      console.log('en el SQL Editor del panel de Supabase antes de continuar con la migración de datos.');
      return false;
    }
    
    console.log('\nTodas las tablas necesarias existen en Supabase.');
    return true;
  } catch (error) {
    console.error('Error al verificar tablas:', error);
    return false;
  }
}

/**
 * Migra datos desde la base de datos local a Supabase
 */
async function migrateData() {
  try {
    console.log('Iniciando migración de datos a Supabase...');

    // Mapeo de tablas y sus esquemas correspondientes
    const tableMappings = [
      { name: 'users', schema: schema.users },
      { name: 'projects', schema: schema.projects },
      { name: 'materials', schema: schema.materials },
      { name: 'tasks', schema: schema.tasks },
      { name: 'task_materials', schema: schema.taskMaterials },
      { name: 'budgets', schema: schema.budgets },
      { name: 'budget_tasks', schema: schema.budgetTasks }
    ];
    
    // Migrar datos de cada tabla
    for (const { name, schema: tableSchema } of tableMappings) {
      try {
        console.log(`Migrando datos de tabla ${name}...`);
        
        // Obtener datos de la tabla local
        const records = await db.select().from(tableSchema);
        
        if (records.length === 0) {
          console.log(`No hay datos para migrar en la tabla ${name}`);
          continue;
        }
        
        // Migrar los registros en lotes para evitar problemas con grandes volúmenes de datos
        const batchSize = 50;
        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize);
          
          const { error } = await supabase.from(name).upsert(batch, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          });
          
          if (error) {
            console.error(`Error al migrar lote en tabla ${name}:`, error);
          } else {
            console.log(`Migrados registros ${i+1} a ${i+batch.length} de ${records.length} en tabla ${name}`);
          }
        }
        
        console.log(`Migración de tabla ${name} completada (${records.length} registros)`);
      } catch (error) {
        console.error(`Error al migrar tabla ${name}:`, error);
      }
    }

    console.log('Todos los datos han sido migrados correctamente a Supabase');
    return true;
  } catch (error) {
    console.error('Error al migrar los datos:', error);
    return false;
  }
}

/**
 * Verifica la migración comparando los recuentos de registros
 */
async function verifyMigration() {
  try {
    console.log('Verificando la migración...');
    
    // Mapeo de tablas y sus esquemas correspondientes
    const tableMappings = [
      { name: 'users', schema: schema.users },
      { name: 'projects', schema: schema.projects },
      { name: 'materials', schema: schema.materials },
      { name: 'tasks', schema: schema.tasks },
      { name: 'task_materials', schema: schema.taskMaterials },
      { name: 'budgets', schema: schema.budgets },
      { name: 'budget_tasks', schema: schema.budgetTasks }
    ];
    
    let allTablesVerified = true;
    
    // Verificar cada tabla
    for (const { name, schema: tableSchema } of tableMappings) {
      try {
        // Contar registros en la base de datos local
        const localRecords = await db.select().from(tableSchema);
        const localCount = localRecords.length;
        
        // Contar registros en Supabase
        const { data, error } = await supabase.from(name).select('id', { count: 'exact' });
        
        if (error) {
          console.error(`Error al verificar tabla ${name}:`, error);
          allTablesVerified = false;
          continue;
        }
        
        const supabaseCount = data.length;
        
        if (localCount === supabaseCount) {
          console.log(`✅ Tabla ${name}: ${localCount} registros migrados correctamente`);
        } else {
          console.log(`❌ Tabla ${name}: discrepancia en el número de registros (local: ${localCount}, Supabase: ${supabaseCount})`);
          allTablesVerified = false;
        }
      } catch (error) {
        console.error(`Error al verificar tabla ${name}:`, error);
        allTablesVerified = false;
      }
    }
    
    if (allTablesVerified) {
      console.log('\nLa migración se ha completado y verificado correctamente.');
    } else {
      console.log('\nHay discrepancias en la migración. Por favor revisa las tablas indicadas.');
    }
    
    return allTablesVerified;
  } catch (error) {
    console.error('Error al verificar la migración:', error);
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('Iniciando script de migración a Supabase...');
  
  // Verificar existencia de tablas
  const tablesExist = await verifyTables();
  if (!tablesExist) {
    console.error('Error: Algunas tablas no existen en Supabase. Por favor crea las tablas necesarias antes de continuar.');
    process.exit(1);
  }
  
  // Migrar datos
  const dataMigrated = await migrateData();
  if (!dataMigrated) {
    console.error('Error al migrar los datos a Supabase.');
    process.exit(1);
  }
  
  // Verificar migración
  const migrationVerified = await verifyMigration();
  if (!migrationVerified) {
    console.warn('Advertencia: La verificación de la migración ha detectado algunas discrepancias.');
  }
  
  console.log('Proceso de migración a Supabase completado.');
  process.exit(0);
}

// Ejecutar el script
main();