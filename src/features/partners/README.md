# Módulo de Socios (Partners)

## Descripción General

El módulo de Socios gestiona los socios de una organización, sus aportes de capital y retiros. Incluye un dashboard interactivo con KPIs, gráficos de tendencia, insights automáticos y seguimiento de actividad.

## Estructura de Archivos

```
src/features/partners/
├── components/
│   └── (componentes específicos del módulo)
├── forms/
│   ├── PartnerFormFields.tsx          # Formulario de socio
│   ├── PartnerContributionFormFields.tsx   # Formulario de aporte
│   └── PartnerWithdrawalFormFields.tsx     # Formulario de retiro
├── hooks/
│   ├── index.ts                       # Exports de hooks
│   ├── use-partners.ts                # Hook de socios
│   ├── use-partner-contributions.ts   # Hook de aportes
│   └── use-partner-withdrawals.ts     # Hook de retiros
├── types/
│   └── index.ts                       # Tipos TypeScript
├── constants.ts                       # Query keys y constantes
├── index.ts                           # Exports principales
└── README.md                          # Esta documentación

src/pages/partners/
├── Partners.tsx                       # Página principal con tabs
└── tabs/
    ├── PartnersDashboardTab.tsx       # Tab Dashboard (Visión General)
    ├── PartnersListTab.tsx            # Tab Lista de Socios
    ├── PartnerBalancesTab.tsx         # Tab Balance por Socio
    └── PartnerTransactionsTab.tsx     # Tab Transacciones
```

## Tabs del Módulo

### 1. Dashboard (Visión General)
- **Ubicación**: `src/pages/partners/tabs/PartnersDashboardTab.tsx`
- **Propósito**: Vista ejecutiva del estado de socios
- **Componentes**:
  - 4 KPIs principales (grid 2x2 mobile, 4x1 desktop)
  - Gráfico de evolución mensual del capital
  - Gráfico de distribución por socio
  - Panel de Insights automáticos
  - Lista de actividad reciente
- **Filtros**: Período temporal (30d, 3m, 6m, 1y, histórico)

### 2. Lista de Socios
- **Ubicación**: `src/pages/partners/tabs/PartnersListTab.tsx`
- **Propósito**: CRUD de socios
- **Funcionalidades**:
  - Tabla con información de contacto
  - Edición y eliminación de socios
  - KPIs de resumen (4 cards)

### 3. Balances
- **Ubicación**: `src/pages/partners/tabs/PartnerBalancesTab.tsx`
- **Propósito**: Balance individual por socio
- **Componentes**:
  - KPIs de totales
  - Acordeón con balance detallado por socio

### 4. Transacciones
- **Ubicación**: `src/pages/partners/tabs/PartnerTransactionsTab.tsx`
- **Propósito**: Historial de aportes y retiros
- **Funcionalidades**:
  - Tabla unificada de movimientos
  - Filtro y búsqueda
  - CRUD de transacciones

## Sistema de KPIs

Todos los tabs usan el sistema headless de KPIs de `src/lib/kpis.ts`:

```typescript
import { calculateMonetaryKPI, calculateCountKPI, formatBreakdown } from '@/lib/kpis';

// KPI monetaria
const capitalKPI = calculateMonetaryKPI({
  items: contributions.map(c => ({
    amount: c.amount,
    currency_id: c.currency_id,
    currency: c.currency,
    exchange_rate: c.exchange_rate
  })),
  baseCurrencyId: defaultCurrency?.code,
  symbol: defaultCurrency?.symbol
});

// KPI de conteo
const partnersKPI = calculateCountKPI({
  count: partners.length,
  label: 'socios'
});
```

## Especificaciones de UI

### Grid de KPIs
```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard>
    <StatCardTitle>
      <IconComponent className="h-4 w-4" />
      Título
    </StatCardTitle>
    <StatCardValue>Valor</StatCardValue>
    <StatCardMeta>Descripción</StatCardMeta>
  </StatCard>
</div>
```

### StatCardTitle con Ícono (Obligatorio)
Todos los StatCardTitle DEBEN incluir un ícono:
```tsx
<StatCardTitle>
  <Wallet className="h-4 w-4" />
  Capital Neto
</StatCardTitle>
```

### Colores de Estado
- **Verde** (`text-green-600`): Valores positivos, aportes
- **Rojo** (`text-red-600`): Valores negativos, retiros
- **Neutral**: Conteos, sin color especial

## Modales

Los modales siguen el patrón de 2 archivos:
1. `*FormFields.tsx` - Campos del formulario
2. Modal wrapper en `src/components/modal/`

