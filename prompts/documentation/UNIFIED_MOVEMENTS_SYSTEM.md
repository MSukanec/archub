# Sistema Unificado de Movimientos Financieros

## Resumen Ejecutivo

Este documento detalla el análisis completo del sistema de movimientos financieros en Seencel, incluyendo el sistema legacy, el sistema actual basado en features, y el plan de unificación para crear una experiencia coherente donde TODOS los movimientos financieros se visualizan y crean desde un único lugar.

---

## 1. Inventario de Tablas de Pagos/Movimientos

### 1.1 Sistema Legacy: Tabla `movements`

**Ubicación**: Tabla directa en Supabase (no definida en schema.ts)

**Estructura principal**:
```typescript
interface Movement {
  id: string;
  description: string;
  amount: number;
  exchange_rate?: number;
  created_at: string;
  movement_date: string;
  created_by: string;
  organization_id: string;
  project_id: string;
  type_id: string;           // FK a movement_concepts
  category_id: string;       // FK a movement_concepts
  subcategory_id?: string;   // FK a movement_concepts
  currency_id: string;
  wallet_id: string;
  is_favorite?: boolean;
  conversion_group_id?: string;  // Agrupa conversiones de moneda
  transfer_group_id?: string;    // Agrupa transferencias internas
}
```

**Tabla relacionada**: `movement_concepts`
- Estructura jerárquica de Tipo > Categoría > Subcategoría
- Permite a cada organización definir su propia taxonomía de movimientos
- Ejemplos: Egresos > Mano de Obra > Jornales, Ingresos > Clientes > Cuotas

**Casos especiales**:
- **Conversiones**: Dos movimientos (egreso + ingreso) con mismo `conversion_group_id`
- **Transferencias**: Dos movimientos (egreso + ingreso) con mismo `transfer_group_id`

**Archivos clave**:
- `src/hooks/use-movements.ts` - Hook principal
- `src/pages/professional/movements/Movements.tsx` - Página legacy
- `src/pages/professional/movements/MovementsList.tsx` - Lista de movimientos
- `src/features/finances/modals/movements/MovementModal.tsx` - Modal de 1957 líneas

---

### 1.2 Sistema Nuevo: Tablas `*_payments`

#### 1.2.1 `client_payments` (Pagos de Clientes)

**Ubicación**: `shared/schema.ts` línea 789

```typescript
export const client_payments = pgTable("client_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  project_id: uuid("project_id").notNull(),
  commitment_id: uuid("commitment_id"),        // Opcional: vincula a compromiso
  schedule_id: uuid("schedule_id"),            // Opcional: vincula a cuota
  organization_id: uuid("organization_id").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency_id: uuid("currency_id").notNull(),
  exchange_rate: numeric("exchange_rate"),
  payment_date: timestamp("payment_date").notNull().defaultNow(),
  notes: text("notes"),
  reference: text("reference"),
  wallet_id: uuid("wallet_id").notNull(),
  client_id: uuid("client_id"),
  status: text("status").notNull().default("confirmed"),
  created_by: uuid("created_by"),
  file_url: text("file_url"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});
```

**Archivos clave**:
- `src/features/clients/services/clientPayments.ts`
- `src/features/clients/modals/ClientPaymentForm.tsx`
- `server/controllers/projects/clientPayments.controller.ts`

---

#### 1.2.2 `material_payments` (Pagos de Materiales)

**Ubicación**: Tabla en Supabase (no en schema.ts)

**Handler**: `server/lib/handlers/projects/materialPayments.ts`

```typescript
// Estructura inferida del handler
interface MaterialPayment {
  id: string;
  project_id: string;
  organization_id: string;
  amount: number;
  currency_id: string;
  exchange_rate?: number;
  payment_date: string;
  notes?: string;
  wallet_id: string;
  material_id?: string;        // Vincula al material
  purchase_order_id?: string;  // Vincula a orden de compra
  status: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}
```

**Archivos clave**:
- `server/lib/handlers/projects/materialPayments.ts`
- `server/controllers/projects/materialPayments.controller.ts`
- Modal: Registrado como `material-payment` en `registerModals.ts`

---

#### 1.2.3 `personnel_payments` (Pagos de Personal)

**Ubicación**: Tabla en Supabase (no en schema.ts)

**Handler**: `server/lib/handlers/projects/personnelPayments.ts`

```typescript
// Estructura inferida del handler
interface PersonnelPayment {
  id: string;
  project_id: string;
  organization_id: string;
  amount: number;
  currency_id: string;
  exchange_rate?: number;
  payment_date: string;
  notes?: string;
  wallet_id: string;
  personnel_id?: string;       // Vincula al personal
  status: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}
```

