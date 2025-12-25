# General Costs (Gastos Generales) - Documentación Completa

## Descripción General

El módulo de **Gastos Generales** es una herramienta integral para gestionar costos operativos de la organización que no están asociados a proyectos específicos. Incluye gestión de conceptos de gasto, pagos, categorías, dashboard con KPIs, gráficos interactivos, y sistema de Data Health.

---

## Arquitectura del Módulo

### Estructura de Carpetas

```
src/features/general-costs/
├── components/           # Componentes visuales del módulo
│   ├── GeneralCostsKPIs.tsx    # Grid de KPIs con mini gráficos
│   └── KPI.tsx                  # Componente KPI individual
├── constants/
│   └── index.ts                 # Query keys y constantes
├── forms/                # Formularios modales
│   ├── GeneralCostForm.tsx              # Crear/editar concepto
│   ├── GeneralCostCategoryForm.tsx      # Crear/editar categoría
│   ├── GeneralCostPaymentForm.tsx       # Modal wrapper para pagos
│   ├── GeneralCostPaymentFormFields.tsx # Campos del formulario de pago
│   ├── GeneralCostPaymentView.tsx       # Vista detalle de pago
│   └── GeneralCostView.tsx              # Vista detalle de concepto
├── hooks/                # React hooks (TanStack Query)
│   ├── index.ts                         # Re-exports
│   ├── use-general-costs.ts             # Lista de conceptos
│   ├── use-general-cost.ts              # Concepto individual
│   ├── use-create-general-cost.ts       # Crear concepto
│   ├── use-update-general-cost.ts       # Actualizar concepto
│   ├── use-delete-general-cost.ts       # Eliminar concepto
│   ├── use-replace-general-cost.ts      # Reemplazar y eliminar
│   ├── use-general-costs-payments.ts    # Lista de pagos
│   ├── use-general-cost-payment.ts      # Pago individual
│   ├── use-create-general-cost-payment.ts
│   ├── use-update-general-cost-payment.ts
│   ├── use-delete-general-cost-payment.ts
│   ├── use-general-cost-payment-media.ts  # Archivos adjuntos
│   ├── use-general-cost-categories.ts     # CRUD de categorías
│   ├── use-replace-general-cost-category.ts
│   ├── use-general-costs-metrics.ts       # Métricas y timeline
│   ├── use-general-costs-monthly-summary.ts  # Resumen mensual (view)
│   └── use-general-costs-by-category.ts      # Desglose por categoría (view)
├── schemas/
│   └── index.ts                 # Zod schemas para validación
├── services/             # Llamadas a Supabase
│   ├── getGeneralCosts.ts
│   ├── getGeneralCost.ts
│   ├── createGeneralCost.ts
│   ├── updateGeneralCost.ts
│   ├── deleteGeneralCost.ts
│   ├── replaceGeneralCost.ts
│   ├── getGeneralCostPayment.ts
│   ├── createGeneralCostPayment.ts
│   ├── updateGeneralCostPayment.ts
│   ├── deleteGeneralCostPayment.ts
│   ├── getGeneralCostPaymentFiles.ts
│   ├── generalCostCategories.ts         # CRUD completo de categorías
│   ├── getGeneralCostsMonthlySummary.ts # Query a vista SQL
│   └── getGeneralCostsByCategory.ts     # Query a vista SQL
├── tests/
│   ├── getGeneralCosts.test.ts
│   └── use-general-costs.test.tsx
├── types/
│   └── index.ts                 # TypeScript interfaces
└── index.ts                     # Barrel exports
```

### Páginas (src/pages/general-costs/)

```
src/pages/general-costs/
├── GeneralCosts.tsx              # Página principal con tabs
├── GeneralCostsDashboardTab.tsx  # Tab "Visión General" - KPIs y gráficos
├── GeneralCostsConceptsTab.tsx   # Tab "Conceptos" - Lista de gastos
├── GeneralCostsPaymentsTab.tsx   # Tab "Pagos" - Lista de pagos
└── GeneralCostsSettingsTab.tsx   # Tab "Ajustes" - Gestión de categorías
```

---

## Tablas de Base de Datos (Supabase/PostgreSQL)

### 1. `general_costs` - Conceptos de Gastos Generales

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | UUID | FK a organizations |
| `name` | TEXT | Nombre del concepto (ej: "Servicios administrativos") |
| `description` | TEXT | Descripción opcional |
| `category_id` | UUID | FK a general_cost_categories |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última actualización |
| `created_by` | UUID | FK a organization_members |
| `is_deleted` | BOOLEAN | Soft delete flag |
| `deleted_at` | TIMESTAMP | Fecha de eliminación |

