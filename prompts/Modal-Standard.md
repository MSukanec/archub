# SEENCEL - Estándar Universal de Modales

Este documento es LA LEY para crear o refactorizar cualquier modal en Seencel.

---

## 1. NOMBRE Y ESTRUCTURA DEL ARCHIVO

El modal debe existir como un único archivo con la convención internacional:

```
<Entidad>Form.tsx
```

**UBICACIÓN: La carpeta DEBE ser `forms`, NO `modals`**

Ejemplos correctos:
- `src/features/clients/forms/ClientPaymentForm.tsx`
- `src/features/general-costs/forms/GeneralCostForm.tsx`
- `src/features/projects/forms/TaskForm.tsx`
- `src/features/contacts/forms/ContactForm.tsx`

Si existen archivos duplicados como:
- `ClientPaymentModal.tsx`
- `ClientPaymentEditModal.tsx`
- `ClientPaymentViewModal.tsx`

**Debes eliminarlos y unificarlos en uno solo:** `ClientPaymentForm.tsx` EN LA CARPETA `forms`

**IMPORTANTE:** Al refactorizar, siempre:
1. Crea la carpeta `forms` si no existe
2. Renombra el archivo a `<Entidad>Form.tsx`
3. Elimina la carpeta `modals` (o los archivos viejos)
4. Actualiza las importaciones en `registerModals.ts`

---

## 2. PROPS OBLIGATORIOS

```typescript
interface ModalProps {
  modalData?: any;
  onClose: () => void;
  mode?: "create" | "edit" | "view";
}
```

El componente debe comportarse según `mode`:

