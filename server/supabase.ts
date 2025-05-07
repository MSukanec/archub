import { createClient } from '@supabase/supabase-js';

// Verificamos si tenemos la URL y alguna de las claves de Supabase
if (!process.env.SUPABASE_URL) {
  throw new Error(
    "SUPABASE_URL no está definido. La conexión a Supabase no está configurada correctamente.",
  );
}

// Preferimos usar la clave de servicio para operaciones administrativas si está disponible
const apiKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!apiKey) {
  throw new Error(
    "No se encontró ninguna clave de API de Supabase. Se requiere SUPABASE_SERVICE_KEY o SUPABASE_KEY.",
  );
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  apiKey
);

console.log('Cliente de Supabase inicializado correctamente');