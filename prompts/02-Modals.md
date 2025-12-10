# SEENCEL - Estándar Universal de Modales

Este documento es LA LEY para crear o refactorizar cualquier modal en Seencel.

---

## 1. NOMBRE Y ESTRUCTURA DEL ARCHIVO

### Archivos Separados: Form vs View

Para mejor escalabilidad y rendimiento, **SEPARAMOS** la lógica de formulario de la vista:

```
<Entidad>Form.tsx   → Para CREATE y EDIT (lógica pesada: useForm, validación, hooks)
<Entidad>View.tsx   → Para VIEW (componente liviano: solo renderiza datos)
```

**UBICACIÓN: La carpeta DEBE ser `forms`**

Ejemplos correctos:
- `src/features/clients/forms/ClientPaymentForm.tsx` (create/edit)
- `src/features/clients/forms/ClientPaymentView.tsx` (view)
- `src/features/general-costs/forms/GeneralCostPaymentForm.tsx`
- `src/features/general-costs/forms/GeneralCostPaymentView.tsx`

### ¿Cuándo usar UN solo archivo vs DOS archivos?

| Caso | Solución |
|------|----------|
| Modal simple (< 150 líneas total) | Un solo `*Form.tsx` con `FormPanel` y `ViewPanel` internos |
| Modal complejo (> 150 líneas, muchos campos) | Dos archivos: `*Form.tsx` + `*View.tsx` |
| View tiene lógica especial (tabs, acordeones) | Definitivamente separar en `*View.tsx` |

### Migración de archivos antiguos

Si existen archivos duplicados como:
- `ClientPaymentModal.tsx`
- `ClientPaymentEditModal.tsx`
- `ClientPaymentViewModal.tsx`

**Elimínalos y crea:**
- `ClientPaymentForm.tsx` (para create/edit)
- `ClientPaymentView.tsx` (para view, si es complejo)

---

## 2. PROPS OBLIGATORIOS

```typescript
interface ModalFormProps {
  modalData?: any;
  onClose: () => void;
  mode?: "create" | "edit";  // Solo create/edit en Form
}

interface ModalViewProps {
  modalData?: any;
  onClose: () => void;
  // mode siempre es "view" implícito
}
```

El componente debe comportarse según `mode`:

```typescript
// ✅ CORRECTO: Usar mode directamente en condiciones
if (mode === "edit") { ... }
if (mode === "create") { ... }

// ❌ EVITAR: Crear variables booleanas intermedias
// const isCreate = mode === "create";
// const isEdit = mode === "edit";
```

**¿POR QUÉ?** Una única fuente de verdad evita duplicaciones y hace el código más claro.

---

## 3. CONTENEDORES OBLIGATORIOS

El modal **DEBE** usar exclusivamente:

```tsx
import { 
  ModalLayout, 
  ModalHeader, 
  ModalBody, 
  ModalFooter 
} from '@/components/modal';
```

### ModalLayout
- Contenedor principal con portal, animaciones, focus trap
- Recibe `onClose`, `size`
- **IMPORTANTE:** Si pasas `children`, el contenido DEBE incluir `<ModalHeader>`, `<ModalBody>`, `<ModalFooter>`

### ModalHeader
- Título, subtítulo, ícono, actions
- **OBLIGATORIO:** Siempre incluir `description`

### ModalBody
- Contenido scrolleable
- No paddings manuales, no scroll manual

### ModalFooter
- Botones de acción
- No divs intermedios

---

## 3.1 LAYOUT FLUIDO - GRID RESPONSIVE (Container-Aware)

### EL PROBLEMA con el enfoque anterior

```tsx
// ❌ MALO: Usa viewport breakpoints, NO container size
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
```

`md:grid-cols-2` se basa en el **viewport** (pantalla completa). Si el modal está en un side-panel estrecho en desktop, sigue intentando poner 2 columnas porque "md" ve que la pantalla es grande. **Esto rompe el layout.**

### LA SOLUCIÓN: CSS Grid Fluido

Usamos CSS Grid moderno con `auto-fit` y `minmax` para que el grid sea **container-aware**:

```tsx
// ✅ BUENO: Se adapta al CONTENEDOR, no al viewport
<div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
```

Esto dice: "pon tantas columnas como quepan, pero cada una mínimo 250px". Si el contenedor es angosto → 1 columna. Si es ancho → 2 o más.

---

### REGLA A: Grupo "Multi-Columna Fluida"

**Cuándo usar:** Grupos de DOS O MÁS campos que deben estar lado a lado si hay espacio, pero apilarse en contenedores angostos.

