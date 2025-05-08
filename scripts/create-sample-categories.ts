import { supabase } from "../server/supabase";

async function createSampleCategories() {
  try {
    console.log("Verificando si la tabla categories existe...");
    
    // Primero, verificamos si la tabla existe
    const { data: existingTable, error: tableCheckError } = await supabase
      .from('categories')
      .select('id')
      .limit(1);
      
    if (tableCheckError && tableCheckError.code === '42P01') {
      // La tabla no existe, necesitamos crearla con SQL directamente
      console.log("La tabla categories no existe. Creándola...");
      
      // Ejecutar SQL para crear la tabla
      const { error: createTableError } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS public.categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            "type" VARCHAR(50) NOT NULL DEFAULT 'material',
            position INTEGER NOT NULL DEFAULT 0,
            parent_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories("type");
          CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
          
          -- Crear función para actualizar el timestamp de actualización
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
             NEW.updated_at = CURRENT_TIMESTAMP;
             RETURN NEW;
          END;
          $$ language 'plpgsql';
          
          -- Crear trigger para actualizar el timestamp
          DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
          CREATE TRIGGER update_categories_updated_at
          BEFORE UPDATE ON public.categories
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        `
      });
      
      if (createTableError) {
        console.error("Error al crear la tabla categories:", createTableError);
        
        // Si falla el método RPC, es probable que Supabase no permita ejecutar SQL arbitrario
        // o que la función 'execute_sql' no esté disponible. Intentemos crear la tabla a través de la API REST
        console.log("Intentando crear categorías con la API REST de Supabase...");
        
        // Intentar insertar categorías (Supabase creará la tabla con la estructura adecuada)
        // Intentamos usar la API normal de Supabase para insertar datos
        const { error: insertError } = await supabase
          .from('categories')
          .insert([
            { name: 'Materiales de construcción', type: 'material', position: 1 },
            { name: 'Materiales eléctricos', type: 'material', position: 2 },
            { name: 'Materiales de plomería', type: 'material', position: 3 }
          ]);
          
        if (insertError) {
          console.error("No se pudo crear la tabla categories a través de la API:", insertError);
          return false;
        } else {
          console.log("Categorías creadas correctamente a través de la API.");
          return true;
        }
      } else {
        console.log("Tabla categories creada correctamente con SQL.");
      }
    } else if (tableCheckError) {
      console.error("Error al verificar la tabla categories:", tableCheckError);
      return false;
    } else {
      console.log("La tabla categories ya existe.");
    }
    
    // Verificar si hay categorías en la tabla
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*');
      
    if (categoriesError) {
      console.error("Error al obtener categorías:", categoriesError);
      return false;
    }
    
    if (!categories || categories.length === 0) {
      console.log("No hay categorías. Insertando categorías predeterminadas...");
      
      // Insertar categorías predeterminadas de materiales
      const { error: materialCategoriesError } = await supabase
        .from('categories')
        .insert([
          { name: 'Materiales de construcción', type: 'material', position: 1 },
          { name: 'Materiales eléctricos', type: 'material', position: 2 },
          { name: 'Materiales de plomería', type: 'material', position: 3 },
          { name: 'Acabados', type: 'material', position: 4 },
          { name: 'Herramientas', type: 'material', position: 5 }
        ]);
        
      if (materialCategoriesError) {
        console.error("Error al insertar categorías de materiales:", materialCategoriesError);
        return false;
      }
      
      // Insertar categorías predeterminadas de tareas
      const { error: taskCategoriesError } = await supabase
        .from('categories')
        .insert([
          { name: 'Obra gruesa', type: 'task', position: 1 },
          { name: 'Instalaciones eléctricas', type: 'task', position: 2 },
          { name: 'Instalaciones sanitarias', type: 'task', position: 3 },
          { name: 'Acabados', type: 'task', position: 4 },
          { name: 'Limpieza', type: 'task', position: 5 }
        ]);
        
      if (taskCategoriesError) {
        console.error("Error al insertar categorías de tareas:", taskCategoriesError);
        return false;
      }
      
      console.log("Categorías predeterminadas insertadas correctamente.");
    } else {
      console.log(`Ya existen ${categories.length} categorías en la tabla.`);
    }
    
    return true;
  } catch (error) {
    console.error("Error en el proceso de creación de categorías:", error);
    return false;
  }
}

// Ejecutar el script
createSampleCategories()
  .then(success => {
    if (success) {
      console.log("Proceso completado con éxito.");
    } else {
      console.log("El proceso falló.");
      process.exit(1);
    }
  })
  .catch(error => {
    console.error("Error:", error);
    process.exit(1);
  });