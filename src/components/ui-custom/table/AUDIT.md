# Table.tsx - Auditoría y Refactorización Completa

## Información General

| Atributo | Valor |
|----------|-------|
| Archivo Original | `src/components/ui-custom/tables-and-trees/Table.tsx` |
| Líneas de código original | 1761 |
| Nueva ubicación | `src/components/ui-custom/table/` |
| Antigüedad estimada | +6 meses |
| Fecha de auditoría | 2024-12-16 |
| Estado | ✅ FASE 1 COMPLETADA - Nueva arquitectura lista |

---

## Resumen Ejecutivo

Se ha creado una nueva arquitectura modular para el componente Table que:

1. **Mantiene compatibilidad total**: El archivo original `tables-and-trees/Table.tsx` sigue funcionando sin cambios
2. **Ofrece nueva arquitectura**: Componentes modulares en `table/` para uso futuro
3. **Extrae lógica de dominio**: `ProjectBadge` movido a `features/projects/components/`
4. **Centraliza utilidades**: Hooks, tipos, constantes y utilidades en archivos separados

---

## 1. PROBLEMAS IDENTIFICADOS Y RESUELTOS

### 1.1 Lógica de Dominio Embebida

| Problema | Estado | Solución |
|----------|--------|----------|
| `ProjectBadge` embebido | ✅ Resuelto | Extraído a `src/features/projects/components/ProjectBadge.tsx` |
| `useProjectReadOnlyContext` | ✅ Resuelto | Nuevo wrapper usa contexto con fallback seguro |
| Texto hardcodeado en español | ✅ Resuelto | Centralizado en `constants.ts` |

### 1.2 Código Duplicado

| Área | Estado |
|------|--------|
| Renderizado de filas | ✅ Consolidado en `TableRow.tsx` |
| Row actions dropdown | ✅ Consolidado en `TableRow.tsx` |
| Checkbox selection | ✅ Consolidado en `TableRow.tsx` |
| Loading skeleton | ✅ Extraído a `TableLoadingSkeleton.tsx` |

### 1.3 Selección Controlada/No Controlada

El hook `useTableSelection` ahora soporta ambos modos:
- **Controlado**: Cuando se provee `onSelectionChange`, usa `selectedItems` externo
- **No controlado**: Cuando no hay `onSelectionChange`, mantiene estado interno inicializado desde `selectedItems`

---

## 2. ESTRUCTURA NUEVA

```
src/components/ui-custom/table/
├── Table.tsx              ← Wrapper con API pública compatible
├── TableDesktop.tsx       ← Vista desktop
├── TableMobile.tsx        ← Vista mobile  
├── TableTopBar.tsx        ← Barra superior con búsqueda, filtros, tabs
├── TableRow.tsx           ← Fila individual + InactiveSeparator
├── TableGroup.tsx         ← Grupo de filas con header
├── TableLoadingSkeleton.tsx ← Skeleton de carga responsive
├── hooks/
│   ├── index.ts           ← Exports públicos
│   ├── useTableSort.ts    ← Ordenamiento de columnas
│   ├── useTableFilter.ts  ← Filtrado y búsqueda
│   ├── useTablePagination.ts ← Paginación
│   └── useTableSelection.ts  ← Selección (controlada/no controlada)
├── types.ts               ← Tipos e interfaces TypeScript
├── utils.ts               ← Funciones utilitarias puras
├── constants.ts           ← Constantes y labels (preparado para i18n)
├── index.ts               ← Exports públicos del módulo
└── AUDIT.md               ← Esta documentación

src/features/projects/components/
└── ProjectBadge.tsx       ← Componente extraído de Table.tsx
```

---

## 3. ESTRATEGIA DE MIGRACIÓN

### Fase Actual: Coexistencia

- **Archivo original** (`tables-and-trees/Table.tsx`): Sigue siendo el punto de importación principal
- **Nueva arquitectura** (`table/`): Lista para adopción gradual
- **ProjectBadge**: Re-exportado desde archivo original para compatibilidad

### Importaciones Actuales (Sin cambios requeridos)

```typescript
// Sigue funcionando - no requiere cambios
import { Table, ProjectBadge } from "@/components/ui-custom/tables-and-trees/Table";
```

### Importaciones Nuevas (Para nuevos desarrollos)

```typescript
// Nueva ubicación modular
import { Table } from "@/components/ui-custom/table";
import { useTableSort, useTableFilter } from "@/components/ui-custom/table/hooks";
import { ProjectBadge } from "@/features/projects/components/ProjectBadge";
```

---

## 4. HOOKS CREADOS

### useTableSort
Maneja ordenamiento de columnas con soporte para:
- Tipos: string, number, date
- Dirección: asc, desc, null (reset)
- Estado inicial configurable

### useTableFilter  
Maneja filtrado y búsqueda:
- Búsqueda interna o externa (controlada)
- Filtros múltiples
- Limpieza de filtros

### useTablePagination
Maneja paginación:
- Páginas configurables (default: 100 items)
- Navegación: next, prev, first, last
- Cálculo automático de páginas

### useTableSelection
Maneja selección múltiple:
- **Modo controlado**: Con `onSelectionChange`, usa estado externo
- **Modo no controlado**: Sin handler, mantiene estado interno
- Selección de página completa
- Clear selection

---

## 5. MÉTRICAS

| Métrica | Antes | Después |
|---------|-------|---------|
| Líneas (monolito) | 1761 | N/A |
| Líneas (wrapper nuevo) | N/A | ~260 |
| Componentes | 1 | 8 |
| Hooks | 0 | 4 |
| Archivos de tipos | 0 | 1 |
| Archivos de utils | 0 | 1 |
| Archivos de constants | 0 | 1 |

---

## 6. PRÓXIMOS PASOS (FASE 2)

### Migración Gradual
1. Actualizar imports en nuevos componentes a usar `@/components/ui-custom/table`
2. Migrar componentes existentes uno a uno
3. Deprecar archivo original cuando migración esté completa

### Mejoras Futuras
1. **Internacionalización**: Conectar `constants.ts` con sistema i18n
2. **Performance**: Agregar React.memo a componentes hijos
3. **Testing**: Agregar tests unitarios para hooks
4. **Virtualización**: Para listas muy largas (>1000 items)

---

## 7. VALIDACIÓN

### Checklist Pre-Refactor
- [x] Identificar lugares que usan Table
- [x] Documentar comportamientos actuales
- [x] Crear nueva estructura modular

### Checklist Durante Refactor
- [x] Mantener API pública idéntica
- [x] No introducir breaking changes
- [x] Build exitoso

### Checklist Post-Refactor
- [x] Archivo original sigue funcionando
- [x] Nueva arquitectura lista para uso
- [x] Documentación actualizada
- [x] ProjectBadge extraído correctamente

---

*Documento creado: 2024-12-16*
*Fase 1 de refactorización completada exitosamente*