```tsx
// Dos campos que fluyen según el espacio disponible
<div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
  <FormField name="amount" />
  <FormField name="date" />
</div>

// Tres campos (se acomodan en 1, 2 o 3 columnas según espacio)
<div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
  <FormField name="currency" />
  <FormField name="wallet" />
  <FormField name="status" />
</div>
```

**Valores de minmax recomendados:**

| Tipo de campo | minmax |
|---------------|--------|
| Input numérico corto | `180px` |
| Select/Dropdown | `220px` |
| Input texto normal | `250px` |
| DatePicker | `200px` |

---

### REGLA B: Grupo "Ancho Completo"

**Cuándo usar:** Campos que SIEMPRE ocupan todo el ancho (Textarea, títulos, secciones).

```tsx
// Textarea siempre full width
<div className="grid grid-cols-1 gap-4">
  <FormField name="description" />
</div>

// O simplemente sin wrapper si es un solo campo
<FormField name="notes" />
```

---

### EJEMPLO COMPLETO DE LAYOUT FLUIDO

```tsx
<ModalBody>
  {/* Fila 1: Fecha y Monto - fluyen juntos si hay espacio */}
  <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
    <FormField name="payment_date" />
    <FormField name="amount" />
  </div>

  {/* Fila 2: Moneda, Billetera, Estado - 3 campos fluidos */}
  <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
    <FormField name="currency_id" />
    <FormField name="wallet_id" />
    <FormField name="status" />
  </div>

  {/* Fila 3: Referencia sola (ancho completo) */}
  <FormField name="reference" />

  {/* Fila 4: Notas - Textarea siempre full width */}
  <div className="grid grid-cols-1">
    <FormField name="notes" />
  </div>
</ModalBody>
```

---

## 4. CONTENEDORES PROHIBIDOS

El modal **NO PUEDE**:
- Crear contenedores div externos para layout
- Crear overlays
- Crear headers o footers propios
- Definir paddings, margins, z-index o posicionamiento
- Usar `fixed`, `absolute`, `inset-0`, `overflow-hidden`
- Agregar borders, shadows propios del modal
- Definir `max-width`, `min-width`, `min-h` que rompan el diseño

---

## 5. ARQUITECTURA: SEPARACIÓN DE CONCERNS

### EL PROBLEMA con componentes monolíticos

Mezclar lógica pesada de formularios (hooks, validación, state) con lógica de vista en el mismo cuerpo del componente:
- Carga hooks innecesarios en modo VIEW
- Hace el componente difícil de mantener
- No escala bien

### LA SOLUCIÓN: Componentes especializados

#### Opción A: Subcomponentes internos (modal simple)

```tsx
// Subcomponente PESADO: Formulario para create/edit
function FormPanel({
  form,
  onSubmit,
  currencies,
  wallets,
}: {
  form: ReturnType<typeof useForm<MyFormData>>;
  onSubmit: (data: MyFormData) => void;
  currencies: Currency[];
  wallets: Wallet[];
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Todos los FormFields aquí */}
      </form>
    </Form>
  );
}

// Subcomponente LIVIANO: Vista de lectura (SIN hooks, SIN state)
function ViewPanel({ payment }: { payment: Payment }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Monto</p>
        <p className="font-medium">${payment.amount}</p>
      </div>
      {/* Solo renderiza datos, sin lógica */}
    </div>
  );
}

// Componente ORQUESTADOR: Solo decide qué renderizar
export function PaymentForm({ modalData, onClose, mode = "create" }: Props) {
  // Hooks SOLO si es necesario
  const form = useForm<MyFormData>({ ... });
  
  if (mode === "view") {
    return (
      <ModalLayout onClose={onClose}>
        <ModalHeader title="Detalle del Pago" />
        <ModalBody>
          <ViewPanel payment={modalData.payment} />
        </ModalBody>
      </ModalLayout>
    );
  }

  return (
    <ModalLayout onClose={onClose}>
      <ModalHeader title={mode === "edit" ? "Editar" : "Nuevo"} />
      <ModalBody>
        <FormPanel form={form} onSubmit={onSubmit} ... />
      </ModalBody>
      <ModalFooter ... />
    </ModalLayout>
  );
}
```

#### Opción B: Archivos separados (modal complejo)

```
forms/
├── PaymentForm.tsx    → Solo CREATE/EDIT, toda la lógica de form
└── PaymentView.tsx    → Solo VIEW, componente liviano
```