**Archivos clave**:
- `server/lib/handlers/projects/personnelPayments.ts`
- `server/controllers/projects/personnelPayments.controller.ts`
- Modal: Registrado como `personnel-payment` en `registerModals.ts`

---

#### 1.2.4 `general_cost_payments` (Pagos de Costos Generales)

**Ubicación**: Feature `src/features/general-costs/`

**Servicios**:
- `src/features/general-costs/services/createGeneralCostPayment.ts`
- `src/features/general-costs/services/getGeneralCostPayment.ts`
- `src/features/general-costs/services/updateGeneralCostPayment.ts`
- `src/features/general-costs/services/deleteGeneralCostPayment.ts`

**Hooks**:
- `src/features/general-costs/hooks/use-general-costs-payments.ts`
- `src/features/general-costs/hooks/use-create-general-cost-payment.ts`

**Modal**: `src/features/general-costs/forms/GeneralCostPaymentForm.tsx`

---

#### 1.2.5 Pagos de Subcontratos

Los pagos de subcontratos se vinculan a través de la tabla `movements` con referencias a subcontratos:

**Archivos clave**:
- `src/features/subcontracts/hooks/use-create-movement-subcontracts.ts`
- `src/features/subcontracts/hooks/use-update-movement-subcontracts.ts`
- `src/pages/professional/project/construction/subcontracts/SubcontractPayments.tsx`

---

#### 1.2.6 Otras Tablas de Pagos

**`payments`** (Pagos de cursos/suscripciones - Learning):
```typescript
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: text("provider").notNull(),
  provider_payment_id: text("provider_payment_id"),
  user_id: uuid("user_id").notNull(),
  course_id: uuid("course_id"),
  amount: numeric("amount").notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull().default("pending"),
  // ... más campos
});
```

**`bank_transfer_payments`** (Transferencias bancarias pendientes):
```typescript
export const bank_transfer_payments = pgTable("bank_transfer_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  payment_id: uuid("payment_id"),
  receipt_url: text("receipt_url"),
  status: text("status").notNull().default("pending"),
  // ... más campos
});
```

---

## 2. Comparación: Sistema Legacy vs Sistema Nuevo

| Aspecto | Sistema Legacy (`movements`) | Sistema Nuevo (`*_payments`) |
|---------|------------------------------|------------------------------|
| **Ubicación** | Tabla única `movements` | Tablas separadas por entidad |
| **Taxonomía** | `movement_concepts` (tipo/categoría/subcategoría) | Campo `movement_type` implícito por tabla |
| **Vinculación** | Campos opcionales en la misma tabla | FK directo a la entidad (client_id, material_id, etc.) |
| **Conversiones** | `conversion_group_id` | No soportado nativamente |
| **Transferencias** | `transfer_group_id` | No soportado nativamente |
| **Vista unificada** | Sí (MovementsList) | No (cada feature tiene su lista) |
| **Modal unificado** | Sí (MovementModal) | No (cada feature tiene su modal) |

---

## 3. Estado Actual del Intento de Unificación

Ya existe trabajo previo hacia la unificación:

### 3.1 Tipos Unificados

**Archivo**: `src/features/finances/types/index.ts`

```typescript
export interface FinancialMovement {
  id: string;
  organization_id: string;
  project_id: string | null;
  amount: number;
  currency_id: string;
  exchange_rate: number;
  payment_date: string;
  description: string;
  notes: string | null;
  reference: string | null;
  wallet_id: string | null;
  status: 'confirmed' | 'pending' | 'rejected' | 'void';
  file_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  movement_type: string;           // "client_payment", "material_payment", etc.
  movement_category: string | null;
  movement_subcategory: string | null;
  client_id: string | null;
  material_id: string | null;
  personnel_id: string | null;
  indirect_id: string | null;
  subcontract_id: string | null;
  general_cost_id: string | null;
  partner_id: string | null;
}
```

### 3.2 Servicio de Agregación (En Progreso)

**Archivo**: `src/features/finances/services/getAllFinancialMovements.ts`

Actualmente solo agrega:
- ✅ client_payments
- ✅ partner_contributions
- ✅ partner_withdrawals
- ✅ material_payments
- ✅ personnel_payments
- ✅ general_cost_payments (agregado 2025-12-13 vía vista SQL)
- ❌ subcontract_payments (TODO)
- ❌ indirect_payments (TODO)

### 3.3 Modal de Nuevo Movimiento

**Archivo**: `src/features/finances/modals/NewMovementModal.tsx`

Modal unificado para crear movimientos desde la página de Finanzas:

