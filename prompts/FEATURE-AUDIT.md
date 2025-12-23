# FEATURE AUDIT - Prompt Oficial de Auditoría de Seencel

> Este es el **ÚNICO archivo de referencia** para auditorías 360° de features de Seencel.
> Consolida arquitectura, páginas, modales, drawers, uploads, refactorización, y más.

---

## TABLA DE CONTENIDOS

1. [Objetivo](#objetivo)
2. [Cómo Usar Este Prompt](#cómo-usar-este-prompt)
3. [Reglas de Seguridad](#reglas-de-seguridad-crítico)
4. [Contexto Técnico](#contexto-técnico-asumido)
5. [Auditoría Completa](#auditoría-completa-no-saltear-nada)
   - 5.1 [Mapa del Feature](#1-mapa-del-feature)
   - 5.2 [Arquitectura de Features](#2-auditoría-de-arquitectura-de-features)
   - 5.3 [Ubicación y Duplicados](#3-auditoría-de-ubicación-de-archivos-y-duplicados-crítico)
   - 5.4 [Páginas (3 Capas)](#4-auditoría-de-páginas-3-capas)
   - 5.5 [Formularios (Forms)](#5-auditoría-de-formularios-forms)
   - 5.6 [Modales](#6-auditoría-de-modales)
   - 5.7 [Drawers](#7-auditoría-de-drawers)
   - 5.8 [Uploads/Storage](#8-auditoría-de-uploadsstorage)
   - 5.9 [Delete/Replace Pattern](#9-auditoría-de-deletereplace-pattern)
   - 5.10 [Base de Datos](#10-auditoría-de-base-de-datos-supabase)
   - 5.11 [Frontend](#11-auditoría-de-frontend)
   - 5.12 [Calidad/Robustez](#12-auditoría-de-calidad--robustez)
   - 5.13 [Refactorización (Tablas, Badges, Headers)](#13-auditoría-de-refactorización-tablas-badges-headers)
6. [Entregables Obligatorios](#entregables-obligatorios)
7. [Condición Final](#condición-final-cerrado)
8. [Reglas para Prompts Externos](#reglas-para-prompts-externos-gpt-otras-ias)

---

## OBJETIVO

Auditar y dejar **"cerrado"** un feature específico de Seencel, asegurando:
- Cero errores en consola ni runtime
- Arquitectura consistente con los estándares actuales
- Performance optimizada
- Seguridad completa (RLS)
- UI/UX consistente
- Documentación actualizada

**NO quiero refactor masivo ni reescritura general: solo lo necesario para que este feature quede 100% sólido.**

---

## CÓMO USAR ESTE PROMPT

Cuando pidas auditar un feature, usa este formato:

```
Audita el feature: {NOMBRE_DEL_FEATURE}

Rutas del feature:
- Carpeta principal: src/features/{feature}/
- Páginas: src/pages/{feature}/
- Hooks relacionados: src/features/{feature}/hooks/
- Stores relacionados: src/stores/{feature}Store.ts

Tablas de Supabase:
- Tablas principales: {lista}
- Views: {lista si existen}
```

---

## REGLAS DE SEGURIDAD (CRÍTICO)

1. **No romper compatibilidad**: Cualquier cambio debe ser incremental y verificable
2. **Antes de modificar**: Entregar AUDIT REPORT completo
3. **Después del report**: Entregar PLAN DE EJECUCIÓN por pasos + checklist
4. **Riesgo de producción**: Proponer alternativa segura (feature flag / fallback / migración gradual)
5. **Si falta algo en DB**: Marcar "FALTA" y pedir confirmación o proponer migración explícita
6. **SQL**: El agente NO puede ejecutar SQL directamente - proporcionar SQL para que el usuario ejecute en Supabase

---

## CONTEXTO TÉCNICO (ASUMIDO)

### Stack
- **Frontend**: React + Vite + Tailwind + shadcn/ui + Zustand + TanStack Query + Wouter
- **Backend**: Express.js (NO serverless, NO /api/)
- **Base de datos**: Supabase (Postgres + Views + RLS + Functions/Triggers + Storage)

### Arquitectura Base del Front

```
src/
  features/          ← Módulos de negocio
  pages/             ← Páginas finales que ve el usuario
  components/        ← Componentes globales reutilizables
  hooks/             ← Hooks globales reutilizables (solo compartidos entre 3+ features)
  stores/            ← Zustand stores globales
  lib/               ← Librerías y configuraciones (supabase, queryClient, etc.)
  styles/            ← Estilos globales
  App.tsx            ← Router principal
  main.tsx           ← Entry point
```

---

## AUDITORÍA COMPLETA (NO SALTEAR NADA)

### 1. MAPA DEL FEATURE

**Objetivo:** Entender el flujo completo del feature.

**Tareas:**
- [ ] Dibujar el flujo de datos: UI → hooks → services → queries → views/tables → RLS
- [ ] Listar todas las rutas/archivos involucrados
- [ ] Listar endpoints / queries principales y sus responsabilidades
- [ ] Identificar dependencias entre archivos

**Output esperado:**
```
📂 Estructura del Feature
├── src/features/{feature}/
│   ├── services/        ← Funciones puras async de Supabase
│   ├── hooks/           ← React hooks con useQuery/useMutation
│   ├── forms/           ← FormFields agnósticos (REUTILIZABLES en modales, drawers, páginas)
│   │   └── FeatureFormFields.tsx
│   ├── components/      ← Componentes específicos del feature
│   │   ├── FeatureDetailContent.tsx  (si aplica, contenido agnóstico para drawers)
│   │   └── ...
│   ├── modals/          ← Modales (contenedores ENVASE para DashboardLayout)
│   │   ├── FeatureModal.tsx
│   │   └── ...
│   ├── drawers/         ← Drawers (contenedores ENVASE para LabLayout, OPCIONAL)
│   │   ├── FeatureDetailDrawer.tsx
│   │   └── ...
│   ├── views/           ← Views agnósticas al layout (si aplica)
│   ├── constants/       ← Enums, configuraciones
│   ├── types/           ← Tipos TypeScript
│   ├── schemas/         ← Validaciones Zod
│   ├── mappers/         ← Transformaciones de datos
│   ├── utils/           ← Funciones de utilidad puras
│   ├── tests/           ← Tests (.gitkeep si vacía)
│   └── index.ts         ← Barrel exports
├── src/pages/{feature}/ ← Páginas (orquestadores)
└── prompts/tables/{feature}.md ← Documentación de tablas
```

**IMPORTANTE:** `forms/` es SEPARADO y AGNÓSTICO. Tanto MODALS como DRAWERS pueden usar el mismo FORM.

---

### 2. AUDITORÍA DE ARQUITECTURA DE FEATURES

**Checklist de estructura:**
- [ ] ¿Carpeta `services/` existe con funciones puras async?
- [ ] ¿Carpeta `hooks/` existe y los hooks solo llaman a services?
- [ ] ¿Carpeta `forms/` existe si hay formularios? (SEPARADA de modals/drawers)
- [ ] ¿Carpeta `types/` tiene todos los tipos centralizados?
- [ ] ¿Carpeta `schemas/` tiene validaciones Zod?
- [ ] ¿Carpeta `constants/` tiene enums y configuraciones?
- [ ] ¿Carpeta `components/` tiene componentes específicos del feature?
- [ ] ¿Carpeta `modals/` existe si hay modales? (contenedores ENVASE)
- [ ] ¿Carpeta `drawers/` existe si hay drawers? (contenedores ENVASE, OPCIONAL)
- [ ] ¿Carpeta `mappers/` existe si hay transformaciones de datos?
- [ ] ¿`index.ts` exporta todo lo necesario?

**Checklist de calidad:**
- [ ] ¿Todos los services tienen JSDoc completo? (`@param`, `@returns`, `@throws`)
- [ ] ¿Los services filtran por `organization_id` cuando aplica?
- [ ] ¿Error handling es consistente? (throw en queries principales, console.error en secundarias)
- [ ] ¿NO hay queries de Supabase dentro de hooks?
- [ ] ¿NO hay lógica de negocio en páginas?

**Prohibiciones (verificar que NO existan):**
- [ ] ¿NO hay carpetas `/api`?
- [ ] ¿NO hay hooks de React en services?
- [ ] ¿NO hay tipos/constantes duplicados?

#### Services (Crítico)

**¿Qué van en `services/`?** TODA la lógica de comunicación con Supabase.

**Reglas:**
- Son **funciones puras async/await**
- NO usan hooks de React (`useState`, `useEffect`, `useQuery`, etc.)
- Solo importan: `supabase`, `date-fns`, tipos
- Reciben parámetros y retornan datos
- Manejan errores con `try/catch` o lanzando excepciones

**Ejemplo de service correcto:**
```typescript
// features/sitelog/services/getSiteLogs.ts
import { supabase } from '@/lib/supabase';
import type { SiteLog } from '../types';

/**
 * Obtiene todas las bitácoras de un proyecto.
 * @param projectId - ID del proyecto
 * @param organizationId - ID de la organización
 * @returns Array de site logs o array vacío
 * @throws {Error} Si falla la query principal
 */
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

**Error Handling en Services:**
1. **Queries principales (datos críticos)** → `throw error`
2. **Queries de relaciones (datos secundarios)** → `console.error()` y continuar
3. **Datos faltantes** → retornar arrays vacíos `[]`

#### Hooks (React Query)

**¿Qué van en `hooks/`?** Hooks de React que usan React Query para llamar a services.

**Reglas:**
- Usan `useQuery`, `useMutation`, `useQueryClient`
- Llaman a **services** para obtener datos
- NO tienen lógica de Supabase directa
- Manejan loading, error, y estados de React

**Ejemplo de hook correcto:**
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

**Regla de oro:** Si ves `supabase.from()` dentro de un hook, **está MAL**. Debe estar en un service.

---

### 3. AUDITORÍA DE UBICACIÓN DE ARCHIVOS Y DUPLICADOS (CRÍTICO)

**Objetivo:** Asegurar que TODOS los archivos estén en su lugar correcto y NO existan duplicados.

#### 3.1 Archivos que NO pertenecen al feature

**Problema común:** Encontrar carpetas/archivos de OTROS features dentro del feature auditado.

**Checklist:**
- [ ] ¿TODOS los archivos en `components/` son específicos de ESTE feature?
- [ ] ¿NO hay subcarpetas que pertenezcan a otros features?
- [ ] ¿NO hay archivos "huérfanos" que deberían estar en otro lugar?

**Acción para archivos fuera de lugar:**
1. Si el feature destino YA EXISTE → Mover al feature correcto
2. Si el feature destino NO EXISTE → Mover a `src/features/legacy/`

#### 3.2 Hooks duplicados entre feature y carpetas globales

**Verificar cruzado obligatorio:**

| Archivo en Feature | Verificar que NO exista en |
|--------------------|---------------------------|
| `src/features/{feature}/hooks/useX.ts` | `src/hooks/useX.ts` |

**Checklist:**
- [ ] ¿Listar TODOS los hooks en `src/features/{feature}/hooks/`?
- [ ] ¿Para CADA hook, verificar que NO existe duplicado en `src/hooks/`?
- [ ] ¿Los imports en todo el proyecto apuntan al hook del feature (no al global)?

#### 3.3 Services duplicados

**Verificar:**
- [ ] ¿Listar TODOS los services en `src/features/{feature}/services/`?
- [ ] ¿Para CADA service, verificar que NO existe duplicado en `src/services/`?

#### 3.4 Types duplicados

**Regla:**
- `src/types/` → SOLO types usados por 3+ features (ej: `User`, `Organization`)
- `src/features/{feature}/types/` → Types específicos del feature

#### 3.5 Stores duplicados

**Verificar:**
- [ ] ¿El store del feature está en `src/stores/{feature}Store.ts`?
- [ ] ¿NO hay un store duplicado en `src/features/{feature}/stores/`?

---

### 4. AUDITORÍA DE PÁGINAS (3 CAPAS)

**Arquitectura esperada:**
```
PAGE (Orquestador)     → Elige layout, maneja tabs, renderiza views
    ↓
LAYOUT (Estructura)    → DashboardLayout o LabLayout (ya existe)
    ↓
VIEW (Contenido)       → Tablas, KPIs, gráficos, formularios
```

**Checklist de PAGE (Orquestador):**
- [ ] ¿La página solo orquesta (no contiene lógica de negocio)?
- [ ] ¿Usa Layout con `headerProps` correctamente?
- [ ] ¿Los botones de acción están en `headerProps.actions` (no en el contenido)?
- [ ] ¿Soporta tanto DashboardLayout como LabLayout?
- [ ] ¿Usa `renderView()` function pattern para tabs?
- [ ] ¿Para LabLayout, los botones van en `toolbarProps.secondaryRightSlot`?

**Checklist de VIEW (Contenido):**
- [ ] ¿Las Views están en `src/features/{feature}/views/`?
- [ ] ¿Cada View es independiente y agnóstica al layout?
- [ ] ¿Las Views hacen su propio fetch de datos?
- [ ] ¿Las Views NO importan layouts?
- [ ] ¿Las Views NO manejan tabs (eso lo hace el Page)?

**Checklist de UI/UX:**
- [ ] ¿Usa `Layout` de `@/layouts/dashboard/DashboardLayout`?
- [ ] ¿Usa `Tabs` de `@/components/ui-custom/Tabs` para filtros?
- [ ] ¿Usa `LoadingSpinner` (no texto "Cargando...")?
- [ ] ¿Los empty states tienen `actionButton` si el header tiene botón crear?
- [ ] ¿Tiene `data-testid` en elementos interactivos?

---

### 5. AUDITORÍA DE FORMULARIOS (FORMS)

**IMPORTANTE:** FORMS es AGNÓSTICO y REUTILIZABLE. Puede usarse tanto en MODALES (DashboardLayout) como en DRAWERS (LabLayout).

**Arquitectura esperada:**
```
forms/
├── FeatureFormFields.tsx    → Campos del formulario (CEREBRO, agnóstico)
```

**Checklist de FormFields:**
- [ ] ¿Archivo está en `src/features/{feature}/forms/` (NO en modals/)?
- [ ] ¿Contiene `react-hook-form` con `zodResolver`?
- [ ] ¿Contiene todos los hooks de datos (`useQuery`, `useMutation`)?
- [ ] ¿Acepta props `hideActions` y `formRef` para control externo?
- [ ] ¿NO importa componentes de modal O drawer (`ModalLayout`, `DrawerLayout`, etc.)?
- [ ] ¿Usa `ref={formRef}` en el `<form>`?
- [ ] ¿Condiciona botones con `{!hideActions && ...}`?
- [ ] ¿El archivo es AGNÓSTICO y puede reutilizarse en múltiples contextos?

**Interface de Props estándar:**
```typescript
export interface FeatureFormFieldsProps {
  // IDs de contexto
  projectId?: string;
  organizationId?: string;
  itemId?: string;

  // Modo de operación
  mode: 'create' | 'edit' | 'view';

  // Callbacks
  onSuccess: () => void;
  onCancel: () => void;

  // Control externo (para uso en modales/drawers con footer propio)
  hideActions?: boolean;  // Default: false - oculta botones internos
  formRef?: React.RefObject<HTMLFormElement>;  // Para submit externo
}
```

---

### 6. AUDITORÍA DE MODALES

**Arquitectura esperada:**
```
modals/
├── FeatureModal.tsx         → Contenedor del modal (ENVASE)
                               Usa el FORM de src/features/{feature}/forms/
```

**Estructura del Modal:**
```
┌─────────────────────────────────┐
│  HEADER (fijo)                  │  ← ModalHeader via headerContent prop
├─────────────────────────────────┤
│                                 │
│  BODY (scrollable)              │  ← ModalBody como children
│                                 │
├─────────────────────────────────┤
│  FOOTER (fijo)                  │  ← ModalFooter via footerContent prop
└─────────────────────────────────┘
```

**Checklist de Modal (Envase):**
- [ ] ¿Archivo está en `src/features/{feature}/modals/`?
- [ ] ¿Envuelve el FormFields del feature (CEREBRO)?
- [ ] ¿Usa `headerContent` prop para ModalHeader?
- [ ] ¿Usa `footerContent` prop para ModalFooter (footer fijo)?
- [ ] ¿ModalBody va como children de ModalLayout?
- [ ] ¿Pasa `hideActions={true}` al FormFields?
- [ ] ¿Usa `formRef.current.requestSubmit()` para submit?

**Checklist de registro:**
- [ ] ¿Registrado en `registerModals.ts`?
- [ ] ¿Exportado en `index.ts` del feature?

**Tamaños de Modal:**
| Size | Ancho |
|------|-------|
| `sm` | 400px |
| `md` | 550px |
| `lg` | 750px (default) |
| `xl` | 1000px |
| `full` | 100% |

---

### 7. AUDITORÍA DE DRAWERS

**Arquitectura esperada:**
```
drawers/                            (OPCIONAL: solo si hay drawers específicos)
├── FeatureDetailDrawer.tsx         → Contenedor del drawer (ENVASE)
                                      Usa el FORM de src/features/{feature}/forms/

O también en components/:
├── FeatureDetailContent.tsx        → Contenido agnóstico (puede ser FORM + otras cosas)
├── FeatureDetailDrawer.tsx         → Contenedor del drawer (ENVASE)
```

**Estructura del Drawer:**
```
┌─────────────────────────────────┐
│  HEADER (fijo)                  │  ← DrawerHeader via headerContent prop
├─────────────────────────────────┤
│                                 │
│  BODY (scrollable)              │  ← DrawerBody como children
│                                 │
├─────────────────────────────────┤
│  FOOTER (fijo, opcional)        │  ← DrawerFooter via footerContent prop
└─────────────────────────────────┘
```

**Checklist del Drawer (Envase):**
- [ ] ¿Archivo está en `src/features/{feature}/drawers/` o `components/`?
- [ ] ¿Envuelve el FormFields del feature (CEREBRO)?
- [ ] ¿Usa `headerContent` prop para DrawerHeader?
- [ ] ¿DrawerBody va como children de DrawerLayout?
- [ ] ¿Usa `DrawerSection` para organizar contenido?
- [ ] ¿Content acepta `hideActions` opcional?
- [ ] ¿Content NO importa `DrawerLayout`?
- [ ] ¿Pasa `hideActions={true}` al FormFields?

**Tamaños de Drawer:**
| Size | Ancho |
|------|-------|
| `sm` | 400px |
| `md` | 500px |
| `lg` | 600px (default) |
| `xl` | 800px |
| `full` | 100% |

---

### 8. AUDITORÍA DE UPLOADS/STORAGE

**Arquitectura 3-Buckets:**

| Bucket | Visibilidad | Propósito |
|--------|------------|-----------|
| **public-assets** | Público | Marketplace, branding, UI assets, avatares públicos |
| **private-assets** | Privado | Documentos financieros, contratos, datos sensibles (org-scoped RLS) |
| **social-assets** | Híbrido | Galerías de proyecto, fotos de bitácora (project-scoped RLS) |

**Si el feature usa archivos/imágenes:**
- [ ] ¿Usa `uploadFile()` de `@/lib/storage`?
- [ ] ¿Usa entity types definidos (no hardcodea bucket names)?
- [ ] ¿Incluye `link_to` para media_links automáticos?
- [ ] ¿Usa `created_by_member_id` (NO user.id)?
- [ ] ¿Las categorías están en el constraint de PostgreSQL?

**Presets de Compresión:**
| Preset | Max Width | Quality | Use Case |
|--------|-----------|---------|----------|
| `avatar` | 512px | 90% | Avatares |
| `course-cover` | 1920px | 90% | Covers de cursos |
| `project-cover` | 1920px | 85% | Covers de proyectos |
| `sitelog-photo` | 1280px | 80% | Fotos de bitácora |
| `document` | 2048px | 85% | Documentos escaneados |
| `default` | 1600px | 85% | Genérico |

---

### 9. AUDITORÍA DE DELETE/REPLACE PATTERN

**Arquitectura de 3 capas:**

1. **MODAL (UI PURA):** `src/components/forms/DeleteConfirmationForm.tsx`
   - Renderiza advertencias y consecuencias
   - Muestra ComboBox si `mode === 'replace'`
   - Llama callbacks (`onDelete`, `onReplace`)
   - NO ejecuta mutaciones

2. **FEATURE MUTATIONS (Lógica de DB):**
   - `src/features/<feature>/services/deleteEntity.ts`
   - `src/features/<feature>/services/replaceEntity.ts`
   - `src/features/<feature>/hooks/use-delete-entity.ts`
   - `src/features/<feature>/hooks/use-replace-entity.ts`

3. **PAGE/COMPONENT (Orquestación):**
   - Arma `consequences`, `mode`, `replacementOptions`
   - Llama `openModal('delete-confirmation', {...})`

**Checklist:**
- [ ] ¿Existe `deleteEntity` service?
- [ ] ¿Existe `replaceEntity` service (si tiene relaciones)?
- [ ] ¿Los hooks reciben `organizationId` como parámetro?
- [ ] ¿Los hooks invalidan AMBAS queries (entidad + relacionados)?
- [ ] ¿El modal usa `DeleteConfirmationForm`?
- [ ] ¿Se pasa `mode`, `consequences`, `replacementOptions` correctamente?

**Cache Invalidation (CRÍTICO):**
```typescript
// ✅ CORRECTO - organizationId en ambos hooks
const organizationId = userData?.organization?.id || null
const deleteItem = useDeleteItem(organizationId)
const replaceItem = useReplaceItem(organizationId)

// Dentro del hook, invalidar con organizationId:
queryClient.invalidateQueries({ 
  queryKey: ['items', 'list', organizationId]  // ✅ CON ORG
})
```

---

### 10. AUDITORÍA DE BASE DE DATOS (Supabase)

**Checklist de tablas:**
- [ ] ¿Tipos de columnas correctos?
- [ ] ¿Relaciones (FK) definidas?
- [ ] ¿Índices en columnas frecuentemente filtradas?
- [ ] ¿Constraints (NOT NULL, CHECK, UNIQUE) donde aplica?
- [ ] ¿Soft delete (`is_deleted`, `deleted_at`) si aplica?
- [ ] ¿Nombres de columnas consistentes con frontend?

**Checklist de Views:**
- [ ] ¿Existen Views para lecturas consolidadas (evitar joins en frontend)?
- [ ] ¿Las Views tienen los campos necesarios?

**Checklist de RLS:**
- [ ] ¿Políticas SELECT / INSERT / UPDATE / DELETE según necesidad?
- [ ] ¿Políticas en español con formato "SUJETO > ACCIÓN > OBJETO > CONDICIÓN"?
- [ ] ¿No hay duplicaciones peligrosas ni huecos de seguridad?
- [ ] ¿Filtrado por `organization_id` donde aplica?

**Output esperado:** "DB Findings" + "DB Fixes" (SQL exacto, separado por migraciones pequeñas)

---

### 11. AUDITORÍA DE FRONTEND

**Checklist de hooks:**
- [ ] ¿No hay duplicados?
- [ ] ¿No hacen joins pesados en frontend (debería ser View)?
- [ ] ¿Manejo de loading/error/empty states consistente?
- [ ] ¿Tipado y validaciones donde aplica?
- [ ] ¿Query keys usando array pattern para invalidación correcta?

**Checklist de performance:**
- [ ] ¿Evita re-fetch innecesario?
- [ ] ¿Cache y staleTime configurados en React Query?
- [ ] ¿Evita renders innecesarios?
- [ ] ¿Usa Views de Supabase para queries complejas?

**Checklist de UI/UX:**
- [ ] ¿Estados vacíos, errores, permisos implementados?
- [ ] ¿Consistencia visual con la app?
- [ ] ¿Usa `var(--accent)` y CSS variables del theme?
- [ ] ¿Indicadores financieros usan `text-chart-positive/negative/neutral`?

---

### 12. AUDITORÍA DE CALIDAD / ROBUSTEZ

**Checklist:**
- [ ] ¿Manejo de errores real? (logs, try/catch, mensajes al usuario)
- [ ] ¿Validaciones en frontend Y DB (constraints)?
- [ ] ¿Concurrencia manejada? (updates que pisan datos, optimistic updates)
- [ ] ¿Seguridad? (nunca confiar en frontend para reglas críticas)
- [ ] ¿Autenticación usa `requireUser()` con userId correcto (NO auth.user.id)?

---

### 13. AUDITORÍA DE REFACTORIZACIÓN (Tablas, Badges, Headers)

#### 13.1 Tablas (`Table`)

**Componente a usar:** `src/components/shared/table` según `src/components/shared/table/AUDIT.md`.

**Sistema de Anchos Semánticos:**
| Tipo | Ancho | Uso |
|------|-------|-----|
| `date` | 110px | Fechas simples |
| `datetime` | 150px | Fecha + hora |
| `amount` | 120px | Montos monetarios |
| `status` | 100px | Estados/badges pequeños |
| `wallet` | 140px | Billeteras/cuentas |
| `number` | 80px | Números simples |
| `id` | 100px | Identificadores |
| `actions` | 48px | Columna de acciones |
| `name` | 200px | Nombres de entidades |
| `email` | 200px | Emails |
| `short-text` | 140px | Texto corto (DEFAULT) |
| `medium-text` | 180px | Texto medio |
| `long-text` | FLEXIBLE | Ocupa el ancho restante |
| `badge` | 120px | Badges/etiquetas |
| `avatar` | 48px | Avatares |
| `checkbox` | 40px | Checkboxes |
| `icon` | 40px | Iconos |

**Reglas:**
- [ ] Asignar un tipo semántico a TODAS las columnas
- [ ] Solo UNA columna con `type: 'long-text'` por tabla (absorbe ancho restante)
- [ ] NUNCA dejar columnas sin tipo semántico

#### 13.2 Badges

**Sistema Semántico:** Todas las variantes están en `src/components/ui/badge.tsx`.

| Variante | Icono | Uso |
|----------|-------|-----|
| `success` | ✓ Check | Éxito, completado |
| `error` | ✓ XCircle | Error, fallido |
| `warning` | ✓ AlertTriangle | Advertencia |
| `pending` | ✓ AlertCircle | Pendiente, en espera |
| `info` | ✓ Info | Información |
| `neutral` | ✓ AlertCircle | Neutral, sin categoría |
| `status-active` | ✓ Play | En proceso |
| `status-completed` | ✓ Check | Completado |
| `status-paused` | ✓ Pause | Pausado |
| `status-cancelled` | ✓ X | Cancelado |
| `status-planning` | ✓ Calendar | Planificación |
| `plan-pro` | ✓ Check | Plan Pro |
| `plan-free` | ✓ Check | Plan Free |
| `plan-teams` | ✓ Check | Plan Teams |
| `plan-enterprise` | ✓ Check | Plan Enterprise |

**Reglas:**
- [ ] Usar variantes semánticas (NO colores hardcodeados)
- [ ] NUNCA usar `style={{ backgroundColor, color: 'white' }}`
- [ ] Siempre usar `<Badge variant="success">` y dejar que CSS maneje colores

#### 13.3 Headers de Página

**Reglas:**
- [ ] Header tiene el **mismo ícono** que en sidebar
- [ ] Header tiene `description` en su prop
- [ ] Botones primarios van en `actionButton` prop
- [ ] Múltiples acciones van en `actions` prop (array de JSX)
- [ ] NUNCA hardcodear botones en el contenido del header

#### 13.4 IdentityBadge

Para mostrar entidades con avatar:
```typescript
<IdentityBadge
  name={organization.name}
  avatarUrl={organization.image_url}
  size="sm"
  showName={true}
/>
```

#### 13.5 Checklist de Refactorización

- [ ] Tabla usa `src/components/shared/table`
- [ ] TODAS las columnas tienen un tipo semántico
- [ ] Una columna tiene `type: 'long-text'` para ancho flexible
- [ ] Badges usan variantes semánticas
- [ ] Badges NO tienen colores hardcodeados
- [ ] Header tiene ícono y descripción
- [ ] Entidades con avatar usan `IdentityBadge`

---

## ENTREGABLES OBLIGATORIOS

### ENTREGABLE 1: AUDIT REPORT

```markdown
## AUDIT REPORT: {NOMBRE_DEL_FEATURE}

### Estado General: 🟢 VERDE / 🟡 AMARILLO / 🔴 ROJO

### Checklist de Madurez
| Categoría | Estado | Notas |
|-----------|--------|-------|
| Estructura de Feature | ✅/⚠️/❌ | ... |
| Ubicación y Duplicados | ✅/⚠️/❌ | ... |
| Arquitectura 3 Capas | ✅/⚠️/❌ | ... |
| Formularios (FORMS) | ✅/⚠️/❌ | ... |
| Modales | ✅/⚠️/❌ | ... |
| Drawers | ✅/⚠️/❌ | ... |
| Uploads | ✅/⚠️/❌ | ... |
| Delete/Replace | ✅/⚠️/❌ | ... |
| DB (Tablas/Views) | ✅/⚠️/❌ | ... |
| RLS | ✅/⚠️/❌ | ... |
| Hooks | ✅/⚠️/❌ | ... |
| UI/UX | ✅/⚠️/❌ | ... |
| Performance | ✅/⚠️/❌ | ... |
| Refactorización (Tablas, Badges) | ✅/⚠️/❌ | ... |

### Top 10 Riesgos/Bugs
| # | Severidad | Descripción | Archivo/Línea |
|---|-----------|-------------|---------------|
| 1 | 🔴 Crítica | ... | ... |
```

### ENTREGABLE 2: PLAN DE EJECUCIÓN

```markdown
## PLAN DE EJECUCIÓN: {NOMBRE_DEL_FEATURE}

### Fase 0: Backups y Medidas Anti-Rotura
### Fase 1: Ubicación y Limpieza de Duplicados
### Fase 2: DB (Migraciones Pequeñas)
### Fase 3: Frontend (Refactors Mínimos)
### Fase 4: Performance + Limpieza

### Checklist Final "Definition of Done"
- [ ] No hay errores en consola ni runtime
- [ ] No hay archivos fuera de lugar ni duplicados
- [ ] DB tiene estructura correcta
- [ ] RLS consistente y segura
- [ ] Hooks consistentes, sin duplicados
- [ ] UI completa (loading/error/empty/permisos)
- [ ] Documentación creada
```

### ENTREGABLE 3: CAMBIOS CONCRETOS

```markdown
## CAMBIOS CONCRETOS: {NOMBRE_DEL_FEATURE}

### SQL Propuesto
### Cambios por Archivo
### Decisiones Pendientes
```

---

## CONDICIÓN FINAL ("CERRADO")

El feature se considera **cerrado** cuando:

- [ ] No hay errores en consola ni en runtime
- [ ] **TODOS los archivos están en su ubicación correcta**
- [ ] **NO hay duplicados** en `src/hooks/`, `src/services/`, `src/types/`
- [ ] DB tiene estructura correcta y lecturas por Views cuando corresponde
- [ ] RLS consistente y segura
- [ ] Arquitectura de feature sigue este documento
- [ ] Formularios son agnósticos y están en `forms/`
- [ ] Modales y Drawers son envases que usan los forms
- [ ] Hooks consistentes, sin duplicados y sin lógica redundante
- [ ] UI completa (loading/error/empty/permisos) y consistente
- [ ] Tablas usan tipos semánticos
- [ ] Badges usan variantes semánticas
- [ ] Documentación del feature creada

---

## REGLAS PARA PROMPTS EXTERNOS (GPT, Otras IAs)

Cuando recibas prompts de GPT u otras IAs, ten en cuenta:

1. **Pueden estar desactualizadas**: Verificar que lo que piden no exista ya (incluso con otro nombre) para evitar duplicados
2. **Revisar archivos existentes**: Antes de crear nuevos archivos, verificar si ya existen lógicas similares que se puedan mejorar/optimizar
3. **SQL es para el usuario**: Cuando una IA te dé SQL o pida modificar Supabase, recuerda que el usuario es quien ejecuta eso. Solo tenlo en cuenta como contexto.
4. **Analizar antes de ejecutar**: ANALIZA el prompt → ANALIZA lo existente → PREGUNTA si tienes dudas → EJECUTA

**Objetivos:**
1. No tener archivos ni lógicas duplicadas
2. No romper lo existente, sino MEJORARLO u OPTIMIZARLO
3. Utilizar siempre las carpetas que ya tenemos

---

**Este es el ÚNICO archivo de referencia para auditorías de features en Seencel.**
