import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Construye la URL de conexión a Supabase utilizando la variable de entorno
const databaseUrl = process.env.DATABASE_URL || 
  `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.usjvirkvbdwteqitcrfo.supabase.co:5432/postgres`;

if (!databaseUrl) {
  throw new Error(
    "No se pudo establecer la conexión a la base de datos. Verifica las variables de entorno DATABASE_URL o SUPABASE_DB_PASSWORD.",
  );
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });

console.log('Conexión establecida a la base de datos de Supabase');
