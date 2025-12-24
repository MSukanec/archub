# 📋 FEATURE AUDIT - Prompt Oficial de Auditoría de Seencel

> Este es el **ÚNICO archivo de referencia** para auditorías 360° de features de Seencel.
> Consolida arquitectura, páginas, modales, drawers, uploads, refactorización, y más.

---

## ⚠️ IMPORTANTE: Ubicación del Documento de Auditoría

**Cuando audites un feature, DEBES crear un documento `AUDIT-{FEATURE}.md` en la carpeta del feature:**

```
src/features/{feature-name}/AUDIT-{FEATURE}.md  ← AQUÍ va el documento
```

**NO aquí:**
```
❌ prompts/FEATURE-AUDIT.md  (Este es el TEMPLATE global)
❌ src/features/{feature}/FEATURE-AUDIT.md  (Nombre incorrecto)
```

---

## Ejemplo: Cómo hacerlo correctamente

```bash
# CORRECTO - Copia el template si quieres una base
# Pero luego PERSONALÍZALO para el feature específico

# Para ORGANIZATION (COMPLETADO):
src/features/organization/AUDIT-ORGANIZATION.md  ✅

# Para PROJECTS (COMPLETADO):
src/features/projects/AUDIT-PROJECTS.md  ✅

# Para LEARNING (PENDIENTE):
src/features/learning/AUDIT-LEARNING.md  ← Crear cuando audites
```

---

## Patrón de Documento de Auditoría

Sigue el patrón de `src/features/projects/AUDIT-PROJECTS.md`:

```markdown
# AUDIT REPORT: Feature {NOMBRE}

**Fecha de auditoría:** YYYY-MM-DD  
**Auditor:** Nombre del auditor  
**Estándar aplicado:** FEATURE-AUDIT.md v1.0  
**Resultado:** ✅ PASA / ❌ FALLA / 🟡 PENDIENTE

---

## 1. RESUMEN EJECUTIVO
(Tabla de status por tema)

## 2. MAPA DEL FEATURE
(Estructura de carpetas y archivos)

## 3. CHECKLIST FINAL DE AUDITORÍA
(✅ Cada aspecto auditado)

## 4. ISSUES RESUELTOS
(Problemas encontrados y fixes)

## 5. ESTÁNDARES APLICADOS
(Qué estándares se siguieron)

## 6. ENTREGABLES
(Qué se entrega)

## 7. CONDICIÓN FINAL
(CERRADO / ABIERTO / BLOQUEADO)

## 8. Post-Cierre
(Notas para cambios futuros)
```

---

## Contenido Completo de la Auditoría

Este prompt contiene todas las secciones de auditoría. **Úsalo como referencia**, pero **NO lo copies tal cual**.

En lugar de eso:
1. Lee las secciones relevantes
2. Crea un documento PERSONALIZADO para el feature
3. Documenta hallazgos ESPECÍFICOS, no genéricos

---

### Secciones de Auditoría (REFERENCIA)

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

---

## CÓMO USAR ESTE PROMPT

### Paso 1: Lee el prompt completo

Familiarízate con todas las secciones (1-16 de auditoría).

### Paso 2: Crea documento en la carpeta del feature

```bash
touch src/features/{feature}/AUDIT-{FEATURE}.md
```

### Paso 3: Estructura el documento

Sigue el patrón de `src/features/projects/AUDIT-PROJECTS.md`.

### Paso 4: Audita cada sección

Marca con ✅ / ❌ conforme avances.

### Paso 5: Documenta hallazgos

Incluye:
- Issues encontrados
- Fixes aplicados
- Warnings o mejoras futuras
- Estado final

---

## REGLAS DE SEGURIDAD (CRÍTICO)

1. **No romper compatibilidad**: Cualquier cambio debe ser incremental y verificable
2. **Antes de modificar**: Entregar AUDIT REPORT completo
3. **Después del report**: Entregar PLAN DE EJECUCIÓN por pasos + checklist
4. **Riesgo de producción**: Proponer alternativa segura (feature flag / fallback / migración gradual)
5. **Si falta algo en DB**: Marcar "FALTA" y pedir confirmación o proponer migración explícita
6. **SQL**: El agente NO puede ejecutar SQL directamente - proporcionar SQL para que el usuario ejecute en Supabase

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

