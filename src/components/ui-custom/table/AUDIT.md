# Table.tsx - Auditoría Completa

## Información General

| Atributo | Valor |
|----------|-------|
| Archivo Original | `src/components/ui-custom/tables-and-trees/Table.tsx` |
| Líneas de código | 1761 |
| Antigüedad estimada | +6 meses |
| Estado | Funcional pero con deuda técnica significativa |
| Fecha de auditoría | 2024-12-16 |

---

## 1. PROBLEMAS IDENTIFICADOS

### 1.1 Lógica de Dominio Embebida

| Problema | Líneas | Descripción | Severidad |
|----------|--------|-------------|-----------|
| `ProjectBadge` component | 45-113 | Componente de negocio específico embebido dentro de Table | 🔴 Alta |
| `useProjectReadOnlyContext` | 22, 288 | Contexto específico de proyecto usado para ocultar acciones | 🔴 Alta |
| Texto hardcodeado en español | múltiples | "Organización", "Seleccionado", "Limpiar Filtros", etc. | 🟡 Media |
| Lógica `movement_date` | 822-825 | Ordenamiento especial para movimientos financieros | 🟡 Media |

### 1.2 Dependencias Indebidas

```typescript
// Línea 22 - Contexto de dominio específico
import { useProjectReadOnlyContext } from "@/contexts/ProjectReadOnlyContext";

// Línea 288 - Uso del contexto
const { shouldHideActions } = useProjectReadOnlyContext();
```

**Impacto**: El componente Table no puede usarse fuera del contexto de proyectos sin modificaciones.

### 1.3 Código Duplicado

| Área | Líneas | Descripción |
|------|--------|-------------|
| Renderizado de filas (grouped) | 1170-1312 | Renderizado de filas dentro de grupos |
| Renderizado de filas (normal) | 1316-1476 | Renderizado de filas sin agrupamiento |
| Row actions dropdown | 1253-1307, 1416-1470 | Menú de acciones duplicado |
| Checkbox selection | 1183-1194, 1348-1358 | Lógica de checkbox duplicada |

**Duplicación estimada**: ~300 líneas que podrían consolidarse.

### 1.4 Props Infladas / Redundantes

```typescript
interface TableProps<T = any> {
  // ❌ DEPRECATED pero aún en uso
  emptyState?: React.ReactNode; // Línea 127 - marcado como deprecated
  
  // ❌ LEGACY - debería removerse
  headerActions?: { ... }; // Línea 220-223
  showDoubleHeader?: boolean; // Línea 224
  leftModeButtons?: { ... }; // Línea 207-211
  tabs?: string[]; // Línea 171 - reemplazado por tabsConfig
  
  // 🟡 REDUNDANTES (hacen lo mismo)
  onCardClick vs onRowClick // Líneas 149-151
  emptyState vs emptyStateConfig // Líneas 127-138
}
```

### 1.5 APIs Legacy

| API | Estado | Reemplazo |
|-----|--------|-----------|
| `tabs` + `activeTab` + `onTabChange` | Deprecated | `tabsConfig` |
| `leftModeButtons` | Deprecated | `tabsConfig` |
| `emptyState` | Deprecated | `emptyStateConfig` |
| `headerActions` + `showDoubleHeader` | Legacy | `topBar` |

---

## 2. ESTRUCTURA ACTUAL

```
Table.tsx (1761 líneas)
├── Imports (1-42)
├── ProjectBadge component (45-113) ← DOMINIO EMBEBIDO
├── TableProps interface (115-247)
├── Table component function (251-1761)
│   ├── Context hooks (288)
│   ├── Internal state (291-302)
│   ├── Handlers (312-327)
│   ├── Data filtering (330-341)
│   ├── Helper functions (348-388)
│   ├── Default content renderers (391-459)
│   ├── TopBar renderer (469-768) ← ~300 líneas
│   ├── Sort handler (771-789)
│   ├── Grouping/sorting logic (792-876)
│   ├── Selection handlers (887-929)
│   ├── Grid helpers (931-976)
│   ├── Loading skeleton (978-1024)
│   └── Main render (1031-1761)
│       ├── Desktop view (1034-1502)
│       │   ├── TopBar (1036)
│       │   ├── Legacy header (1039-1051)
│       │   ├── Column headers (1054-1106)
│       │   ├── Grouped rows (1148-1313)
│       │   ├── Normal rows (1314-1477)
│       │   ├── Footer row (1479-1502)
│       │   └── Pagination (1503-~1560)
│       └── Mobile view (1561-1761)
```

---

## 3. PLAN DE REFACTORIZACIÓN

### Fase 1: Estructura de Archivos

