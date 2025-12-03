# Universal Import System

Sistema de importación masiva de datos desde archivos CSV/Excel. Permite importar grandes volúmenes de datos con validación, mapeo automático de columnas, resolución de conflictos y sugerencias de IA.

## Arquitectura

```
src/features/imports/
├── components/
│   └── UniversalImportForm.tsx    # Componente principal del wizard
├── hooks/
│   ├── useFileParser.ts           # Parseo de CSV/Excel
│   ├── useColumnAutoMap.ts        # Auto-mapeo de columnas
│   ├── useValidationEngine.ts     # Motor de validación
│   └── useAISuggestMapping.ts     # Sugerencias de IA (GPT-4o mini)
├── steps/
│   ├── StepPreview.tsx            # Paso 1: Vista previa del archivo
│   ├── StepMapping.tsx            # Paso 2: Mapeo de columnas
│   ├── StepValidation.tsx         # Paso 3: Validación de errores
│   ├── StepConflicts.tsx          # Paso 4: Resolución de conflictos
│   └── StepSummary.tsx            # Paso 5: Resumen e importación
└── types/
    └── index.ts                   # Tipos TypeScript
```

## Flujo de 5 Pasos

1. **Vista Previa**: El usuario sube el archivo y ve las primeras filas
2. **Mapeo**: Asigna columnas del archivo a campos del sistema (con auto-mapeo)
3. **Validación**: Se muestran errores de tipo, formato, etc.
4. **Conflictos**: Resolver valores que no coinciden (ej: "Efectivo" vs "efectivo")
5. **Resumen**: Confirmar e importar los registros válidos

## Tipos Principales

### ImportConfig

```typescript
interface ImportConfig {
  entityName: string;              // Nombre singular: "Pago de Cliente"
  entityNamePlural: string;        // Nombre plural: "Pagos de Clientes"
  targetSchema: TargetField[];     // Esquema de campos destino
  smartColumnMapping?: Record<string, string>;  // Mapeos inteligentes
  valueMapConfig?: Record<string, Record<string, string>>;  // Traducción de valores
  onImport: (rows: Record<string, any>[]) => Promise<void>;  // Función de importación
  
  // Opcionales
  projectContext?: ProjectContext;
  availableProjects?: Array<{ id: string; name: string }>;
  availableClients?: Array<{ id: string; name: string }>;
  fieldHelpMessages?: Record<string, FieldHelpMessage>;
}
```

### TargetField

```typescript
interface TargetField {
  field: string;           // Nombre del campo en la DB
  label: string;           // Etiqueta para mostrar
  type: FieldType;         // 'string' | 'number' | 'date' | 'currency' | 'boolean' | 'foreign-key'
  required?: boolean;      // Si es obligatorio
  description?: string;    // Descripción/ejemplo
  foreignKeyConfig?: {     // Solo para type: 'foreign-key'
    entityName: string;
    labelKey: string;
    valueKey: string;
    options: Array<{ label: string; value: string }>;
  };
}
```

## Cómo Implementar en una Nueva Página

### Paso 1: Importar tipos y hooks necesarios

```typescript
import { useGlobalModalStore } from '@/components/modal';
import type { TargetField, ImportConfig, ProjectContext } from '@/features/imports/types';
import { useOrganizationWallets } from '@/features/organization/hooks';
import { useOrganizationCurrencies } from '@/hooks/use-currencies';
```

### Paso 2: Crear función handleImport

