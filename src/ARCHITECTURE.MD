# 🏗️ ARQUITECTURA DEFINITIVA DE SEENCEL

**PROMPT PARA REPLIT — ARQUITECTURA PERFECTA (EXPRESS + REACT, SIN API)**

A partir de ahora, **SIEMPRE** que modifiques, crees o reorganices código en este proyecto, debes seguir estas reglas AL PIE DE LA LETRA.

---

## 🌐 1. NUNCA CREAR /api/

**NO estamos usando Next.js, ni Vercel, ni serverless.**

El proyecto usa **Express interno** y debe mantenerse así.

### ❌ PROHIBIDO:
- No crear carpetas `/api`
- No crear endpoints tipo Next.js (export const GET)
- No crear nada dentro de `/api/` nunca más

### ✅ PERMITIDO:
- Todo el backend (Express) ya existe en `/server`
- NO se modifica a menos que se pida explícitamente

---

## 🧱 2. ARQUITECTURA BASE DEL FRONT

La estructura general del proyecto debe verse así:

```
src/
  features/          ← Módulos de negocio
  pages/             ← Páginas finales que ve el usuario
  components/        ← Componentes globales reutilizables
  hooks/             ← Hooks globales reutilizables
  stores/            ← Zustand stores globales
  lib/               ← Librerías y configuraciones (supabase, queryClient, etc.)
  styles/            ← Estilos globales
  App.tsx            ← Router principal
  main.tsx           ← Entry point
```

---

## 📦 3. ESTRUCTURA DE FEATURES (LA MÁS IMPORTANTE)

**Cada feature debe tener EXACTAMENTE esta estructura:**

```
features/<nombreFeature>/
  services/          ← Lógica de Supabase (funciones puras, async/await)
  hooks/             ← React hooks (useQuery/useMutation)
  components/        ← Componentes específicos del feature
  modals/            ← Modales y formularios
    forms/           ← Formularios separados del modal principal
  constants/         ← Enums, configuraciones, opciones
  types/             ← Tipos TypeScript
  schemas/           ← Validaciones Zod
  mappers/           ← Transformaciones de datos
  utils/             ← Funciones de utilidad puras
  tests/             ← Tests (puede estar vacía)
  index.ts           ← Barrel export
```

### 📘 Ejemplo real: `features/sitelog/`

```
features/sitelog/
  services/
    getSiteLogs.ts                 ← Función pura async que consulta Supabase
    getTimelineData.ts             ← Función pura async
    getActivityData.ts             ← Función pura async
    uploadSiteLogFiles.ts          ← Función pura async
  hooks/
    use-site-logs.ts               ← Hook que usa useQuery + getSiteLogs
    use-sitelog-timeline.ts        ← Hook que usa useQuery + getTimelineData
    use-sitelog-activity.ts        ← Hook que usa useQuery + getActivityData
  components/
    LogEntryCard.tsx               ← Componente de tarjeta
    LogTimeline.tsx                ← Componente de timeline
    DateSeparator.tsx              ← Componente separador
  modals/
    SiteLogModal.tsx               ← Modal principal
    SiteLogModalView.tsx           ← Modal de solo vista
    forms/
      MediaForm.tsx                ← Formulario de multimedia
      PersonnelForm.tsx            ← Formulario de personal
  constants/
    index.ts                       ← ENTRY_TYPES, WEATHER_TYPES, etc.
  types/
    index.ts                       ← SiteLog, SiteLogFileInput, etc.
  schemas/
    index.ts                       ← siteLogSchema (Zod)
  mappers/
    siteLogMapper.ts               ← Transforma datos de Supabase
    timelineMapper.ts              ← Mapea a formato timeline
  utils/                           ← (vacía en este caso)
  tests/                           ← Tests futuros (.gitkeep)
  index.ts                         ← Exporta todo para importar desde fuera
```

---

## 🔧 4. SERVICES (CRÍTICO)

### 📌 ¿Qué van en `services/`?