**PaymentForm.tsx:**
```tsx
export default function PaymentForm({ modalData, onClose, mode = "create" }: Props) {
  const form = useForm<PaymentFormData>({ ... });
  const { data: currencies } = useCurrencies();
  const { data: wallets } = useWallets();
  const createMutation = useCreatePayment();
  const updateMutation = useUpdatePayment();
  
  // Toda la lógica pesada aquí
  
  return (
    <ModalLayout onClose={onClose} size="lg">
      <ModalHeader 
        title={mode === "edit" ? "Editar Pago" : "Nuevo Pago"}
        description="Gestiona los detalles del pago"
      />
      <ModalBody>
        <Form {...form}>
          {/* Layout fluido con todos los campos */}
        </Form>
      </ModalBody>
      <ModalFooter ... />
    </ModalLayout>
  );
}
```

**PaymentView.tsx:**
```tsx
export default function PaymentView({ modalData, onClose }: Props) {
  // SOLO fetch del payment, nada más
  const { data: payment, isLoading } = usePayment(modalData?.paymentId);
  
  if (isLoading) {
    return <LoadingState />;
  }
  
  return (
    <ModalLayout onClose={onClose} size="lg">
      <ModalHeader 
        title={`Pago - ${payment?.reference || 'Sin ref'}`}
        description={formatDate(payment?.payment_date)}
      />
      <ModalBody>
        {/* Vista estética, sin inputs */}
        <div className="space-y-6">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
            <InfoItem label="Monto" value={formatCurrency(payment.amount)} />
            <InfoItem label="Fecha" value={formatDate(payment.date)} />
          </div>
          {/* etc */}
        </div>
      </ModalBody>
      <ModalFooter leftLabel="Cerrar" onLeftClick={onClose} />
    </ModalLayout>
  );
}
```

---

## 6. REGISTRO EN registerModals.ts

### Con archivos separados (Form + View)

```typescript
// src/components/modal/factory/registerModals.ts
import PaymentForm from '@/features/payments/forms/PaymentForm';
import PaymentView from '@/features/payments/forms/PaymentView';

// Para CREATE y EDIT
registerModal('payment', PaymentForm, {
  category: 'finance',
  size: 'lg',
  mapDataToProps: (data) => ({
    organizationId: data?.organizationId,
    paymentId: data?.paymentId,
    mode: data?.paymentId ? (data?.mode || 'edit') : 'create'
  })
});

// Para VIEW (modal separado)
registerModal('payment-view', PaymentView, {
  category: 'finance',
  size: 'lg',
  mapDataToProps: (data) => ({
    paymentId: data?.paymentId,
  })
});
```

### Abrir los modales

```typescript
// Para crear
openModal('payment', { organizationId });

// Para editar
openModal('payment', { paymentId: '123', mode: 'edit' });

// Para ver
openModal('payment-view', { paymentId: '123' });
```

---

## 7. TAMAÑOS DE MODAL

```typescript
<ModalLayout size="lg" onClose={onClose}>
```

| Size | Ancho |
|------|-------|
| `sm` | 400px |
| `md` | 550px |
| `lg` | 750px **(default)** |
| `xl` | 1000px |
| `full` | 100% |

---

## 8. DIRTY FORM BLOCKING

Para formularios con cambios sin guardar:

```typescript
const { setBlockClose, clearBlockClose } = useGlobalModalStore();

// Cuando el form tiene cambios sin guardar
setBlockClose();

// Cuando se guarda o descarta
clearBlockClose();
```

---

## 9. MOBILE (DrawerBase)

El sistema detecta automáticamente mobile y usa `DrawerBase`:

```typescript
<DrawerBase
  isOpen={isOpen}
  onClose={onClose}
  snapPoint="auto"    // 'auto' | 'half' | 'full'
  showDragHandle={true}
  dismissible={true}
>
  {/* Contenido */}
</DrawerBase>
```

---

## 10. CHECKLIST DE REFACTORIZACIÓN

Cuando refactorices un modal existente:

**ARQUITECTURA:**
- [ ] ¿Es un modal complejo (> 150 líneas)? → Separar en `*Form.tsx` + `*View.tsx`
- [ ] ¿Usas variables booleanas (`isCreate`, `isEdit`)? → Elimínalas, usa `mode` directo
- [ ] ¿El modo VIEW carga hooks de formulario? → Separar en ViewPanel o archivo aparte
- [ ] ¿Pasas `children` a `ModalLayout`? → Asegúrate de incluir `<ModalBody>` explícitamente

