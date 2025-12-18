# Table.tsx - Auditoría y Refactorización Completa

## Información General

| Atributo | Valor |
|----------|-------|
| Archivo Original (LEGACY) | `src/components/ui-custom/tables-and-trees/Table.tsx` |
| Líneas de código original | 1761 |
| Nueva ubicación (MODULAR) | `src/components/shared/table/` |
| Antigüedad estimada | +6 meses |
| Fecha de auditoría | 2024-12-18 |
| Estado | ✅ FASE 2 COMPLETADA - Sistema de tipos semánticos de columnas |

---

## Resumen Ejecutivo

Se ha creado una nueva arquitectura modular para el componente Table que:

1. **Mantiene compatibilidad total**: El archivo original `tables-and-trees/Table.tsx` sigue funcionando sin cambios para todos los consumidores actuales
2. **Ofrece nueva arquitectura**: Componentes modulares en `shared/table/` para uso futuro y migración gradual
3. **Sistema de tipos semánticos**: Nuevo sistema enterprise de anchos de columna basado en tipos semánticos (Fase 2)
4. **Centraliza utilidades**: Hooks, tipos, constantes y utilidades en archivos separados
5. **Sistema i18n**: Sistema de internacionalización integrado con las constantes de la tabla

---

## 1. ESTRUCTURA DE ARCHIVOS

### 1.1 Nueva Arquitectura Modular

```
src/components/shared/table/
├── Table.tsx                 ← Componente wrapper principal
├── TableDesktop.tsx          ← Vista para pantallas desktop
├── TableMobile.tsx           ← Vista para pantallas móviles (cards)
├── TableTopBar.tsx           ← Barra superior con búsqueda, filtros, tabs
├── TableRow.tsx              ← Fila individual de tabla + InactiveSeparator
├── TableGroup.tsx            ← Grupo de filas con header colapsable
├── TableLoadingSkeleton.tsx  ← Skeleton de carga responsive
├── tableColumnTypes.ts       ← 🆕 Sistema de tipos semánticos de columnas
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

---

## 2. SISTEMA DE TIPOS SEMÁNTICOS DE COLUMNAS (NUEVO)

### 2.1 Filosofía

El sistema de tipos semánticos está inspirado en las mejores prácticas de Stripe, Linear y Notion:

- **Columnas estructuradas** (fecha, monto, estado) tienen ancho fijo
- **Columna flexible** (`long-text`) ocupa el ancho restante
- **Tablas** ocupan el 100% del ancho disponible sin desperdicio
- **Consistencia** automática entre todas las tablas

### 2.2 Tipos Disponibles (`tableColumnTypes.ts`)

```typescript
export type TableColumnType =
  | 'date'        // 110px - Fechas simples
  | 'datetime'    // 150px - Fecha + hora
  | 'amount'      // 120px - Montos monetarios
  | 'status'      // 100px - Estados/badges pequeños
  | 'wallet'      // 140px - Billeteras/cuentas
  | 'number'      // 80px  - Números simples
  | 'id'          // 100px - Identificadores
  | 'actions'     // 48px  - Columna de acciones
  | 'name'        // 200px - Nombres de entidades
  | 'email'       // 200px - Emails
  | 'short-text'  // 140px - Texto corto (DEFAULT)
  | 'medium-text' // 180px - Texto medio
  | 'long-text'   // minmax(200px, 1fr) - FLEXIBLE
  | 'badge'       // 120px - Badges/etiquetas
  | 'avatar'      // 48px  - Avatares
  | 'checkbox'    // 40px  - Checkboxes
  | 'icon';       // 40px  - Iconos