**TODA la lógica de comunicación con Supabase.**

### ✅ Reglas:
- Son **funciones puras async/await**
- NO usan hooks de React (`useState`, `useEffect`, `useQuery`, etc.)
- Solo importan: `supabase`, `date-fns`, tipos
- Reciben parámetros y retornan datos
- Manejan errores con `try/catch` o lanzando excepciones

### ❌ Prohibido en services:
- Hooks de React
- Lógica de UI
- Estados locales

### 📘 Ejemplo de service correcto:

```typescript
// features/sitelog/services/getSiteLogs.ts
import { supabase } from '@/lib/supabase';
import type { SiteLog } from '../types';

export async function getSiteLogs(
  projectId: string, 
  organizationId: string
): Promise<SiteLog[]> {
  const { data, error } = await supabase
    .from('site_logs')
    .select('*')
    .eq('project_id', projectId)
    .eq('organization_id', organizationId);

  if (error) throw error;
  return data || [];
}
```

**NO hacer esto:**

```typescript
// ❌ INCORRECTO - Hook dentro de service
export function getSiteLogs() {
  const [data, setData] = useState([]); // ❌ NO
  useEffect(() => { ... }); // ❌ NO
}
```

---

## 📦 5. HOOKS (REACT QUERY)

### 📌 ¿Qué van en `hooks/`?

**Hooks de React que usan React Query para llamar a services.**

### ✅ Reglas:
- Usan `useQuery`, `useMutation`, `useQueryClient`
- Llaman a **services** para obtener datos
- NO tienen lógica de Supabase directa
- Manejan loading, error, y estados de React

### 📘 Ejemplo de hook correcto:

```typescript
// features/sitelog/hooks/use-site-logs.ts
import { useQuery } from '@tanstack/react-query';
import { getSiteLogs } from '../services/getSiteLogs';

export function useSiteLogs(projectId: string | undefined, organizationId: string | undefined) {
  return useQuery({
    queryKey: ['site-logs', projectId, organizationId],
    queryFn: () => getSiteLogs(projectId!, organizationId!),
    enabled: !!projectId && !!organizationId
  });
}
```

**NO hacer esto:**

```typescript
// ❌ INCORRECTO - Query de Supabase dentro del hook
export function useSiteLogs(projectId: string) {
  return useQuery({
    queryKey: ['site-logs', projectId],
    queryFn: async () => {
      const { data } = await supabase.from('site_logs').select('*'); // ❌ NO
      return data;
    }
  });
}
```

**Regla de oro:** Si ves `supabase.from()` dentro de un hook, **está MAL**. Debe estar en un service.

---

## 🗺️ 6. MAPPERS (TRANSFORMACIONES)

### 📌 ¿Qué van en `mappers/`?

**Funciones puras que transforman datos entre formatos.**

### ✅ Usos comunes:
- Transformar data de Supabase a tipos del frontend
- Combinar datos de múltiples tablas
- Formatear fechas, números, textos
- Agregar campos calculados

### 📘 Ejemplo:

```typescript
// features/sitelog/mappers/siteLogMapper.ts
import type { SiteLog } from '../types';

export function mapSiteLogFromSupabase(rawData: any): SiteLog {
  return {
    id: rawData.id,
    log_date: rawData.log_date,
    entry_type_id: rawData.entry_type_id,
    severity: rawData.severity,
    status: rawData.status || 'pending',
    comments: rawData.comments || '',
    created_by: rawData.created_by,
    created_at: rawData.created_at,
    organization_id: rawData.organization_id,
    project_id: rawData.project_id
  };
}
```

---

## 📄 7. PAGES (PÁGINAS)

### 📌 ¿Qué van en `pages/`?

**Páginas finales que el usuario ve. Cada "pantalla" de la app.**

### ✅ Reglas:
- Van en `src/pages/<nombrePagina>/` o `src/pages/<feature>/`
- Solo importan **features**, nunca lógica directa
- Pueden tener tabs/sub-páginas en la misma carpeta
- Son componentes "tontos" que orquestan features

