# Sistema de Restricciones en Seencel

## Visión General

El sistema de restricciones en Seencel se divide en **dos conceptos claros y separados**:

1. **ComingSoonRestricted** → Funcionalidades que vienen pronto (visible pero bloqueada)
2. **PlanRestricted** → Restricciones reales según el plan de suscripción

---

## ComingSoonRestricted

### ¿Qué es?
Component que muestra funcionalidades **visibles pero bloqueadas** para todos los usuarios porque aún están en desarrollo.

### Características
- ✅ Badge negro centrado con icono de candado
- ✅ Tooltip "Próximamente" al pasar el mouse
- ✅ Bloquea completamente la interacción
- ✅ Para TODOS los usuarios (independiente del plan)

### Cuándo usar
- Nuevas secciones del sidebar que aún no están implementadas
- Funcionalidades en beta que se mostrarán pronto
- Tabs deshabilitadas que están en desarrollo

### Ubicación actual
**Sidebar items (9 total):**
- Análisis de Costos
- Movimientos
- Capital
- Finanzas
- Cómputo y Presupuesto
- Mano de Obra
- Indirectos
- Subcontratos
- Actividad

### Cómo usar
```tsx
import { ComingSoonRestricted } from "@/components/shared/restrictions";

<ComingSoonRestricted>
  <Button>Nueva Funcionalidad</Button>
</ComingSoonRestricted>
```

---

## PlanRestricted

### ¿Qué es?
Component que bloquea funcionalidades reales según el **plan de suscripción** y los **límites de recursos**.

### Características
- 🔒 Lee de la tabla `plans.features` (JSONB field)
- 🔒 Valida límites actuales vs límites del plan
- 🔒 Muestra modal de upgrade cuando se alcanza el límite
- 🔒 Solo bloquea a usuarios que NO tienen acceso

### Features validadas actualmente
| Feature | Límite | Ubicación |
|---------|--------|-----------|
| `max_projects` | Máximo de proyectos | Projects.tsx |
| `max_members` | Máximo de miembros | Members.tsx |
| `max_kanban_boards` | (REMOVIDA - era dead code) | - |
| `custom_project_color` | (REMOVIDA - era dead code) | - |
| `allow_secondary_currencies` | (REMOVIDA - era dead code) | - |
| `allow_exchange_rate` | (REMOVIDA - era dead code) | - |

### Cuándo usar
- Limitar creación de proyectos según el plan
- Limitar invitación de miembros según el plan
- Limitar cualquier recurso que tenga límites por plan

### Ubicación actual
**Usada en:**
- `src/pages/projects/Projects.tsx` → max_projects
- `src/pages/projects/ProjectActivesTab.tsx` → max_projects
- `src/pages/projects/ProjectListTab.tsx` → max_projects
- `src/pages/settings/Members.tsx` → max_members (desktop + mobile)
- `src/layouts/dashboard/components/MobileActionBar/ActionBarMobile.tsx` → Manejo genérico
- `src/layouts/dashboard/PageLayout.tsx` → Para tabs restringidas

### Cómo usar (Desktop)
```tsx
import { PlanRestricted } from "@/features/users";

<PlanRestricted 
  feature="max_members" 
  current={organizationMembers.length}
  useUpgradeModal={true}
  modalImage={FEATURE_IMAGES.MEMBERS}
  modalTitle="Alcanzaste el límite de miembros"
  modalDescription="Actualiza a un plan superior..."
>
  <Button onClick={() => openModal('member')}>
    Invitar Miembro
  </Button>
</PlanRestricted>
```

### Cómo usar (Mobile Action Bar)
```tsx
const createAction = {
  id: 'create',
  icon: Plus,
  label: 'Nuevo Proyecto',
  onClick: () => openModal('project'),
  planRestriction: {
    feature: 'max_projects',
    current: projects.length,
    modalImage: FEATURE_IMAGES.PROJECTS,
    modalTitle: 'Alcanzaste el límite de proyectos',
    modalDescription: 'Actualiza a un plan superior...'
  }
};

setActions({ create: createAction });
```

---

## Flujo de decisión: ¿Cuál usar?

```
¿Es una funcionalidad nueva que aún no existe?
  ├─ SÍ → Usa ComingSoonRestricted ✅
  └─ NO → Continúa...

¿Necesita validar límites del plan de suscripción?
  ├─ SÍ → Usa PlanRestricted ✅
  └─ NO → No uses restricción
```

---

## Cómo agregar nueva restricción de plan

### 1. Backend: Agregar feature a plans table
```sql
-- Actualizar JSONB en plans table
UPDATE plans SET features = jsonb_set(
  features, 
  '{"new_feature"}', 
  'true'
) WHERE name = 'pro';
```

### 2. Frontend: Importar y usar PlanRestricted
```tsx
import { PlanRestricted } from "@/features/users";

<PlanRestricted feature="new_feature">
  <Button>Acción Restringida</Button>
</PlanRestricted>
```

### 3. Para Mobile Action Bar
```tsx
const createAction = {
  planRestriction: {
    feature: 'new_feature',
    current: currentValue,
    modalTitle: 'Título personalizado',
    modalDescription: 'Descripción...'
  }
};
```

---

## Componentes relacionados

### Guards (en `/guards`)
- **ComingSoonRestricted.tsx** → Bloquea funcionalidades en desarrollo
- **PlanRestricted.tsx** → Bloquea por límites de plan
- **RoleRestricted.tsx** → Bloquea por rol de usuario
- **ContextRestricted.tsx** → Bloquea por contexto (proyecto/org)

### UI (en `/ui`)
- **EmptyStateBlock.tsx** → Estado vacío cuando hay restricción
- **RestrictionOverlay.tsx** → Overlay visual sobre contenido restringido

---

## Changelog de cambios

### ✅ Completado (Refactor 30/11/2025)
- ✅ Creado ComingSoonRestricted component
- ✅ Migrados 9 sidebar items a ComingSoonRestricted
- ✅ Limpiados imports muertos de PlanRestricted (SiteLogModal, MovementsList, Table)
- ✅ Removidas restricciones de dead code (exchange_rate, custom_colors, kanban)
- ✅ Confirmado uso válido solo en: Projects, Members, PageLayout, MobileActionBar

---

## Preguntas frecuentes

**P: ¿Debo agregar una nueva restricción?**
A: Solo si realmente existe un límite por plan en la BD. Si es una funcionalidad nueva, usa ComingSoonRestricted.

**P: ¿Cómo sé si una restricción existe en DB?**
A: Verifica `plans.features` JSONB field. Debe estar definida para el plan que la necesita.

**P: ¿Puedo usar PlanRestricted para coming soon?**
A: ❌ No. ComingSoonRestricted es específicamente para eso. Mantén la separación clara.

**P: ¿Qué pasa si alguien alcanza el límite?**
A: Se muestra modal de upgrade automáticamente (si `useUpgradeModal=true`).