**Output esperado:**
```
📂 Estructura del Feature
├── src/features/{feature}/
│   ├── services/        ← Funciones puras async de Supabase
│   ├── hooks/           ← React hooks con useQuery/useMutation
│   ├── forms/           ← Forms agnósticos (REUTILIZABLES en modales, drawers, páginas)
│   │   └── FeatureForm.tsx
│   ├── components/      ← Componentes específicos del feature
│   ├── modals/          ← Modales (contenedores ENVASE)
│   ├── views/           ← Views agnósticas al layout
│   ├── types/           ← Tipos TypeScript
│   ├── schemas/         ← Validaciones Zod
│   ├── constants/       ← Enums, configuraciones
│   └── index.ts         ← Barrel exports
├── src/pages/{feature}/ ← Páginas (orquestadores)
└── src/features/{feature}/AUDIT-{FEATURE}.md ← ESTE DOCUMENTO
```

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
- [ ] ¿`index.ts` exporta todo lo necesario?

---

### 3. AUDITORÍA DE UBICACIÓN DE ARCHIVOS Y DUPLICADOS (CRÍTICO)

**Objetivo:** Asegurar que TODOS los archivos estén en su lugar correcto y NO existan duplicados.

**Verificar cruzado obligatorio:**
- [ ] ¿TODOS los archivos en `components/` son específicos de ESTE feature?
- [ ] ¿NO hay subcarpetas que pertenezcan a otros features?
- [ ] ¿NO hay duplicados en `src/hooks/`, `src/types/`, `src/services/`?

---

### 4. AUDITORÍA DE PÁGINAS (3 CAPAS)

**Arquitectura esperada:**
```
PAGE (Orquestador)     → Elige layout, maneja tabs, renderiza views
    ↓
LAYOUT (Estructura)    → DashboardLayout o LabLayout
    ↓
VIEW (Contenido)       → Tablas, KPIs, gráficos, formularios
```

**NOMENCLATURA OBLIGATORIA:**
| Tipo | Ubicación | Nombre | Ejemplo |
|------|-----------|--------|---------|
| **Page** | `src/pages/{feature}/` | `*Page.tsx` | `ProjectsPage.tsx` |
| **View** | `src/features/{feature}/views/` | `*View.tsx` | `ProjectListView.tsx` |

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

---

### 5.1 AUDITORÍA DE SISTEMA DE GUARDADO (SAVE ENGINE)

**Objetivo:** Asegurar que TODOS los formularios, modales y vistas con auto-save o acciones puntuales usen el sistema centralizado de guardado.

**REGLA DE ORO:** 
- ✅ `useAutosaveController` → **PREFERIDO** - Autosave enterprise (blur/Enter trigger, validación, normalización)
- ✅ `useSaveEngine` → Auto-save con delay (legacy, solo si no requiere validación)
- ✅ `useOptimisticMutation` → Acciones puntuales (toggles, clicks, deletes)
- ❌ `supabase.from()` NUNCA directo en componentes
- ❌ `queryClient.invalidateQueries()` NUNCA sueltas sin patrón
- ❌ **NUNCA guardar en onChange** - Solo actualiza estado local

**Checklist:**
- [ ] ¿Usa `useAutosaveController` o `useSaveEngine` para auto-save?
- [ ] ¿Usa `useOptimisticMutation` para acciones puntuales (toggles, clicks)?
- [ ] ¿Tiene `additionalQueryKeys` para invalidar caches relacionados?
- [ ] ¿Incluye guardia `if (!oldData) return oldData;` en optimisticUpdate?
- [ ] ¿NO hay llamadas directas a Supabase en componentes?
- [ ] ¿NO hay `invalidateQueries` manuales sueltas?
- [ ] ¿Valida campos requeridos ANTES de guardar?
- [ ] ¿Normaliza valores vacíos ('' → null)?
- [ ] ¿Hidrata `lastPersistedData` con datos iniciales?

---