```
src/components/ui-custom/table/
├── Table.tsx              ← Wrapper (API pública)
├── TableDesktop.tsx       ← Vista desktop
├── TableMobile.tsx        ← Vista mobile
├── TableTopBar.tsx        ← Barra superior
├── TableRow.tsx           ← Fila individual
├── TableGroup.tsx         ← Grupo de filas
├── hooks/
│   ├── useTableSort.ts
│   ├── useTableFilter.ts
│   ├── useTablePagination.ts
│   └── useTableSelection.ts
├── types.ts               ← Tipos e interfaces
├── utils.ts               ← Utilidades
├── constants.ts           ← Constantes
└── AUDIT.md               ← Esta documentación
```

### Fase 2: Extracción de Hooks

| Hook | Responsabilidad | Estado |
|------|----------------|--------|
| `useTableSort` | Ordenamiento de columnas | ⬜ Pendiente |
| `useTableFilter` | Filtrado de datos | ⬜ Pendiente |
| `useTablePagination` | Paginación | ⬜ Pendiente |
| `useTableSelection` | Selección múltiple | ⬜ Pendiente |

### Fase 3: Desacoplamiento

| Tarea | Estado |
|-------|--------|
| Extraer `ProjectBadge` a `/features/projects/components/` | ⬜ Pendiente |
| Eliminar `useProjectReadOnlyContext` | ⬜ Pendiente |
| Agregar prop `hideActions?: boolean` como reemplazo | ⬜ Pendiente |
| Internacionalizar textos (preparar para i18n) | ⬜ Futuro |

### Fase 4: Limpieza

| Tarea | Estado |
|-------|--------|
| Marcar props deprecated con JSDoc | ⬜ Pendiente |
| Consolidar código duplicado en `TableRow` | ⬜ Pendiente |
| Simplificar lógica de `topBar` | ⬜ Pendiente |
| Remover código legacy no usado | ⬜ Futuro |

---

## 4. COMPATIBILIDAD

### Props que se mantienen (API pública estable)

```typescript
// Core props - NO MODIFICAR
columns: Column[]
data: T[]
isLoading?: boolean
className?: string

// Selection props - NO MODIFICAR
selectable?: boolean
selectedItems?: T[]
onSelectionChange?: (items: T[]) => void
getItemId?: (item: T) => string | number

// Row customization - NO MODIFICAR
getRowClassName?: (item: T) => string
onRowClick?: (item: T) => void
rowActions?: (item: T) => RowAction[]

// Sorting - NO MODIFICAR
defaultSort?: { key: string; direction: "asc" | "desc" }

// TopBar - NO MODIFICAR
topBar?: TopBarConfig

// Empty state - NO MODIFICAR
emptyStateConfig?: EmptyStateConfig
```

### Props legacy (mantener por compatibilidad, deprecar gradualmente)

```typescript
// ⚠️ DEPRECATED - Usar emptyStateConfig
emptyState?: React.ReactNode

// ⚠️ LEGACY - Usar topBar
headerActions?: HeaderActions
showDoubleHeader?: boolean
```

---

## 5. MÉTRICAS OBJETIVO

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Líneas de código (Table.tsx) | 1761 | ~200-300 |
| Componentes | 1 monolítico | 6-8 modulares |
| Hooks personalizados | 0 | 4 |
| Dependencias de dominio | 2 | 0 |
| Código duplicado | ~300 líneas | 0 |

---

## 6. CHECKLIST DE VALIDACIÓN

### Pre-refactor
- [ ] Identificar todos los lugares que usan Table
- [ ] Documentar comportamientos actuales
- [ ] Crear tests de regresión (si aplica)

### Durante refactor
- [ ] Mantener API pública idéntica
- [ ] No introducir breaking changes
- [ ] Validar cada paso con build exitoso

### Post-refactor
- [ ] Verificar que todos los usos siguen funcionando
- [ ] Documentar nuevas capacidades
- [ ] Actualizar este archivo con resultados

---

## 7. ARCHIVOS QUE USAN TABLE

Para identificar antes de refactorizar:

```bash
grep -r "import.*Table" --include="*.tsx" --include="*.ts" src/
```

---

## 8. NOTAS ADICIONALES

### Decisiones de diseño a preservar
1. **Responsive**: Desktop usa grid, mobile usa cards
2. **TopBar integrado**: Búsqueda, filtros, tabs en una barra
3. **Bulk actions**: Modo especial cuando hay selección
4. **Agrupamiento**: Soporte para agrupar filas
5. **Elementos inactivos**: Separación visual de items inactivos

### Consideraciones de rendimiento
- `useMemo` para datos filtrados/ordenados/agrupados ✅
- Paginación de 100 items ✅
- Re-renders controlados ⚠️ (puede mejorarse)

---

*Documento generado automáticamente durante auditoría de código.*
