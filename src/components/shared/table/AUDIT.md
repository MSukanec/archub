# Table.tsx - Auditoría y Refactorización Completa

## Información General

| Atributo | Valor |
|----------|-------|
| Archivo Original (LEGACY) | `src/components/ui-custom/tables-and-trees/Table.tsx` |
| Líneas de código original | 1761 |
| Nueva ubicación (MODULAR) | `src/components/shared/table/` |
| Antigüedad estimada | +6 meses |
| Fecha de auditoría | 2024-12-16 |
| Estado | ✅ FASE 1 COMPLETADA - Nueva arquitectura lista |

---

## Resumen Ejecutivo

Se ha creado una nueva arquitectura modular para el componente Table que:

1. **Mantiene compatibilidad total**: El archivo original `tables-and-trees/Table.tsx` sigue funcionando sin cambios para todos los consumidores actuales
2. **Ofrece nueva arquitectura**: Componentes modulares en `shared/table/` para uso futuro y migración gradual
3. **ProjectBadge eliminado**: Ya no existe como componente separado - la funcionalidad de badge de proyecto está embebida en el Table.tsx legacy usando el Badge común de shadcn
4. **Centraliza utilidades**: Hooks, tipos, constantes y utilidades en archivos separados
5. **Sistema i18n**: Nuevo sistema de internacionalización en `src/lib/i18n/` integrado con las constantes de la tabla

---

## 1. ESTRUCTURA DE ARCHIVOS

### 1.1 Nueva Arquitectura Modular

```
src/components/shared/table/
├── Table.tsx                 ← Componente wrapper principal (nuevo)
├── TableDesktop.tsx          ← Vista para pantallas desktop
├── TableMobile.tsx           ← Vista para pantallas móviles (cards)
├── TableTopBar.tsx           ← Barra superior con búsqueda, filtros, tabs
├── TableRow.tsx              ← Fila individual de tabla + InactiveSeparator
├── TableGroup.tsx            ← Grupo de filas con header colapsable
├── TableLoadingSkeleton.tsx  ← Skeleton de carga responsive
├── hooks/
│   ├── index.ts              ← Exports públicos de hooks
│   ├── useTableSort.ts       ← Hook de ordenamiento
│   ├── useTableFilter.ts     ← Hook de filtrado y búsqueda
│   ├── useTablePagination.ts ← Hook de paginación
│   └── useTableSelection.ts  ← Hook de selección múltiple
├── types.ts                  ← Tipos e interfaces TypeScript
├── utils.ts                  ← Funciones utilitarias puras
├── constants.ts              ← Constantes y labels (integrado con i18n)
├── index.ts                  ← Exports públicos del módulo
└── AUDIT.md                  ← Esta documentación
```

### 1.2 Archivo Legacy (SIN CAMBIOS)

```
src/components/ui-custom/tables-and-trees/
└── Table.tsx                 ← Archivo original monolítico (1761 líneas)
                                 Sigue siendo el punto de importación principal
                                 Incluye ProjectBadge como función interna
```

### 1.3 Sistema de Internacionalización

```
src/lib/i18n/
├── index.tsx                 ← Provider, hook useI18n, contexto
└── translations/
    ├── es.ts                 ← Traducciones en español
    └── en.ts                 ← Traducciones en inglés
```

---

## 2. DESCRIPCIÓN DE CADA ARCHIVO

### 2.1 Componentes de Tabla (`src/components/shared/table/`)

#### `Table.tsx` (nuevo, ~260 líneas)
**Propósito**: Wrapper principal que orquesta todos los sub-componentes.
**Responsabilidades**:
- Determina si mostrar vista desktop o mobile según breakpoint
- Integra todos los hooks (sort, filter, pagination, selection)
- Renderiza TableTopBar + TableDesktop/TableMobile
- Mantiene API pública compatible con el Table legacy

#### `TableDesktop.tsx`
**Propósito**: Renderizado de tabla para pantallas grandes.
**Responsabilidades**:
- Renderiza `<table>` HTML con headers y filas
- Maneja sorting al hacer click en headers
- Renderiza columnas con sus configuraciones
- Usa TableRow para cada fila
- Usa TableGroup para agrupaciones

#### `TableMobile.tsx`
**Propósito**: Renderizado de tabla como cards para móviles.
**Responsabilidades**:
- Transforma filas en cards verticales
- Muestra campos configurados como "mobile visible"
- Mantiene funcionalidad de selección y acciones