### 2. `general_costs_payments` - Pagos de Gastos Generales

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | UUID | FK a organizations |
| `general_cost_id` | UUID | FK a general_costs (opcional) |
| `amount` | DECIMAL | Monto del pago |
| `currency_id` | UUID | FK a currencies |
| `exchange_rate` | DECIMAL | Tipo de cambio al momento del pago |
| `payment_date` | DATE | Fecha del pago |
| `wallet_id` | UUID | FK a organization_wallets |
| `status` | TEXT | 'confirmed', 'pending', 'rejected', 'void' |
| `notes` | TEXT | Notas opcionales |
| `reference` | TEXT | Referencia/comprobante |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última actualización |
| `created_by` | UUID | FK a organization_members |
| `is_deleted` | BOOLEAN | Soft delete flag |
| `deleted_at` | TIMESTAMP | Fecha de eliminación |

### 3. `general_cost_categories` - Categorías

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | UUID | FK a organizations |
| `name` | TEXT | Nombre de la categoría |
| `description` | TEXT | Descripción opcional |
| `is_system` | BOOLEAN | true = categoría predefinida (no editable) |
| `is_deleted` | BOOLEAN | Soft delete flag |
| `deleted_at` | TIMESTAMP | Fecha de eliminación |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última actualización |

### 4. `media_links` - Enlaces a Archivos (columna relacionada)

La tabla `media_links` tiene la columna `general_cost_payment_id` para asociar archivos adjuntos a pagos.

### 5. Vistas SQL

#### `general_costs_monthly_summary_view`
Agrega pagos confirmados por mes:
```sql
SELECT 
  organization_id,
  payment_month,  -- formato YYYY-MM
  SUM(total_amount) as total_amount,
  COUNT(*) as payments_count
FROM general_costs_payments
WHERE status = 'confirmed' AND is_deleted = false
GROUP BY organization_id, payment_month
```

#### `general_costs_by_category_view`
Agrega pagos por categoría y mes:
```sql
SELECT 
  organization_id,
  payment_month,
  category_id,
  category_name,
  SUM(total_amount) as total_amount
FROM general_costs_payments
JOIN general_costs ON ...
JOIN general_cost_categories ON ...
WHERE status = 'confirmed'
GROUP BY organization_id, payment_month, category_id, category_name
```

---

## Tipos TypeScript

### GeneralCost
```typescript
interface GeneralCost {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string | null;
  is_deleted?: boolean | null;
  deleted_at?: string | null;
  created_by?: string | null;
  category_id?: string | null;
  category?: {
    id: string;
    name: string;
  } | null;
}
```

### GeneralCostPayment
```typescript
interface GeneralCostPayment {
  id: string;
  organization_id: string;
  amount: number;
  currency_id: string;
  exchange_rate: number | null;
  payment_date: string;
  notes: string | null;
  reference: string | null;
  created_at: string;
  updated_at: string | null;
  wallet_id: string | null;
  general_cost_id: string | null;
  status: 'confirmed' | 'pending' | 'rejected' | 'void';
  created_by: string | null;
  currency?: { id, name, code, symbol } | null;
  wallet?: { id, wallets: { id, name } } | null;
  general_cost?: { id, name, description, category_id, category } | null;
  creator?: { id, users: { id, full_name, avatar_url } } | null;
}
```

### GeneralCostCategory
```typescript
interface GeneralCostCategory {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}
```

---

## Schemas de Validación (Zod)

### generalCostSchema
```typescript
const generalCostSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  category_id: z.string().optional(),
});
```

### generalCostPaymentSchema
```typescript
const generalCostPaymentSchema = z.object({
  payment_date: z.date({ required_error: "Fecha es requerida" }),
  general_cost_id: z.string().optional(),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  wallet_id: z.string().min(1, 'Billetera es requerida'),
  amount: z.number().min(0.01, 'Monto debe ser mayor a 0'),
  exchange_rate: z.number().optional(),
  notes: z.string().optional(),
  reference: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'overdue', 'cancelled']).default('confirmed'),
});
```

---

## Query Keys (Cache Invalidation)

