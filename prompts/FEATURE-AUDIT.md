# FEATURE AUDIT - Prompt Oficial de Auditoría de Seencel

> Este es el prompt de auditoría 360° oficial para cerrar features de Seencel.
> Combina los estándares de arquitectura, páginas, modales, drawers, uploads, y más.

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

### Referencias de Arquitectura
- `prompts/00-Architecture.md` - Arquitectura base de features
- `prompts/01-Pages.md` - Estándar de páginas
- `prompts/02-Modals.md` - Estándar de modales con formularios
- `prompts/03-Drawers.md` - Estándar de drawers
- `prompts/03-Uploads.md` - Sistema de storage y uploads
- `prompts/04-Replacement.md` - Patrón Delete/Replace
- `prompts/PAGE-REFACT.md` - Arquitectura 3 capas (Page → Layout → View)
- `prompts/tables/{feature}.md` - Documentación de tablas específicas

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
│   ├── components/      ← Componentes específicos del feature
│   ├── views/           ← Views agnósticas al layout (si aplica)
│   ├── modals/          ← Modales del feature
│   │   └── forms/       ← FormFields agnósticos
│   ├── constants/       ← Enums, configuraciones
│   ├── types/           ← Tipos TypeScript
│   ├── schemas/         ← Validaciones Zod
│   └── index.ts         ← Barrel exports
├── src/pages/{feature}/ ← Páginas (orquestadores)
└── prompts/tables/{feature}.md ← Documentación de tablas
```

---

### 2. AUDITORÍA DE ARQUITECTURA DE FEATURES

**Referencia:** `prompts/00-Architecture.md`

**Checklist de estructura:**
- [ ] ¿Carpeta `services/` existe con funciones puras async?
- [ ] ¿Carpeta `hooks/` existe y los hooks solo llaman a services?
- [ ] ¿Carpeta `types/` tiene todos los tipos centralizados?
- [ ] ¿Carpeta `schemas/` tiene validaciones Zod?
- [ ] ¿Carpeta `constants/` tiene enums y configuraciones?
- [ ] ¿Carpeta `components/` tiene componentes específicos?
- [ ] ¿Carpeta `modals/` y `modals/forms/` si hay formularios?
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

---

### 3. AUDITORÍA DE PÁGINAS (3 CAPAS)

**Referencia:** `prompts/PAGE-REFACT.md` + `prompts/01-Pages.md`

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

### 4. AUDITORÍA DE MODALES

**Referencia:** `prompts/02-Modals.md`

**Arquitectura esperada:**
```
forms/
├── FeatureFormFields.tsx    → Campos del formulario (CEREBRO)