#### Patrón 0: AUTOSAVE ENTERPRISE (PREFERIDO) con useAutosaveController

**USAR ESTE PATRÓN** para vistas con campos editables que siguen el estilo Notion/Linear:
- Guarda solo en `onBlur`, `Enter` o cambio de select
- **NUNCA guarda en onChange** - Solo actualiza estado local
- Valida campos requeridos antes de guardar
- Normaliza datos (empty string → null, trim)
- Dirty check para evitar guardados redundantes

**Ubicación:** `src/core/autosave/`

```typescript
import { useAutosaveController, normalizeStringValue } from '@/core/autosave';

// 1. Estado local para el formulario
const [projectName, setProjectName] = useState('');
const [projectCode, setProjectCode] = useState('');
const [isHydrated, setIsHydrated] = useState(false);

// 2. Controller de autosave
const saveController = useAutosaveController({
  queryKey: projectsKeys.data(projectId),
  saveFn: async (dataToSave: any) => {
    // Normalizar empty strings → null
    const normalized = {
      name: normalizeStringValue(dataToSave.name),
      code: normalizeStringValue(dataToSave.code), // '' → null
    };
    const { error } = await supabase
      .from('projects')
      .update(normalized)
      .eq('id', projectId);
    if (error) throw error;
  },
  additionalQueryKeys: [
    projectsKeys.list(organizationId),
    projectsKeys.info(projectId),
  ],
  enabled: !!projectId && isHydrated,
});

// 3. Validación antes de guardar
const isFormValid = (data: any): boolean => {
  if (!data.name?.trim()) return false; // Required field
  return true;
};

// 4. Handler para blur (guarda solo si válido)
const handleBlur = () => {
  if (!isHydrated) return;
  const formData = { name: projectName, code: projectCode };
  if (!isFormValid(formData)) return; // No guardar si inválido
  saveController.save(formData);
};

// 5. Handler para Enter key
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleBlur();
  }
};

// 6. Hidratación con datos del servidor
useEffect(() => {
  if (!data) return;
  setProjectName(data.name || '');
  setProjectCode(data.code || '');
  setTimeout(() => {
    setIsHydrated(true);
    // ⚠️ CRÍTICO: Seed lastPersistedData para evitar guardados redundantes
    saveController.setLastPersistedData({
      name: data.name || '',
      code: data.code || '',
    });
  }, 100);
}, [data]);

// 7. En el JSX
<Input
  value={projectName}
  onChange={(e) => setProjectName(e.target.value)} // Solo estado local
  onBlur={handleBlur}                               // Guarda aquí
  onKeyDown={handleKeyDown}                         // O con Enter
/>
```

**Cuándo usar:**
- Vistas con campos de texto editables (datos básicos, configuración)
- Formularios embebidos en páginas (no modales)
- Cualquier UI estilo Notion/Linear

---

#### Patrón 1: AUTO-SAVE CON useSaveEngine (Legacy)

Para campos que se guardan **automáticamente** tras delay (usar solo si no requiere validación):

```typescript
const { isSaving, hasUnsavedChanges } = useSaveEngine({
  data: {
    name: projectName,
    description: description,
  },
  queryKey: ['project-data', projectId],
  saveFn: async (dataToSave) => {
    const { error } = await supabase
      .from('projects')
      .update(dataToSave)
      .eq('id', projectId);
    if (error) throw error;
  },
  delay: 500, // ⚠️ MÁXIMO 500ms, nunca 1500ms
  enabled: !!projectId,
  additionalQueryKeys: [
    ['project-info', projectId],
    ['projects'],
    ['projects-lite', organizationId]
  ],
});
```

#### Patrón 2: ACCIONES PUNTUALES CON useOptimisticMutation

Para acciones que ocurren por **click/toggle**:

```typescript
const { mutate: deleteProject } = useOptimisticMutation({
  mutationFn: async (projectId: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);
    if (error) throw error;
  },
  queryKey: ['projects', organizationId],
  optimisticUpdate: (oldData: any, projectId: string) => {
    if (!oldData) return oldData;  // ⚠️ GUARDIA CRÍTICA
    if (!Array.isArray(oldData)) return oldData;
    return oldData.filter(p => p.id !== projectId);
  },
  onSuccessMessage: "Proyecto eliminado",
  onErrorMessage: "No se pudo eliminar",
  additionalQueryKeys: [['projects-lite'], ['active-projects']],
});
```