```typescript
// Centralized in @/core/query-keys/general-costs.keys.ts
const generalCostsKeys = {
  all: ['general-costs'],
  lists: () => [...all, 'list'],
  list: (orgId) => [...lists(), orgId],
  details: () => [...all, 'detail'],
  detail: (id) => [...details(), id],
  payments: () => [...all, 'payment'],
  paymentList: (orgId) => [...payments(), 'list', orgId],
  payment: (id) => [...payments(), id],
  monthlySummary: () => [...all, 'monthly-summary'],
  monthlySummaryList: (orgId) => [...monthlySummary(), orgId],
  byCategory: () => [...all, 'by-category'],
  byCategoryList: (orgId) => [...byCategory(), orgId],
  categories: () => [...all, 'categories'],
  categoryList: (orgId) => [...categories(), orgId],
  category: (id) => [...categories(), id],
};
```

---

## Funcionalidades por Tab

### Tab 1: Dashboard (Visión General)

**Archivo:** `GeneralCostsDashboardTab.tsx`

#### KPIs Principales (4 cards):
1. **Total Gastado** - Suma de todos los pagos confirmados en el período
   - Usa `calculateMonetaryKPI` de `src/lib/kpis.ts`
   - Muestra breakdown multi-moneda si aplica
   - Trend comparativo con período anterior
   
2. **Promedio Mensual** - Total / cantidad de meses con pagos
   - Comparación contra promedio histórico
   
3. **Total Pagos** - Cantidad de pagos confirmados
   - Trend basado en pagos/mes vs período anterior
   
4. **Categoría Principal** - Categoría con mayor gasto
   - Muestra % de concentración
   - Trend de concentración

#### Filtro de Período:
- 30 días, 3 meses, 6 meses, 1 año, Histórico
- **Smart filtering**: Opciones sin datos se deshabilitan
- Función `calculateAvailablePeriods()` determina disponibilidad

#### Gráficos:
1. **Tendencia Mensual** (`MonthlyTrendChart`)
   - Componente puro configurable
   - Click en barra → drill-down a tab Pagos filtrado por mes

2. **Desglose por Categoría** (`CategoryBreakdownChart`)
   - Top 8 categorías
   - Click en slice → drill-down a tab Pagos filtrado por categoría

#### Insights Automáticos:
- Generados por `generateInsights()` de `src/components/dashboard/insights`
- Acciones: navegar a tabs, filtrar, scroll a panel

#### Data Health:
- Integrado via `useGeneralCostsDataHealth`
- Detecta problemas de calidad de datos
- Se fusiona con insights de negocio via `mergeWithBusinessInsights`

#### Actividad Reciente:
- Lista de últimos pagos confirmados
- Click → abre modal de vista

---

### Tab 2: Conceptos

**Archivo:** `GeneralCostsConceptsTab.tsx`

#### KPIs (grid 2x2 mobile, 4x1 desktop):
1. **Total Conceptos** - Cantidad de gastos generales activos
2. **Con Pagos** - Conceptos que tienen pagos asociados
3. **Sin Pagos** - Conceptos sin pagos (oportunidad de limpieza)
4. **Total Pagado** - Suma de todos los pagos (con breakdown multi-moneda)

#### Tabla de Conceptos:
Columnas:
- **Concepto** - Nombre + categoría badge
- **Pagos** - Cantidad de pagos asociados
- **Último Pago** - Fecha del pago más reciente
- **Total Pagado** - Suma con breakdown si hay múltiples monedas
- **Tendencia (6 meses)** - Sparkline SVG puro (`MiniSparkline`)
- **Descripción** - Texto truncado

#### Sparklines de Tendencia:
- Componente: `src/components/charts/MiniSparkline.tsx`
- Implementación SVG pura (no Recharts) para evitar problemas de overflow
- Muestra los últimos 6 meses de pagos
- Color: `var(--accent)`

```typescript
// Cálculo de datos para sparkline
const trendData = Array.from({ length: 6 }, (_, i) => {
  const targetMonth = subMonths(now, 5 - i);
  const monthStart = startOfMonth(targetMonth);
  const monthEnd = endOfMonth(targetMonth);
  
  const monthTotal = associatedPayments
    .filter(p => {
      const paymentDate = parseLocalDate(p.payment_date);
      return paymentDate >= monthStart && paymentDate <= monthEnd;
    })
    .reduce((sum, p) => {
      const amountInBase = convertToBaseCurrency(p.amount, p.currency, p.exchange_rate);
      return sum + amountInBase;
    }, 0);
    
  return { value: monthTotal };
});
```

#### Acciones:
- Editar concepto → Modal `GeneralCostForm`
- Eliminar/Reemplazar → Modal `delete-confirmation` con opción de reemplazo

---

### Tab 3: Pagos

**Archivo:** `GeneralCostsPaymentsTab.tsx`

