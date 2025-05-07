import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carga variables de entorno
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL o SUPABASE_KEY no están definidas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCategoriesTable() {
  console.log('Verificando la existencia de la tabla "categories"...')
  
  // Verificar si existe la tabla categories
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_name', 'categories')
    .eq('table_schema', 'public')
  
  if (error) {
    console.error('Error al verificar la tabla categories:', error.message)
    console.log('Es posible que necesites ejecutar el script SQL en el editor SQL de Supabase')
    console.log('Ve a tu proyecto en Supabase -> SQL Editor -> Nuevo Query')
    console.log('Copia el contenido del archivo supabase-sql-setup.sql y ejecútalo')
    process.exit(1)
  }
  
  if (!data || data.length === 0) {
    console.log('La tabla "categories" NO existe en la base de datos.')
    console.log('Necesitas ejecutar el script SQL en Supabase:')
    console.log('1. Ve a tu proyecto en Supabase -> SQL Editor -> Nuevo Query')
    console.log('2. Copia el contenido del archivo supabase-sql-setup.sql y ejecútalo')
  } else {
    console.log('La tabla "categories" existe en la base de datos.')
    
    // Verificar columnas
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'categories')
      .eq('table_schema', 'public')
    
    if (columnsError) {
      console.error('Error al verificar columnas:', columnsError.message)
    } else {
      console.log('Columnas encontradas:', columns.map(c => c.column_name).join(', '))
    }
  }
}

// Ejecutar la verificación
checkCategoriesTable()
  .catch(err => {
    console.error('Error inesperado:', err)
    process.exit(1)
  })
  .finally(() => {
    console.log('Verificación completada')
  })