modals/
├── FeatureModal.tsx         → Contenedor del modal (ENVASE)
```

**Checklist de FormFields (Cerebro):**
- [ ] ¿Contiene `react-hook-form` con `zodResolver`?
- [ ] ¿Contiene todos los hooks de datos (`useQuery`, `useMutation`)?
- [ ] ¿Acepta props `hideActions` y `formRef` para control externo?
- [ ] ¿NO importa componentes de modal (`ModalLayout`, etc.)?
- [ ] ¿Usa `ref={formRef}` en el `<form>`?
- [ ] ¿Condiciona botones con `{!hideActions && ...}`?

**Checklist de Modal (Envase):**
- [ ] ¿Usa `headerContent` prop para ModalHeader?
- [ ] ¿Usa `footerContent` prop para ModalFooter (footer fijo)?
- [ ] ¿ModalBody va como children de ModalLayout?
- [ ] ¿Pasa `hideActions={true}` al FormFields?
- [ ] ¿Usa `formRef.current.requestSubmit()` para submit?

**Checklist de registro:**
- [ ] ¿Registrado en `registerModals.ts`?
- [ ] ¿Exportado en `index.ts` del feature?

---

### 5. AUDITORÍA DE DRAWERS

**Referencia:** `prompts/03-Drawers.md`

**Arquitectura esperada:**
```
components/
├── FeatureDetailContent.tsx    → Contenido agnóstico (CEREBRO)
├── FeatureDetailDrawer.tsx     → Contenedor del drawer (ENVASE)
```

**Checklist:**
- [ ] ¿Usa `headerContent` prop para DrawerHeader?
- [ ] ¿DrawerBody va como children de DrawerLayout?
- [ ] ¿Usa `DrawerSection` para organizar contenido?
- [ ] ¿Content acepta `hideActions` opcional?
- [ ] ¿Content NO importa `DrawerLayout`?

---

### 6. AUDITORÍA DE UPLOADS/STORAGE

**Referencia:** `prompts/03-Uploads.md`

**Si el feature usa archivos/imágenes:**
- [ ] ¿Usa `uploadFile()` de `@/lib/storage`?
- [ ] ¿Usa entity types definidos (no hardcodea bucket names)?
- [ ] ¿Incluye `link_to` para media_links automáticos?
- [ ] ¿Usa `created_by_member_id` (NO user.id)?
- [ ] ¿Las categorías están en el constraint de PostgreSQL?

---

### 7. AUDITORÍA DE DELETE/REPLACE PATTERN

**Referencia:** `prompts/04-Replacement.md`

**Si el feature tiene eliminación de entidades con relaciones:**
- [ ] ¿Existe `deleteEntity` service?
- [ ] ¿Existe `replaceEntity` service (si tiene relaciones)?
- [ ] ¿Los hooks reciben `organizationId` como parámetro?
- [ ] ¿Los hooks invalidan AMBAS queries (entidad + relacionados)?
- [ ] ¿El modal usa `DeleteConfirmationForm`?
- [ ] ¿Se pasa `mode`, `consequences`, `replacementOptions` correctamente?

---

### 8. AUDITORÍA DE BASE DE DATOS (Supabase)

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

### 9. AUDITORÍA DE FRONTEND

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

**Output esperado:** "FE Findings" + "FE Fixes" (por archivo, con cambios propuestos)

---

### 10. AUDITORÍA DE CALIDAD / ROBUSTEZ

**Checklist:**
- [ ] ¿Manejo de errores real? (logs, try/catch, mensajes al usuario)
- [ ] ¿Validaciones en frontend Y DB (constraints)?
- [ ] ¿Concurrencia manejada? (updates que pisan datos, optimistic updates)
- [ ] ¿Seguridad? (nunca confiar en frontend para reglas críticas)
- [ ] ¿Autenticación usa `requireUser()` con userId correcto (NO auth.user.id)?

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
| Arquitectura 3 Capas | ✅/⚠️/❌ | ... |
| Modales | ✅/⚠️/❌ | ... |
| Drawers | ✅/⚠️/❌ | ... |
| Uploads | ✅/⚠️/❌ | ... |
| Delete/Replace | ✅/⚠️/❌ | ... |
| DB (Tablas/Views) | ✅/⚠️/❌ | ... |
| RLS | ✅/⚠️/❌ | ... |
| Hooks | ✅/⚠️/❌ | ... |
| UI/UX | ✅/⚠️/❌ | ... |
| Performance | ✅/⚠️/❌ | ... |

### Top 10 Riesgos/Bugs
| # | Severidad | Descripción | Archivo/Línea |
|---|-----------|-------------|---------------|
| 1 | 🔴 Crítica | ... | ... |
| 2 | 🟠 Alta | ... | ... |
| ... | ... | ... | ... |

### Hallazgos Detallados

#### DB Findings
- ...

#### FE Findings
- ...
```

---

### ENTREGABLE 2: PLAN DE EJECUCIÓN