```typescript
// ✅ CORRECTO: Usar mode directamente en condiciones
if (mode === "view") { ... }
if (mode === "edit") { ... }
if (mode === "create") { ... }

// ❌ EVITAR: Crear variables booleanas intermedias
// const isCreate = mode === "create";
// const isEdit = mode === "edit";
// const isView = mode === "view";
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
- Recibe `onClose`, `size`, y opcionalmente `columns`
- **IMPORTANTE:** Si pasas `children`, el contenido DEBE incluir `<ModalHeader>`, `<ModalBody>`, `<ModalFooter>` (sin `ModalLayout` que las envuelva de nuevo)

### ModalHeader
- Título, subtítulo, ícono, actions
- No estilos extras

### ModalBody
- Contenido scrolleable
- No paddings manuales, no scroll manual
- **CRÍTICO:** Cuando usas la nueva API (children), el `ModalBody` debe estar DENTRO del JSX. El `ModalLayout` NO lo añade automáticamente si hay children.
- **Columnas:** Por defecto 1 columna. Mobile SIEMPRE 1 columna.

### ModalFooter
- Botones de acción
- No divs intermedios

---

## 3.1 COLUMNAS EN EL BODY - CONTROL GRANULAR

**IMPORTANTE:** El sistema de columnas funciona en DOS NIVELES:

### Nivel 1: ModalLayout `columns` (Macro - Rara vez usado)
```tsx
<ModalLayout onClose={onClose} size="lg" columns={2}>
```
→ Esto hace que TODO el contenido en desktop se muestre en 2 columnas.

**⚠️ CASI NUNCA** usarás esto porque queremos control granular.

### Nivel 2: Grid interno en el Form (Micro - Control granular - LO NORMAL)
Para que **CIERTOS CAMPOS ESPECÍFICOS** estén inline en desktop y otros no:

```tsx
<ModalLayout onClose={onClose} size="lg">  {/* columns no especificado = default 1 */}
  <ModalBody>
    {/* Estos DOS campos inline en desktop, 1 columna en mobile */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField name="amount" />
      <FormField name="date" />
    </div>
    
    {/* Este campo ocupa TODO el ancho */}
    <FormField name="description" />
    
    {/* Otros dos inline */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField name="category" />
      <FormField name="status" />
    </div>
  </ModalBody>
</ModalLayout>
```

**REGLA DE ORO:** Nunca te pediré "2 columnas en todo". Solo te pediré "estos campos inline".

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

## 5. SUBCOMPONENTES INTERNOS PARA ORGANIZAR EL JSX

**NOVEDAD (Nov 25, 2024):** Usar subcomponentes internos para separar la lógica de edición/creación de la vista, mejorando legibilidad y mantenibilidad.

### Estructura recomendada

```tsx
// Subcomponente: Formulario para create/edit
function FormPanel({
  form,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<MyFormData>>;
  onSubmit: (data: MyFormData) => void;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Campos del formulario */}
      </form>
    </Form>
  );
}

// Subcomponente: Vista de lectura
function ViewPanel({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {/* Mostrar datos sin inputs */}
    </div>
  );
}

export function MyEntityForm({ modalData, onClose, mode = "create" }: MyEntityFormProps) {
  const form = useForm<MyFormData>({ ... });
  
  return (
    <ModalLayout onClose={onClose} size="md">
      <ModalHeader title={getTitle(mode)} description={getDescription(mode)} />
      
      <ModalBody>
        {mode === "view" ? (
          <ViewPanel data={modalData} />
        ) : (
          <FormPanel form={form} onSubmit={onSubmit} />
        )}
      </ModalBody>

      {mode !== "view" && (
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={onClose}
          rightLabel={mode === "create" ? "Crear" : "Actualizar"}
          onRightClick={form.handleSubmit(onSubmit)}
        />
      )}
    </ModalLayout>
  );
}
```

**VENTAJAS:**
- ✅ Separación clara entre lógica de formulario y visualización
- ✅ Mejor lectura del componente principal
- ✅ Reutilizable en otros lugares si es necesario
- ✅ No necesita Zustand ni state externo

---

## 6. UN ÚNICO COMPONENTE PARA CREATE, EDIT Y VIEW

### CREATE
- Campos vacíos
- Inputs habilitados
- Botón "Crear"

### EDIT
- Campos precargados
- Inputs habilitados
- Botón "Guardar cambios"

### VIEW
**IMPORTANTE:** NO usar inputs disabled porque se ven mal.

En modo VIEW:
- No hay form
- No hay inputs
- No hay submit
- Se muestra una vista estética (ViewPanel)

```tsx
if (mode === "view") {
  return (
    <ModalLayout onClose={onClose} size="lg">
      <ModalHeader title={data.name} />
      <ModalBody>
        <ViewPanel data={modalData} />
      </ModalBody>
    </ModalLayout>
  );
}
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

## 8. REGISTRAR EN EL REGISTRY

Después de crear/modificar el modal, registrarlo en `registerModals.ts`:

```typescript
// src/components/modal/factory/registerModals.ts
import { MyEntityForm } from '@/features/my-feature/forms/MyEntityForm';

registerModal('my-entity', MyEntityForm, {
  category: 'project',      // admin | project | finance | organization | learning | general
  size: 'lg',               // sm | md | lg | xl | full
  drawerOnMobile: true,     // Usar DrawerBase en mobile
  preventCloseOnBackdrop: false,
  preventCloseOnEsc: false,
  mapDataToProps: (data) => ({ entityId: data?.entityId }),
});
```

---

## 9. ABRIR EL MODAL

```typescript
import { useGlobalModalStore } from '@/components/modal';

function MyComponent() {
  const { openModal } = useGlobalModalStore();
  
  return (
    <Button onClick={() => openModal('my-entity', { entityId: '123', mode: 'edit' })}>
      Editar
    </Button>
  );
}
```

### API del Store

```typescript
const { openModal, pushModal, popModal, closeAll } = useGlobalModalStore();

openModal('project', { projectId: '123' });           // Reemplaza todo el stack
pushModal('delete-confirmation', { onConfirm: fn }); // Apila encima
popModal();                                           // Cierra solo el superior
closeAll();                                           // Cierra todos
```

---

## 10. DIRTY FORM BLOCKING

Para formularios con cambios sin guardar:

```typescript
const { setBlockClose, clearBlockClose } = useGlobalModalStore();

// Cuando el form tiene cambios sin guardar
setBlockClose();

// Cuando se guarda o descarta
clearBlockClose();
```

---

## 11. MOBILE (DrawerBase)

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

## 12. ARQUITECTURA DE CARPETAS

```
src/components/modal/
├── foundation/          # Componentes base (UI primitivos)
│   ├── ModalLayout.tsx
│   ├── ModalHeader.tsx
│   ├── ModalBody.tsx
│   ├── ModalFooter.tsx
│   ├── DrawerBase.tsx
│   └── index.ts
├── state/               # Estado global (Zustand)
│   ├── globalModalStore.ts    # Stack, pushModal, popModal
│   └── index.ts
├── factory/             # Registry pattern
│   ├── registry.ts
│   ├── registerModals.ts
│   └── index.ts
├── ModalProvider.tsx    # Renderiza el stack
├── ModalContainer.tsx   # Aplica config del registry
└── index.ts
```

---

## 13. REFACTORIZACIÓN DE MODALS EXISTENTES

Cuando refactorices un modal existente (consolidar múltiples archivos en uno):

**CHECKLIST PREVIO:**
- [ ] ¿El ModalHeader tiene `description`? **OBLIGATORIO**
  - Ejemplo: `<ModalHeader title="Editar Pago" description="Actualiza los detalles del pago" />`
  - Si no existe, **agrega una descripción clara** que explique qué hace el modal
- [ ] Revisar que todos los modos (CREATE, EDIT, VIEW) tengan titulo y descripción apropiados
- [ ] Verificar que VIEW mode NO use inputs disabled (usa ViewPanel en su lugar)
- [ ] Revisar control de columnas: ¿Necesita campos inline? (grid interno, NO `columns={2}`)

**CHECKLIST DE ARQUITECTURA NUEVA (Nov 25, 2024):**
- [ ] ¿Usas variables booleanas (`isCreate`, `isEdit`, `isView`)? **ELIMÍNALAS**, usa `mode` directamente
- [ ] ¿Tiene subcomponentes internos (`FormPanel`, `ViewPanel`)? **AGREGA SI NO EXISTEN** para separar lógica
- [ ] ¿Pasas `children` a `ModalLayout`? **ASEGÚRATE** de que incluyen `<ModalBody>` explícitamente
- [ ] ¿Usas props legacy (`editPanel`, `headerContent`, `footerContent`)? **MIGRA** a la nueva API (children JSX)
- [ ] ¿El componente tiene lógica de múltiples paneles? **REFACTORIZA** en `FormPanel` y `ViewPanel` internos

---

## 14. CHECKLIST QA

Después de crear/refactorizar:

- [ ] Probar CREATE
- [ ] Probar EDIT
- [ ] Probar VIEW
- [ ] Probar pushModal desde adentro (si aplica)
- [ ] Verificar que funciona en Drawer (mobile)
- [ ] Confirmar que no hay errores de import
- [ ] Confirmar que los botones están en ModalFooter
- [ ] ModalHeader tiene descripción clara
- [ ] Borrar archivos viejos (edit-modal, view-modal, etc.)
- [ ] Quitar código muerto y console.logs
- [ ] Actualizar registerModals.ts
- [ ] Verificar padding correcto (no duplicado)

---

## 15. EJEMPLO COMPLETO (NUEVO PATRÓN)

```tsx
// src/features/clients/forms/ClientPaymentForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard } from 'lucide-react';

import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { clientPaymentSchema, type ClientPaymentFormData } from '../schemas';

// Subcomponente: Formulario para create/edit
function FormPanel({
  form,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<ClientPaymentFormData>>;
  onSubmit: (data: ClientPaymentFormData) => void;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monto</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0.00" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

// Subcomponente: Vista de lectura
function ViewPanel({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Monto</p>
        <p className="font-medium">${data.amount}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Fecha</p>
        <p className="font-medium">{new Date(data.date).toLocaleDateString()}</p>
      </div>
    </div>
  );
}

interface ClientPaymentFormProps {
  modalData?: { paymentId?: string; clientId?: string };
  onClose: () => void;
  mode?: "create" | "edit" | "view";
}

export function ClientPaymentForm({ 
  modalData, 
  onClose, 
  mode = "create" 
}: ClientPaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<ClientPaymentFormData>({
    resolver: zodResolver(clientPaymentSchema),
    defaultValues: { amount: '', date: '' }
  });

  const onSubmit = async (data: ClientPaymentFormData) => {
    setIsSubmitting(true);
    try {
      // Lógica de submit
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const getHeader = () => {
    switch (mode) {
      case "view":
        return { title: "Detalle del Pago", description: "Información del pago realizado" };
      case "edit":
        return { title: "Editar Pago", description: "Actualiza los detalles del pago" };
      case "create":
      default:
        return { title: "Nuevo Pago", description: "Registra un nuevo pago de cliente" };
    }
  };

  const header = getHeader();

  return (
    <ModalLayout onClose={onClose} size="md">
      <ModalHeader 
        title={header.title}
        description={header.description}
        icon={CreditCard}
      />
      
      <ModalBody>
        {mode === "view" ? (
          <ViewPanel data={modalData} />
        ) : (
          <FormPanel form={form} onSubmit={onSubmit} />
        )}
      </ModalBody>

      {mode !== "view" && (
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={onClose}
          rightLabel={mode === "create" ? "Crear" : "Guardar cambios"}
          onRightClick={form.handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
        />
      )}
    </ModalLayout>
  );
}
```

---

## USO DEL PROMPT

Cuando pidas crear o refactorizar un modal:

```
Replit, lee prompts/Modal-Standard.md y aplícalo a:
src/features/clients/forms/ClientPaymentForm.tsx
```