**Tipos soportados**:
- ✅ client_payment (Pago de Cliente)
- ✅ partner_contribution (Aporte de Socio)
- ✅ partner_withdrawal (Retiro de Socio)
- ✅ material_payment (Pago de Material)
- ✅ personnel_payment (Pago de Personal)
- ✅ general_cost_payment (Pago de Gasto General - agregado 2025-12-13)
- ❌ subcontract_payment (TODO)

**Patrón de integración**:
Cada tipo de movimiento usa un formulario agnóstico (`*FormFields.tsx`) que:
- No importa componentes de modal
- Recibe props: projectId, organizationId, mode, onSuccess, onCancel, hideActions, formRef
- El modal controla submit vía `formRef.current.requestSubmit()`

**Ejemplo**: `GeneralCostPaymentFormFields.tsx` creado en `src/features/general-costs/forms/`

### 3.4 Mappers Existentes

**Archivo**: `src/features/finances/mappers/index.ts`

- `mapClientPaymentsToFinancialMovements`
- `mapPartnerContributionsToFinancialMovements`
- `mapPartnerWithdrawalsToFinancialMovements`

---

## 4. Arquitectura Propuesta

### 4.1 Opción A: Vista de Base de Datos (Recomendada)

Crear una vista SQL que unifique todas las tablas de pagos:

```sql
CREATE VIEW unified_financial_movements AS
SELECT 
  id,
  'client_payment' as movement_type,
  project_id,
  organization_id,
  amount::numeric as amount,
  currency_id,
  exchange_rate,
  payment_date as occurred_at,
  notes as description,
  wallet_id,
  status,
  created_by,
  created_at,
  updated_at,
  client_id,
  NULL::uuid as material_id,
  NULL::uuid as personnel_id,
  NULL::uuid as general_cost_id,
  NULL::uuid as subcontract_id,
  NULL::uuid as partner_id
FROM client_payments
WHERE status != 'void'

UNION ALL

SELECT 
  id,
  'material_payment' as movement_type,
  project_id,
  organization_id,
  amount::numeric,
  currency_id,
  exchange_rate,
  payment_date as occurred_at,
  notes as description,
  wallet_id,
  status,
  created_by,
  created_at,
  updated_at,
  NULL::uuid as client_id,
  material_id,
  NULL::uuid as personnel_id,
  NULL::uuid as general_cost_id,
  NULL::uuid as subcontract_id,
  NULL::uuid as partner_id
FROM material_payments
WHERE status != 'void'

-- ... más UNION ALL para cada tabla
;
```

**Ventajas**:
- Rendimiento optimizado (queries directas a la vista)
- RLS centralizado
- Un solo punto de mantenimiento
- Índices optimizados

**Desventajas**:
- Requiere migración de esquema
- Necesita actualizar RLS policies

---

### 4.2 Opción B: Agregación en API (Alternativa)

Completar el servicio `getAllFinancialMovements.ts` para agregar todas las tablas.

**Ventajas**:
- No requiere cambios en BD
- Más flexible

**Desventajas**:
- Múltiples queries por request
- Lógica duplicada
- Difícil de mantener

---

### 4.3 Modal Unificado: `UnifiedMovementModal`

**Arquitectura propuesta**:

```tsx
// src/features/finances/modals/UnifiedMovementModal.tsx

interface UnifiedMovementModalProps {
  modalData?: {
    defaultType?: MovementType;
    projectId?: string;
    editingPayment?: any;
  };
  onClose: () => void;
}

type MovementType = 
  | 'client_payment'
  | 'material_payment'
  | 'personnel_payment'
  | 'general_cost_payment'
  | 'subcontract_payment'
  | 'conversion'
  | 'transfer'
  | 'partner_contribution'
  | 'partner_withdrawal';

export function UnifiedMovementModal({ modalData, onClose }: UnifiedMovementModalProps) {
  const [selectedType, setSelectedType] = useState<MovementType | null>(
    modalData?.defaultType || null
  );

  return (
    <FormModalLayout size="lg">
      <FormModalHeader
        icon={DollarSign}
        title="Nuevo Movimiento"
        description="Registra un nuevo movimiento financiero en el sistema"
        onClose={onClose}
      />
      
      <FormModalBody>
        {/* Selector de tipo de movimiento */}
        <CascadingSelect
          label="Tipo de Movimiento"
          options={MOVEMENT_TYPE_OPTIONS}
          value={selectedType}
          onChange={setSelectedType}
        />

        {/* Renderizado condicional del formulario específico */}
        {selectedType === 'client_payment' && (
          <ClientPaymentFormContent 
            projectId={modalData?.projectId}
            onSuccess={onClose}
          />
        )}
        
        {selectedType === 'material_payment' && (
          <MaterialPaymentFormContent 
            projectId={modalData?.projectId}
            onSuccess={onClose}
          />
        )}
        
        {/* ... más tipos */}
      </FormModalBody>
    </FormModalLayout>
  );
}

const MOVEMENT_TYPE_OPTIONS = [
  {
    value: 'income',
    label: 'Ingresos',
    children: [
      { value: 'client_payment', label: 'Pago de Cliente' },
      { value: 'partner_contribution', label: 'Aporte de Socio' },
    ]
  },
  {
    value: 'expense',
    label: 'Egresos',
    children: [
      { value: 'material_payment', label: 'Pago de Material' },
      { value: 'personnel_payment', label: 'Pago de Personal' },
      { value: 'subcontract_payment', label: 'Pago de Subcontrato' },
      { value: 'general_cost_payment', label: 'Costo General' },
      { value: 'partner_withdrawal', label: 'Retiro de Socio' },
    ]
  },
  { value: 'conversion', label: 'Conversión de Moneda' },
  { value: 'transfer', label: 'Transferencia Interna' },
];
```