#### `TableTopBar.tsx`
**Propósito**: Barra superior de la tabla.
**Responsabilidades**:
- Input de búsqueda (interna o controlada externamente)
- Tabs de filtrado rápido
- Dropdowns de filtros adicionales
- Contador de selección y botón de acción masiva
- Botón de "nuevo" elemento

#### `TableRow.tsx`
**Propósito**: Fila individual de la tabla.
**Responsabilidades**:
- Renderiza celdas según configuración de columnas
- Checkbox de selección (si habilitado)
- Menú de acciones (dropdown con editar, eliminar, etc.)
- Estilos de fila activa/inactiva
- InactiveSeparator: línea visual que separa items activos de inactivos

#### `TableGroup.tsx`
**Propósito**: Grupo de filas con header colapsable.
**Responsabilidades**:
- Header de grupo con nombre y contador
- Funcionalidad de colapsar/expandir
- Renderiza TableRow para cada item del grupo

#### `TableLoadingSkeleton.tsx`
**Propósito**: Estado de carga de la tabla.
**Responsabilidades**:
- Skeleton animado responsive
- Muestra número configurable de filas ficticias
- Se adapta a desktop/mobile

### 2.2 Hooks (`src/components/shared/table/hooks/`)

#### `useTableSort.ts`
**Propósito**: Manejo de ordenamiento de columnas.
**API**:
```typescript
const { sortKey, sortDirection, handleSort, resetSort } = useTableSort({
  initialSortKey: 'name',
  initialSortDirection: 'asc'
});
```
**Características**:
- Soporta tipos: string, number, date
- Direcciones: 'asc', 'desc', null (sin ordenar)
- Estado inicial configurable

#### `useTableFilter.ts`
**Propósito**: Manejo de filtrado y búsqueda.
**API**:
```typescript
const { 
  searchTerm, 
  setSearchTerm, 
  activeFilters, 
  setFilter, 
  clearFilters 
} = useTableFilter({
  externalSearchTerm,
  onSearchChange
});
```
**Características**:
- Búsqueda interna o controlada externamente
- Filtros múltiples por key-value
- Limpieza de todos los filtros

#### `useTablePagination.ts`
**Propósito**: Manejo de paginación.
**API**:
```typescript
const { 
  currentPage, 
  totalPages, 
  paginatedItems, 
  goToPage, 
  nextPage, 
  prevPage 
} = useTablePagination({
  items,
  pageSize: 100
});
```
**Características**:
- Tamaño de página configurable (default: 100)
- Navegación: next, prev, first, last, goToPage
- Cálculo automático de páginas

#### `useTableSelection.ts`
**Propósito**: Manejo de selección múltiple.
**API**:
```typescript
const { 
  selectedItems, 
  toggleItem, 
  toggleAll, 
  clearSelection, 
  isSelected, 
  isAllSelected 
} = useTableSelection({
  items,
  selectedItems: externalSelectedItems,
  onSelectionChange
});
```
**Características**:
- **Modo controlado**: Si se provee `onSelectionChange`, usa estado externo
- **Modo no controlado**: Si no hay handler, mantiene estado interno
- Selección individual y de página completa

### 2.3 Archivos de Soporte

#### `types.ts`
**Propósito**: Definiciones TypeScript para todo el sistema de tabla.
**Contenido**:
- `TableColumn<T>`: Configuración de columna
- `TableProps<T>`: Props del componente Table
- `RowAction<T>`: Configuración de acciones por fila
- `FilterOption`: Opciones de filtrado
- `TabConfig`: Configuración de tabs
- Tipos auxiliares para sorting, pagination, etc.

#### `utils.ts`
**Propósito**: Funciones utilitarias puras.
**Contenido**:
- `sortItems()`: Ordenar array por key y dirección
- `filterItems()`: Filtrar array por término de búsqueda
- `groupItems()`: Agrupar items por key
- `getNestedValue()`: Acceder a propiedades anidadas (ej: "user.name")

#### `constants.ts`
**Propósito**: Constantes y labels de UI.
**Contenido**:
- `TABLE_LABELS`: Labels por defecto en español
- `getTableLabels(locale)`: Función que retorna labels según idioma
- Integración con sistema i18n de `src/lib/i18n/`

#### `index.ts`
**Propósito**: Exports públicos del módulo.
**Contenido**:
```typescript
export { Table } from './Table';
export { TableDesktop } from './TableDesktop';
export { TableMobile } from './TableMobile';
// ... todos los componentes y hooks
```