**Guardia CRÍTICA en optimisticUpdate:**
```typescript
optimisticUpdate: (oldData: any, variables: any) => {
  if (!oldData) return oldData;  // ← Sin esto, corrupción de cache
  // Ahora es seguro hacer spread/map/filter
  return {
    ...oldData,
    ...variables
  };
}
```

---

### 5.2 AUDITORÍA DE QUERY KEYS CENTRALIZADAS (OBLIGATORIO)

**Objetivo:** Asegurar que TODAS las query keys estén centralizadas en una factory por feature para evitar fragmentación de cache.

**REGLA DE ORO:**
- ✅ `featureKeys.list()`, `featureKeys.detail(id)` → Factory centralizada
- ❌ `['feature-lite']`, `['feature-map']` → Keys fragmentadas que causan bugs de cache
- ✅ Usar `select` para derivar versiones ligeras de la misma query
- ✅ `queryClient.setQueryData(featureKeys.list())` → Cache updates atómicos

**Ubicación obligatoria:**
```
src/core/query-keys/{feature}.keys.ts  ← Factory de keys
src/core/query-keys/index.ts           ← Barrel exports
```

**Estructura estándar:**
```typescript
type NullableId = string | null | undefined;

export const featureKeys = {
  all: ['feature'] as const,
  lists: () => [...featureKeys.all, 'list'] as const,
  list: (organizationId: NullableId) => 
    [...featureKeys.lists(), organizationId ?? undefined] as const,
  details: () => [...featureKeys.all, 'detail'] as const,
  detail: (id: NullableId) => 
    [...featureKeys.details(), id ?? undefined] as const,
} as const;
```

**Patrón de derivación con `select`:**
```typescript
// ✅ CORRECTO - Deriva versión ligera de la misma cache
export function useFeatureLite(organizationId: NullableId) {
  return useQuery({
    queryKey: featureKeys.list(organizationId),
    select: (data) => data?.map(item => ({ id: item.id, name: item.name })),
  });
}

// ❌ INCORRECTO - Cache fragmentada
export function useFeatureLite(organizationId: NullableId) {
  return useQuery({
    queryKey: ['feature-lite', organizationId], // ← Cache separada
    queryFn: fetchFeatureLite,
  });
}
```

**Checklist:**
- [ ] ¿Existe `src/core/query-keys/{feature}.keys.ts`?
- [ ] ¿NO hay strings literales de query keys en hooks/views?
- [ ] ¿Usa `select` para derivar versiones ligeras?
- [ ] ¿Cache updates usan `setQueryData(featureKeys.xxx())`?
- [ ] ¿Invalidaciones usan la factory centralizada?
- [ ] ¿NullableId soporta `string | null | undefined`?

---

### 5.3 AUDITORÍA DE PERFORMANCE & CACHE OPTIMIZATION (CRÍTICO)

**OBJETIVO:** Asegurar que el sistema sea **INSTANTÁNEO** eliminando invalidaciones globales innecesarias y optimizando delays.

**🚨 INVALIDACIONES GLOBALES PROHIBIDAS:**
- ❌ `featureKeys.lists()` → Invalida TODO (causa refetch masivo)
- ❌ `featureKeys.all()` → Invalida TODO
- ❌ Queries sin organizationId/id → Cache global corrupta
- ✅ `featureKeys.list(organizationId)` → CORRECTO (scoped)
- ✅ `featureKeys.detail(id)` → CORRECTO (specific)

**Checklist de Performance:**
- [ ] ¿`additionalQueryKeys` NUNCA usa `featureKeys.lists()` o `featureKeys.all()`?
- [ ] ¿TODAS las invalidaciones están scopeadas a `organizationId` o `id`?
- [ ] ¿Delays en `useSaveEngine` ≤ 500ms? (NO 1500ms)
- [ ] ¿`optimisticUpdate` funciona correctamente (sin dependencias de backend)?
- [ ] ¿NO hay refetch innecesarios tras mutations?
- [ ] ¿Query keys son ESPECÍFICAS, NO genéricas?

