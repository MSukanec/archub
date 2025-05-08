import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function checkCategoriesTable() {
  try {
    console.log("Verificando existencia de la tabla categories...");
    
    // Consulta para verificar si la tabla existe
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'categories'
      );
    `);
    
    const tableExists = result[0]?.exists || false;
    
    if (tableExists) {
      console.log("✓ La tabla categories ya existe.");
      return true;
    } else {
      console.log("✗ La tabla categories no existe. Creando tabla...");
      
      // Crear la tabla categories
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          position INTEGER NOT NULL DEFAULT 0,
          parent_id INTEGER DEFAULT NULL REFERENCES categories(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Verificar si se creó correctamente
      const checkResult = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'categories'
        );
      `);
      
      const createdSuccessfully = checkResult[0]?.exists || false;
      
      if (createdSuccessfully) {
        console.log("✓ Tabla categories creada correctamente.");
        
        // Crear función y trigger para actualizar el timestamp
        await db.execute(sql`
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
             NEW.updated_at = CURRENT_TIMESTAMP;
             RETURN NEW;
          END;
          $$ language 'plpgsql';
        `);
        
        await db.execute(sql`
          CREATE TRIGGER update_categories_updated_at
          BEFORE UPDATE ON categories
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        `);
        
        // Crear índices
        await db.execute(sql`
          CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
        `);
        
        await db.execute(sql`
          CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
        `);
        
        // Insertar categorías predeterminadas para materiales
        await db.execute(sql`
          INSERT INTO categories (name, type, position) VALUES 
          ('Materiales de construcción', 'material', 1),
          ('Materiales eléctricos', 'material', 2),
          ('Materiales de plomería', 'material', 3),
          ('Acabados', 'material', 4),
          ('Herramientas', 'material', 5);
        `);
        
        // Insertar categorías predeterminadas para tareas
        await db.execute(sql`
          INSERT INTO categories (name, type, position) VALUES 
          ('Obra gruesa', 'task', 1),
          ('Instalaciones eléctricas', 'task', 2),
          ('Instalaciones sanitarias', 'task', 3),
          ('Acabados', 'task', 4),
          ('Limpieza', 'task', 5);
        `);
        
        console.log("✓ Categorías predeterminadas creadas.");
        return true;
      } else {
        console.log("✗ No se pudo crear la tabla categories.");
        return false;
      }
    }
  } catch (error) {
    console.error("Error al verificar/crear la tabla categories:");
    if (error instanceof Error) {
      console.error("Mensaje:", error.message);
      console.error("Stack:", error.stack);
    } else {
      console.error(error);
    }
    return false;
  }
}

// Ejecutar la función al importar el archivo
checkCategoriesTable()
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

export { checkCategoriesTable };