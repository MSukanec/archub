import { supabase } from "../server/supabase";

async function testSupabase() {
  console.log("Iniciando prueba de conexión a Supabase...");

  try {
    // Verificar si podemos listar las tablas
    console.log("Verificando tablas disponibles...");
    const { data: tables, error: tablesError } = await supabase.from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
      
    if (tablesError) {
      console.error("Error al obtener tablas:", tablesError);
    } else {
      console.log("Tablas disponibles:");
      tables.forEach(t => console.log(`- ${t.table_name}`));
    }
    
    // Probar la tabla materiales
    console.log("\nProbando consulta a la tabla 'materiales'...");
    const { data: materiales, error: materialesError } = await supabase
      .from('materiales')
      .select('*')
      .limit(5);
      
    if (materialesError) {
      console.error("Error al consultar materiales:", materialesError);
    } else {
      console.log(`Encontrados ${materiales.length} materiales:`);
      console.log(materiales);
      
      // Probar la inserción de un nuevo material
      console.log("\nProbando inserción de un nuevo material...");
      const nuevoMaterial = {
        nombre: "Material de prueba " + new Date().toISOString()
      };
      
      const { data: materialInsertado, error: insertError } = await supabase
        .from('materiales')
        .insert(nuevoMaterial)
        .select()
        .single();
        
      if (insertError) {
        console.error("Error al insertar material:", insertError);
      } else {
        console.log("Material insertado correctamente:", materialInsertado);
        
        // Probar la eliminación del material recién creado
        console.log("\nProbando eliminación del material...");
        const { error: deleteError } = await supabase
          .from('materiales')
          .delete()
          .eq('id', materialInsertado.id);
          
        if (deleteError) {
          console.error("Error al eliminar material:", deleteError);
        } else {
          console.log("Material eliminado correctamente.");
        }
      }
    }
    
    // Crear un usuario de prueba o verificar si ya existe
    console.log("\nVerificando si existe la tabla 'users'...");
    const { data: usersTable } = await supabase.from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'users');
      
    if (usersTable && usersTable.length > 0) {
      console.log("La tabla 'users' existe. Intentando crear un usuario de prueba...");
      
      // Primero verificamos si ya existe el usuario
      const { data: existingUser, error: userQueryError } = await supabase
        .from('users')
        .select('id, username')
        .eq('username', 'testuser')
        .maybeSingle();
        
      if (userQueryError) {
        console.error("Error al verificar si existe el usuario:", userQueryError);
      } else if (existingUser) {
        console.log("El usuario de prueba ya existe:", existingUser);
      } else {
        // Crear un usuario de prueba
        const testUser = {
          username: "testuser",
          password: "password123",
          full_name: "Usuario de Prueba"
        };
        
        const { data: newUser, error: createUserError } = await supabase
          .from('users')
          .insert(testUser)
          .select()
          .single();
          
        if (createUserError) {
          console.error("Error al crear usuario de prueba:", createUserError);
        } else {
          console.log("Usuario de prueba creado correctamente:", newUser);
        }
      }
    } else {
      console.log("La tabla 'users' no existe aún. Necesitamos crear las estructuras de base de datos.");
    }
    
    console.log("\nPrueba completada.");
  } catch (error) {
    console.error("Error general durante la prueba:", error);
  }
}

// Ejecutar la prueba
testSupabase().catch(console.error);