**ANTI-PATTERNS a eliminar:**

```typescript
// ❌ INCORRECTO - Invalida TODO
const { mutate } = useOptimisticMutation({
  queryKey: projectsKeys.lists(),  // ← GLOBAL, causa lag
  additionalQueryKeys: [projectsKeys.all()],  // ← Más global
});

// ❌ INCORRECTO - Delay muy longo
const { isSaving } = useSaveEngine({
  delay: 1500,  // ← Usuario ve 1.5 segundos de espera
});

// ❌ INCORRECTO - Cache fragmentada
useQuery({
  queryKey: ['projects-lite'],  // ← Separada del resto
  queryFn: fetchProjectsLite,
});
```

**PATRONES CORRECTOS:**

```typescript
// ✅ CORRECTO - Scoped a organizationId
const { mutate } = useOptimisticMutation({
  queryKey: projectsKeys.list(organizationId),  // ← SPECIFIC
  additionalQueryKeys: [projectsKeys.info(projectId)],  // ← SPECIFIC
});

// ✅ CORRECTO - Delay corto (instantáneo)
const { isSaving } = useSaveEngine({
  delay: 500,  // ← Usuario no espera
});

// ✅ CORRECTO - Derivada de la cache principal con select
useQuery({
  queryKey: projectsKeys.list(organizationId),
  select: (data) => data?.map(p => ({ id: p.id, name: p.name })),
});
```

**Verificación POST-IMPLEMENTACIÓN:**
1. Abre DevTools → Network tab
2. Haz cambios en un formulario (cambiar modalidad, tipo, etc)
3. Debería ser **INSTANTÁNEO** (sin esperar)
4. Si tarda >500ms, busca invalidaciones innecesarias

**Referencia: Commit que lo arregló:**
```
- ProjectBasicDataView: delay 1500ms → 500ms
- ProjectLocationView: delay 1500ms → 500ms + remove projectsKeys.lists()
- ProjectForm: remove projectsKeys.lists()
- ProjectActivesView: remove projectsKeys.lists()
```

---

### 5.4 AUDITORÍA DE SISTEMA DE NOTIFICACIONES (TOASTS) - CRÍTICO

**REGLA DE ORO:** 
- ✅ **Toasts CENTRALIZADOS en hooks** (`onSuccessMessage`, `onErrorMessage`)
- ❌ **NUNCA toasts manuales en modals/forms** (causa duplicación)
- ❌ **NUNCA callbacks `onSuccess`/`onError` que disparen toasts en modals**

**POR QUÉ:** Si el hook tiene `onSuccessMessage` y el modal TAMBIÉN muestra toast en callback, salen **DOS toasts idénticos**.

**Checklist de Toasts:**
- [ ] ¿Los hooks (`useCreateEntity`, `useUpdateEntity`) tienen `onSuccessMessage`?
- [ ] ¿Los hooks tienen `onErrorMessage`?
- [ ] ¿Los modals/forms NUNCA llaman a `toast()` en callbacks?
- [ ] ¿Callbacks en modals SOLO manejan cierre (reset, onClose)?
- [ ] ¿NO hay `useToast()` importado en modals?

**Patrón INCORRECTO (PROHIBIDO):**

```typescript
// ❌ ProjectModal.tsx
const { toast } = useToast();

const { mutate } = useOptimisticMutation({
  onSuccessMessage: 'Proyecto actualizado',  // ← TOAST 1
});

// Luego en el modal:
callbacks: {
  onSubmitSuccess: () => {
    toast({ title: 'Proyecto actualizado' });  // ← TOAST 2 (DUPLICADO)
  }
}
```

**Patrón CORRECTO:**

