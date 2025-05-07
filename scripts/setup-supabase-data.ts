import { supabase } from '../server/supabase';

async function setupInitialData() {
  try {
    console.log('Iniciando configuración de datos iniciales en Supabase...');

    // Verificar si ya existen usuarios
    const { data: existingUsers, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
      
    if (userError) {
      console.error('Error al verificar usuarios existentes:', userError);
      return false;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('Ya existen usuarios en la base de datos. No se crearán datos de prueba adicionales.');
      return true;
    }
    
    console.log('No se encontraron usuarios. Creando datos iniciales...');
    
    // Insertar usuario admin
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .insert({
        username: 'admin',
        password: 'admin123',
        full_name: 'Administrador',
        email: 'admin@example.com'
      })
      .select()
      .single();
      
    if (adminError) {
      console.error('Error al crear usuario admin:', adminError);
      return false;
    }
    
    console.log('Usuario admin creado con éxito:', adminUser);
    
    // Insertar usuario demo
    const { data: demoUser, error: demoError } = await supabase
      .from('users')
      .insert({
        username: 'demo',
        password: 'demo123',
        full_name: 'Usuario Demo',
        email: 'demo@example.com'
      })
      .select()
      .single();
      
    if (demoError) {
      console.error('Error al crear usuario demo:', demoError);
    } else {
      console.log('Usuario demo creado con éxito:', demoUser);
    }
    
    // Crear un proyecto de ejemplo
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: 'Casa de Ejemplo',
        description: 'Proyecto de construcción de casa modelo',
        status: 'in_progress',
        user_id: adminUser.id
      })
      .select()
      .single();
      
    if (projectError) {
      console.error('Error al crear proyecto de ejemplo:', projectError);
    } else {
      console.log('Proyecto de ejemplo creado con éxito:', project);
    }
    
    // Crear materiales de ejemplo
    const materials = [
      { name: 'Cemento', category: 'Materiales básicos', unit: 'kg', unit_price: 5.50 },
      { name: 'Arena', category: 'Materiales básicos', unit: 'm³', unit_price: 20.00 },
      { name: 'Ladrillo Visto', category: 'Materiales básicos', unit: 'unidad', unit_price: 1.20 },
      { name: 'Varilla de acero', category: 'Hierros', unit: 'unidad', unit_price: 15.00 },
      { name: 'Pintura', category: 'Acabados', unit: 'litro', unit_price: 8.75 }
    ];
    
    const { data: insertedMaterials, error: materialsError } = await supabase
      .from('materials')
      .insert(materials)
      .select();
      
    if (materialsError) {
      console.error('Error al crear materiales de ejemplo:', materialsError);
    } else {
      console.log(`${insertedMaterials.length} materiales de ejemplo creados con éxito`);
    }
    
    // Crear tareas de ejemplo
    const tasks = [
      { name: 'Columna de Hormigón Armado', category: 'Estructura', unit: 'm³', unit_price: 120.00 },
      { name: 'Levantamiento de muros', category: 'Albañilería', unit: 'm²', unit_price: 85.00 },
      { name: 'Instalación eléctrica', category: 'Instalaciones', unit: 'punto', unit_price: 45.00 },
      { name: 'Instalación sanitaria', category: 'Instalaciones', unit: 'punto', unit_price: 60.00 },
      { name: 'Pintura interior', category: 'Acabados', unit: 'm²', unit_price: 12.00 }
    ];
    
    const { data: insertedTasks, error: tasksError } = await supabase
      .from('tasks')
      .insert(tasks)
      .select();
      
    if (tasksError) {
      console.error('Error al crear tareas de ejemplo:', tasksError);
    } else {
      console.log(`${insertedTasks.length} tareas de ejemplo creadas con éxito`);
    }
    
    // Crear relaciones entre tareas y materiales si ambos se crearon correctamente
    if (insertedMaterials && insertedTasks) {
      const taskMaterials = [
        { task_id: insertedTasks[0].id, material_id: insertedMaterials[0].id, quantity: 50 },
        { task_id: insertedTasks[0].id, material_id: insertedMaterials[1].id, quantity: 2 },
        { task_id: insertedTasks[1].id, material_id: insertedMaterials[2].id, quantity: 500 },
        { task_id: insertedTasks[1].id, material_id: insertedMaterials[0].id, quantity: 25 },
        { task_id: insertedTasks[4].id, material_id: insertedMaterials[4].id, quantity: 10 }
      ];
      
      const { data: insertedTaskMaterials, error: taskMaterialsError } = await supabase
        .from('task_materials')
        .insert(taskMaterials)
        .select();
        
      if (taskMaterialsError) {
        console.error('Error al crear relaciones tarea-material:', taskMaterialsError);
      } else {
        console.log(`${insertedTaskMaterials.length} relaciones tarea-material creadas con éxito`);
      }
    }
    
    // Crear un presupuesto de ejemplo si el proyecto se creó correctamente
    if (project) {
      const { data: budget, error: budgetError } = await supabase
        .from('budgets')
        .insert({
          name: 'Presupuesto de Mantenimiento',
          description: 'Presupuesto para mantenimiento general',
          user_id: adminUser.id,
          project_id: project.id
        })
        .select()
        .single();
        
      if (budgetError) {
        console.error('Error al crear presupuesto de ejemplo:', budgetError);
      } else {
        console.log('Presupuesto de ejemplo creado con éxito:', budget);
        
        // Asociar tareas al presupuesto si las tareas se crearon correctamente
        if (insertedTasks && budget) {
          const budgetTasks = [
            { budget_id: budget.id, task_id: insertedTasks[0].id, quantity: 15 },
            { budget_id: budget.id, task_id: insertedTasks[1].id, quantity: 85 },
            { budget_id: budget.id, task_id: insertedTasks[2].id, quantity: 20 },
            { budget_id: budget.id, task_id: insertedTasks[3].id, quantity: 10 }
          ];
          
          const { data: insertedBudgetTasks, error: budgetTasksError } = await supabase
            .from('budget_tasks')
            .insert(budgetTasks)
            .select();
            
          if (budgetTasksError) {
            console.error('Error al crear relaciones presupuesto-tarea:', budgetTasksError);
          } else {
            console.log(`${insertedBudgetTasks.length} relaciones presupuesto-tarea creadas con éxito`);
          }
        }
      }
    }
    
    console.log('Configuración de datos iniciales completada con éxito.');
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
      console.log('Proceso de configuración completado correctamente.');
    } else {
      console.error('El proceso de configuración completó con errores.');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Error fatal durante la configuración:', error);
    process.exit(1);
  });