**LAYOUT FLUIDO:**
- [ ] ¿Usas `md:grid-cols-2` o breakpoints similares? → Reemplaza con `grid-cols-[repeat(auto-fit,minmax(Xpx,1fr))]`
- [ ] ¿Campos que deberían estar inline usan grid fluido? → Aplica REGLA A
- [ ] ¿Textareas y campos grandes usan ancho completo? → Aplica REGLA B

**HEADERS:**
- [ ] ¿ModalHeader tiene `description`? → OBLIGATORIO, agrega una descripción clara
- [ ] ¿Cada modo (create/edit/view) tiene título apropiado?

**LIMPIEZA:**
- [ ] ¿Existen archivos viejos (*Modal.tsx, *EditModal.tsx)? → Elimínalos
- [ ] ¿Se actualizó `registerModals.ts`?
- [ ] ¿Se eliminaron console.logs y código muerto?

---

## 11. CHECKLIST QA

Después de crear/refactorizar:

- [ ] Probar CREATE
- [ ] Probar EDIT (campos precargados correctamente)
- [ ] Probar VIEW (sin inputs, vista estética)
- [ ] Probar en contenedor angosto (side panel)
- [ ] Probar en mobile (drawer)
- [ ] Confirmar que no hay errores de import
- [ ] Confirmar que ModalHeader tiene descripción

---

## 12. EJEMPLO COMPLETO: ARCHIVOS SEPARADOS

### PaymentForm.tsx (CREATE/EDIT)

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DollarSign } from 'lucide-react';

import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { paymentSchema, type PaymentFormData } from '../schemas';

interface PaymentFormProps {
  modalData?: { paymentId?: string; organizationId?: string };
  onClose: () => void;
  mode?: "create" | "edit";
}