```typescript
// ❌ NO importar useToast
// ❌ NO tener callbacks con toast

// ✅ ProjectForm.tsx (el hook)
export function useProjectForm() {
  return useOptimisticMutation({
    onSuccessMessage: 'Proyecto actualizado',  // ← UN ÚNICO TOAST AQUÍ
    onErrorMessage: 'Error al actualizar',
  });
}

// ✅ ProjectModal.tsx (solo cierre)
const { form, onSubmit, reset } = useProjectForm({
  onSuccess: () => {
    reset();      // ← Solo limpiar
    onClose();    // ← Solo cerrar
  },
  callbacks: {
    // ✅ SOLO callbacks específicos, NO toasts
    onImageUploadStart: () => {},  // ← Si se necesita
    onImageUploadSuccess: () => {},
  }
});
```

**Excepción permitida:** Solo toasts para UX específica del modal (subida de imagen, carga, etc.), NO para success/error de submit.

```typescript
// ✅ PERMITIDO - Toast para UX específica del modal
callbacks: {
  onImageUploadStart: () => {
    toast({ title: "Subiendo imagen..." });  // ← OK, es específico del modal
  }
}

// ❌ PROHIBIDO - Toast para success/error del formulario
callbacks: {
  onSubmitSuccess: () => {
    toast({ title: "Guardado" });  // ← NO, el hook ya lo hace
  }
}
```

**Verificación POST-IMPLEMENTACIÓN:**
1. Crea/edita una entidad
2. Debe aparecer **1 ÚNICO toast** de éxito
3. Si ves 2 toasts, busca callbacks `onSubmitSuccess`/`onSubmitError` en el modal y remover

---

### 6. AUDITORÍA DE MODALES

**REGLA:** El Modal es un ENVASE puro. Solo maneja:
- ModalLayout, ModalHeader, ModalBody, ModalFooter
- Lógica de cierre
- Toasts SOLO para UX específica del modal (image upload, loading, etc)
- **NUNCA toasts para success/error del formulario** (ver sección 5.4)

**Checklist:**
- [ ] ¿Archivo termina en `*Modal.tsx`?
- [ ] ¿Está en `src/features/{feature}/modals/`?
- [ ] ¿Importa FormPanel, ViewPanel, useFeatureForm del Form?
- [ ] ¿Callback `onSuccess` SOLO hace `reset()` y `onClose()`?
- [ ] ¿NO tiene callbacks `onSubmitSuccess` o `onSubmitError` con toasts?
- [ ] ¿NO tiene `useToast()` importado (excepto para UX específica)?
- [ ] ¿NO tiene lógica de mutations directa?
- [ ] ¿Registrado en `registerModals.ts`?

---

### 7. AUDITORÍA DE DRAWERS

**Checklist:**
- [ ] ¿Archivo está en `src/features/{feature}/drawers/` o `components/`?
- [ ] ¿Envuelve el FormFields del feature?
- [ ] ¿Usa `headerContent` prop para DrawerHeader?
- [ ] ¿Usa `DrawerSection` para organizar contenido?

---

### 8. AUDITORÍA DE UPLOADS/STORAGE

**Arquitectura 3-Buckets:**
| Bucket | Visibilidad | Propósito |
|--------|------------|-----------|
| **public-assets** | Público | Marketplace, branding, UI assets |
| **private-assets** | Privado | Documentos financieros, contratos |
| **social-assets** | Híbrido | Galerías de proyecto, fotos de bitácora |

---

### 9. AUDITORÍA DE DELETE/REPLACE PATTERN

**Checklist:**
- [ ] ¿Existe `deleteEntity` service?
- [ ] ¿Existe `replaceEntity` service (si tiene relaciones)?
- [ ] ¿Los hooks reciben `organizationId` como parámetro?
- [ ] ¿Los hooks invalidan AMBAS queries (entidad + relacionados)?
- [ ] ¿El modal usa `DeleteConfirmationForm`?

---

### 10. AUDITORÍA DE BASE DE DATOS (Supabase)

**Checklist de tablas:**
- [ ] ¿Tipos de columnas correctos?
- [ ] ¿Relaciones (FK) definidas?
- [ ] ¿Índices en columnas frecuentemente filtradas?
- [ ] ¿Constraints (NOT NULL, CHECK, UNIQUE) donde aplica?
- [ ] ¿Soft delete (`is_deleted`, `deleted_at`) si aplica?
- [ ] ¿Nombres de columnas consistentes con frontend?

