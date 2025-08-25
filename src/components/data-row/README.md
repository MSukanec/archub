# DataRowCard - Componente Base Reutilizable

## Descripción

`DataRowCard` es un componente base reutilizable para crear ítems de lista tipo card que reemplazan visualmente las filas de tabla. Ideal para interfaces móviles y de escritorio que necesitan mostrar información estructurada de forma compacta y accesible.

## Estructura Visual

```
[Checkbox?] [Avatar/Icono] [Título + Subtitle + Lines] [Amount + Badge + Chevron]
   Leading                      Content                      Trailing
```

## Props Principales

### Leading Section (Izquierda)
- `selectable?: boolean` - Muestra checkbox de selección
- `selected?: boolean` - Estado del checkbox
- `avatarUrl?: string` - URL del avatar
- `avatarFallback?: string` - Iniciales para el avatar (ej: "AB")
- `iconName?: string` - Nombre del ícono (futuro)

### Content Section (Centro)
- `title: string` - Título principal (negrita, obligatorio)
- `subtitle?: string` - Subtítulo (texto muted)
- `lines?: Line[]` - Hasta 3 líneas adicionales con formato

### Trailing Section (Derecha)
- `amount?: number` - Importe numérico
- `currencyCode?: string` - Código de moneda (ARS, USD, etc.)
- `amountTone?: 'neutral' | 'success' | 'danger'` - Color del importe
- `badgeText?: string` - Texto del badge (ej: "Pendiente")
- `showChevron?: boolean` - Muestra flecha de navegación

### Comportamiento
- `onClick?: () => void` - Hace el card clickeable
- `disabled?: boolean` - Deshabilita interacciones
- `loading?: boolean` - Muestra skeleton
- `density?: 'compact' | 'normal' | 'comfortable'` - Tamaño del card

## Tipo Line

```typescript
type Line = {
  text: string;                    // Texto principal
  tone?: 'muted' | 'success' | 'warning' | 'danger' | 'info'; // Color
  hintRight?: string;              // Texto pequeño a la derecha
  mono?: boolean;                  // Fuente monoespaciada
}
```

## Ejemplos de Uso

### 1. Movimiento Financiero
```typescript
<DataRowCard
  title="Materiales"
  subtitle="Acopio"
  avatarFallback="M"
  lines={[
    { text: '-$13.000', tone: 'danger', mono: true, hintRight: 'ARS' },
    { text: 'Gas (Mattioni)', tone: 'muted' }
  ]}
  showChevron={true}
  onClick={() => openMovementModal()}
/>
```

### 2. Pago de Cliente
```typescript
<DataRowCard
  title="Aporte — Osvaldo Robert"
  lines={[
    { text: '+$9.305.263', tone: 'success', mono: true, hintRight: 'ARS' },
    { text: 'UF02 · Cuota 1', tone: 'info' }
  ]}
  badgeText="Confirmado"
  amount={9305263}
  currencyCode="ARS"
  amountTone="success"
/>
```

### 3. Lista Seleccionable
```typescript
<DataRowCard
  title="Proveedor ABC"
  subtitle="Material de construcción"
  selectable={true}
  selected={isSelected}
  avatarFallback="PA"
  density="compact"
/>
```

### 4. Estado de Carga
```typescript
<DataRowCard
  title=""
  loading={true}
  density="normal"
/>
```

## Cómo Crear Wrappers Específicos

### Paso 1: Crear archivo wrapper
Ubicación: `src/components/data-row/rows/[Entidad]Row.tsx`

### Paso 2: Implementar usando children pattern
```typescript
// Ejemplo: MovementRow.tsx
import DataRowCard from '../DataRowCard';
import { Movement } from '@/types';

interface MovementRowProps {
  movement: Movement;
  onClick?: () => void;
  selected?: boolean;
  density?: 'compact' | 'normal' | 'comfortable';
}

export default function MovementRow({ movement, onClick, selected, density }: MovementRowProps) {
  // Contenido interno del card usando children
  const cardContent = (
    <>
      {/* Columna de contenido (principal) */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <div className="font-semibold text-sm truncate">
          {movement.description}
        </div>
        
        {/* Subtitle */}
        <div className="text-xs text-muted-foreground truncate">
          {movement.category?.name}
        </div>
        
        {/* Additional info line */}
        <div className="text-xs text-muted-foreground">
          {movement.wallet?.name || 'Sin billetera'}
        </div>
      </div>

      {/* Trailing Section */}
      <div className="flex items-center">
        <div className="text-right">
          <div className={cn(
            "text-sm font-medium",
            movement.amount > 0 ? "text-green-600" : "text-red-600"
          )}>
            {formatAmount(movement.amount)}
          </div>
          <div className="text-xs text-muted-foreground">
            {movement.currency?.symbol}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <DataRowCard
      avatarFallback={movement.category?.name?.[0] || 'M'}
      selected={selected}
      density={density}
      onClick={onClick}
    >
      {cardContent}
    </DataRowCard>
  );
}
```

## Pregunta Checklist

Cuando me digas "Quiero hacer una data-row para la tabla X", te preguntaré:

### Leading
- ¿Quieres avatar? ¿Con imagen o solo iniciales?
- ¿Necesitas selección múltiple (checkbox)?
- ¿Algún ícono específico?

### Content
- ¿Cuál es el título principal?
- ¿Hay subtítulo?
- ¿Cuántas líneas adicionales? (máx 3)
- ¿Qué tono de color para cada línea?
- ¿Alguna línea necesita formato monoespaciado?

### Trailing
- ¿Mostrar importe? ¿Con qué color?
- ¿Hay badge de estado?
- ¿Es clickeable? (chevron)

### Comportamiento
- ¿Densidad preferida?
- ¿Acciones al hacer click?
- ¿Soporte para loading/skeleton?

## Accesibilidad

- ✅ Soporte completo de teclado (Enter/Espacio)
- ✅ Roles ARIA apropiados
- ✅ Estados de foco visibles
- ✅ Textos semánticamente correctos
- ✅ Contraste de colores adecuado

## Responsive

- Optimizado para móvil (min 360px)
- Texto truncado automáticamente
- Trailing section se adapta al espacio disponible
- Touch targets apropiados (44px mín)