```typescript
const handleImport = () => {
  if (!organizationId || !userData?.user?.id) {
    toast({ title: 'Error', description: 'No se pudo cargar la información requerida', variant: 'destructive' });
    return;
  }

  // 1. Definir el schema de campos
  const targetSchema: TargetField[] = [
    {
      field: 'payment_date',
      label: 'Fecha de Pago',
      type: 'date',
      required: true,
      description: 'Ej: 2024-01-15',
    },
    {
      field: 'amount',
      label: 'Monto',
      type: 'number',
      required: true,
      description: 'Ej: 5000',
    },
    {
      field: 'currency_code',
      label: 'Moneda (Código)',
      type: 'foreign-key',
      required: true,
      description: 'Ej: USD, ARS, EUR',
      foreignKeyConfig: {
        entityName: 'currency',
        labelKey: 'label',
        valueKey: 'value',
        options: (organizationCurrencies || []).map(oc => ({
          label: `${oc.currency?.code || ''} - ${oc.currency?.name || ''}`,
          value: oc.currency_id,
        })),
      },
    },
    {
      field: 'wallet_name',
      label: 'Billetera',
      type: 'foreign-key',
      required: false,
      foreignKeyConfig: {
        entityName: 'wallet',
        labelKey: 'label',
        valueKey: 'value',
        options: (organizationWallets || []).map(ow => ({
          label: ow.wallets?.name || 'Sin nombre',
          value: ow.id,
        })),
      },
    },
    // ... más campos
  ];

  // 2. Crear mapeo de valores (traduce valores del CSV a IDs)
  const walletValueMap: Record<string, string> = {};
  (organizationWallets || []).forEach(ow => {
    if (ow.wallets?.name && ow.id) {
      const normalizedName = ow.wallets.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      walletValueMap[normalizedName] = ow.id;
    }
  });

  const currencyValueMap: Record<string, string> = {};
  (organizationCurrencies || []).forEach(oc => {
    if (oc.currency?.code && oc.currency_id) {
      currencyValueMap[oc.currency.code.toLowerCase().trim()] = oc.currency_id;
    }
  });

  const valueMapConfig = {
    currency_code: currencyValueMap,
    wallet_name: walletValueMap,
    status: {
      'confirmado': 'confirmed',
      'pendiente': 'pending',
      'rechazado': 'rejected',
    },
  };

  // 3. Abrir el modal
  openModal('universal-import', {
    config: {
      entityName: 'Pago',
      entityNamePlural: 'Pagos',
      targetSchema,
      valueMapConfig,
      projectContext: { type: 'organization', organizationId },
      fieldHelpMessages: {
        wallet_name: {
          message: 'Las billeteras deben agregarse primero en configuración.',
          linkText: 'Ir a Configuración',
          linkPath: '/settings/finances',
        },
      },
      onImport: async (rows: any[]) => {
        // 4. Procesar cada fila e insertar en la DB
        for (const row of rows) {
          await createPaymentMutation.mutateAsync({
            organization_id: organizationId,
            payment_date: row.payment_date,
            amount: parseFloat(row.amount),
            currency_id: row.currency_code,
            wallet_id: row.wallet_name || defaultWalletId,
            status: row.status || 'confirmed',
            notes: row.notes || null,
            // ... más campos
          });
        }
      },
    } as ImportConfig,
  });
};
```

### Paso 3: Agregar botón en la tabla

```typescript
<Table
  topBar={{
    showImport: true,
    onImport: handleImport,
    // ...otros props
  }}
  // ...
/>
```

## Características Especiales

### Auto-mapeo de columnas
El sistema intenta mapear automáticamente columnas del archivo a campos del schema basándose en:
- Coincidencia exacta de nombres
- Coincidencia parcial (Levenshtein)
- Palabras clave comunes (fecha, monto, etc.)

### Sugerencias de IA
Si el auto-mapeo no funciona, se usa GPT-4o mini para sugerir mapeos basados en:
- Headers del archivo
- Schema de destino
- Datos de ejemplo

### Resolución de conflictos
Cuando un valor no coincide exactamente (ej: "efectivo" vs "Efectivo"):
- Muestra sugerencias basadas en similitud
- Permite seleccionar el valor correcto
- Aplica corrección a todas las filas con el mismo valor

### Validación por tipo
- **date**: Acepta múltiples formatos (DD/MM/YYYY, YYYY-MM-DD, etc.)
- **number**: Maneja separadores de miles y decimales
- **currency**: Similar a number pero con símbolo
- **foreign-key**: Valida que exista en las opciones disponibles

## Páginas que lo usan

1. **ClientPaymentsTab** (`src/pages/clients/ClientPaymentsTab.tsx`) - Pagos de clientes
2. **MaterialPaymentsTab** (`src/pages/professional/materials/MaterialPaymentsTab.tsx`) - Pagos de materiales/mano de obra
3. **GeneralCostsPaymentsTab** (`src/pages/general-costs/GeneralCostsPaymentsTab.tsx`) - Pagos de gastos generales

## Notas de Implementación

- El modal está registrado como `'universal-import'` en el sistema de modales
- Los IDs de foreign-key (wallet_id, currency_id) deben mapearse correctamente
- `wallet_id` usa `organization_wallets.id`, NO `wallets.id`
- Siempre normalizar strings para comparación (lowercase, sin acentos)
- La función `onImport` recibe filas ya procesadas con IDs resueltos
