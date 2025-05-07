import { supabase } from '../server/supabase';
import { createHash } from 'crypto';

// Función para hashear contraseñas
async function hashPassword(password: string): Promise<string> {
  const salt = Math.random().toString(36).substring(2, 15);
  const hash = createHash('sha256');
  hash.update(password + salt);
  return hash.digest('hex') + '.' + salt;
}

async function setupInitialData() {
  try {
    console.log('===== INICIALIZANDO DATOS EN SUPABASE =====');
    console.log('Verificando tablas existentes...');

    // Verificar si existe la tabla users
    const { error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
      
    if (usersError && usersError.code === '42P01') {
      console.error('\n❌ ERROR: La tabla "users" no existe.');
      console.log('Por favor, ejecuta primero el script SQL para crear las tablas.');
      console.log('Utiliza el script test-supabase-schema.ts para obtener el SQL necesario.');
      return false;
    }
    
    console.log('✅ Tabla "users" encontrada.');
    
    // Verificar si ya existen usuarios
    const { data: existingUsers, error: userCheckError } = await supabase
      .from('users')
      .select('id, username')
      .limit(10);
      
    if (userCheckError) {
      console.error('Error al verificar usuarios existentes:', userCheckError);
      return false;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('Usuarios existentes:', existingUsers.map(u => u.username).join(', '));
      
      // Preguntar si se desea continuar
      console.log('\n⚠️ Ya existen usuarios en la base de datos.');
      console.log('Continuando con la inicialización de datos...');
    } else {
      console.log('No se encontraron usuarios. Creando usuarios iniciales...');
    }
    
    // Crear o verificar usuario admin
    let adminUser;
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'admin')
      .maybeSingle();
      
    if (existingAdmin) {
      console.log('El usuario admin ya existe:', existingAdmin);
      adminUser = existingAdmin;
    } else {
      // Insertar usuario admin
      const hashedPassword = await hashPassword('admin123');
      const { data: newAdmin, error: adminError } = await supabase
        .from('users')
        .insert({
          username: 'admin',
          password: hashedPassword,
          full_name: 'Administrador',
          email: 'admin@example.com'
        })
        .select()
        .single();
        
      if (adminError) {
        console.error('Error al crear usuario admin:', adminError);
      } else {
        console.log('✅ Usuario admin creado con éxito.');
        adminUser = newAdmin;
      }
    }
    
    // Crear o verificar usuario demo
    let demoUser;
    const { data: existingDemo } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'demo')
      .maybeSingle();
      
    if (existingDemo) {
      console.log('El usuario demo ya existe.');
      demoUser = existingDemo;
    } else {
      // Insertar usuario demo
      const hashedPassword = await hashPassword('demo123');
      const { data: newDemo, error: demoError } = await supabase
        .from('users')
        .insert({
          username: 'demo',
          password: hashedPassword,
          full_name: 'Usuario Demo',
          email: 'demo@example.com'
        })
        .select()
        .single();
        
      if (demoError) {
        console.error('Error al crear usuario demo:', demoError);
      } else {
        console.log('✅ Usuario demo creado con éxito.');
        demoUser = newDemo;
      }
    }
    
    if (!adminUser) {
      console.error('❌ No se pudo crear o encontrar el usuario admin. No se pueden crear datos dependientes.');
      return false;
    }
    
    // Verificar y crear proyectos
    console.log('\nVerificando proyectos existentes...');
    const { data: existingProjects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name')
      .limit(10);
      
    if (projectsError && projectsError.code === '42P01') {
      console.error('❌ La tabla "projects" no existe.');
      return false;
    } else if (projectsError) {
      console.error('Error al verificar proyectos:', projectsError);
    } else if (existingProjects && existingProjects.length > 0) {
      console.log('Proyectos existentes:', existingProjects.map(p => p.name).join(', '));
    } else {
      console.log('No se encontraron proyectos. Creando proyectos iniciales...');
      
      // Crear proyectos de ejemplo
      const projects = [
        {
          name: 'Casa Modelo',
          description: 'Proyecto de construcción de casa modelo',
          status: 'in_progress',
          user_id: adminUser.id
        },
        {
          name: 'Edificio Comercial',
          description: 'Construcción de locales comerciales',
          status: 'planning',
          user_id: adminUser.id
        }
      ];
      
      const { data: insertedProjects, error: projectError } = await supabase
        .from('projects')
        .insert(projects)
        .select();
        
      if (projectError) {
        console.error('Error al crear proyectos de ejemplo:', projectError);
      } else {
        console.log(`✅ ${insertedProjects.length} proyectos creados con éxito.`);
      }
    }
    
    // Verificar y crear materiales si se está utilizando la tabla "materials"
    console.log('\nVerificando materiales existentes...');
    const { data: existingMaterials, error: materialsError } = await supabase
      .from('materials')
      .select('id, name')
      .limit(10);
      
    if (materialsError && materialsError.code === '42P01') {
      console.log('❌ La tabla "materials" no existe. Verificando tabla "materiales"...');
      
      // Verificar si existe la tabla materiales (en español)
      const { data: materialesData, error: materialesError } = await supabase
        .from('materiales')
        .select('id, nombre')
        .limit(10);
        
      if (materialesError && materialesError.code === '42P01') {
        console.error('❌ Ninguna tabla de materiales encontrada ("materials" o "materiales").');
      } else if (materialesError) {
        console.error('Error al verificar tabla materiales:', materialesError);
      } else if (materialesData && materialesData.length > 0) {
        console.log('✅ Usando tabla "materiales". Elementos encontrados:', materialesData.map(m => m.nombre).join(', '));
      } else {
        console.log('La tabla "materiales" existe pero está vacía. Creando datos de ejemplo...');
        
        // Insertar materiales en la tabla "materiales"
        const materiales = [
          { nombre: 'Cemento' },
          { nombre: 'Arena' },
          { nombre: 'Ladrillo' },
          { nombre: 'Varilla de acero' },
          { nombre: 'Pintura' }
        ];
        
        const { data: insertedMateriales, error: insertError } = await supabase
          .from('materiales')
          .insert(materiales)
          .select();
          
        if (insertError) {
          console.error('Error al crear materiales de ejemplo:', insertError);
        } else {
          console.log(`✅ ${insertedMateriales.length} materiales creados con éxito en tabla "materiales".`);
        }
      }
    } else if (materialsError) {
      console.error('Error al verificar materiales:', materialsError);
    } else if (existingMaterials && existingMaterials.length > 0) {
      console.log('✅ Materiales existentes en tabla "materials":', existingMaterials.map(m => m.name).join(', '));
    } else {
      console.log('La tabla "materials" existe pero está vacía. Creando datos de ejemplo...');
      
      // Insertar materiales
      const materials = [
        { name: 'Cemento', category: 'Materiales básicos', unit: 'kg', unit_price: 5.50 },
        { name: 'Arena', category: 'Materiales básicos', unit: 'm³', unit_price: 20.00 },
        { name: 'Ladrillo', category: 'Materiales básicos', unit: 'unidad', unit_price: 1.20 },
        { name: 'Varilla de acero', category: 'Hierros', unit: 'unidad', unit_price: 15.00 },
        { name: 'Pintura', category: 'Acabados', unit: 'litro', unit_price: 8.75 }
      ];
      
      const { data: insertedMaterials, error: insertError } = await supabase
        .from('materials')
        .insert(materials)
        .select();
        
      if (insertError) {
        console.error('Error al crear materiales de ejemplo:', insertError);
      } else {
        console.log(`✅ ${insertedMaterials.length} materiales creados con éxito en tabla "materials".`);
      }
    }
    
    // Verificar y crear tareas
    console.log('\nVerificando tareas existentes...');
    const { data: existingTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, name')
      .limit(10);
      
    if (tasksError && tasksError.code === '42P01') {
      console.error('❌ La tabla "tasks" no existe.');
    } else if (tasksError) {
      console.error('Error al verificar tareas:', tasksError);
    } else if (existingTasks && existingTasks.length > 0) {
      console.log('✅ Tareas existentes:', existingTasks.map(t => t.name).join(', '));
    } else {
      console.log('No se encontraron tareas. Creando tareas iniciales...');
      
      // Insertar tareas
      const tasks = [
        { name: 'Columna de Hormigón Armado', category: 'Estructura', unit: 'm³', unit_price: 120.00 },
        { name: 'Levantamiento de muros', category: 'Albañilería', unit: 'm²', unit_price: 85.00 },
        { name: 'Instalación eléctrica', category: 'Instalaciones', unit: 'punto', unit_price: 45.00 },
        { name: 'Instalación sanitaria', category: 'Instalaciones', unit: 'punto', unit_price: 60.00 },
        { name: 'Pintura interior', category: 'Acabados', unit: 'm²', unit_price: 12.00 }
      ];
      
      const { data: insertedTasks, error: insertError } = await supabase
        .from('tasks')
        .insert(tasks)
        .select();
        
      if (insertError) {
        console.error('Error al crear tareas de ejemplo:', insertError);
      } else {
        console.log(`✅ ${insertedTasks.length} tareas creadas con éxito.`);
      }
    }
    
    console.log('\n===== INICIALIZACIÓN DE DATOS COMPLETADA =====');
    console.log('* Se han verificado o creado datos básicos para la aplicación.');
    console.log('* Usuarios disponibles:');
    console.log('  - admin/admin123');
    console.log('  - demo/demo123');
    console.log('* La aplicación está lista para usar con Supabase.');
    
    return true;
  } catch (error) {
    console.error('Error general durante la configuración de datos iniciales:', error);
    return false;
  }
}

// Ejecutar la configuración
setupInitialData()
  .then(success => {
    if (success) {
      console.log('\n✅ Proceso de configuración completado correctamente.');
    } else {
      console.error('\n❌ El proceso de configuración completó con errores.');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error fatal durante la configuración:', error);
    process.exit(1);
  });