import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Usar la URL de conexión a la base de datos local
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL no está definido. La base de datos no está configurada correctamente.",
  );
}

const databaseUrl = process.env.DATABASE_URL;

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });

console.log('Conexión establecida a la base de datos PostgreSQL');