export default function PaymentForm({ modalData, onClose, mode = "create" }: PaymentFormProps) {
  const { data: existingPayment } = usePayment(mode === "edit" ? modalData?.paymentId : undefined);
  const { data: currencies } = useCurrencies();
  const { data: wallets } = useWallets();
  
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: 0, date: new Date(), notes: '' }
  });

  // Populate form for edit mode
  React.useEffect(() => {
    if (mode === "edit" && existingPayment) {
      form.reset({
        amount: existingPayment.amount,
        date: parseLocalDate(existingPayment.date),
        notes: existingPayment.notes || '',
      });
    }
  }, [existingPayment, mode]);

  const createMutation = useCreatePayment();
  const updateMutation = useUpdatePayment();

  const onSubmit = async (data: PaymentFormData) => {
    if (mode === "edit") {
      await updateMutation.mutateAsync({ id: modalData?.paymentId, ...data });
    } else {
      await createMutation.mutateAsync(data);
    }
    onClose();
  };

  return (
    <ModalLayout onClose={onClose} size="lg">
      <ModalHeader 
        title={mode === "edit" ? "Editar Pago" : "Nuevo Pago"}
        description={mode === "edit" ? "Actualiza los detalles del pago" : "Registra un nuevo pago"}
        icon={DollarSign}
      />
      
      <ModalBody>
        <Form {...form}>
          <form className="space-y-4">
            {/* Fila 1: Fecha y Monto - Grid fluido */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Fila 2: Moneda y Billetera - Grid fluido */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
              <FormField name="currency_id" ... />
              <FormField name="wallet_id" ... />
            </div>

            {/* Fila 3: Notas - Ancho completo */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
      </ModalBody>

      <ModalFooter
        leftLabel="Cancelar"
        onLeftClick={onClose}
        submitText={mode === "edit" ? "Guardar Cambios" : "Crear Pago"}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </ModalLayout>
  );
}
```

### PaymentView.tsx (VIEW)

```tsx
import { DollarSign, Calendar, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { Separator } from '@/components/ui/separator';
import { parseLocalDate } from '@/lib/date-utils';

interface PaymentViewProps {
  modalData?: { paymentId?: string };
  onClose: () => void;
}

export default function PaymentView({ modalData, onClose }: PaymentViewProps) {
  const { data: payment, isLoading } = usePayment(modalData?.paymentId);

  if (isLoading) {
    return (
      <ModalLayout onClose={onClose} size="lg">
        <ModalBody>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        </ModalBody>
      </ModalLayout>
    );
  }

  return (
    <ModalLayout onClose={onClose} size="lg">
      <ModalHeader 
        title={`Pago - ${payment?.reference || 'Sin referencia'}`}
        description={payment?.payment_date ? format(parseLocalDate(payment.payment_date), 'dd MMMM yyyy', { locale: es }) : ''}
        icon={DollarSign}
      />
      
      <ModalBody>
        <div className="space-y-6">
          {/* Info principal - Grid fluido */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Monto
              </p>
              <p className="font-semibold text-lg">
                {payment?.currency?.symbol} {payment?.amount?.toLocaleString('es-AR')}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Fecha
              </p>
              <p className="font-medium">
                {format(parseLocalDate(payment?.payment_date), 'dd/MM/yyyy')}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Billetera
              </p>
              <p className="font-medium">{payment?.wallet?.name}</p>
            </div>
          </div>

          {payment?.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Notas</p>
                <p className="text-sm whitespace-pre-wrap">{payment.notes}</p>
              </div>
            </>
          )}
        </div>
      </ModalBody>

      <ModalFooter leftLabel="Cerrar" onLeftClick={onClose} />
    </ModalLayout>
  );
}
```

---

## 13. MODALES ESPECIALES - PATRONES

### Modal de Eliminación / Confirmación Destructiva

El `DeleteConfirmationForm` es un modal **universal y reutilizable** para eliminar elementos.

**Principios clave:**
- ✅ NO tiene lógica de negocio
- ✅ Solo UI + callbacks
- ✅ Soporta eliminación simple o reemplazo
- ✅ Recibe todos los datos desde afuera

**Props:**
```tsx
modalData: {
  mode: 'delete' | 'replace'
  title: string
  description: string
  itemName: string
  consequences?: string[]
  replacementOptions?: { label, value }[]
  currentId?: string
  onDelete: () => void
  onReplace?: (newId: string) => void
}
```

---

## 14. PATRÓN AVANZADO: FORMULARIO AGNÓSTICO (Separación Total)

### EL PROBLEMA con la arquitectura actual

Incluso con `FormPanel` y `ViewPanel` separados, el componente sigue teniendo el `ModalLayout` adentro. Esto significa que:
- NO se puede reutilizar el form en una página completa
- NO se puede usar en un Sheet (panel lateral) sin duplicar código
- El form está "casado" con el modal

### LA SOLUCIÓN: 2 Archivos Completamente Separados

```
forms/
├── FeatureFormFields.tsx    → Form PURO (sin modal)
└── ...

modals/
├── FeatureModal.tsx         → Modal WRAPPER (tonto)
└── ...
```

---

### CAPA 1: FormFields (El Cerebro)

**Ubicación:** `src/features/{feature}/forms/{Feature}FormFields.tsx`

```tsx
// Props del form puro
interface FeatureFormFieldsProps {
  projectId?: string;
  organizationId?: string;
  itemId?: string;
  mode: 'create' | 'edit' | 'view';
  onSuccess: () => void;  // Callback cuando se guarda
  onCancel: () => void;   // Callback para cancelar
}

export function FeatureFormFields({
  projectId,
  organizationId,
  itemId,
  mode,
  onSuccess,
  onCancel
}: FeatureFormFieldsProps) {
  // Todos los hooks de datos
  const { data: existingItem } = useItem(itemId);
  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem();
  
  // Form setup
  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (data: FormData) => {
    try {
      if (mode === 'edit') {
        await updateMutation.mutateAsync({ ... });
      } else {
        await createMutation.mutateAsync({ ... });
      }
      toast({ title: 'Éxito' });
      onSuccess();  // Notificar al parent
    } catch (error) {
      toast({ variant: 'destructive', ... });
    }
  };

  // MODO VIEW
  if (mode === 'view') {
    return (
      <div className="w-full space-y-6">
        <ViewPanel data={existingItem} />
        <div className="flex justify-end pt-4 border-t">
          <Button variant="secondary" onClick={onCancel}>Cerrar</Button>
        </div>
      </div>
    );
  }

  // MODO CREATE/EDIT
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
        {/* Grid fluido con campos */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          <FormField ... />
          <FormField ... />
        </div>

        {/* BOTONES - Siempre al final del form, NO en ModalFooter */}
        <div className="flex gap-2 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-[3]">
            {isSubmitting ? 'Guardando...' : mode === 'edit' ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

**REGLAS DEL FORMFIELDS:**
- ❌ NO importa ModalLayout, ModalHeader, ModalBody, ModalFooter
- ❌ NO tiene conocimiento de que está en un modal
- ✅ Incluye botones de acción con Button de shadcn
- ✅ Ocupa 100% del ancho (`className="w-full"`)
- ✅ Maneja su propio isSubmitting

---

### CAPA 2: Modal Wrapper (El Envase Tonto)

**Ubicación:** `src/features/{feature}/modals/{Feature}Modal.tsx`

```tsx
import { ModalLayout, ModalHeader, ModalBody } from '@/components/modal';
import { FeatureFormFields } from '../forms/FeatureFormFields';

interface FeatureModalProps {
  modalData?: {
    projectId?: string;
    organizationId?: string;
    itemId?: string;
  };
  onClose: () => void;
  mode?: 'create' | 'edit' | 'view';
}

export function FeatureModal({ modalData, onClose, mode = 'create' }: FeatureModalProps) {
  const getHeader = () => {
    switch (mode) {
      case 'view': return { title: 'Ver Elemento', description: 'Detalles' };
      case 'edit': return { title: 'Editar', description: 'Modifica los datos' };
      default: return { title: 'Nuevo', description: 'Crea un elemento' };
    }
  };
  const header = getHeader();

  return (
    <ModalLayout onClose={onClose} size="lg">
      <ModalHeader title={header.title} description={header.description} icon={Icon} />
      <ModalBody>
        <FeatureFormFields
          projectId={modalData?.projectId}
          organizationId={modalData?.organizationId}
          itemId={modalData?.itemId}
          mode={mode}
          onSuccess={onClose}  // Conectar success a close
          onCancel={onClose}   // Conectar cancel a close
        />
      </ModalBody>
      {/* NO hay ModalFooter - los botones están en FormFields */}
    </ModalLayout>
  );
}
```

**REGLAS DEL MODAL WRAPPER:**
- ✅ Solo usa ModalLayout + ModalHeader + ModalBody
- ❌ NO usa ModalFooter (botones están en FormFields)
- ✅ Conecta `onSuccess={onClose}` y `onCancel={onClose}`
- ✅ Solo gestiona títulos según mode

---

### RE-EXPORT PARA COMPATIBILIDAD

Para no romper imports existentes:

```tsx
// src/features/{feature}/forms/{Feature}Form.tsx
export { FeatureModal as FeatureForm } from '../modals/FeatureModal';
export { FeatureModal } from '../modals/FeatureModal';
export { FeatureFormFields } from './FeatureFormFields';
export default FeatureModal;
```

---

### ¿CUÁNDO USAR ESTE PATRÓN?

| Situación | Usar Patrón Agnóstico? |
|-----------|------------------------|
| Form se usará SOLO en modal | Opcional (pero recomendado) |
| Form se usará en modal Y página | **SÍ, obligatorio** |
| Form se usará en Sheet lateral | **SÍ, obligatorio** |
| Form simple (< 100 líneas) | Opcional |
| Form complejo (> 150 líneas) | **SÍ, recomendado** |

---

### BENEFICIOS

1. **Reutilización Total**: Usa el mismo FormFields en modal, página, sheet
2. **Testing Aislado**: Testea el form sin preocuparte del modal
3. **Mantenimiento**: Cambios en modal no afectan lógica del form
4. **Flexibilidad**: Mañana puedes mover el form donde quieras

---

## 15. FORMULARIOS REFACTORIZADOS (Patrón Agnóstico)

Lista de formularios que YA siguen el patrón de separación total:

| Feature | FormFields | Modal Wrapper | Fecha |
|---------|------------|---------------|-------|
| ClientPayment | `forms/ClientPaymentFormFields.tsx` | `modals/ClientPaymentModal.tsx` | 2025-12-10 |
| MaterialPayment | `forms/MaterialPaymentFormFields.tsx` | `modals/MaterialPaymentModal.tsx` | 2025-12-10 |
| PersonnelPayment | `forms/PersonnelPaymentFormFields.tsx` | `modals/PersonnelPaymentModal.tsx` | 2025-12-10 |

---

## 16. FORMULARIOS PENDIENTES DE REFACTORIZAR

Formularios que aún usan arquitectura antigua (form + modal mezclados):

- [ ] GeneralCostPaymentForm
- [ ] SubcontractFormModal
- [ ] ContactForm
- [ ] ProjectForm
- [ ] ClientForm
- [ ] (agregar según se identifiquen)

---

## USO DEL PROMPT

Cuando pidas crear o refactorizar un modal:

```
Replit, lee prompts/02-Modals.md y refactoriza:
src/features/clients/forms/ClientPaymentForm.tsx

Quiero:
- Fila 1: fecha y monto
- Fila 2: moneda, billetera y estado
- Fila 3: notas (ancho completo)
```