#### KPIs:
1. **Total Pagado** - Suma filtrada
2. **Cantidad de Pagos** - Count filtrado
3. **Promedio por Pago** - Total / Count
4. **Pagos Pendientes** - Count con status != 'confirmed'

#### Filtros:
- Billetera (organization_wallets)
- Moneda (currencies)
- Concepto (general_costs)
- Categoría (general_cost_categories)
- Estado (confirmed, pending, rejected, void)
- Mes (YYYY-MM)

#### Drill-Down desde Dashboard:
Props `initialFilterMonth`, `initialFilterGeneralCost`, `initialFilterCategory` permiten navegación con filtros pre-aplicados.

#### Tabla de Pagos:
Columnas:
- Fecha
- Concepto + Categoría
- Monto + Moneda
- Billetera
- Estado (badge con color)
- Creador (IdentityBadge)
- Adjuntos (count)
- Acciones (ver, editar, eliminar)

#### Funcionalidades:
- Selección múltiple para acciones batch
- Importación desde Excel (wizard universal)
- Exportación a Excel y PDF
- Subida de archivos adjuntos

---

### Tab 4: Ajustes

**Archivo:** `GeneralCostsSettingsTab.tsx`

#### Gestión de Categorías:
- Lista de categorías ordenadas alfabéticamente
- Badge "Sistema" para categorías predefinidas
- CRUD completo para categorías personalizadas

#### Lógica de Eliminación:
1. Verifica uso con `getGeneralCostCategoryUsageCount()`
2. Si hay uso + otras categorías → ofrece reemplazo
3. Si hay uso sin alternativas → advierte que quedarán sin categoría
4. Usa modal `delete-confirmation` con modo 'replace' o 'delete'

---

## Sistema de KPIs

### Funciones Principales (src/lib/kpis.ts)

```typescript
// KPI monetario con soporte multi-moneda
calculateMonetaryKPI({
  items: PaymentItem[],
  baseCurrencyId: string,
  symbol: string,
  quoteCurrency?: string
}) → { value, breakdown, formattedValue }

// KPI de conteo simple
calculateCountKPI({
  count: number,
  label: string
}) → { value, label }

// KPI de texto
calculateTextKPI({
  text: string,
  icon?: string
}) → { text, icon }
```

### Lógica Multi-Moneda:
1. Cada pago tiene `amount`, `currency_id`, `exchange_rate`
2. Conversión a moneda base: `amount_in_base = amount * exchange_rate`
3. Breakdown muestra desglose por moneda original solo si hay múltiples monedas únicas

```typescript
// Solo mostrar breakdown si hay múltiples monedas
const uniqueCurrencies = new Set(payments.map(p => p.currency_id));
const hasMultipleCurrencies = uniqueCurrencies.size > 1;

const breakdownText = hasMultipleCurrencies && breakdown.length > 0
  ? formatSubValue(breakdown)
  : undefined;
```

---

## Sistema de Data Health

### Ubicación: `src/core/data-health/`

Integración específica para gastos generales via `useGeneralCostsDataHealth`.

### Reglas Implementadas:
1. **Pagos sin concepto asignado** - Detecta pagos con `general_cost_id = null`
2. **Exchange rate faltante** - Pagos en moneda diferente sin tipo de cambio
3. **Pagos antiguos pendientes** - Status 'pending' por más de 30 días
4. **Montos sospechosos** - Outliers estadísticos

### Uso:
```typescript
const dataHealth = useGeneralCostsDataHealth(payments, {
  organizationId,
  defaultCurrencyId,
  filterTags: ['general-costs'],
});

// Fusionar con insights de negocio
const allInsights = mergeWithBusinessInsights(dataHealth.issues, businessInsights);
```

---

## Componentes de Visualización

### MiniSparkline (src/components/charts/MiniSparkline.tsx)

SVG puro para gráficos de tendencia en tablas:

```typescript
interface SparklineProps {
  data: number[]          // Array de valores numéricos
  color?: string          // default: 'var(--accent)'
  height?: number         // default: 48px
}
```

**Características:**
- No usa Recharts (evita problemas de overflow:hidden en tablas)
- Renderizado SVG directo
- Normaliza datos al rango visible
- Maneja casos edge (sin datos, todos ceros)

### MonthlyTrendChart

Gráfico de barras para tendencia mensual con drill-down.

### CategoryBreakdownChart

Gráfico de torta/barras para desglose por categoría.

---

## Modales

### Registro en Sistema de Modales

```typescript
// En el registry de modales globales
'general-costs': GeneralCostForm,
'general-costs-payment': GeneralCostPaymentForm,
'generalCostCategory': GeneralCostCategoryForm,
```

