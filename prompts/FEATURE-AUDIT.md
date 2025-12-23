# FEATURE AUDIT - Prompt Oficial de Auditoría de Seencel

> Este es el **ÚNICO archivo de referencia** para auditorías 360° de features de Seencel.
> Consolida arquitectura, páginas, modales, drawers, uploads, refactorización, y más.

---

## TABLA DE CONTENIDOS

1. [Objetivo](#objetivo)
2. [Fuera de Alcance](#fuera-de-alcance-de-esta-auditoría)
3. [Cómo Usar Este Prompt](#cómo-usar-este-prompt)
4. [Reglas de Seguridad](#reglas-de-seguridad-crítico)
5. [Regla de STOP (Bloqueo)](#regla-de-stop-bloqueo-de-auditoría)
6. [Contexto Técnico](#contexto-técnico-asumido)
7. [Auditoría Completa](#auditoría-completa-no-saltear-nada)
   - 7.1 [Mapa del Feature](#1-mapa-del-feature)
   - 7.2 [Arquitectura de Features](#2-auditoría-de-arquitectura-de-features)
   - 7.3 [Ubicación y Duplicados](#3-auditoría-de-ubicación-de-archivos-y-duplicados-crítico)
   - 7.4 [Páginas (3 Capas)](#4-auditoría-de-páginas-3-capas)
   - 7.5 [Formularios (Forms)](#5-auditoría-de-formularios-forms)
   - 7.5.1 [Sistema de Guardado (Save Engine)](#51-auditoría-de-sistema-de-guardado-save-engine)
   - 7.6 [Modales](#6-auditoría-de-modales)
   - 7.7 [Drawers](#7-auditoría-de-drawers)
   - 7.8 [Uploads/Storage](#8-auditoría-de-uploadsstorage)
   - 7.9 [Delete/Replace Pattern](#9-auditoría-de-deletereplace-pattern)
   - 7.10 [Base de Datos](#10-auditoría-de-base-de-datos-supabase)
   - 7.11 [Frontend](#11-auditoría-de-frontend)
   - 7.12 [Calidad/Robustez](#12-auditoría-de-calidad--robustez)
   - 7.13 [Refactorización (Tablas, Badges, Headers)](#13-auditoría-de-refactorización-tablas-badges-headers)
   - 7.14 [Quality Gates (Testing)](#14-auditoría-de-quality-gates-testing)
   - 7.15 [Accesibilidad e i18n](#15-auditoría-de-accesibilidad-e-i18n)
   - 7.16 [Production Readiness](#16-auditoría-de-production-readiness)
8. [Entregables Obligatorios](#entregables-obligatorios)
9. [Condición Final](#condición-final-cerrado)
10. [Regla Post-Cierre](#regla-post-cierre-cerrado--no-se-toca)
11. [Guías de Sistemas Específicos](#guías-de-sistemas-específicos)
12. [Reglas para Prompts Externos](#reglas-para-prompts-externos-gpt-otras-ias)

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

## FUERA DE ALCANCE DE ESTA AUDITORÍA

Esta auditoría **NO incluye**:
- ❌ Rediseños visuales no críticos
- ❌ Reescrituras completas de features legacy
- ❌ Migraciones cross-feature
- ❌ Optimización prematura sin impacto medible
- ❌ Cambios estructurales del sistema que excedan el feature auditado
- ❌ Agregar funcionalidades nuevas (solo auditar lo existente)

> **Objetivo:** Evitar scope creep y auditorías infinitas. Si algo requiere cambios sistémicos, se documenta como "FUERA DE ALCANCE" y se propone como proyecto separado.

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

## REGLA DE STOP (BLOQUEO DE AUDITORÍA)

Si durante la auditoría se detecta **cualquiera** de los siguientes casos:

| Bloqueador | Descripción |
|------------|-------------|
| 🚫 **Dependencias circulares** | El feature depende de otro feature que depende de este |
| 🚫 **Tabla base faltante** | No existe la tabla principal del feature en Supabase |
| 🚫 **Inconsistencias graves de RLS** | Políticas a nivel sistema que afectan múltiples features |
| 🚫 **Datos corruptos** | Datos imposibles de validar con seguridad (nulls inesperados, FKs rotas) |
| 🚫 **Arquitectura incompatible** | El feature usa patrones obsoletos que requieren reescritura total |

👉 **La auditoría debe DETENERSE** y marcarse como:

```
ESTADO: 🔴 BLOQUEADO POR PROBLEMA DE SISTEMA
```

**Output requerido en caso de bloqueo:**
1. Descripción clara del bloqueo
2. Qué parte del sistema lo causa (tabla, RLS, feature, etc.)
3. Recomendación de resolución previa
4. NO proponer fixes locales sobre problemas sistémicos

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
3. IMPORTANTE: Actualizar TODOS los imports que referencian los archivos movidos
4. Actualizar los barrel exports (index.ts) de los features afectados

**Ejemplo de componentes fuera de lugar (detectado en PROJECTS):**
```
src/features/projects/components/
  ├── ProjectColorAdvanced.tsx  ✅ Correcto
  ├── ProjectItemCard.tsx       ✅ Correcto
  ├── ProjectRow.tsx            ✅ Correcto
  ├── ProjectSelectorField.tsx  ✅ Correcto
  ├── TaskRow.tsx               ❌ MOVER a legacy/components/tasks/
  ├── AnalysisTaskRow.tsx       ❌ MOVER a legacy/components/tasks/
  ├── TaskCostPopover.tsx       ❌ MOVER a legacy/components/tasks/
  ├── admin/                    ❌ MOVER carpeta completa a legacy/components/admin/
  └── gantt/                    ❌ MOVER carpeta completa a legacy/components/gantt/
```

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

**NOMENCLATURA OBLIGATORIA:**

| Tipo | Ubicación | Nombre | Ejemplo |
|------|-----------|--------|---------|
| **Page** | `src/pages/{feature}/` | `*Page.tsx` | `ProjectsPage.tsx`, `ProjectDataPage.tsx` |
| **View** | `src/features/{feature}/views/` | `*View.tsx` | `ProjectActivesView.tsx`, `ProjectListView.tsx` |

**REGLAS CRÍTICAS:**
1. **Pages** terminan en `*Page.tsx` y viven ÚNICAMENTE en `src/pages/{feature}/`
2. **Views** terminan en `*View.tsx` y viven ÚNICAMENTE en `src/features/{feature}/views/`
3. **NO** deben existir archivos `*Tab.tsx` en pages/ - son legacy y deben migrarse a Views
4. Las Pages son **orquestadores**: eligen layout, manejan tabs, renderizan views
5. Las Views son **contenido agnóstico**: tablas, KPIs, gráficos, formularios

**Ejemplo correcto (PROJECTS):**
```
src/pages/projects/
├── ProjectsPage.tsx        ← Orquestador: LabLayout + renderiza Views
└── ProjectDataPage.tsx     ← Orquestador: DashboardLayout + renderiza Views

src/features/projects/views/
├── ProjectActivesView.tsx       ← Contenido: grid de proyectos activos
├── ProjectBasicDataView.tsx     ← Contenido: datos básicos del proyecto
├── ProjectListView.tsx          ← Contenido: tabla de proyectos
├── ProjectLocationView.tsx      ← Contenido: ubicación del proyecto
├── ProjectSettingsView.tsx      ← Contenido: configuración (tipos, modalidades)
└── ProjectVisionGeneralView.tsx ← Contenido: dashboard con KPIs
```

**Checklist de PAGE (Orquestador):**
- [ ] ¿El archivo termina en `*Page.tsx`?
- [ ] ¿Está en `src/pages/{feature}/`?
- [ ] ¿La página solo orquesta (no contiene lógica de negocio)?
- [ ] ¿Usa Layout con `headerProps` correctamente?
- [ ] ¿Los botones de acción están en `headerProps.actions` (no en el contenido)?
- [ ] ¿Soporta tanto DashboardLayout como LabLayout?
- [ ] ¿Usa `renderView()` function pattern para tabs?
- [ ] ¿Para LabLayout, los botones van en `toolbarProps.secondaryRightSlot`?
- [ ] ¿NO existen archivos `*Tab.tsx` legacy en la misma carpeta?

**Checklist de VIEW (Contenido):**
- [ ] ¿El archivo termina en `*View.tsx`?
- [ ] ¿Está en `src/features/{feature}/views/`?
- [ ] ¿Cada View es independiente y agnóstica al layout?
- [ ] ¿Las Views hacen su propio fetch de datos?
- [ ] ¿Las Views NO importan layouts?
- [ ] ¿Las Views NO manejan tabs (eso lo hace el Page)?

**Checklist de UI/UX:**
- [ ] ¿Usa `Layout` de `@/layouts/dashboard/DashboardLayout`?
- [ ] ¿Usa `Tabs` de `@/components/ui-custom/Tabs` para filtros?
- [ ] ¿Usa `LoadingSpinner` (no texto "Cargando...")?
- [ ] ¿Los empty states tienen `actionButton` si el header tiene botón crear?
- [ ] ¿Tiene `data-testid` en elementos interactivos? (para testing futuro)

---

### 5. AUDITORÍA DE FORMULARIOS (FORMS)

**REGLA CRÍTICA:** 
- **CADA FORM tiene su MODAL correspondiente** (1:1)
- El FORM es **agnóstico** (puede usarse en modal, drawer, o página)
- El MODAL es el **envase** que abre el usuario

**Nomenclatura OBLIGATORIA:**
| Tipo | Ubicación | Nombre | Contenido |
|------|-----------|--------|-----------|
| **Form** | `forms/` | `*Form.tsx` | FormPanel + ViewPanel + useFeatureForm hook |
| **Modal** | `modals/` | `*Modal.tsx` | ModalLayout + consume el Form |

**Ejemplo correcto (PROJECTS):**
```
src/features/projects/
├── forms/
│   ├── ProjectForm.tsx           ← FormPanel, ViewPanel, useProjectForm
│   ├── ProjectModalityForm.tsx   ← FormPanel, ViewPanel, useProjectModalityForm
│   └── ProjectTypeForm.tsx       ← FormPanel, ViewPanel, useProjectTypeForm
├── modals/
│   ├── ProjectModal.tsx          ← Solo ModalLayout, usa ProjectForm
│   ├── ProjectModalityModal.tsx  ← Solo ModalLayout, usa ProjectModalityForm
│   └── ProjectTypeModal.tsx      ← Solo ModalLayout, usa ProjectTypeForm
```

**Estructura del Form (`*Form.tsx`):**
```typescript
// 1. ViewPanel - Vista de solo lectura
export function ViewPanel({ data }: { data: Feature }) { ... }

// 2. FormPanel - Campos del formulario (UI pura)
export function FormPanel({ form, onSubmit, ...props }) { ... }

// 3. useFeatureForm - Hook de orquestación con callbacks
export function useFeatureForm(options: UseFeatureFormOptions) {
  // Estado: isSubmitting, etc.
  // Mutations con callbacks
  // Retorna: { form, onSubmit, reset, isSubmitting, ... }
}

// 4. Tipos exportados
export type { Feature, FeatureFormData };
```

**Checklist de Form:**
- [ ] ¿Archivo termina en `*Form.tsx` (NO `*FormFields.tsx`)?
- [ ] ¿Está en `src/features/{feature}/forms/`?
- [ ] ¿Exporta `FormPanel`, `ViewPanel`, `useFeatureForm`?
- [ ] ¿El hook acepta `callbacks` para UX (toasts manejados por el modal)?
- [ ] ¿NO importa componentes de modal (`ModalLayout`, `ModalHeader`, etc.)?
- [ ] ¿El hook retorna estado neutral (`isSubmitting`, `isUploading`)?
- [ ] ¿Es AGNÓSTICO y reutilizable en múltiples contextos?

**PERFORMANCE PATTERNS (CRÍTICO - Verificar SIEMPRE):**

Cada Form debe implementar estos patrones para ser INSTANTÁNEO:

```typescript
const onSubmit = async (data: FormData) => {
  try {
    if (mode === 'edit') {
      // ⚡ PASO 1: OPTIMISTIC UPDATE PRIMERO
      queryClient.setQueryData([QUERY_KEY, id], (oldData) => ({
        ...oldData,
        ...data
      }));

      // ⚡ PASO 2: FIRE AND FORGET - Mutation SIN await
      updateMutation.mutate({ id, data });

      // ✅ PASO 3: CALLBACK INMEDIATO (el modal cierra YA)
      callbacks?.onSuccess?.('edit');
    } else {
      // Para CREATE: genera ID optimista
      const optimisticItem = { 
        id: 'temp-' + Date.now(), 
        ...data 
      };

      // ⚡ PASO 1: OPTIMISTIC UPDATE
      queryClient.setQueryData([QUERY_KEY], (oldData) => [
        ...oldData, 
        optimisticItem
      ]);

      // ⚡ PASO 2: FIRE AND FORGET
      createMutation.mutate(data, {
        onSuccess: (newItem) => {
          // Reemplazar optimista con real
          queryClient.setQueryData([QUERY_KEY], (oldData) =>
            oldData.map(item => 
              item.id === optimisticItem.id ? newItem : item
            )
          );
        }
      });

      // ✅ PASO 3: CALLBACK INMEDIATO
      callbacks?.onSuccess?.('create');
    }
  } catch (error) {
    callbacks?.onError?.(error);
  }
};
```

**Checklist de Performance:**
- [ ] ¿Usa `.mutate()` (NO `.mutateAsync()`)?
- [ ] ¿Optimistic update ANTES de la mutation?
- [ ] ¿Callback invocado INMEDIATAMENTE (no espera servidor)?
- [ ] ¿Side-effects en background (logging, uploads)?
- [ ] ¿No hay `await` bloqueante?

---

### 5.1 AUDITORÍA DE SISTEMA DE GUARDADO (SAVE ENGINE)

**Objetivo:** Asegurar que todos los formularios, modales y vistas con auto-save usen el sistema centralizado.

**Checklist:**
- [ ] ¿Usa `useSaveEngine` de `@/core/save-engine` para auto-save?
- [ ] ¿Usa `useOptimisticMutation` para acciones puntuales (toggles, clicks)?
- [ ] ¿NO hay llamadas directas a Supabase en componentes?
- [ ] ¿NO hay `invalidateQueries` manuales sueltas?
- [ ] ¿Tiene `additionalQueryKeys` para invalidar caches relacionados?

**Patrón correcto de auto-save:**
```typescript
const { isSaving } = useSaveEngine({
  data: formData,
  queryKey: ['entity', entityId],
  saveFn: async (data) => { /* guardar */ },
  delay: 1500,
  enabled: !!entityId,
  additionalQueryKeys: [['related-data']],
});
```

**Referencia:** Documentación completa en `/docs/save-architecture.md`

**Prohibiciones:**
- ❌ `supabase.from()` directamente en componentes
- ❌ `queryClient.invalidateQueries()` sueltas sin patrón
- ❌ `useAutoSave` legacy (migrar a `useSaveEngine`)

---

### 6. AUDITORÍA DE MODALES

**REGLA:** El Modal es un ENVASE puro. Solo maneja:
- ModalLayout, ModalHeader, ModalBody, ModalFooter
- Toasts (UX específica del modal)
- Lógica de cierre

**Estructura del Modal (`*Modal.tsx`):**
```typescript
import { FormPanel, ViewPanel, useFeatureForm } from '../forms/FeatureForm';

export function FeatureModal({ modalData, onClose, mode }) {
  const { toast } = useToast();
  
  // 1. Consume el hook del Form
  const { form, onSubmit, reset, isSubmitting } = useFeatureForm({
    feature: modalData?.feature,
    mode,
    onSuccess: () => { reset(); onClose(); },
    callbacks: {
      onSuccess: (m) => toast({ title: m === 'edit' ? 'Actualizado' : 'Creado' }),
      onError: (e) => toast({ title: 'Error', variant: 'destructive' }),
    },
  });

  // 2. Renderiza el envase con el Form adentro
  return (
    <ModalLayout onClose={onClose}>
      <ModalHeader title="..." icon={...} />
      <ModalBody>
        {mode === 'view' ? <ViewPanel data={...} /> : <FormPanel form={form} onSubmit={onSubmit} />}
      </ModalBody>
      <ModalFooter onSubmit={form.handleSubmit(onSubmit)} isSubmitting={isSubmitting} />
    </ModalLayout>
  );
}
```

**Checklist de Modal (Envase):**
- [ ] ¿Archivo termina en `*Modal.tsx`?
- [ ] ¿Está en `src/features/{feature}/modals/`?
- [ ] ¿Importa FormPanel, ViewPanel, useFeatureForm del Form correspondiente?
- [ ] ¿Maneja los toasts via callbacks del hook?
- [ ] ¿NO tiene lógica de mutations directa (eso está en el Form)?
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
- [ ] ¿Políticas SELECT / INSERT / UPDATE / DELETE según necesidad? ⚠️ *VERIFICAR EN SUPABASE*
- [ ] ¿Políticas en español con formato "SUJETO > ACCIÓN > OBJETO > CONDICIÓN"?
- [ ] ¿No hay duplicaciones peligrosas ni huecos de seguridad? ⚠️ *VERIFICAR EN SUPABASE*
- [ ] ¿Filtrado por `organization_id` donde aplica?

**Output esperado:** "DB Findings" + "DB Fixes" (SQL exacto, separado por migraciones pequeñas)

> **Nota:** RLS debe verificarse directamente en Supabase Dashboard → Authentication → Policies.

---

### 11. AUDITORÍA DE FRONTEND

**Checklist de hooks:**
- [ ] ¿No hay duplicados?
- [ ] ¿No hacen joins pesados en frontend (debería ser View)?
- [ ] ¿Manejo de loading/error/empty states consistente?
- [ ] ¿Tipado y validaciones donde aplica?
- [ ] ¿Query keys usando array pattern para invalidación correcta?

**Checklist de performance (queries):**
- [ ] ¿Cache y staleTime configurados en React Query?
- [ ] ¿Usa Views de Supabase para queries complejas (evita joins en frontend)?

> **Nota:** Performance de carga (LCP, bundle size, lazy loading) se audita en **Sección 17.1 Performance Budgets**.

**Checklist de UI/UX:**
- [ ] ¿Estados vacíos, errores, permisos implementados?
- [ ] ¿Consistencia visual con la app?
- [ ] ¿Usa `var(--accent)` y CSS variables del theme?
- [ ] ¿Indicadores financieros usan `text-chart-positive/negative/neutral`?

---

### 12. AUDITORÍA DE CÓDIGO LIMPIO

**CRÍTICO: Eliminar TODO código de debug DURANTE la auditoría.**

Durante la auditoría del feature, buscar y eliminar:

```typescript
// ❌ ELIMINAR TODOS ESTOS:
console.log(...)       // Logs de debug
console.warn(...)      // Advertencias de debug
console.error(...)     // Errores de debug (excepto en error handlers reales)
console.table(...)     // Logs de tablas
debugger               // Breakpoints olvidados
console.trace(...)     // Stack traces de debug
```

**Checklist de Código Limpio:**
- [ ] ¿Se ejecutó `grep -r "console\." src/features/{feature}/` para encontrar logs?
- [ ] ¿Se eliminaron TODOS los `console.log()`, `console.warn()`, `console.error()` de debug?
- [ ] ¿Se eliminaron sentencias `debugger;` olvidadas?
- [ ] ¿Se verificó que NO hay logs en hooks, components, services, forms, views?
- [ ] ¿Se verificó que NO hay comentarios `// TODO: remove log`, `// debug`, `// temp`?
- [ ] ¿Los únicos `console` restantes son error handlers en try/catch legítimos?

**Ejemplo correcto:**
```typescript
// ✅ CORRECTO: Logs en error handlers reales
} catch (error) {
  console.error('Error fetching data:', error);  // Intentional, información para debugging en producción
  toast({ title: 'Error', variant: 'destructive' });
}
```

**Ejemplo INCORRECTO (ELIMINAR):**
```typescript
// ❌ ELIMINAR
const data = await fetchProjects();
console.log('Projects data:', data);  // DEBUG - ELIMINAR
```

---

### 13. AUDITORÍA DE CALIDAD / ROBUSTEZ

**Checklist de Validaciones:**
- [ ] ¿Validaciones en frontend (Zod schemas) Y DB (constraints)?
- [ ] ¿Concurrencia manejada? (updates que pisan datos, optimistic updates)
- [ ] ¿Seguridad? (nunca confiar en frontend para reglas críticas)
- [ ] ¿Autenticación usa `requireUser()` con userId correcto (NO auth.user.id)?

> **Nota:** El manejo de errores (try/catch, logging, mensajes) se audita en **Sección 17.2 Error Handling**.

---

### 14. AUDITORÍA DE REFACTORIZACIÓN (Tablas, Badges, Headers)

#### 17.1 Tablas (`Table`)

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

#### 14.2 Badges

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

#### 14.3 Headers de Página

**Reglas:**
- [ ] Header tiene el **mismo ícono** que en sidebar
- [ ] Header tiene `description` en su prop
- [ ] Botones primarios van en `actionButton` prop
- [ ] Múltiples acciones van en `actions` prop (array de JSX)
- [ ] NUNCA hardcodear botones en el contenido del header

#### 14.4 IdentityBadge

Para mostrar entidades con avatar:
```typescript
<IdentityBadge
  name={organization.name}
  avatarUrl={organization.image_url}
  size="sm"
  showName={true}
/>
```

#### 14.5 Checklist de Refactorización

- [ ] Tabla usa `src/components/shared/table`
- [ ] TODAS las columnas tienen un tipo semántico
- [ ] Una columna tiene `type: 'long-text'` para ancho flexible
- [ ] Badges usan variantes semánticas
- [ ] Badges NO tienen colores hardcodeados
- [ ] Header tiene ícono y descripción
- [ ] Entidades con avatar usan `IdentityBadge`

---

### 15. AUDITORÍA DE QUALITY GATES (Testing)

**Objetivo:** Asegurar que el feature tiene cobertura de testing adecuada para prevenir regresiones.

#### 17.1 Niveles de Testing Esperados

| Nivel | Qué testea | Herramienta | Cuándo es obligatorio |
|-------|------------|-------------|----------------------|
| **Unit Tests** | Funciones puras, utils, helpers | Vitest | Siempre que haya lógica de negocio |
| **Integration Tests** | Hooks, services con mocks | Vitest + MSW | Features con lógica compleja |
| **Component Tests** | Componentes aislados | Vitest + Testing Library | Componentes reutilizables |
| **E2E Tests** | Flujos críticos completos | Playwright (futuro) | Flujos de pago, auth, CRUD principal |

#### 14.2 Checklist de Testing

**Mínimo obligatorio (Quality Gate):**
- [ ] ¿Los services tienen tests para casos happy path?
- [ ] ¿Los services manejan errores correctamente (tests de error)?
- [ ] ¿Las funciones de cálculo (KPIs, conversiones) tienen tests?
- [ ] ¿Los schemas Zod validan correctamente (edge cases)?

**Recomendado (features críticos):**
- [ ] ¿Los hooks tienen tests con mocks de API?
- [ ] ¿Los componentes de formulario validan correctamente?
- [ ] ¿Los flujos CRUD principales tienen tests E2E?

#### 14.3 Ubicación de Tests

```
src/features/{feature}/
├── services/
│   ├── getItems.ts
│   └── __tests__/
│       └── getItems.test.ts
├── hooks/
│   ├── use-items.ts
│   └── __tests__/
│       └── use-items.test.ts
└── tests/               ← Tests de integración del feature
    └── feature.test.ts
```

#### 14.4 Criterios de Bloqueo

Un feature **NO puede marcarse como cerrado** si:
- ❌ Tiene funciones de cálculo monetario sin tests
- ❌ Tiene validaciones Zod sin tests de edge cases
- ❌ Tiene lógica de permisos/RLS sin verificación

---

### 16. AUDITORÍA DE ACCESIBILIDAD E I18N

**Objetivo:** Asegurar que el feature es accesible y está preparado para internacionalización.

#### 17.1 Checklist de Accesibilidad (a11y)

**Navegación por teclado:**
- [ ] ¿Todos los elementos interactivos son focusables?
- [ ] ¿El orden de focus es lógico (Tab order)?
- [ ] ¿Los modales atrapan el focus correctamente?
- [ ] ¿Escape cierra modales/drawers?

**Screen readers:**
- [ ] ¿Los botones tienen `aria-label` si solo tienen ícono?
- [ ] ¿Las imágenes tienen `alt` descriptivo?
- [ ] ¿Los formularios tienen labels asociados?
- [ ] ¿Los errores de validación son anunciados?

**Contraste y visuales:**
- [ ] ¿El contraste de texto cumple WCAG AA (4.5:1)? ⚠️ *VERIFICAR CON AXE DEVTOOLS*
- [ ] ¿Los estados focus son visibles?
- [ ] ¿La información no depende solo del color?

**Componentes shadcn/ui:**
- [ ] ¿Usa componentes de Radix (ya accesibles)?
- [ ] ¿NO hay divs clickeables (usar Button)?
- [ ] ¿Los Select tienen placeholder descriptivo?

#### 15.2 Checklist de Internacionalización (i18n)

**Textos:**
- [ ] ¿Los textos de UI usan `t()` de i18n?
- [ ] ¿Los mensajes de error están traducidos?
- [ ] ¿Los placeholders están traducidos?
- [ ] ¿Las fechas usan `formatDate()` con locale?

**Formatos:**
- [ ] ¿Los números usan `formatNumber()` con locale?
- [ ] ¿Las monedas usan el sistema de multimoneda?
- [ ] ¿Las fechas respetan formato regional?

**Fallbacks:**
- [ ] ¿Hay fallback a español si falta traducción?
- [ ] ¿Los textos largos no rompen el layout?

#### 15.3 Herramientas de Verificación

```typescript
// En desarrollo, verificar con:
// 1. Tab through toda la página
// 2. axe DevTools extension (Chrome)
// 3. VoiceOver (Mac) o NVDA (Windows)
```

---

### 17. AUDITORÍA DE PRODUCTION READINESS

**Objetivo:** Asegurar que el feature está listo para producción con observabilidad y resiliencia.

#### 17.1 Performance Budgets

| Métrica | Target | Cómo medir | Verificación |
|---------|--------|------------|--------------|
| **LCP (Largest Contentful Paint)** | < 2.5s | Lighthouse | ⚠️ MANUAL |
| **Bundle size (feature chunk)** | < 100KB gzip | `npm run build` | ✅ Automatizable |
| **Queries por página** | < 5 queries iniciales | React Query DevTools | ⚠️ MANUAL |
| **Re-renders innecesarios** | 0 | React DevTools Profiler | ⚠️ MANUAL |

**Checklist de Performance:**
- [ ] ¿Usa lazy loading para rutas secundarias?
- [ ] ¿Las imágenes están comprimidas y optimizadas?
- [ ] ¿Las queries usan `staleTime` apropiado?
- [ ] ¿Los cálculos pesados están en `useMemo`?
- [ ] ¿Las listas largas usan virtualización?

#### 16.2 Error Handling & Resilience

**Error Boundaries:**
- [ ] ¿El feature tiene ErrorBoundary para errores de render?
- [ ] ¿Los errores de API muestran mensaje amigable?
- [ ] ¿Hay retry automático en queries críticas?

**Fallbacks:**
- [ ] ¿Los datos opcionales tienen fallback `?? []`?
- [ ] ¿Las imágenes tienen fallback si fallan?
- [ ] ¿Los componentes degradan gracefully?

#### 16.3 Observabilidad

**Logging:**
- [ ] ¿Los errores se loguean con contexto suficiente?
- [ ] ¿Los errores de API incluyen request/response info?
- [ ] ¿NO se loguean datos sensibles (passwords, tokens)?

**Métricas (cuando aplique):**
- [ ] ¿Las acciones críticas tienen tracking?
- [ ] ¿Los tiempos de carga se miden?

#### 16.4 Feature Flags & Rollout

**Para features nuevos o riesgosos:**
- [ ] ¿El feature puede desactivarse sin deploy?
- [ ] ¿Hay plan de rollback si falla?
- [ ] ¿Se puede activar gradualmente (% de usuarios)?

**Integración con Ops Center:**
- [ ] ¿Los errores críticos generan alertas?
- [ ] ¿Hay runbook de resolución si falla?

#### 16.5 Checklist Pre-Deploy

Antes de considerar el feature "production ready":

- [ ] No hay errores en consola (dev y prod) ✅ *Automatizable*
- [ ] Performance dentro de budgets ⚠️ *Verificar con Lighthouse*
- [ ] Accesibilidad verificada ⚠️ *Verificar con axe DevTools*
- [ ] Textos traducibles via i18n ✅ *Automatizable*
- [ ] Error boundaries implementados ✅ *Automatizable*
- [ ] Logging adecuado ✅ *Automatizable*
- [ ] Documentación actualizada ✅ *Automatizable*

> **Nota:** CI con tests automatizados es un objetivo futuro. Por ahora, verificar tests manualmente con `npm test`.

---

## ENTREGABLES OBLIGATORIOS

### ENTREGABLE 1: AUDIT REPORT

**Ubicación:** `src/features/{feature}/AUDIT-{FEATURE}.md` (DENTRO del feature, no en prompts/)

```markdown
## AUDIT REPORT: {NOMBRE_DEL_FEATURE}

### Estado del Feature (Resumen Ejecutivo)

| Aspecto | Estado |
|---------|--------|
| **Nivel de madurez** | 🟢 Estable / 🟡 Parcial / 🔴 Incompleto |
| **Riesgo en producción** | Bajo / Medio / Alto |
| **Deuda técnica** | Mínima / Moderada / Significativa |

**Recomendación final:**
- [ ] ✅ Cerrar ahora (feature listo)
- [ ] ⚠️ Cerrar con fixes menores (< 2 horas de trabajo)
- [ ] ❌ No cerrar (bloqueado por problemas estructurales)

**Resumen en 1 línea:** {Descripción breve del estado}

---

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
| Refactorización (Tablas, Badges) | ✅/⚠️/❌ | ... |
| Quality Gates (Testing) | ✅/⚠️/❌ | ... |
| Accesibilidad (a11y) | ✅/⚠️/❌ | ... |
| Internacionalización (i18n) | ✅/⚠️/❌ | ... |
| Production Readiness | ✅/⚠️/❌ | ... |

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

**Arquitectura y Estructura:**
- [ ] No hay errores en consola ni en runtime
- [ ] **TODOS los archivos están en su ubicación correcta**
- [ ] **NO hay duplicados** en `src/hooks/`, `src/services/`, `src/types/`
- [ ] Arquitectura de feature sigue este documento
- [ ] Formularios son agnósticos y están en `forms/`
- [ ] Modales y Drawers son envases que usan los forms

**Base de Datos:**
- [ ] DB tiene estructura correcta y lecturas por Views cuando corresponde
- [ ] RLS consistente y segura

**Frontend:**
- [ ] Hooks consistentes, sin duplicados y sin lógica redundante
- [ ] UI completa (loading/error/empty/permisos) y consistente
- [ ] Tablas usan tipos semánticos
- [ ] Badges usan variantes semánticas
- [ ] Elementos interactivos tienen `data-testid`

**Quality Gates (Enterprise):**
- [ ] Tests mínimos implementados para lógica de negocio
- [ ] Accesibilidad verificada (keyboard nav, aria-labels)
- [ ] Textos traducibles via i18n
- [ ] Performance dentro de budgets
- [ ] Error boundaries implementados
- [ ] Documentación del feature creada

---

## REGLA POST-CIERRE ("CERRADO = NO SE TOCA")

Un feature marcado como **CERRADO**:

| Regla | Descripción |
|-------|-------------|
| 🚫 **No experimental** | No se usa como base para experimentos o prototipos |
| 🚫 **No hacks** | No recibe workarounds rápidos ni fixes temporales |
| 🚫 **No modificaciones casuales** | Solo se modifica por razones documentadas |

**Excepciones permitidas (requieren justificación):**
| Caso | Acción requerida |
|------|------------------|
| Bug crítico en producción | Fix inmediato + documentar en changelog |
| Cambio funcional aprobado | Reabrir auditoría parcial del área afectada |
| Refactor sistémico | Reabrir auditoría completa |

**Cualquier cambio a un feature cerrado debe:**
1. Documentarse explícitamente
2. Verificar que no rompe los checks de cierre
3. Actualizar documentación si aplica

> **Objetivo:** Proteger features cerrados de degradación futura. Un feature cerrado es un contrato de calidad.

---

## GUÍAS DE SISTEMAS ESPECÍFICOS

Los siguientes documentos contienen guías de implementación detalladas para sistemas específicos de Seencel. Consúltalos cuando trabajes con estos features:

| Archivo | Sistema | Descripción |
|---------|---------|-------------|
| `prompts/documentation/DASHBOARD_SYSTEM.md` | Dashboards | Arquitectura de dashboards, KPIs headless, charts, insights automáticos, analytics |
| `prompts/documentation/MULTICURRENCY_SYSTEM.md` | Multimoneda | Sistema de conversiones, `useOrgCurrencyContext`, formateo, visibilidad condicional |
| `prompts/documentation/GET_USER_FUNCTION.md` | Autenticación | Función RPC `get_user()` de Supabase, estructura del JSON, CTEs |
| `prompts/documentation/FORUM_SYSTEM.md` | Foro | Sistema de foro con categorías, threads, posts, reacciones, foros por curso |
| `prompts/documentation/OPS-CENTER.md` | Ops Center | Centro de operaciones admin: health checks, alertas, flow blocking, repair actions |
| `prompts/documentation/PDF_SYSTEM_AUDIT.md` | Sistema PDF | Estado actual del sistema PDF, bloques, templates, roadmap de implementación |
| `prompts/documentation/SUBSCRIPTIONS_BILLING_SYSTEM.md` | Suscripciones | Sistema de planes, billing, proration, coupons, soft-locks, cron jobs |
| `prompts/documentation/PAYMENT-SUBSCRIPTION-FLOW-AUDIT.md` | Flujo de Pagos | Auditoría del flujo de pagos y suscripciones |
| `prompts/documentation/WEBHOOK-PAYMENT-FLOW.md` | Webhooks | Flujo de webhooks de pagos (MercadoPago, PayPal) |
| `prompts/documentation/UNIFIED_MOVEMENTS_SYSTEM.md` | Movimientos | Sistema unificado de movimientos financieros |
| `prompts/documentation/UNIVERSAL_IMPORT_SYSTEM.md` | Importación | Sistema universal de importación de datos (wizard 5 pasos) |
| `prompts/documentation/RESEND.md` | Emails | Sistema de notificaciones por email con Resend y React Email |

**Cuándo consultar estas guías:**
- Al auditar un feature que **USE** alguno de estos sistemas
- Al crear **nuevos features** que necesiten dashboards, multimoneda, PDFs, etc.
- Cuando necesites entender la **arquitectura interna** de un sistema global

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