### 2.4 Sistema i18n (`src/lib/i18n/`)

#### `index.tsx`
**Propósito**: Provider y hook de internacionalización.
**Contenido**:
- `I18nProvider`: Contexto React que envuelve la app
- `useI18n()`: Hook para acceder a traducciones y cambiar idioma
- Persistencia en localStorage
- Detección automática del idioma del navegador

**API**:
```typescript
const { locale, setLocale, t } = useI18n();

// Cambiar idioma
setLocale('en');

// Acceder a traducción
t('table.search'); // "Buscar..." o "Search..."
```

#### `translations/es.ts`
**Propósito**: Traducciones en español.
**Contenido**: Objeto con todas las strings de UI en español.

#### `translations/en.ts`
**Propósito**: Traducciones en inglés.
**Contenido**: Objeto con todas las strings de UI en inglés.

---

## 3. ESTADO ACTUAL DE MIGRACIÓN

### ¿Qué está funcionando ahora?

| Componente | Estado | Notas |
|------------|--------|-------|
| Table legacy (`tables-and-trees/`) | ✅ Activo | Todos los consumidores lo usan |
| Table modular (`shared/table/`) | ✅ Listo | Creado pero NO migrado |
| ProjectBadge | ❌ Eliminado | Funcionalidad en Table legacy |
| Sistema i18n | ✅ Listo | Falta agregar Provider al App shell |

### Importaciones Actuales (Todos los consumidores)

```typescript
// Esto sigue funcionando - NO HAY CAMBIOS
import { Table } from "@/components/ui-custom/tables-and-trees/Table";
```

### Importaciones Nuevas (Para FUTURA migración)

```typescript
// Cuando se migre, será:
import { Table } from "@/components/shared/table";
import { useTableSort, useTableFilter } from "@/components/shared/table/hooks";
```

---

## 4. PROBLEMAS CONOCIDOS

### 4.1 Error de RoleRestricted (Pre-existente)
- **Error**: "Invalid hook call" en RoleRestricted.tsx línea 22
- **Causa**: Problema de Hot Module Replacement o React duplicado
- **Impacto**: No afecta producción, solo desarrollo
- **Relación con refactor**: NINGUNA - es problema pre-existente

### 4.2 ProjectBadge Deprecado
- **Antes**: Existía como componente separado en `features/projects/`
- **Ahora**: Eliminado - funcionalidad integrada en Table.tsx legacy
- **Razón**: Era un wrapper simple sobre Badge de shadcn

---

## 5. PRÓXIMOS PASOS (FASE 2)

### 5.1 Integrar I18nProvider
Agregar `<I18nProvider>` al App shell para habilitar cambio de idioma en runtime.

### 5.2 Migración de Consumidores
1. Identificar todos los lugares que importan de `tables-and-trees/Table`
2. Migrar uno a uno a `shared/table`
3. Validar que funcionen igual
4. Deprecar archivo legacy cuando todos estén migrados

### 5.3 Mejoras Opcionales
- React.memo en componentes hijos para performance
- Tests unitarios para hooks
- Virtualización para listas >1000 items

---

## 6. MÉTRICAS

| Métrica | Antes | Después |
|---------|-------|---------|
| Líneas (monolito) | 1761 | Mantenido sin cambios |
| Líneas (wrapper nuevo) | N/A | ~260 |
| Componentes | 1 | 8 |
| Hooks | 0 | 4 |
| Archivos de tipos | 0 | 1 |
| Archivos de utils | 0 | 1 |
| Archivos de constants | 0 | 1 |
| Sistema i18n | 0 | 3 archivos |

---

## 7. CHECKLIST DE VALIDACIÓN

### Fase 1 (Completada)
- [x] Crear nueva estructura modular en `shared/table/`
- [x] Crear hooks reutilizables
- [x] Crear tipos TypeScript
- [x] Crear utilidades puras
- [x] Crear constantes con soporte i18n
- [x] Crear sistema i18n base
- [x] Documentar todo en AUDIT.md
- [x] Archivo legacy sigue funcionando
- [x] Build exitoso

### Fase 2 (Pendiente)
- [ ] Agregar I18nProvider al App shell
- [ ] Migrar primer consumidor de prueba
- [ ] Migrar resto de consumidores
- [ ] Deprecar archivo legacy
- [ ] Eliminar archivo legacy

---

*Documento actualizado: 2024-12-16*
*Fase 1 completada exitosamente*
*Fase 2 pendiente de aprobación del usuario*
