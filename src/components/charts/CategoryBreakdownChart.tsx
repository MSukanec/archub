# Seencel - Session 22 - EN PROGRESO

## TAREA ACTUAL: Agregar variante a CategoryBreakdownChart

### Cambio solicitado:
- Agregar prop `variant` a CategoryBreakdownChart.tsx
  - `variant="default"` (actual): donut con legend debajo
  - `variant="compact"` (nuevo): sunburst/roseta con labels internos
- Usar `variant="compact"` en card de "Distribución por Categoría"

### Ubicaciones:
- `src/components/charts/CategoryBreakdownChart.tsx` - agregar variant
- `src/pages/general-costs/GeneralCostsDashboardTab.tsx` línea ~647 - pasar `variant="compact"`

### Implementación:
- Variant compact: Pie chart sin innerRadius (full pie), labels internos, sin legend
- Usar renderCustomLabel para mostrar nombre + valor dentro del segmento
- Colores igual a la actual

## STATUS ANTERIOR: ✅ COMPLETADO
- 4 KPIs funcionales (Gasto Total, Promedio Mensual, Total Pagos, Concentración)
- Layout responsive 2 cols mobile / 4 cols desktop
- Badges con estilo correcto
- Dashboard de Gastos Generales listos para producción
