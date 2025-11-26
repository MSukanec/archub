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

### 🛡️ Error Handling en Services

**Estrategia consistente para todos los services:**

#### ✅ Regla de error handling:

1. **Queries principales (datos críticos)** → `throw error`
2. **Queries de relaciones (datos secundarios)** → `console.error()` y continuar
3. **Datos faltantes** → retornar arrays vacíos `[]`

#### 📘 Ejemplo completo:

```typescript
/**
 * Obtiene todas las bitácoras con sus relaciones.
 * @param projectId - ID del proyecto
 * @param organizationId - ID de la organización
 * @returns Array de site logs o array vacío
 * @throws {Error} Si falla la query principal
 */
export async function getSiteLogs(projectId: string, organizationId: string) {
  if (!projectId || !organizationId) {
    return []; // Datos faltantes → return []
  }

  // Query principal - THROW si falla
  const { data: siteLogs, error } = await supabase
    .from('site_logs')
    .select('*')
    .eq('project_id', projectId);

  if (error) {
    throw error; // ✅ Lanzar error crítico
  }

  if (!siteLogs || siteLogs.length === 0) {
    return []; // ✅ No hay datos → array vacío
  }

  // Query de relaciones - LOG y continuar
  const { data: events, error: eventsError } = await supabase
    .from('site_log_events')
    .select('*')
    .in('site_log_id', siteLogs.map(log => log.id));

  if (eventsError) {
    console.error('Error fetching site log events:', eventsError); // ✅ Log y continuar
  }

  // Combinar datos
  return siteLogs.map(log => ({
    ...log,
    events: events?.filter(e => e.site_log_id === log.id) || []
  }));
}
```

#### 📋 Beneficios de esta estrategia:

- **Consistencia**: Todos los services siguen el mismo patrón
- **Resiliencia**: La app no se rompe si falla una relación
- **Debugging**: Los errores secundarios se logean para debugging
- **UX**: El usuario ve datos parciales en vez de pantalla en blanco

### 📝 JSDoc en Services

**SIEMPRE agregar JSDoc a cada service:**

```typescript
/**
 * Descripción breve de lo que hace el service.
 * 
 * Detalles adicionales si es necesario:
 * - Qué relaciones trae
 * - Qué transformaciones hace
 * - Casos especiales
 * 
 * @param param1 - Descripción del parámetro
 * @param param2 - Descripción del parámetro
 * @returns Qué retorna la función
 * @throws {Error} Cuándo lanza errores
 */
```

**Beneficio**: Al hacer hover en el IDE, se ve toda la documentación sin leer el código.

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

### ✅ Regla fundamental:

**Siempre crear carpeta `tests/` con al menos 2 tests de ejemplo:**
- 1 test de **service** (función pura, fácil de testear)
- 1 test de **hook** (React Query + mocking)

### 📦 Configuración de Testing

**Framework**: Vitest + @testing-library/react

#### Instalación (ya incluido en el proyecto):

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  },
  "dependencies": {
    "vitest": "^4.0.10",
    "@testing-library/react": "^16.3.0",
    "jsdom": "^27.2.0"
  }
}
```

#### Configuración (vitest.config.ts):

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()] as any,
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});
```

### 📘 Ejemplo 1: Test de Service

```typescript
// features/sitelog/tests/getSiteLogs.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSiteLogs } from '../services/getSiteLogs';
import { supabase } from '@/lib/supabase';

// Mock de Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('getSiteLogs service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return site logs for valid project', async () => {
    const mockSiteLogs = [
      { id: '1', log_date: '2025-11-17', comments: 'Test log' }
    ];
    
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: mockSiteLogs, 
            error: null 
          })
        })
      })
    });
    
    (supabase.from as any) = mockFrom;

    const result = await getSiteLogs('project-123', 'org-456');

    expect(result).toBeDefined();
    expect(mockFrom).toHaveBeenCalledWith('site_logs');
  });

  it('should return empty array when no logs found', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: [], 
            error: null 
          })
        })
      })
    });
    
    (supabase.from as any) = mockFrom;

    const result = await getSiteLogs('project-123', 'org-456');
    expect(result).toEqual([]);
  });

  it('should throw error when Supabase query fails', async () => {
    const mockError = new Error('Database connection failed');
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: null, 
            error: mockError 
          })
        })
      })
    });
    
    (supabase.from as any) = mockFrom;

    await expect(getSiteLogs('project-123', 'org-456'))
      .rejects.toThrow('Database connection failed');
  });
});
```