---

## 5. Plan de Implementación

### Fase 0: Preparación (1-2 días)
- [ ] Crear este documento de arquitectura ✅
- [ ] Mapear campos de cada tabla `*_payments`
- [ ] Identificar campos faltantes en cada tabla
- [ ] Definir RLS policies necesarias

### Fase 1: Vista Unificada (2-3 días)
- [ ] Crear migración SQL para la vista `unified_financial_movements`
- [ ] Actualizar tipos TypeScript
- [ ] Crear hook `useUnifiedFinancialMovements`
- [ ] Probar con datos existentes

### Fase 2: Nueva Página de Movimientos (2-3 días)
- [ ] Crear nueva página usando la vista unificada
- [ ] Reutilizar componentes de MovementsList
- [ ] Agregar filtros por tipo de movimiento
- [ ] Implementar KPIs unificados

### Fase 3: Modal Unificado (3-4 días)
- [ ] Crear `UnifiedMovementModal`
- [ ] Extraer formularios de cada feature como componentes reutilizables
- [ ] Implementar selector de tipo con CascadingSelect
- [ ] Probar creación de cada tipo de movimiento

### Fase 4: Deprecación Legacy (1-2 días)
- [ ] Redirigir `/movements` a nueva página
- [ ] Marcar modal legacy como deprecated
- [ ] Actualizar navegación

---

## 6. Archivos Clave para Revisar

### Frontend
```
src/pages/professional/movements/Movements.tsx
src/pages/professional/movements/MovementsList.tsx
src/features/finances/modals/movements/MovementModal.tsx
src/features/finances/types/index.ts
src/features/finances/services/getAllFinancialMovements.ts
src/features/finances/mappers/index.ts
src/features/clients/modals/ClientPaymentForm.tsx
src/features/general-costs/forms/GeneralCostPaymentForm.tsx
src/components/modal/factory/registerModals.ts
```

### Backend
```
server/lib/handlers/projects/clientPayments.controller.ts
server/lib/handlers/projects/materialPayments.ts
server/lib/handlers/projects/personnelPayments.ts
shared/schema.ts
```

### Hooks
```
src/hooks/use-movements.ts
src/features/finances/hooks/use-financial-movements.ts
src/features/general-costs/hooks/use-general-costs-payments.ts
```

---

## 7. Consideraciones Técnicas

### 7.1 Conversiones y Transferencias
El sistema legacy maneja conversiones y transferencias como pares de movimientos vinculados. El nuevo sistema debe mantener esta capacidad:
- Conversiones: Cambio de moneda (egreso en USD, ingreso en ARS)
- Transferencias: Movimiento entre billeteras (egreso de Efectivo, ingreso en Banco)

### 7.2 Compatibilidad con Datos Existentes
- La tabla `movements` contiene datos históricos
- La vista debe incluir movimientos legacy + nuevos pagos

### 7.3 Performance
- Considerar materializar la vista si hay muchos registros
- Agregar índices apropiados
- Implementar paginación

---

## 8. Preguntas Abiertas

1. **¿Qué hacer con los movimientos legacy?** 
   - ¿Migrar a nuevas tablas?
   - ¿Mantener en paralelo?

2. **¿Los subcontratos tienen tabla propia de pagos?**
   - Actualmente usan `movements` con vinculación

3. **¿Los indirectos tienen tabla propia?**
   - Revisar si existe `indirect_payments`

4. **¿Cómo manejar los conceptos de movimiento?**
   - ¿Deprecar `movement_concepts`?
   - ¿Mantener para categorización adicional?

---

*Documento creado: Diciembre 2025*
*Última actualización: 2025-12-13 (Agregado modal NewMovementModal con general_cost_payment)*
