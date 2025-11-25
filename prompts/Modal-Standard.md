# SEENCEL - Estándar Universal de Modales

Este documento es LA LEY para crear o refactorizar cualquier modal en Seencel.

---

## 1. NOMBRE Y ESTRUCTURA DEL ARCHIVO

El modal debe existir como un único archivo:

```
<Entidad>Form.tsx
```

Ejemplos:
- `ClientPaymentForm.tsx`
- `GeneralCostsPaymentForm.tsx`
- `TaskForm.tsx`
- `ContactForm.tsx`

Si existen archivos duplicados como:
- `ClientPaymentModal.tsx`
- `ClientPaymentEditModal.tsx`
- `ClientPaymentViewModal.tsx`

**Debes eliminarlos y unificarlos en uno solo:** `ClientPaymentForm.tsx`

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
const isCreate = mode === "create";
const isEdit = mode === "edit";
const isView = mode === "view";
```

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
- Recibe `onClose` y `size`

### ModalHeader
- Título, subtítulo, ícono, actions
- No estilos extras

### ModalBody
- Contenido scrolleable
- No paddings manuales, no scroll manual

### ModalFooter
- Botones de acción
- No divs intermedios

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

## 5. UN ÚNICO COMPONENTE PARA CREATE, EDIT Y VIEW

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
if (isView) {
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

## 6. TAMAÑOS DE MODAL

```typescript
<ModalLayout size="lg" onClose={onClose}>
```

| Size | Ancho |
|------|-------|
| `sm` | 400px |
| `md` | 550px (default) |
| `lg` | 750px |
| `xl` | 1000px |
| `full` | 100% |

---

## 7. REGISTRAR EN EL REGISTRY

Después de crear/modificar el modal, registrarlo en `registerModals.ts`:

```typescript
// src/components/modal/factory/registerModals.ts
import { MyEntityForm } from '@/features/my-feature/modals/MyEntityForm';

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

## 8. ABRIR EL MODAL

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

## 9. DIRTY FORM BLOCKING

Para formularios con cambios sin guardar:

```typescript
const { setBlockClose, clearBlockClose } = useGlobalModalStore();

// Cuando el form tiene cambios sin guardar
setBlockClose();

// Cuando se guarda o descarta
clearBlockClose();
```

---

## 10. MOBILE (DrawerBase)

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

## 11. ARQUITECTURA DE CARPETAS

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

## 12. CHECKLIST QA

Después de crear/refactorizar:

- [ ] Probar CREATE
- [ ] Probar EDIT
- [ ] Probar VIEW
- [ ] Probar pushModal desde adentro (si aplica)
- [ ] Verificar que funciona en Drawer (mobile)
- [ ] Confirmar que no hay errores de import
- [ ] Confirmar que los botones están en ModalFooter
- [ ] Borrar archivos viejos (edit-modal, view-modal, etc.)
- [ ] Quitar código muerto y console.logs
- [ ] Actualizar registerModals.ts

---

## 13. EJEMPLO COMPLETO

```tsx
// src/features/clients/modals/ClientPaymentForm.tsx
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { Button } from '@/components/ui/button';

interface ClientPaymentFormProps {
  modalData?: { paymentId?: string; clientId?: string };
  onClose: () => void;
  mode?: "create" | "edit" | "view";
}

export function ClientPaymentForm({ modalData, onClose, mode = "create" }: ClientPaymentFormProps) {
  const isCreate = mode === "create";
  const isEdit = mode === "edit";
  const isView = mode === "view";

  const title = isCreate ? "Nuevo Pago" : isEdit ? "Editar Pago" : "Detalle del Pago";

  // VIEW MODE
  if (isView) {
    return (
      <ModalLayout onClose={onClose} size="lg">
        <ModalHeader title={title} />
        <ModalBody>
          <PaymentViewPanel data={modalData} />
        </ModalBody>
      </ModalLayout>
    );
  }

  // CREATE / EDIT MODE
  return (
    <ModalLayout onClose={onClose} size="lg">
      <ModalHeader title={title} />
      <ModalBody>
        <PaymentForm data={modalData} mode={mode} />
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button>{isCreate ? "Crear" : "Guardar cambios"}</Button>
      </ModalFooter>
    </ModalLayout>
  );
}
```

---

## USO DEL PROMPT

Cuando pidas crear o refactorizar un modal:

```
Replit, lee prompts/Modal-Standard.md y aplícalo a:
src/features/clients/modals/ClientPaymentModal.tsx
```