### 📘 Ejemplo:

```
pages/
  sitelog/
    Sitelog.tsx              ← Página principal
    SitelogEntriesTab.tsx    ← Tab de entradas
    SitelogChartsTab.tsx     ← Tab de gráficos
  dashboard/
    Dashboard.tsx
  projects/
    Projects.tsx
```

### 📘 Código de página correcto:

```typescript
// pages/sitelog/Sitelog.tsx
import { useSiteLogs } from '@/features/sitelog/hooks/use-site-logs';
import { LogTimeline } from '@/features/sitelog/components/LogTimeline';

export default function Sitelog() {
  const { data: siteLogs, isLoading } = useSiteLogs(projectId, orgId);
  
  if (isLoading) return <Loading />;
  
  return <LogTimeline logs={siteLogs} />;
}
```

**NO hacer esto:**

```typescript
// ❌ INCORRECTO - Lógica de negocio en página
export default function Sitelog() {
  const { data } = await supabase.from('site_logs').select('*'); // ❌ NO
  const processed = data.map(x => ...); // ❌ NO, usar mapper
}
```

---

## 🧩 8. COMPONENTS

### 📌 Componentes globales → `src/components/`

Componentes reutilizables en TODA la app:

```
components/
  ui/               ← Shadcn UI
  layout/
    Sidebar.tsx
    Header.tsx
  modal/
    FormModalLayout.tsx
  table/
    Table.tsx
```

### 📌 Componentes específicos → `features/<feature>/components/`

Componentes que solo usa ESE feature:

```
features/sitelog/components/
  LogEntryCard.tsx   ← Solo para sitelog
  LogTimeline.tsx    ← Solo para sitelog
```

---

## 🗂️ 9. TYPES, SCHEMAS, CONSTANTS

### ✅ Siempre dentro del feature:

```
features/<feature>/types/index.ts       ← Tipos TypeScript
features/<feature>/schemas/index.ts     ← Validaciones Zod
features/<feature>/constants/index.ts   ← Configuraciones, enums
```

### 📘 Ejemplo de constants:

```typescript
// features/sitelog/constants/index.ts
export const ENTRY_TYPES = {
  avance_de_obra: { icon: TrendingUp, label: "Avance de obra" },
  visita_tecnica: { icon: Users, label: "Visita técnica" }
} as const;
```

### 📘 Ejemplo de schemas:

```typescript
// features/sitelog/schemas/index.ts
import { z } from 'zod';

export const siteLogSchema = z.object({
  log_date: z.string().min(1, "La fecha es requerida"),
  severity: z.enum(['low', 'medium', 'high', 'critical'])
});

export type SiteLogFormData = z.infer<typeof siteLogSchema>;
```

---

## 📜 10. MODALS

### 📌 Estructura de modales:

```
features/<feature>/modals/
  <FeatureModal>.tsx         ← Modal principal
  <FeatureModalView>.tsx     ← Modal de solo vista (opcional)
  forms/
    <SubForm1>.tsx           ← Formulario específico
    <SubForm2>.tsx
```

### 📘 Ejemplo:

```
features/sitelog/modals/
  SiteLogModal.tsx           ← Modal de crear/editar
  SiteLogModalView.tsx       ← Modal de vista
  forms/
    MediaForm.tsx            ← Sub-formulario de multimedia
    PersonnelForm.tsx        ← Sub-formulario de personal
```

---

## 🧪 11. TESTS

### ✅ Regla:

**Siempre crear carpeta `tests/` aunque esté vacía.**

```
features/<feature>/tests/
  .gitkeep  ← Mantiene la carpeta en Git
```

Esto facilita agregar tests en el futuro sin cambiar estructura.

---

## 📘 12. INDEX.TS (BARREL EXPORT)

Cada feature debe exportar todo desde `index.ts`:

