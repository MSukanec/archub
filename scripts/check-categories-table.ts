import { supabase } from "../server/supabase";

async function checkCategoriesTable() {
  try {
    console.log("Verificando si la tabla categories existe...");
    
    // Verificar si la tabla existe
    const { data: existingTable, error: tableCheckError } = await supabase
      .from('categories')
      .select('id')
      .limit(1);
      
    if (tableCheckError && tableCheckError.code === '42P01') {
      console.log("La tabla categories NO existe en Supabase.");
      console.log("Debes ejecutar el script SQL 'supabase-categories-setup.sql' en la consola SQL de Supabase.");
      console.log("Pasos:");
      console.log("1. Ve al dashboard de Supabase");
      console.log("2. Selecciona tu proyecto");
      console.log("3. Ve a 'SQL Editor'");
      console.log("4. Copia y pega el contenido de 'supabase-categories-setup.sql'");
      console.log("5. Ejecuta el script");
      return false;
    } else if (tableCheckError) {
      console.error("Error al verificar la tabla categories:", tableCheckError);
      return false;
    } else {
      console.log("La tabla categories EXISTE en Supabase.");
      
      // Verificar si hay categorías en la tabla
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*');
        
      if (categoriesError) {
        console.error("Error al obtener categorías:", categoriesError);
        return false;
      }
      
      if (!categories || categories.length === 0) {
        console.log("La tabla existe pero está vacía. Debes ejecutar el script SQL para insertar datos.");
      } else {
        console.log(`Hay ${categories.length} categorías en la tabla:`);
        categories.forEach(category => {
          console.log(`- ${category.name} (tipo: ${category.type}, posición: ${category.position})`);
        });
      }
      
      return true;
    }
  } catch (error) {
    console.error("Error al comprobar la tabla de categorías:", error);
    return false;
  }
}

// Ejecutar el script
checkCategoriesTable()
  .then(success => {
    if (success) {
      console.log("Verificación completada con éxito.");
    } else {
      console.log("La verificación falló.");
      process.exit(1);
    }
  })
  .catch(error => {
    console.error("Error:", error);
    process.exit(1);
  });