import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { scrypt, randomBytes } from 'crypto'
import { promisify } from 'util'

// Carga variables de entorno
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL o SUPABASE_KEY no están definidas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createSampleCategories() {
  console.log('Creando categorías de ejemplo...')
  
  // Verificar si ya existen categorías
  const { data: existingCategories, error: checkError } = await supabase
    .from('categories')
    .select('id')
    .limit(1)
  
  if (checkError) {
    console.error('Error al verificar categorías existentes:', checkError.message)
    console.log('Asegúrate de que la tabla "categories" existe en la base de datos')
    console.log('Ejecuta el script supabase-sql-setup.sql en el editor SQL de Supabase primero')
    process.exit(1)
  }
  
  if (existingCategories && existingCategories.length > 0) {
    console.log('Ya existen categorías en la base de datos. No se crearán categorías de ejemplo.')
    return
  }
  
  // Categorías principales de materiales
  const materialCategories = [
    { name: 'Materiales Básicos', position: 0, type: 'material' },
    { name: 'Instalaciones Eléctricas', position: 1, type: 'material' },
    { name: 'Instalaciones Sanitarias', position: 2, type: 'material' },
    { name: 'Acabados', position: 3, type: 'material' }
  ]
  
  // Categorías principales de tareas
  const taskCategories = [
    { name: 'Preliminares', position: 0, type: 'task' },
    { name: 'Estructura', position: 1, type: 'task' },
    { name: 'Instalaciones', position: 2, type: 'task' },
    { name: 'Acabados', position: 3, type: 'task' }
  ]
  
  // Insertar categorías principales de materiales
  const { data: insertedMaterialCategories, error: materialError } = await supabase
    .from('categories')
    .insert(materialCategories)
    .select()
  
  if (materialError) {
    console.error('Error al crear categorías de materiales:', materialError.message)
  } else {
    console.log(`Creadas ${insertedMaterialCategories.length} categorías principales de materiales`)
    
    // Subcategorías de materiales
    const materialSubcategories = [
      { name: 'Cemento', position: 0, parent_id: insertedMaterialCategories[0].id, type: 'material' },
      { name: 'Arena', position: 1, parent_id: insertedMaterialCategories[0].id, type: 'material' },
      { name: 'Grava', position: 2, parent_id: insertedMaterialCategories[0].id, type: 'material' },
      { name: 'Cables', position: 0, parent_id: insertedMaterialCategories[1].id, type: 'material' },
      { name: 'Interruptores', position: 1, parent_id: insertedMaterialCategories[1].id, type: 'material' },
      { name: 'Tuberías', position: 0, parent_id: insertedMaterialCategories[2].id, type: 'material' },
      { name: 'Pinturas', position: 0, parent_id: insertedMaterialCategories[3].id, type: 'material' },
      { name: 'Cerámicas', position: 1, parent_id: insertedMaterialCategories[3].id, type: 'material' }
    ]
    
    const { data: insertedMaterialSubcategories, error: subError } = await supabase
      .from('categories')
      .insert(materialSubcategories)
      .select()
    
    if (subError) {
      console.error('Error al crear subcategorías de materiales:', subError.message)
    } else {
      console.log(`Creadas ${insertedMaterialSubcategories.length} subcategorías de materiales`)
    }
  }
  
  // Insertar categorías principales de tareas
  const { data: insertedTaskCategories, error: taskError } = await supabase
    .from('categories')
    .insert(taskCategories)
    .select()
  
  if (taskError) {
    console.error('Error al crear categorías de tareas:', taskError.message)
  } else {
    console.log(`Creadas ${insertedTaskCategories.length} categorías principales de tareas`)
    
    // Subcategorías de tareas
    const taskSubcategories = [
      { name: 'Limpieza', position: 0, parent_id: insertedTaskCategories[0].id, type: 'task' },
      { name: 'Replanteo', position: 1, parent_id: insertedTaskCategories[0].id, type: 'task' },
      { name: 'Cimentación', position: 0, parent_id: insertedTaskCategories[1].id, type: 'task' },
      { name: 'Columnas', position: 1, parent_id: insertedTaskCategories[1].id, type: 'task' },
      { name: 'Muros', position: 2, parent_id: insertedTaskCategories[1].id, type: 'task' },
      { name: 'Instalación Eléctrica', position: 0, parent_id: insertedTaskCategories[2].id, type: 'task' },
      { name: 'Instalación Sanitaria', position: 1, parent_id: insertedTaskCategories[2].id, type: 'task' },
      { name: 'Pintura', position: 0, parent_id: insertedTaskCategories[3].id, type: 'task' },
      { name: 'Pisos', position: 1, parent_id: insertedTaskCategories[3].id, type: 'task' }
    ]
    
    const { data: insertedTaskSubcategories, error: taskSubError } = await supabase
      .from('categories')
      .insert(taskSubcategories)
      .select()
    
    if (taskSubError) {
      console.error('Error al crear subcategorías de tareas:', taskSubError.message)
    } else {
      console.log(`Creadas ${insertedTaskSubcategories.length} subcategorías de tareas`)
    }
  }
}

// Ejecutar la función
createSampleCategories()
  .catch(err => {
    console.error('Error inesperado:', err)
    process.exit(1)
  })
  .finally(() => {
    console.log('Proceso completado')
  })