### 📘 Ejemplo 2: Test de Hook

```typescript
// features/sitelog/tests/use-site-logs.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSiteLogs } from '../hooks/use-site-logs';
import * as getSiteLogsService from '../services/getSiteLogs';

// Mock del service
vi.mock('../services/getSiteLogs', () => ({
  getSiteLogs: vi.fn()
}));

describe('useSiteLogs hook', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false }
    }
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should fetch site logs successfully', async () => {
    const mockLogs = [
      { id: '1', log_date: '2025-11-17', comments: 'Test' }
    ];
    
    vi.spyOn(getSiteLogsService, 'getSiteLogs').mockResolvedValue(mockLogs);

    const { result } = renderHook(
      () => useSiteLogs('project-123', 'org-456'),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockLogs);
  });

  it('should not fetch when projectId is undefined', () => {
    const { result } = renderHook(
      () => useSiteLogs(undefined, 'org-456'),
      { wrapper }
    );

    expect(result.current.isFetching).toBe(false);
  });
});
```

### 🎯 Estructura de tests recomendada:

```
features/<feature>/tests/
  <serviceName>.test.ts       ← Tests de services (async functions)
  <hookName>.test.tsx         ← Tests de hooks (React Query)
  <mapperName>.test.ts        ← Tests de mappers (opcional)
```

### ✅ Cobertura mínima esperada:

Para cada service principal:
- ✅ Test de caso exitoso (happy path)
- ✅ Test de caso sin datos (empty array)
- ✅ Test de caso con error (throw)

Para cada hook principal:
- ✅ Test de fetch exitoso
- ✅ Test con parámetros undefined (enabled: false)

### 🚀 Ejecutar tests:

```bash
npm run test                  # Ejecutar tests una vez
npm run test:ui              # Ejecutar con UI interactivo
npm run test:coverage        # Ejecutar con reporte de cobertura
```

### 💡 Beneficios de testing:

- **Confianza**: Saber que los cambios no rompen nada
- **Documentación**: Los tests son ejemplos vivos de cómo usar el código
- **Refactoring**: Cambiar código sin miedo a romper funcionalidad
- **Debugging**: Encontrar bugs antes de producción

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

### 📦 Estructura de carpetas:
- [ ] ¿Carpeta `services/` existe con funciones puras async?
- [ ] ¿Carpeta `hooks/` existe y los hooks solo llaman services?
- [ ] ¿Carpeta `mappers/` existe si hay transformaciones de datos?
- [ ] ¿Carpeta `types/` tiene todos los tipos centralizados?
- [ ] ¿Carpeta `schemas/` tiene validaciones Zod?
- [ ] ¿Carpeta `constants/` tiene enums y configuraciones?
- [ ] ¿Carpeta `components/` tiene componentes específicos?
- [ ] ¿Carpeta `modals/` y `modals/forms/` si hay formularios?
- [ ] ¿Carpeta `tests/` existe con al menos 2 tests de ejemplo?
- [ ] ¿`index.ts` exporta todo lo necesario?

### 📝 Calidad de código:
- [ ] ¿Todos los services tienen JSDoc completo? (`@param`, `@returns`, `@throws`)
- [ ] ¿Los services filtran por `organization_id` cuando aplica? (seguridad)
- [ ] ¿Error handling es consistente? (throw en queries principales, console.error en secundarias)
- [ ] ¿Los tests ejecutan exitosamente? (al menos 80% pass rate)
- [ ] ¿NO hay queries de Supabase dentro de hooks?
- [ ] ¿NO hay lógica de negocio en páginas?

### 🧪 Testing:
- [ ] ¿Existe al menos 1 test de service? (happy path, empty data, error)
- [ ] ¿Existe al menos 1 test de hook? (fetch exitoso, parámetros undefined)
- [ ] ¿Los mocks están completos y los tests pasan?