**Checklist de RLS:**
- [ ] ¿Políticas SELECT / INSERT / UPDATE / DELETE según necesidad?
- [ ] ¿Filtrado por `organization_id` donde aplica?
- [ ] ¿NO hay huecos de seguridad?

---

### 11. AUDITORÍA DE FRONTEND

**Checklist de hooks:**
- [ ] ¿NO hay duplicados?
- [ ] ¿Manejo de loading/error/empty states consistente?
- [ ] ¿Tipado y validaciones donde aplica?
- [ ] ¿Query keys usando array pattern?

**Checklist de UI/UX:**
- [ ] ¿Estados vacíos, errores, permisos implementados?
- [ ] ¿Consistencia visual con la app?
- [ ] ¿Indicadores financieros usan `text-chart-positive/negative/neutral`?

---

### 12. AUDITORÍA DE CÓDIGO LIMPIO

**CRÍTICO: Eliminar TODO código de debug DURANTE la auditoría.**

```typescript
// ❌ ELIMINAR TODOS ESTOS:
console.log(...)       // Logs de debug
console.warn(...)      // Advertencias de debug
console.error(...)     // Errores de debug (excepto legítimos)
debugger               // Breakpoints olvidados
```

---

### 13. AUDITORÍA DE CALIDAD / ROBUSTEZ

**Checklist de Validaciones:**
- [ ] ¿Validaciones en frontend (Zod) Y DB (constraints)?
- [ ] ¿Concurrencia manejada?
- [ ] ¿Seguridad (nunca confiar solo en frontend)?
- [ ] ¿Autenticación usa `requireUser()`?

---

### 14. AUDITORÍA DE REFACTORIZACIÓN (Tablas, Badges, Headers)

**Checklist:**
- [ ] Tabla usa `src/components/shared/table`
- [ ] TODAS las columnas tienen un tipo semántico
- [ ] Badges usan variantes semánticas (NO hardcodeados)
- [ ] Header tiene ícono y descripción
- [ ] Entidades con avatar usan `IdentityBadge`

---

### 15. AUDITORÍA DE QUALITY GATES (Testing)

**Mínimo obligatorio:**
- [ ] ¿Los services tienen tests para happy path?
- [ ] ¿Los services manejan errores correctamente?
- [ ] ¿Las funciones de cálculo tienen tests?
- [ ] ¿Los schemas Zod validan correctamente?

---

### 16. AUDITORÍA DE ACCESIBILIDAD E I18N

**Checklist:**
- [ ] ¿ARIA labels en elementos interactivos?
- [ ] ¿Keyboard navigation funcional?
- [ ] ¿Translations completadas?
- [ ] ¿Contraste de colores adecuado?

---

## ENTREGABLES OBLIGATORIOS

1. ✅ `src/features/{feature}/AUDIT-{FEATURE}.md` completado
2. ✅ Feature code auditado y fixes aplicados
3. ✅ Todos los puntos de checklist marcados ✅ / ❌
4. ✅ Issues documentados con resolutions
5. ✅ Estado final claro (CERRADO / ABIERTO / BLOQUEADO)

---

## CONDICIÓN FINAL

El feature se marca como **CERRADO** cuando:
- ✅ TODOS los checklists tienen ✅
- ✅ NO hay issues abiertos
- ✅ Workflow corre sin errores
- ✅ Tests pasan (si aplica)

---

## REGLA POST-CIERRE: CERRADO = NO SE TOCA

Este feature está CERRADO. Cambios futuros:
1. Crear ticket separado con auditoría completa
2. No hacer cambios ad-hoc
3. Mantener los estándares documentados

---

## REFERENCIAS

- **Save Engine Docs:** `/docs/save-architecture.md`
- **Save Engine Source:** `/src/core/save-engine/`
- **Ejemplo ORGANIZATION:** `/src/features/organization/AUDIT-ORGANIZATION.md`
- **Ejemplo PROJECTS:** `/src/features/projects/AUDIT-PROJECTS.md`

---

**Este es el ÚNICO archivo de referencia para auditorías de features en Seencel.**