### Flujo de Formularios

1. **GeneralCostForm**
   - Validación de nombre duplicado
   - Selección opcional de categoría
   - Modo create/edit

2. **GeneralCostPaymentForm**
   - Campos: fecha, concepto, billetera, monto, moneda, exchange rate, notas, referencia
   - Subida de archivos (FileUploader)
   - Integración con media_links

3. **GeneralCostCategoryForm**
   - Nombre y descripción
   - Solo para categorías no-sistema

---

## Hooks Principales

### useGeneralCosts
```typescript
const { data: generalCosts, isLoading } = useGeneralCosts(organizationId);
// Retorna GeneralCost[] con categoría incluida
```

### useGeneralCostsPayments
```typescript
const { data: payments, isLoading } = useGeneralCostsPayments(organizationId);
// Retorna GeneralCostPayment[] con todas las relaciones
```

### useGeneralCostsMonthlySummary
```typescript
const { data: summary } = useGeneralCostsMonthlySummary(organizationId);
// Retorna datos agregados por mes desde vista SQL
```

### useGeneralCostsByCategory
```typescript
const { data: byCategory } = useGeneralCostsByCategory(organizationId);
// Retorna datos agregados por categoría desde vista SQL
```

---

## Lógicas de Negocio Importantes

### 1. Soft Delete
Todas las entidades usan soft delete:
```typescript
await supabase
  .from('general_costs')
  .update({ is_deleted: true, deleted_at: new Date().toISOString() })
  .eq('id', id);
```

### 2. Replace and Delete
Al eliminar un concepto/categoría con registros asociados:
```typescript
// 1. Reemplazar FK en registros relacionados
await supabase.from('general_costs_payments')
  .update({ general_cost_id: newId })
  .eq('general_cost_id', oldId);

// 2. Soft delete del registro original
await supabase.from('general_costs')
  .update({ is_deleted: true, deleted_at: now })
  .eq('id', oldId);
```

### 3. Categorías de Sistema
- Flag `is_system = true` indica categoría predefinida
- No se pueden editar ni eliminar
- Se incluyen automáticamente para todas las organizaciones

### 4. Smart Period Filtering
```typescript
function calculateAvailablePeriods(payments) {
  return {
    'all': true,  // Siempre disponible
    '30d': hasPaymentsInLast30Days,
    '3m': hasPaymentsInLast3Months,
    '6m': hasPaymentsInLast6Months,
    '1y': hasPaymentsInLastYear,
  };
}
```

---

## Testing

### Archivos de Test
- `tests/getGeneralCosts.test.ts` - Unit tests para el servicio
- `tests/use-general-costs.test.tsx` - Tests de React hooks

### Cobertura
- CRUD de conceptos
- CRUD de pagos
- Filtrado por organización
- Soft delete
- Relaciones con categorías

---

## Dependencias Externas

- **Supabase** - Base de datos y autenticación
- **TanStack Query** - Cache y estado del servidor
- **Zod** - Validación de schemas
- **date-fns** - Manipulación de fechas
- **react-hook-form** - Formularios
- **Recharts** - Gráficos (no usado en sparklines)
- **Lucide React** - Iconos

---

## Notas de Implementación

### Multi-tenancy
Todos los servicios filtran por `organization_id`:
```typescript
.eq('organization_id', organizationId)
```

### Fechas
Usar siempre `parseLocalDate()` de `src/lib/date-utils.ts` para evitar problemas de timezone.

### Moneda Base
Obtener con `useOrganizationDefaultCurrency(organizationId)` y usar para conversiones.

### Cache Invalidation
Después de mutaciones, usar invalidaciones scoped por organizationId:
```typescript
// IMPORTANTE: Usar invalidaciones scoped, NUNCA globales
queryClient.invalidateQueries({ queryKey: generalCostsKeys.list(organizationId) });
queryClient.invalidateQueries({ queryKey: generalCostsKeys.paymentList(organizationId) });
queryClient.invalidateQueries({ queryKey: generalCostsKeys.monthlySummaryList(organizationId) });
```

---

## Changelog

- **v1.0** - Implementación inicial con CRUD básico
- **v1.1** - Agregado sistema de categorías
- **v1.2** - Dashboard con KPIs y gráficos
- **v1.3** - Filtros inteligentes de período
- **v1.4** - Sparklines de tendencia en tab Conceptos
- **v1.5** - Integración con Data Health
- **v1.6** - Multi-moneda breakdown condicional
- **v1.7** - MiniSparkline SVG puro (fix overflow issues)
