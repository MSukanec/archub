Stack: Node.js · Express · Supabase · TypeScript
Objetivo: Backend estable, escalable y consistente, sin serverless, sin duplicaciones.

📂 1. Estructura General del Backend
server/
  index.ts
  routes/
    index.ts
    <modulo>.ts        # Ej: clients.ts, projects.ts
  controllers/
    <modulo>/
      <action>.ts      # Ej: getClients.ts, createClient.ts
  lib/
    supabase.ts
    auth.ts
    cors.ts
    validators.ts
    utils.ts
    rate-limit.ts

🧱 2. Rol de cada carpeta
server/index.ts

Punto de entrada.
Hace:

Crea instancia de Express

Aplica middlewares:

CORS

parseo JSON

auth (si aplica)

Carga server/routes/index.ts

Inicia el servidor

Nunca debe tener lógica.
Solo configuración.

server/routes/

Define las rutas de Express.

✔ Cómo se estructura cada archivo de rutas:

Un archivo por módulo del sistema:

server/routes/clients.ts
server/routes/projects.ts
server/routes/payments.ts
...


Cada archivo hace:

import express.Router()

Importa funciones desde controllers/<modulo>

Define endpoints

Exporta el router

Ejemplo (simplificado):

import { Router } from "express";
import { getClients, createClient } from "../controllers/clients";

const router = Router();

router.get("/", getClients);
router.post("/", createClient);

export default router;

server/routes/index.ts

Ensamblador de rutas.
Registra todos los módulos en un solo lugar.

Ejemplo:

router.use("/clients", clients);
router.use("/projects", projects);
router.use("/payments", payments);
router.use("/courses", courses);

server/controllers/

Acá vive la lógica REAL del sistema.

Reglas:

Un módulo → una carpeta.

Una acción/endopoint → un archivo.

Ejemplo:

controllers/
  clients/
    getClients.ts
    createClient.ts
    updateClient.ts
    deleteClient.ts

Cada controlador:

No toca Express directamente.

Solo recibe (req, res) y ejecuta lógica.

Usa lib/supabase.ts para conectarse a la DB.

Ejemplo simple:

export async function getClients(req, res) {
  const { data, error } = await supabase
    .from("project_clients")
    .select("*")
    .eq("project_id", req.params.projectId);

  if (error) return res.status(400).json({ error });
  res.json({ data });
}

server/lib/

Funciones compartidas.

Contiene:

supabase.ts → clientes admin y anon

auth.ts → parsear tokens, validar usuarios

utils.ts → helpers genéricos

validators.ts → Zod schemas

cors.ts → config centralizada de CORS

rate-limit.ts → rate limiting

Nunca poner lógica de negocio acá.

🧩 3. Cómo crear un nuevo módulo

Cuando creamos “suppliers”, “materials”, “design-phases”, etc:

1. Crear carpeta del módulo:
server/controllers/suppliers/

2. Crear controlador por acción:
getSuppliers.ts
createSupplier.ts
updateSupplier.ts
deleteSupplier.ts

3. Crear archivo de rutas:
server/routes/suppliers.ts

4. Registrar en routes/index.ts:
router.use("/suppliers", suppliers);

5. Listo.

Sin modificar nada más en el sistema.

🎮 4. Regla de Oro — “4 capas, 1 responsabilidad por capa”
Capa	Responsabilidad	Ejemplo
Routes	Caminos HTTP, sin lógica	router.get("/clients")
Controllers	Lógica de negocio, validaciones	Leer/write DB
Lib	Helpers compartidos	supabase.ts, auth.ts
Index.ts	Bootstrapping	Configurar y arrancar express

NUNCA mezclar.

🚫 5. Cosas prohibidas (te rompen el backend)

❌ Lógica dentro de server/index.ts
❌ Consultas a la DB dentro de routes/*.ts
❌ Que un controlador importe otro controlador
❌ Crear endpoints dentro de /api/
❌ Repetir nombres de rutas
❌ Mezclar Express con serverless
❌ Crear carpetas fuera de server/

🔥 6. Cómo debe trabajar siempre el Agent (reglas que debe obedecer)

Agregar estas reglas explícitamente:

✔ Si creo un endpoint nuevo:

Crear archivo dentro de controllers/<modulo>/

Crear ruta en routes/<modulo>.ts

Agregarlo a routes/index.ts

NO tocar otras partes del backend

✔ Si agrego lógica nueva:

Nunca va en rutas

Nunca va en index

Nunca va en frontend

Siempre va en controllers/<modulo>/

✔ Si necesito helpers:

Van en server/lib/

Nunca en otra carpeta

✔ Si necesito trabajar con Supabase:

Siempre usar lib/supabase.ts

Nunca crear un cliente nuevo en cada controlador

✔ Si agrego nuevos módulos:

Un folder dentro de controllers

Un archivo en routes

Un registro en routes/index.ts

✔ Si borro algo:

Asegurar que no quede ningún import roto

✔ Si modifico algo:

Mantener consistencia con esta arquitectura

🧠 7. Mini ejemplo completo (router + controller + lib)
routes/clients.ts
router.get("/", getClients);
router.post("/", createClient);

controllers/clients/getClients.ts
export async function getClients(req, res) {
  const { data, error } = await supabase.from("clients").select("*");
  if (error) return res.status(400).json({ error });
  res.json({ data });
}

lib/supabase.ts
export const supabase = createClient(process.env.URL, process.env.KEY);

🎯 8. Objetivo final

Un backend:

ordenado

entendible

escalable

estándar profesional

fácil de mantener

imposible de romper

📌 FIN DE ARCHITECTURE.md