```markdown
## PLAN DE EJECUCIÓN: {NOMBRE_DEL_FEATURE}

### Fase 0: Backups y Medidas Anti-Rotura
- [ ] Checkpoint creado
- [ ] Identificar archivos que se van a modificar

### Fase 1: DB (Migraciones Pequeñas)
1. [ ] Migración 1: ...
2. [ ] Migración 2: ...
- Verificación: ...

### Fase 2: Frontend (Refactors Mínimos)
1. [ ] Archivo 1: ...
2. [ ] Archivo 2: ...
- Verificación: ...

### Fase 3: Performance + Limpieza
1. [ ] ...
- Verificación: ...

### Checklist Final "Definition of Done"
- [ ] No hay errores en consola ni runtime
- [ ] DB tiene estructura correcta
- [ ] RLS consistente y segura
- [ ] Hooks consistentes, sin duplicados
- [ ] UI completa (loading/error/empty/permisos)
- [ ] Documentación creada en `docs/features/{feature}.md`
```

---

### ENTREGABLE 3: CAMBIOS CONCRETOS

```markdown
## CAMBIOS CONCRETOS: {NOMBRE_DEL_FEATURE}

### SQL Propuesto
(Migraciones pequeñas, ordenadas)

```sql
-- Migración 1: ...
...

-- Migración 2: ...
...
```

### Cambios por Archivo
| Archivo | Qué Cambia | Snippet |
|---------|------------|---------|
| ... | ... | ... |

### Decisiones Pendientes
| ID | Descripción | Alternativa A | Alternativa B | Recomendación |
|----|-------------|---------------|---------------|---------------|
| D1 | ... | ... | ... | ... |
```

---

## CONDICIÓN FINAL ("CERRADO")

El feature se considera **cerrado** cuando:

- [ ] No hay errores en consola ni en runtime
- [ ] DB tiene estructura correcta y lecturas principales por Views cuando corresponde
- [ ] RLS consistente y segura
- [ ] Arquitectura de feature sigue `prompts/00-Architecture.md`
- [ ] Páginas siguen `prompts/PAGE-REFACT.md` (3 capas)
- [ ] Modales siguen `prompts/02-Modals.md`
- [ ] Drawers siguen `prompts/03-Drawers.md`
- [ ] Uploads siguen `prompts/03-Uploads.md`
- [ ] Delete/Replace sigue `prompts/04-Replacement.md`
- [ ] Hooks consistentes, sin duplicados y sin lógica redundante
- [ ] UI completa (loading/error/empty/permisos) y consistente
- [ ] Documentación del feature creada: `docs/features/{feature}.md` con:
  - Propósito del feature
  - Tablas/Views usadas
  - RLS resumen
  - Hooks principales
  - Flujo de datos
  - Checklist de mantenimiento

---

## PROCESO DE AUDITORÍA

1. **Primero**: Entregar ENTREGABLE 1 (AUDIT REPORT)
2. **NO implementar nada todavía**
3. **Usuario revisa y aprueba**
4. **Después**: Entregar ENTREGABLE 2 (PLAN DE EJECUCIÓN)
5. **Usuario revisa y aprueba**
6. **Finalmente**: Implementar ENTREGABLE 3 (CAMBIOS CONCRETOS) paso a paso

---

## REFERENCIAS RÁPIDAS

| Documento | Descripción |
|-----------|-------------|
| `prompts/00-Architecture.md` | Arquitectura de features |
| `prompts/01-Pages.md` | Estándar de páginas |
| `prompts/02-Modals.md` | Estándar de modales |
| `prompts/03-Drawers.md` | Estándar de drawers |
| `prompts/03-Uploads.md` | Sistema de storage |
| `prompts/04-Replacement.md` | Patrón Delete/Replace |
| `prompts/PAGE-REFACT.md` | Arquitectura 3 capas |
| `prompts/MASTER PROMPT.md` | Reglas maestras |
| `prompts/tables/{feature}.md` | Documentación de tablas |
| `replit.md` | Contexto del proyecto |

---

**Este es el prompt oficial de auditoría. Úsalo cada vez que necesites cerrar un feature de Seencel.** ✅