### 🚫 Prohibiciones:
- [ ] ¿NO hay carpetas `/api`?
- [ ] ¿NO hay hooks de React en services?
- [ ] ¿NO hay tipos/constantes duplicados?

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

## 📖 15. GUÍAS AUXILIARES ESPECIALIZADAS

Este archivo (`ARCHITECTURE.MD`) es la **BIBLIA GENERAL** de arquitectura del proyecto.

Para tareas específicas, existen **guías auxiliares complementarias**:

### 📋 Crear Modales: `prompts/Modals.md`

**Cuándo consultarla:** Cuando necesites crear un modal (formulario, selección, confirmación)

**Qué incluye:**
- ✅ Patrón completo de modales con React Hook Form + Zod
- ✅ DOS opciones arquitectónicas:
  - **Opción A**: Modales en features/ usando services (PREFERIDO)
  - **Opción B**: Modales globales usando REST endpoints
- ✅ Template copy-paste listo para usar
- ✅ Form Modals vs Selection Modals
- ✅ Componentes de formulario (Input, Textarea, Select, Switch, etc.)
- ✅ Checklist de validación
- ✅ Errores comunes a evitar

**Ejemplo de uso:**
```bash
# Antes de crear un modal, leer:
prompts/Modals.md
```

**Regla de oro:** Los modales dentro de `features/` usan **services**, los modales globales usan **REST endpoints**. NUNCA queries directas de Supabase.

---

### 📄 Crear Páginas: `prompts/Pages.md`

**Cuándo consultarla:** Cuando necesites crear una nueva página o tab

**Qué incluye:**
- ✅ Estructura base de páginas con `Layout` + `headerProps`
- ✅ Páginas con tabs (en header o en contenido)
- ✅ Botones de acción en header (NO en contenido)
- ✅ Empty states con actionButton
- ✅ **Importación desde features** (hooks, components, modals)
- ✅ Ejemplos de referencia (AdminDashboard, AdminAdmin, AdminSupport)
- ✅ Props comunes del header
- ✅ Navegación admin
- ✅ Checklist completo

**Ejemplo de uso:**
```bash
# Antes de crear una página, leer:
prompts/Pages.md
```

**Regla de oro:** Las páginas importan desde `features/`, NUNCA hacen queries directas. Usan `Layout` con `headerProps`, NO `PageLayout` directamente.

---

### 🔄 Flujo de trabajo completo

Cuando necesites crear un feature completo:

1. **Leer `src/ARCHITECTURE.MD`** → Entender estructura general de features
2. **Crear estructura de feature** → Seguir patrón de `features/sitelog/`
3. **Leer `prompts/Modals.md`** → Si necesitas modales para el feature
4. **Leer `prompts/Pages.md`** → Si necesitas páginas que consuman el feature
5. **Verificar checklist** → Antes de dar por terminado

---

### 📚 Relación entre documentos

```
┌─────────────────────────────────────────────────┐
│  src/ARCHITECTURE.MD (GENERAL)                 │
│  ├─ Estructura de features/                    │
│  ├─ Services, Hooks, Mappers                   │
│  ├─ Error Handling, JSDoc, Testing             │
│  └─ Checklist completo                         │
└─────────────────────────────────────────────────┘
                    ↓
        ┌───────────┴───────────┐
        ↓                       ↓
┌───────────────┐      ┌───────────────┐
│ Modals.md     │      │ Pages.md      │
│ (ESPECÍFICO)  │      │ (ESPECÍFICO)  │
├───────────────┤      ├───────────────┤
│ - Formularios │      │ - Layout      │
│ - React Hook  │      │ - HeaderProps │
│   Form        │      │ - Tabs        │
│ - Validación  │      │ - Imports de  │
│ - useMutation │      │   features/   │
└───────────────┘      └───────────────┘
```

---

**💡 Tip:** Mantén estos 3 documentos abiertos mientras desarrollas. ARCHITECTURE.MD es tu guía principal, Modals.md y Pages.md son referencias rápidas para tareas específicas.

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
