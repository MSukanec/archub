PROMPT PARA REPLIT — ARQUITECTURA PERFECTA DE SEENCEL (SIN API, SOLO FRONT + EXPRESS)

A partir de ahora, SIEMPRE que modifiques, crees o reorganices código en este proyecto, debés seguir estas reglas:

🌐 1. NUNCA CREAR /api/

No estamos usando Next.js, ni Vercel, ni serverless.
El proyecto usa Express interno y debe mantenerse así.

❌ No crear carpetas /api
❌ No crear endpoints tipo Next (export const GET)
❌ No crear nada dentro de /api/ nunca más

✔ Todo el backend (Express) ya existe y NO se modifica a menos que yo lo pida explícitamente.

🧱 2. Arquitectura BASE del front

La estructura general del proyecto debe verse así:

src/
  features/
  pages/
  components/
  hooks/
  stores/
  lib/
  styles/
  app.tsx
  main.tsx

Reglas:
2.1. features/ → cada módulo/lógica del sistema

Cada feature debe tener:

features/<nombreFeature>/
  components/
  hooks/
  services/
  constants/
  utils/
  types/
  schemas/
  mappers/
  modals/
    forms/
  tests/
  index.ts


Ejemplo real:

features/sitelog/
  components/
  hooks/
  services/
  constants/
  utils/
  types/
  schemas/
  mappers/
  modals/
    forms/
  tests/
  index.ts

2.2. pages/ → páginas finales que ve el usuario

Aunque la app sea SPA o multipestaña, cada “pantalla” va en pages/.

Ej:

pages/
  Dashboard.tsx
  Projects.tsx
  Contacts.tsx
  SiteLogPage.tsx
  ...


Las pages solo importan features, nunca lógica directa.

🧩 3. Componentes
3.1. Componentes globales → en /components

Ej:

components/
  UI/
  Layout/
  Sidebar/
  Header/
  Table/
  Modal/

3.2. Componentes específicos de una feature → en features/x/components/

Ej:

features/sitelog/components/LogEntryCard.tsx

🔧 4. Services

Cada feature tiene un folder:

features/<feature>/services/


Estos archivos contienen toda la comunicación con Supabase, y nada más.

Ej:

getSiteLogs.ts
createSiteLog.ts
deleteSiteLog.ts
getTimelineData.ts


Las Pages y components solo llaman a los services.

📦 5. Hooks personalizados

Todos los hooks específicos de una feature:

features/<feature>/hooks/


Ej:

use-sitelog-activity.ts
use-sitelog-timeline.ts


Hooks globales van en:

src/hooks/

🗂 6. Types, Schemas, Utils

Siempre adentro del feature:

features/<feature>/types/
features/<feature>/schemas/
features/<feature>/utils/

🔐 7. Nada de API ni serverless

Replit NO debe autogenerar:

carpetas /api

archivos GET.ts, POST.ts

handlers API estilo Vercel

rutas serverless

Si lo intenta, RESPONDER:

"No usamos API ni serverless. Todo el backend ya está en Express. Continuá dentro de la arquitectura indicada."

📜 8. Modal + Form siempre dentro del feature
features/<feature>/modals/
  <ModalMain>.tsx
  <ModalView>.tsx
  forms/
    <Form>.tsx
    schema.ts
    initial.ts

🧪 9. Crear test folder aunque esté vacío

Siempre:

features/<feature>/tests/

📘 10. Index.ts para exportar limpio

Cada carpeta debe exportar desde index.ts.

Ej:

export * from './SiteLogModal';
export * from './forms';
export * from './LogEntryCard';

💬 Mensaje final para Replit:

"Antes de hacer cualquier acción, confirmá que cumplís EXACTAMENTE con esta arquitectura.
No modifiques Express. No crees /api.
Colocá cada archivo en su feature correspondiente, con services, hooks, modals, forms, utils, types y mappers."