```

### 2.3 Mapa Central de Anchos

```typescript
export const COLUMN_TYPE_WIDTHS: Record<TableColumnType, string> = {
  'date': '110px',
  'datetime': '150px',
  'amount': '120px',
  'status': '100px',
  'wallet': '140px',
  'number': '80px',
  'id': '100px',
  'actions': '48px',
  'name': '200px',
  'email': '200px',
  'short-text': '140px',
  'medium-text': '180px',
  'long-text': 'minmax(200px, 1fr)',  // ← FLEXIBLE
  'badge': '120px',
  'avatar': '48px',
  'checkbox': '40px',
  'icon': '40px',
};
```

### 2.4 Uso en Columnas

```typescript
const columns = [
  {
    key: 'created_at',
    label: 'Fecha',
    type: 'date' as const,      // ← NUEVO: tipo semántico
    render: (item) => formatDate(item.created_at)
  },
  {
    key: 'user',
    label: 'Usuario',
    type: 'name' as const,
    render: (item) => <IdentityBadge name={item.name} />
  },
  {
    key: 'description',
    label: 'Descripción',
    type: 'long-text' as const,  // ← FLEXIBLE: absorbe espacio restante
    render: (item) => item.description
  },
  {
    key: 'status',
    label: 'Estado',
    type: 'status' as const,
    render: (item) => <Badge>{item.status}</Badge>
  }
];
```

### 2.5 Comportamiento Automático

1. **CSS Grid**: El sistema genera `grid-template-columns` automáticamente
2. **Columna flexible**: Si hay `long-text`, absorbe el espacio restante
3. **Fallback inteligente**: Si no hay `long-text`, la última columna se vuelve flexible
4. **Compatibilidad**: Si no se especifica `type`, usa el sistema legacy de `width`

### 2.6 Reglas Importantes

- ❌ NO usar `width` manual cuando se usa `type`
- ❌ NO hardcodear px en vistas
- ✅ El layout ocupa siempre el 100% del ancho disponible
- ✅ Una sola columna con `long-text` por tabla (recomendado)
- ✅ Compatible con tablas existentes (sin cambios requeridos)

---

## 3. DESCRIPCIÓN DE CADA ARCHIVO

### 3.1 Componentes de Tabla

#### `Table.tsx` (~260 líneas)
**Propósito**: Wrapper principal que orquesta todos los sub-componentes.
**Responsabilidades**:
- Determina si mostrar vista desktop o mobile según breakpoint
- Integra todos los hooks (sort, filter, pagination, selection)
- Renderiza TableTopBar + TableDesktop/TableMobile
- Mantiene API pública compatible con el Table legacy

#### `TableDesktop.tsx`
**Propósito**: Renderizado de tabla para pantallas grandes.
**Responsabilidades**:
- Renderiza grid con headers y filas
- Maneja sorting al hacer click en headers
- Renderiza columnas con sus configuraciones
- Usa TableRow para cada fila
- Usa TableGroup para agrupaciones

#### `TableMobile.tsx`
**Propósito**: Renderizado de tabla como cards para móviles.

#### `TableTopBar.tsx`
**Propósito**: Barra superior de la tabla.

#### `TableRow.tsx`
**Propósito**: Fila individual de la tabla.

#### `TableGroup.tsx`
**Propósito**: Grupo de filas con header colapsable.

#### `TableLoadingSkeleton.tsx`
**Propósito**: Estado de carga de la tabla.

### 3.2 Sistema de Tipos Semánticos

#### `tableColumnTypes.ts` (NUEVO)
**Propósito**: Single source of truth para anchos de columnas.
**Contenido**:
- `TableColumnType`: Union type con todos los tipos disponibles
- `COLUMN_TYPE_WIDTHS`: Mapa de tipo → ancho CSS
- `DEFAULT_COLUMN_TYPE`: Tipo por defecto ('short-text')
- `getColumnWidth()`: Obtiene ancho para un tipo
- `buildGridTemplateColumns()`: Genera grid-template-columns

### 3.3 Hooks

#### `useTableSort.ts`
**Propósito**: Manejo de ordenamiento de columnas.

#### `useTableFilter.ts`
**Propósito**: Manejo de filtrado y búsqueda.

#### `useTablePagination.ts`
**Propósito**: Manejo de paginación.

#### `useTableSelection.ts`
**Propósito**: Manejo de selección múltiple.

### 3.4 Archivos de Soporte

#### `types.ts`
**Propósito**: Definiciones TypeScript para todo el sistema de tabla.
**Cambios Fase 2**:
- Propiedad `type?: TableColumnType` añadida a `Column<T>`
- Propiedad `width` marcada como `@deprecated`

#### `utils.ts`
**Propósito**: Funciones utilitarias puras.
**Cambios Fase 2**:
- `getGridTemplateColumns()` detecta tipos semánticos automáticamente
- Si hay tipos semánticos → usa `buildGridTemplateColumns()`
- Si no hay tipos → usa sistema legacy de `width`

#### `constants.ts`
**Propósito**: Constantes y labels de UI.

#### `index.ts`
**Propósito**: Exports públicos del módulo.
**Cambios Fase 2**:
- Exporta `tableColumnTypes.ts` completo

---

## 4. ESTADO ACTUAL DE MIGRACIÓN

### ¿Qué está funcionando ahora?

| Componente | Estado | Notas |
|------------|--------|-------|
| Table legacy (`tables-and-trees/`) | ✅ Activo | Mayoría de consumidores lo usan |
| Table modular (`shared/table/`) | ✅ En uso | Migraciones piloto completadas |
| Sistema de tipos semánticos | ✅ Listo | Fase 2 completada |
| Sistema i18n | ✅ Listo | Falta agregar Provider al App shell |

### Pantallas Usando Tipos Semánticos

| Pantalla | Archivo | Fecha | Estado |
|----------|---------|-------|--------|
| Admin → Usuarios | `AdminAdminUsers.tsx` | 2024-12-18 | ✅ Migrado |
| Admin → Organizaciones | `AdminAdminOrganizations.tsx` | 2024-12-18 | ✅ Migrado |
| Admin → Actividad | `AdminActivityLogs.tsx` | 2024-12-18 | ✅ Migrado |

### Importaciones

```typescript
// Nuevo sistema con tipos semánticos
import { Table } from "@/components/shared/table";
import type { Column, TableColumnType } from "@/components/shared/table";
```

---

## 5. PRÓXIMOS PASOS (FASE 3)

### 5.1 Migración de Más Consumidores
1. Identificar tablas con layouts inconsistentes
2. Aplicar tipos semánticos a cada columna
3. Validar que el layout sea correcto

### 5.2 Mejoras Opcionales
- [ ] Densidad configurable (compact/normal/comfortable)
- [ ] Columnas redimensionables (drag resize)
- [ ] Columnas sticky (left/right)
- [ ] React.memo en componentes hijos para performance
- [ ] Tests unitarios para hooks
- [ ] Virtualización para listas >1000 items

---

## 6. MÉTRICAS

| Métrica | Antes | Después Fase 1 | Después Fase 2 |
|---------|-------|----------------|----------------|
| Líneas (monolito) | 1761 | Mantenido | Mantenido |
| Líneas (wrapper nuevo) | N/A | ~260 | ~260 |
| Componentes | 1 | 8 | 8 |
| Hooks | 0 | 4 | 4 |
| Archivos de tipos | 0 | 1 | 2 (+tableColumnTypes) |
| Archivos de utils | 0 | 1 | 1 |
| Archivos de constants | 0 | 1 | 1 |
| Sistema i18n | 0 | 3 archivos | 3 archivos |

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

### Fase 2 (Completada)
- [x] Crear `tableColumnTypes.ts` con tipos semánticos
- [x] Actualizar `Column<T>` interface con propiedad `type`
- [x] Actualizar `getGridTemplateColumns()` para detectar tipos
- [x] Migrar Admin → Usuarios a tipos semánticos
- [x] Migrar Admin → Organizaciones a tipos semánticos
- [x] Migrar Admin → Actividad a tipos semánticos
- [x] Actualizar AUDIT.md
- [x] Verificar build exitoso

### Fase 3 (Pendiente)
- [ ] Migrar resto de tablas a tipos semánticos
- [ ] Agregar I18nProvider al App shell
- [ ] Deprecar archivo legacy cuando todos estén migrados

---

*Documento actualizado: 2024-12-18*
*Fase 2 completada exitosamente*
*Sistema de tipos semánticos implementado y funcionando*
