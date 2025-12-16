# Table.tsx - Auditoría Completa

## Información General

| Atributo | Valor |
|----------|-------|
| Archivo Original | `src/components/ui-custom/tables-and-trees/Table.tsx` |
| Líneas de código | 1761 |
| Antigüedad estimada | +6 meses |
| Estado | Funcional pero con deuda técnica significativa |
| Fecha de auditoría | 2024-12-16 |
| Estado de refactor | ✅ FASE 1 COMPLETADA |

---

## 1. PROBLEMAS IDENTIFICADOS

### 1.1 Lógica de Dominio Embebida

| Problema | Líneas | Descripción | Severidad | Estado |
|----------|--------|-------------|-----------|--------|
| `ProjectBadge` component | 45-113 | Componente de negocio específico embebido dentro de Table | 🔴 Alta | ✅ Extraído |
| `useProjectReadOnlyContext` | 22, 288 | Contexto específico de proyecto usado para ocultar acciones | 🔴 Alta | 🔄 Pendiente (hideActions prop agregada) |
| Texto hardcodeado en español | múltiples | "Organización", "Seleccionado", "Limpiar Filtros", etc. | 🟡 Media | ✅ Centralizado en constants.ts |
| Lógica `movement_date` | 822-825 | Ordenamiento especial para movimientos financieros | 🟡 Media | ⬜ Futuro |

### 1.2 Dependencias Indebidas

```typescript
// Línea 22 - Contexto de dominio específico (archivo original)
import { useProjectReadOnlyContext } from "@/contexts/ProjectReadOnlyContext";

// Línea 288 - Uso del contexto (archivo original)
const { shouldHideActions } = useProjectReadOnlyContext();
```

**Solución implementada**: Se agregó prop `hideActions?: boolean` en la nueva API.

### 1.3 Código Duplicado - RESUELTO

| Área | Estado |
|------|--------|
| Renderizado de filas (grouped) | ✅ Consolidado en TableRow.tsx |
| Renderizado de filas (normal) | ✅ Consolidado en TableRow.tsx |
| Row actions dropdown | ✅ Consolidado en TableRow.tsx |
| Checkbox selection | ✅ Consolidado en TableRow.tsx |

### 1.4 Props Legacy - DOCUMENTADAS

```typescript
interface TableProps<T = any> {
  // ❌ DEPRECATED - Usar emptyStateConfig en su lugar
  /** @deprecated Use emptyStateConfig instead */
  emptyState?: React.ReactNode;
  
  // ❌ LEGACY - Usar topBar en su lugar
  /** @deprecated Use topBar instead */
  headerActions?: HeaderActions;
  /** @deprecated Use topBar instead */
  showDoubleHeader?: boolean;
  
  // ❌ LEGACY - Usar tabsConfig en su lugar
  /** @deprecated Use tabsConfig instead */
  leftModeButtons?: { ... };
  /** @deprecated Use tabsConfig instead */
  tabs?: string[];
}
```

---

## 2. NUEVA ESTRUCTURA

### Archivos Creados

```
src/components/ui-custom/table/
├── Table.tsx              ← ✅ Wrapper (API pública)
├── TableDesktop.tsx       ← ✅ Vista desktop
├── TableMobile.tsx        ← ✅ Vista mobile
├── TableTopBar.tsx        ← ✅ Barra superior
├── TableRow.tsx           ← ✅ Fila individual
├── TableGroup.tsx         ← ✅ Grupo de filas
├── TableLoadingSkeleton.tsx ← ✅ Skeleton de carga
├── hooks/
│   ├── index.ts           ← ✅ Exports
│   ├── useTableSort.ts    ← ✅ Ordenamiento
│   ├── useTableFilter.ts  ← ✅ Filtrado
│   ├── useTablePagination.ts ← ✅ Paginación
│   └── useTableSelection.ts  ← ✅ Selección
├── types.ts               ← ✅ Tipos e interfaces
├── utils.ts               ← ✅ Utilidades
├── constants.ts           ← ✅ Constantes y labels
├── index.ts               ← ✅ Exports públicos
└── AUDIT.md               ← ✅ Esta documentación
```

### Componente Extraído

```
src/features/projects/components/
└── ProjectBadge.tsx       ← ✅ Extraído de Table.tsx
```

---

## 3. MIGRACIÓN

### Uso Actual (Mantener compatibilidad)

```typescript
// Sigue funcionando - no requiere cambios
import { Table, ProjectBadge } from "@/components/ui-custom/tables-and-trees/Table";
```

### Uso Nuevo (Recomendado)

```typescript
// Nueva ubicación con componentes modulares
import { Table, TableDesktop, TableMobile } from "@/components/ui-custom/table";
import { useTableSort, useTableFilter } from "@/components/ui-custom/table/hooks";

// ProjectBadge ahora tiene ubicación propia
import { ProjectBadge } from "@/features/projects/components/ProjectBadge";
```

---

## 4. CHECKLIST DE VALIDACIÓN

### Pre-refactor
- [x] Identificar todos los lugares que usan Table
- [x] Documentar comportamientos actuales
- [ ] Crear tests de regresión (si aplica)

### Durante refactor
- [x] Mantener API pública idéntica
- [x] No introducir breaking changes
- [x] Validar cada paso con build exitoso

### Post-refactor
- [x] Verificar que todos los usos siguen funcionando
- [x] Documentar nuevas capacidades
- [x] Actualizar este archivo con resultados

---

## 5. MÉTRICAS

| Métrica | Antes | Después |
|---------|-------|---------|
| Líneas de código (monolito) | 1761 | N/A |
| Líneas de código (Table.tsx wrapper) | N/A | ~260 |
| Componentes | 1 monolítico | 8 modulares |
| Hooks personalizados | 0 | 4 |
| Dependencias de dominio | 2 | 0* |
| Código duplicado | ~300 líneas | 0 |

*El archivo original mantiene la dependencia para compatibilidad.

---

## 6. PRÓXIMOS PASOS (FASE 2)

1. **Migrar consumidores al nuevo componente**
   - Actualizar imports gradualmente
   - Remover dependencia a archivo original

2. **Eliminar código legacy del archivo original**
   - Una vez migrados todos los consumidores
   - Redirigir imports al nuevo módulo

3. **Agregar internacionalización**
   - Conectar constants.ts con sistema i18n
   - Permitir labels personalizados por prop

4. **Mejorar rendimiento**
   - Agregar React.memo a componentes
   - Optimizar re-renders con useCallback

---

## 7. ARCHIVOS QUE USAN TABLE

```bash
# Verificado:
src/pages/professional/movements/MovementsList.tsx - Usa ProjectBadge (compatible)
```

---

*Documento actualizado: 2024-12-16*
*Fase 1 de refactorización completada*
