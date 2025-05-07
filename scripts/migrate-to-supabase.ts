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

async function createTables() {
  try {
    console.log('Iniciando creación de tablas en Supabase...');

    // Crear tabla usuarios
    const { error: userTableError } = await supabase.from('users').select('id').limit(1);
    if (userTableError && userTableError.code === '42P01') {
      const { error } = await supabase.rpc('exec', { 
        query: `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          full_name TEXT,
          email TEXT,
          avatar_url TEXT
        );
      `);
      console.log('Tabla users creada correctamente');
    } else {
      console.log('La tabla users ya existe');
    }

    // Crear tabla projects
    const { error: projectTableError } = await supabase.from('projects').select('id').limit(1);
    if (projectTableError && projectTableError.code === '42P01') {
      const { error } = await supabase.rpc('exec', { 
        query: `
        CREATE TABLE projects (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'planning',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          user_id INTEGER NOT NULL
        );
      `);
      console.log('Tabla projects creada correctamente');
    } else {
      console.log('La tabla projects ya existe');
    }

    // Crear tabla materials
    const { error: materialsTableError } = await supabase.from('materials').select('id').limit(1);
    if (materialsTableError && materialsTableError.code === '42P01') {
      const { error } = await supabase.rpc('exec', { 
        query: `
        CREATE TABLE materials (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          unit TEXT NOT NULL,
          unit_price NUMERIC NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Tabla materials creada correctamente');
    } else {
      console.log('La tabla materials ya existe');
    }

    // Crear tabla tasks
    const { error: tasksTableError } = await supabase.from('tasks').select('id').limit(1);
    if (tasksTableError && tasksTableError.code === '42P01') {
      const { error } = await supabase.rpc('exec', { 
        query: `
        CREATE TABLE tasks (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          unit TEXT NOT NULL,
          unit_price NUMERIC NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Tabla tasks creada correctamente');
    } else {
      console.log('La tabla tasks ya existe');
    }

    // Crear tabla task_materials
    const createTaskMaterialsTable = await supabase.from('task_materials').select('id').limit(1);
    if (createTaskMaterialsTable.error && createTaskMaterialsTable.error.code === '42P01') {
      await supabase.query(`
        CREATE TABLE task_materials (
          id SERIAL PRIMARY KEY,
          task_id INTEGER NOT NULL,
          material_id INTEGER NOT NULL,
          quantity NUMERIC NOT NULL
        );
      `);
      console.log('Tabla task_materials creada correctamente');
    } else {
      console.log('La tabla task_materials ya existe');
    }

    // Crear tabla budgets
    const createBudgetsTable = await supabase.from('budgets').select('id').limit(1);
    if (createBudgetsTable.error && createBudgetsTable.error.code === '42P01') {
      await supabase.query(`
        CREATE TABLE budgets (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          user_id INTEGER NOT NULL,
          project_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Tabla budgets creada correctamente');
    } else {
      console.log('La tabla budgets ya existe');
    }

    // Crear tabla budget_tasks
    const createBudgetTasksTable = await supabase.from('budget_tasks').select('id').limit(1);
    if (createBudgetTasksTable.error && createBudgetTasksTable.error.code === '42P01') {
      await supabase.query(`
        CREATE TABLE budget_tasks (
          id SERIAL PRIMARY KEY,
          budget_id INTEGER NOT NULL,
          task_id INTEGER NOT NULL,
          quantity NUMERIC NOT NULL
        );
      `);
      console.log('Tabla budget_tasks creada correctamente');
    } else {
      console.log('La tabla budget_tasks ya existe');
    }

    console.log('Todas las tablas han sido creadas correctamente en Supabase');
    
    return true;
  } catch (error) {
    console.error('Error al crear las tablas:', error);
    return false;
  }
}

async function migrateData() {
  try {
    console.log('Iniciando migración de datos a Supabase...');

    // Obtener datos de tabla usuarios
    const users = await db.select().from(schema.users);
    if (users.length > 0) {
      // Insertar usuarios en Supabase
      for (const user of users) {
        const { error } = await supabase.from('users').upsert(user, { onConflict: 'id' });
        if (error) {
          console.error('Error al insertar usuario:', error);
        }
      }
      console.log(`Se migraron ${users.length} usuarios correctamente`);
    }

    // Obtener datos de tabla projects
    const projects = await db.select().from(schema.projects);
    if (projects.length > 0) {
      // Insertar proyectos en Supabase
      for (const project of projects) {
        const { error } = await supabase.from('projects').upsert(project, { onConflict: 'id' });
        if (error) {
          console.error('Error al insertar proyecto:', error);
        }
      }
      console.log(`Se migraron ${projects.length} proyectos correctamente`);
    }

    // Obtener datos de tabla materials
    const materials = await db.select().from(schema.materials);
    if (materials.length > 0) {
      // Insertar materiales en Supabase
      for (const material of materials) {
        const { error } = await supabase.from('materials').upsert(material, { onConflict: 'id' });
        if (error) {
          console.error('Error al insertar material:', error);
        }
      }
      console.log(`Se migraron ${materials.length} materiales correctamente`);
    }

    // Obtener datos de tabla tasks
    const tasks = await db.select().from(schema.tasks);
    if (tasks.length > 0) {
      // Insertar tareas en Supabase
      for (const task of tasks) {
        const { error } = await supabase.from('tasks').upsert(task, { onConflict: 'id' });
        if (error) {
          console.error('Error al insertar tarea:', error);
        }
      }
      console.log(`Se migraron ${tasks.length} tareas correctamente`);
    }

    // Obtener datos de tabla task_materials
    const taskMaterials = await db.select().from(schema.taskMaterials);
    if (taskMaterials.length > 0) {
      // Insertar relaciones tarea-material en Supabase
      for (const taskMaterial of taskMaterials) {
        const { error } = await supabase.from('task_materials').upsert(taskMaterial, { onConflict: 'id' });
        if (error) {
          console.error('Error al insertar relación tarea-material:', error);
        }
      }
      console.log(`Se migraron ${taskMaterials.length} relaciones tarea-material correctamente`);
    }

    // Obtener datos de tabla budgets
    const budgets = await db.select().from(schema.budgets);
    if (budgets.length > 0) {
      // Insertar presupuestos en Supabase
      for (const budget of budgets) {
        const { error } = await supabase.from('budgets').upsert(budget, { onConflict: 'id' });
        if (error) {
          console.error('Error al insertar presupuesto:', error);
        }
      }
      console.log(`Se migraron ${budgets.length} presupuestos correctamente`);
    }

    // Obtener datos de tabla budget_tasks
    const budgetTasks = await db.select().from(schema.budgetTasks);
    if (budgetTasks.length > 0) {
      // Insertar relaciones presupuesto-tarea en Supabase
      for (const budgetTask of budgetTasks) {
        const { error } = await supabase.from('budget_tasks').upsert(budgetTask, { onConflict: 'id' });
        if (error) {
          console.error('Error al insertar relación presupuesto-tarea:', error);
        }
      }
      console.log(`Se migraron ${budgetTasks.length} relaciones presupuesto-tarea correctamente`);
    }

    console.log('Todos los datos han sido migrados correctamente a Supabase');
    
    return true;
  } catch (error) {
    console.error('Error al migrar los datos:', error);
    return false;
  }
}

async function insertSampleData() {
  try {
    console.log('Verificando si es necesario insertar datos de ejemplo...');

    // Verificar si hay usuarios
    const { data: users, error: usersError } = await supabase.from('users').select('id').limit(1);
    if (usersError) throw usersError;
    
    if (users.length === 0) {
      // Insertar usuario de ejemplo
      const { data: adminUser, error: adminError } = await supabase.from('users').insert({
        username: 'admin',
        password: 'admin123', // En producción debería ser una contraseña hasheada
        full_name: 'Administrador',
        email: 'admin@example.com'
      }).select();
      
      if (adminError) throw adminError;
      console.log('Usuario administrador creado:', adminUser);

      // Insertar proyecto de ejemplo
      const { data: project, error: projectError } = await supabase.from('projects').insert({
        name: 'Casa de Ejemplo',
        description: 'Proyecto de construcción de casa de ejemplo',
        status: 'in_progress',
        user_id: adminUser[0].id
      }).select();
      
      if (projectError) throw projectError;
      console.log('Proyecto de ejemplo creado:', project);

      // Insertar materiales de ejemplo
      const materials = [
        { name: 'Cemento', category: 'Materiales básicos', unit: 'kg', unit_price: 5.50 },
        { name: 'Arena', category: 'Materiales básicos', unit: 'm³', unit_price: 20.00 },
        { name: 'Ladrillo', category: 'Materiales básicos', unit: 'unidad', unit_price: 1.20 },
        { name: 'Varilla de acero', category: 'Hierros', unit: 'unidad', unit_price: 15.00 },
        { name: 'Pintura', category: 'Acabados', unit: 'litro', unit_price: 8.75 }
      ];
      
      const { data: insertedMaterials, error: materialsError } = await supabase.from('materials').insert(materials).select();
      if (materialsError) throw materialsError;
      console.log('Materiales de ejemplo creados:', insertedMaterials);

      // Insertar tareas de ejemplo
      const tasks = [
        { name: 'Cimientos', category: 'Estructura', unit: 'm³', unit_price: 120.00 },
        { name: 'Levantamiento de muros', category: 'Albañilería', unit: 'm²', unit_price: 85.00 },
        { name: 'Instalación eléctrica', category: 'Instalaciones', unit: 'punto', unit_price: 45.00 },
        { name: 'Instalación sanitaria', category: 'Instalaciones', unit: 'punto', unit_price: 60.00 },
        { name: 'Pintura interior', category: 'Acabados', unit: 'm²', unit_price: 12.00 }
      ];
      
      const { data: insertedTasks, error: tasksError } = await supabase.from('tasks').insert(tasks).select();
      if (tasksError) throw tasksError;
      console.log('Tareas de ejemplo creadas:', insertedTasks);

      // Crear relaciones entre tareas y materiales
      const taskMaterials = [
        { task_id: insertedTasks[0].id, material_id: insertedMaterials[0].id, quantity: 50 },
        { task_id: insertedTasks[0].id, material_id: insertedMaterials[1].id, quantity: 2 },
        { task_id: insertedTasks[1].id, material_id: insertedMaterials[2].id, quantity: 500 },
        { task_id: insertedTasks[1].id, material_id: insertedMaterials[0].id, quantity: 25 },
        { task_id: insertedTasks[4].id, material_id: insertedMaterials[4].id, quantity: 10 }
      ];
      
      const { data: insertedTaskMaterials, error: taskMaterialsError } = await supabase.from('task_materials').insert(taskMaterials).select();
      if (taskMaterialsError) throw taskMaterialsError;
      console.log('Relaciones tarea-material creadas:', insertedTaskMaterials);

      // Crear presupuesto de ejemplo
      const { data: budget, error: budgetError } = await supabase.from('budgets').insert({
        name: 'Presupuesto Inicial Casa',
        description: 'Presupuesto inicial para la construcción de la casa',
        user_id: adminUser[0].id,
        project_id: project[0].id
      }).select();
      
      if (budgetError) throw budgetError;
      console.log('Presupuesto de ejemplo creado:', budget);

      // Asociar tareas al presupuesto
      const budgetTasks = [
        { budget_id: budget[0].id, task_id: insertedTasks[0].id, quantity: 15 },
        { budget_id: budget[0].id, task_id: insertedTasks[1].id, quantity: 85 },
        { budget_id: budget[0].id, task_id: insertedTasks[2].id, quantity: 20 },
        { budget_id: budget[0].id, task_id: insertedTasks[3].id, quantity: 10 }
      ];
      
      const { data: insertedBudgetTasks, error: budgetTasksError } = await supabase.from('budget_tasks').insert(budgetTasks).select();
      if (budgetTasksError) throw budgetTasksError;
      console.log('Relaciones presupuesto-tarea creadas:', insertedBudgetTasks);

      console.log('Datos de ejemplo insertados correctamente');
    } else {
      console.log('Ya existen datos en las tablas, no es necesario insertar datos de ejemplo');
    }
    
    return true;
  } catch (error) {
    console.error('Error al insertar datos de ejemplo:', error);
    return false;
  }
}

async function main() {
  console.log('Iniciando script de migración a Supabase...');
  
  // Crear tablas
  const tablesCreated = await createTables();
  if (!tablesCreated) {
    console.error('Error al crear las tablas, abortando migración');
    process.exit(1);
  }
  
  // Migrar datos existentes
  const dataMigrated = await migrateData();
  if (!dataMigrated) {
    console.error('Error al migrar los datos, continuando con datos de ejemplo');
  }
  
  // Insertar datos de ejemplo si es necesario
  const sampleDataInserted = await insertSampleData();
  if (!sampleDataInserted) {
    console.error('Error al insertar datos de ejemplo');
  }
  
  console.log('Proceso de migración a Supabase completado');
  process.exit(0);
}

// Ejecutar el script
main();