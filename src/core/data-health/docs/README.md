# Data Health System

Sistema reusable para detectar problemas de calidad en los datos financieros.

## Objetivo

Alertar al usuario sobre problemas que afectan la calidad de los análisis, SIN mezclar con insights de negocio y SIN mostrar errores técnicos.

## Estructura

```
src/core/data-health/
├── index.ts                    # API pública
├── types.ts                    # Tipos base
├── engine/
│   └── DataHealthEngine.ts     # Motor de ejecución de reglas
├── rules/
│   └── payment-rules.ts        # Reglas para pagos
├── adapters/
│   └── insights-adapter.ts     # Adaptador a InsightCard
├── hooks/
│   └── useDataHealth.ts        # Hook de React para integración
└── docs/
    └── README.md               # Esta documentación
```

## Tipos Principales

### DataSeverity
```typescript
type DataSeverity = 'info' | 'warning' | 'critical';
```

- `info`: Información que puede ser útil pero no afecta el análisis
- `warning`: Problema que puede afectar parcialmente el análisis
- `critical`: Problema que afecta significativamente los cálculos

### DataIssue
```typescript
interface DataIssue {
  id: string;                    // ID único del issue
  ruleId: string;                // ID de la regla que lo generó
  title: string;                 // Título corto
  description: string;           // Descripción clara del problema
  severity: DataSeverity;        // Severidad
  recommendedAction: {           // Acción correctiva
    label: string;
    description?: string;
    actionType: 'navigate' | 'edit' | 'bulk_edit' | 'manual';
    targetPath?: string;
    targetIds?: (string | number)[];
  };
  affectedCount: number;         // Cantidad de elementos afectados
  affectedEntities?: Array<{     // Primeros 5 elementos afectados
    id: string | number;
    label: string;
  }>;
}
```

### DataHealthRule
```typescript
interface DataHealthRule<TInput> {
  id: string;                    // ID único de la regla
  name: string;                  // Nombre descriptivo
  description: string;           // Qué detecta esta regla
  category: string;              // Categoría (classification, currency, dates)
  appliesTo: string[];           // Tags para filtrado (payments, general-costs)
  check: (input: TInput[], ctx: DataHealthContext) => DataIssue | null;
}
```

## Reglas Disponibles

### Pagos

| ID | Nombre | Severidad | Descripción |
|----|--------|-----------|-------------|
| `payments-without-category` | Pagos sin categoría | warning | Pagos que no tienen categoría asignada |
| `payments-missing-exchange-rate` | Pagos sin cotización | critical | Pagos en moneda extranjera sin cotización |
| `payments-with-future-date` | Pagos con fecha futura | info | Pagos con fecha posterior a hoy |
| `payments-without-concept` | Pagos sin concepto | warning | Pagos no asociados a un concepto |

## Uso

### En un componente React

```typescript
import { useGeneralCostsDataHealth } from '@/core/data-health';

function MyDashboard() {
  const { data: payments = [] } = usePayments();
  
  const dataHealth = useGeneralCostsDataHealth(payments, {
    organizationId: 'org-123',
    defaultCurrencyId: 'currency-ars',
    enabled: true,
  });

  // Usar insights en InsightCard
  return (
    <InsightCard 
      items={[...dataHealth.insights, ...businessInsights]}
    />
  );
}
```

### Crear una nueva regla

```typescript
import type { DataHealthRule, NormalizedPayment } from '@/core/data-health';

export const myCustomRule: DataHealthRule<NormalizedPayment> = {
  id: 'my-custom-rule',
  name: 'Mi Regla Personalizada',
  description: 'Detecta X problema',
  category: 'classification',
  appliesTo: ['payments', 'my-module'],
  check: (payments, ctx) => {
    const affected = payments.filter(p => /* condición */);
    
    if (affected.length === 0) return null;

    return {
      id: `${ctx.organizationId}-my-custom-rule`,
      ruleId: 'my-custom-rule',
      title: 'Mi Problema',
      description: `${affected.length} pagos tienen este problema`,
      severity: 'warning',
      affectedCount: affected.length,
      affectedEntities: affected.slice(0, 5).map(p => ({ 
        id: p.id, 
        label: p.label 
      })),
      recommendedAction: {
        label: 'Corregir',
        actionType: 'bulk_edit',
        targetIds: affected.map(p => p.id),
      },
    };
  },
};
```

## Integración con InsightCard

El adaptador `dataHealthToInsights` convierte los `DataIssue` al formato `InsightItem`:

```typescript
import { dataHealthToInsights, mergeWithBusinessInsights } from '@/core/data-health';

// Convertir a insights
const healthInsights = dataHealthToInsights(result);

// Combinar con insights de negocio (data health primero)
const allInsights = mergeWithBusinessInsights(businessInsights, healthInsights);
```

## Mapeo de Severidad a Variante

| DataSeverity | InsightVariant |
|--------------|----------------|
| info | info |
| warning | warning |
| critical | danger |

## Principios de Diseño

1. **Agnóstico**: Las reglas trabajan con datos normalizados, no con tipos específicos de la app
2. **Reusable**: El engine puede usarse en cualquier módulo
3. **No técnico**: Los mensajes están escritos para usuarios finales
4. **Actionable**: Cada issue tiene una acción correctiva clara
5. **Separado de insights de negocio**: Data Health detecta problemas de datos, no tendencias o patrones
