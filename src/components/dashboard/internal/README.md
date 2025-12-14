# Internal Components

Componentes internos usados por las Dashboard Blocks.

## DashboardCardHeader

Header unificado para todos los dashboard cards.

**Especificaciones de diseño:**
- Íconos: `16px` (h-4 w-4) en `text-muted-foreground`
- Título: `text-sm font-medium text-foreground`
- Descripción: `text-xs text-muted-foreground`
- Espaciado: `pb-3`

Este componente es usado internamente por:
- `DashboardCard`
- `InsightCard`
- `ActivityCard`

Y también por `StatCardTitle` (KPI Card) para mantener consistencia.
