# Dashboard Building Blocks (Nivel 2)

## ¿Qué es un Dashboard Block?

Los Dashboard Blocks son **componentes reutilizables de dashboard** que:
- **SÍ usan Card** y otros contenedores de UI
- **SÍ combinan UI + Charts + Métricas**
- **SÍ definen layout interno y jerarquía visual**
- **NO conocen el dominio** (no "gastos", no "materiales")
- **NO consultan datos** (reciben todo por props)
- **NO hacen cálculos de negocio**

## Diferencia entre tipos de bloques

| Tipo | Usa Card | Contiene Chart | Muestra Valor | Ejemplo |
|------|----------|----------------|---------------|---------|
| KPI Card | ✅ | ❌ | ✅ | StatCard |
| Chart Card | ✅ | ✅ | ❌ | (futuro) ChartCard |
| Metric Card | ✅ | Mini | ✅ | (futuro) MetricCard |

## Componentes en esta carpeta

### StatCard (KPI Card)

Bloque para mostrar métricas/KPIs con:
- Título con ícono
- Valor principal grande
- Meta/breakdown secundario
- Navegación opcional (href, onClick)

```tsx
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/dashboard';
import { DollarSign } from 'lucide-react';

<StatCard href="/finanzas">
  <StatCardTitle>
    <DollarSign className="h-4 w-4" />
    Gasto Total
  </StatCardTitle>
  <StatCardValue>$ 150.000</StatCardValue>
  <StatCardMeta>+12% vs mes anterior</StatCardMeta>
</StatCard>
```

## Por qué usamos Card

Los Dashboard Blocks usan Card porque:
1. Definen una **superficie visual** consistente
2. Agregan **padding, bordes, sombras** estandarizados
3. Permiten **hover states** y navegación
4. Mantienen coherencia visual en todo el dashboard

## Regla de reutilización

Un Dashboard Block debe ser **agnóstico al negocio**:

```tsx
// ✅ CORRECTO: Genérico, recibe datos por props
<StatCard>
  <StatCardTitle>{title}</StatCardTitle>
  <StatCardValue>{value}</StatCardValue>
</StatCard>

// ❌ INCORRECTO: Conoce el dominio, consulta datos
<GastosTotalesCard organizationId={id} />  // ← Esto es un Widget (Nivel 3)
```

## Relación con otros niveles

```
┌─────────────────────────────────────────────────────────┐
│  Nivel 3: Widgets Semánticos (pages/*, features/*)     │
│  → Consultan datos, hacen cálculos                     │
│  → Conocen el dominio (gastos, materiales, etc.)       │
├─────────────────────────────────────────────────────────┤
│  Nivel 2: Dashboard Blocks (components/dashboard/)     │  ← ESTA CARPETA
│  → Bloques visuales reutilizables                      │
│  → StatCard, ChartCard, MetricCard                     │
├─────────────────────────────────────────────────────────┤
│  Nivel 1: Charts (components/charts/)                  │
│  → Gráficos puros sin contenedor                       │
├─────────────────────────────────────────────────────────┤
│  Nivel 0: UI Primitives (components/ui/)               │
│  → Card, Button, Badge, etc.                           │
└─────────────────────────────────────────────────────────┘
```

## Cómo agregar un nuevo Dashboard Block

1. Verificar que cumple los criterios de Nivel 2
2. DEBE usar Card u otro contenedor de UI
3. DEBE recibir datos por props
4. NO debe conocer el dominio de negocio
5. Colocarlo en esta carpeta
6. Exportarlo desde `index.ts`
