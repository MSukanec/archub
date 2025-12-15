# Sistema de Insights Accionables

Sistema extensible para generar insights automáticos con acciones interactivas en dashboards.

## Arquitectura

```
types.ts          → Tipos base (Insight, InsightAction, InsightContext)
insightRules.ts   → Reglas de negocio que generan insights
InsightItem.tsx   → Transformador de Insight → InsightItem visual
index.ts          → Exportaciones públicas
```

## Tipos Principales

### InsightActionType
```typescript
type InsightActionType = 'navigate' | 'filter' | 'open';
```

- **navigate**: Navegar a otra pestaña/sección con filtros opcionales
- **filter**: Filtrar datos en el contexto actual (ej: destacar categoría en gráfico)
- **open**: Desplazar/abrir un panel específico

### InsightAction
```typescript
interface InsightAction {
  id: string;                    // Identificador único
  label: string;                 // Texto del botón
  type: InsightActionType;       // Tipo de acción
  payload: Record<string, unknown>; // Datos específicos de la acción
}
```

### Insight (extendido)
```typescript
interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  icon: string;
  priority: number;
  context?: string;
  actionHint?: string;
  actions?: InsightAction[];  // ← NUEVO: Acciones interactivas
}
```

## Reglas Implementadas

| Regla | Acción | Payload |
|-------|--------|---------|
| growthExplained | navigate | `{ tab: 'concepts', filterCategory: string }` |
| concentration | filter | `{ category: string }` |
| operationalLoad | navigate | `{ tab: 'payments' }` |
| repeatedPattern | open | `{ panel: 'monthlyChart' }` |
| consolidation | navigate | `{ tab: 'concepts', filterConcept: string }` |

## Uso en Componentes

### 1. Definir handler en el dashboard

```typescript
const handleInsightAction = useCallback((action: InsightAction) => {
  switch (action.type) {
    case 'navigate':
      // Manejar navegación
      break;
    case 'filter':
      // Manejar filtrado
      break;
    case 'open':
      // Manejar apertura de panel
      break;
  }
}, [dependencies]);
```

### 2. Pasar handler al InsightCard

```tsx
<InsightCard
  items={toInsightItems(insights)}
  onAction={handleInsightAction}
/>
```

## Extensibilidad

### Agregar nueva regla de insight

1. Crear función en `insightRules.ts`:
```typescript
export const myNewInsight: InsightRule = (context) => {
  if (!condicion) return null;
  
  return {
    id: 'my-insight',
    type: 'info',
    title: 'Título',
    description: 'Descripción',
    icon: 'IconName',
    priority: 5,
    actions: [
      {
        id: 'action-id',
        label: 'Etiqueta',
        type: 'navigate',
        payload: { tab: 'target' }
      }
    ]
  };
};
```

2. Agregar a `allInsightRules`:
```typescript
export const allInsightRules: InsightRule[] = [
  // ...existentes
  myNewInsight
];
```

### Agregar nuevo tipo de acción

1. Extender `InsightActionType` en `types.ts`
2. Agregar case en el handler del dashboard

## Principios de Diseño

- **Separación**: Lógica visual desacoplada de lógica de negocio
- **Escalabilidad**: Handler genérico sin lógica hardcodeada
- **Compatibilidad**: Sistema opcional (funciona sin handler)
- **Tipado**: TypeScript para seguridad de tipos