```typescript
// features/sitelog/index.ts

// Services
export * from './services/getSiteLogs';
export * from './services/getTimelineData';

// Hooks
export * from './hooks/use-site-logs';
export * from './hooks/use-sitelog-timeline';

// Components
export * from './components/LogTimeline';

// Modals
export * from './modals/SiteLogModal';

// Types, Constants, Schemas
export * from './types';
export * from './constants';
export * from './schemas';
```

**Uso desde fuera:**

```typescript
import { useSiteLogs, LogTimeline, ENTRY_TYPES } from '@/features/sitelog';
```

---

## ✅ 13. CHECKLIST DE ARQUITECTURA

**Antes de dar por terminado un feature, verificar:**

- [ ] ¿Carpeta `services/` existe con funciones puras async?
- [ ] ¿Carpeta `hooks/` existe y los hooks solo llaman services?
- [ ] ¿Carpeta `mappers/` existe si hay transformaciones de datos?
- [ ] ¿Carpeta `types/` tiene todos los tipos centralizados?
- [ ] ¿Carpeta `schemas/` tiene validaciones Zod?
- [ ] ¿Carpeta `constants/` tiene enums y configuraciones?
- [ ] ¿Carpeta `components/` tiene componentes específicos?
- [ ] ¿Carpeta `modals/` y `modals/forms/` si hay formularios?
- [ ] ¿Carpeta `tests/` existe (aunque esté vacía)?
- [ ] ¿`index.ts` exporta todo lo necesario?
- [ ] ¿NO hay queries de Supabase dentro de hooks?
- [ ] ¿NO hay lógica de negocio en páginas?
- [ ] ¿NO hay carpetas `/api`?

---

## 🚫 14. LO QUE NUNCA DEBES HACER

### ❌ NO crear carpetas `/api`
### ❌ NO poner lógica de Supabase en hooks
### ❌ NO poner lógica de negocio en páginas
### ❌ NO crear endpoints tipo Next.js
### ❌ NO modificar Express sin pedirlo
### ❌ NO usar hooks de React en services
### ❌ NO duplicar tipos/constantes en múltiples archivos

---

## 💬 MENSAJE FINAL PARA REPLIT

**Antes de hacer cualquier acción, confirma que cumples EXACTAMENTE con esta arquitectura.**

1. ¿Vas a crear/modificar un feature? → Sigue la estructura completa
2. ¿Necesitas datos de Supabase? → Crea un service
3. ¿Necesitas usar React Query? → Crea un hook que llame al service
4. ¿Necesitas transformar datos? → Crea un mapper
5. ¿Necesitas constantes? → Centralízalas en `constants/`
6. ¿Necesitas tipos? → Centralízalos en `types/`

**No modifiques Express. No crees `/api`. Coloca cada archivo en su feature correspondiente.**

---

## 📚 RESUMEN VISUAL

```
┌─────────────────────────────────────────────────┐
│  SEPARACIÓN DE RESPONSABILIDADES               │
├─────────────────────────────────────────────────┤
│  services/     → Supabase queries (async)      │
│  hooks/        → React Query (useQuery)        │
│  mappers/      → Transformaciones puras        │
│  components/   → UI sin lógica de negocio      │
│  modals/       → Formularios y validaciones    │
│  types/        → TypeScript definitions        │
│  schemas/      → Zod validations               │
│  constants/    → Configuraciones               │
│  utils/        → Funciones puras auxiliares    │
│  tests/        → Tests (vacía ok)              │
└─────────────────────────────────────────────────┘
```

---

**✨ Con esta arquitectura, cada feature es:**
- **Testeable** - Cada parte se puede probar independientemente
- **Mantenible** - Fácil encontrar y modificar código
- **Escalable** - Agregar features nuevos es simple
- **Predecible** - Siempre sabes dónde va cada cosa
- **Reutilizable** - Components, hooks y services se pueden compartir

**🎯 Objetivo: Código limpio, organizado y profesional.**