### Uso de Modales
```typescript
const { openModal } = useGlobalModalStore();

// Agregar socio
openModal('partner', { organizationId });

// Agregar aporte
openModal('partner-contribution', { organizationId });

// Agregar retiro
openModal('partner-withdrawal', { organizationId });
```

## Hooks Principales

### usePartners
```typescript
const { data: partners, isLoading } = usePartners(organizationId);
```

### usePartnerContributions
```typescript
const { data: contributions } = usePartnerContributions(organizationId);
```

### usePartnerWithdrawals
```typescript
const { data: withdrawals } = usePartnerWithdrawals(organizationId);
```

## Sistema Multimoneda

El módulo soporta múltiples monedas usando el sistema centralizado de `src/lib/money.ts`:

- Cada transacción tiene `currency_id` y `exchange_rate`
- Los KPIs calculan valores en moneda base automáticamente
- El breakdown muestra desglose por moneda cuando hay múltiples

## Insights Automáticos

El Dashboard genera insights usando el motor de `src/components/dashboard/insights/`:

```typescript
import { generateInsights, buildInsightContext, toInsightItems } from '@/components/dashboard/insights';

const context = buildInsightContext({
  totalGasto: netCapital,
  previousPeriodGasto: previousNetCapital,
  categoryData: partnerDistributionData,
  monthlyData: monthlyChartData,
  // ...
});

const insights = generateInsights(context, 3);
```

## Query Keys

Definidos en `src/features/partners/constants.ts`:

```typescript
export const PARTNER_QUERY_KEYS = {
  partners: (orgId: string) => ['partners', orgId],
  contributions: (orgId: string) => ['partner-contributions', orgId],
  withdrawals: (orgId: string) => ['partner-withdrawals', orgId],
};
```

## Invalidación de Cache

Al crear/editar/eliminar, invalidar las queries relacionadas:

```typescript
queryClient.invalidateQueries({ queryKey: ['partners'] });
queryClient.invalidateQueries({ queryKey: ['partner-contributions'] });
queryClient.invalidateQueries({ queryKey: ['partner-withdrawals'] });
```

## Filtro de Período Inteligente

El Dashboard implementa filtros de período que se deshabilitan automáticamente cuando no hay datos:

```typescript
import { calculateAvailablePeriods } from '@/pages/partners/tabs/PartnersDashboardTab';

const availablePeriods = calculateAvailablePeriods(contributions, withdrawals);
// { '30d': false, '3m': true, '6m': true, '1y': true, 'all': true }
```

## Componentes de Gráficos

### MonthlyTrendChart
Gráfico de área para evolución temporal:
```tsx
<DashboardCard title="Evolución del Capital" icon={<BarChart3 />}>
  <MonthlyTrendChart 
    data={monthlyChartData} 
    height={280}
    onBarClick={handleMonthDrillDown}
  />
</DashboardCard>
```

### CategoryBreakdownChart
Gráfico donut para distribución:
```tsx
<DashboardCard title="Distribución por Socio" icon={<PieChart />}>
  <CategoryBreakdownChart 
    data={partnerDistributionData} 
    height={280}
    onSliceClick={handlePartnerDrillDown}
  />
</DashboardCard>
```

## Tipos Principales

```typescript
// Partner
interface Partner {
  id: string;
  organization_id: string;
  contact_id: string;
  status: 'active' | 'inactive' | 'deleted';
  notes: string | null;
  contacts: PartnerContact | null;
}

// Contribution
interface PartnerContribution {
  id: string;
  partner_id: string | null;
  amount: number;
  currency_id: string;
  exchange_rate: number;
  contribution_date: string;
  status: 'confirmed' | 'pending' | 'rejected' | 'void';
  // ...
}

// Withdrawal
interface PartnerWithdrawal {
  id: string;
  partner_id: string | null;
  amount: number;
  currency_id: string;
  exchange_rate: number;
  withdrawal_date: string;
  status: 'confirmed' | 'pending' | 'rejected' | 'void';
  // ...
}
```

## Patrones Importantes

1. **Grid de KPIs**: Siempre `grid-cols-2 lg:grid-cols-4`
2. **Íconos en StatCardTitle**: Obligatorios, tamaño `h-4 w-4`
3. **Colores semánticos**: Verde para aportes, rojo para retiros
4. **data-testid**: En todos los elementos interactivos
5. **Empty States**: Con ícono, título, descripción y acción
6. **Loading States**: Skeleton o LoadingSpinner

## Dependencias

- `@tanstack/react-query` - Estado del servidor
- `recharts` - Gráficos
- `lucide-react` - Íconos
- `date-fns` - Manejo de fechas
- `zod` - Validación de formularios
