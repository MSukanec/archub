# SEENCEL - Estándar de Modales con Formularios Agnósticos

Este documento define el patrón arquitectónico para crear modales con formularios reutilizables.

---

## 1. PRINCIPIO FUNDAMENTAL

Los formularios son **agnósticos al contexto**. Pueden usarse en:
- Modales (con footer controlado por el modal)
- Páginas completas (con botones propios)
- Paneles laterales (Sheet)
- Cualquier otro contenedor

---

## 2. ARQUITECTURA DE MODAL

### Estructura Obligatoria

Todo modal DEBE tener 4 partes en orden:

```
┌─────────────────────────────────┐
│  HEADER (fijo)                  │  ← ModalHeader via headerContent prop
├─────────────────────────────────┤
│                                 │
│  BODY (scrollable)              │  ← ModalBody como children
│                                 │
├─────────────────────────────────┤
│  FOOTER (fijo)                  │  ← ModalFooter via footerContent prop
└─────────────────────────────────┘
```

### ⚠️ IMPORTANTE: Footer Fijo

Para que el footer sea **FIJO** (no scrollee con el contenido):
- **USAR**: `footerContent` prop de ModalLayout
- **NO USAR**: ModalFooter como children directo

```tsx
// ✅ CORRECTO - Footer fijo
<ModalLayout
  headerContent={<ModalHeader ... />}
  footerContent={<ModalFooter ... />}
>
  <ModalBody>...</ModalBody>
</ModalLayout>

// ❌ INCORRECTO - Footer scrollea con el body
<ModalLayout>
  <ModalHeader ... />
  <ModalBody>...</ModalBody>
  <ModalFooter ... />  // ← Esto NO funciona, el footer scrollea
</ModalLayout>
```

---

## 3. ARQUITECTURA DE 2 ARCHIVOS

```
forms/
├── FeatureFormFields.tsx    → Campos del formulario (CEREBRO)

modals/
├── FeatureModal.tsx         → Contenedor del modal (ENVASE)
```

---

## 4. FORMFIELDS (El Cerebro)

**Ubicación:** `src/features/{feature}/forms/{Feature}FormFields.tsx`

### Características

- Contiene `react-hook-form` con `zodResolver`
- Contiene todos los hooks de datos (`useQuery`, `useMutation`)
- Contiene la lógica de submit y validaciones
- **Props opcionales** `hideActions` y `formRef` para control externo
- Ocupa el 100% del ancho disponible
- **NO** importa `ModalLayout`, `ModalHeader`, `ModalBody`, `ModalFooter`
- **NO** tiene conocimiento de que está dentro de un modal

### Interface de Props

```typescript
export interface FeatureFormFieldsProps {
  // IDs de contexto
  projectId?: string;
  organizationId?: string;
  itemId?: string;

  // Modo de operación
  mode: 'create' | 'edit' | 'view';

  // Callbacks
  onSuccess: () => void;
  onCancel: () => void;

  // Control externo (para uso en modales con ModalFooter)
  hideActions?: boolean;  // Default: false - oculta botones internos
  formRef?: React.RefObject<HTMLFormElement>;  // Para submit externo
}
```

### Estructura del Componente

```tsx
export function FeatureFormFields({
  projectId,
  organizationId,
  itemId,
  mode,
  onSuccess,
  onCancel,
  hideActions = false,  // Por defecto muestra botones
  formRef,
}: FeatureFormFieldsProps) {
  // Hooks de datos
  const { data: existingItem, isLoading } = useItem(itemId);
  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem();

  // Form setup
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { ... }
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Submit handler
  const onSubmit = async (data: FormData) => {
    try {
      if (mode === 'edit') {
        await updateMutation.mutateAsync({ id: itemId, ...data });
      } else {
        await createMutation.mutateAsync(data);
      }
      toast({ title: 'Guardado correctamente' });
      onSuccess();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al guardar' });
    }
  };

  // Loading state
  if (isLoading && mode !== 'create') {
    return <LoadingState />;
  }

  // Modo VIEW
  if (mode === 'view') {
    return (
      <div className="w-full space-y-6">
        <ViewContent data={existingItem} />
        {!hideActions && (
          <div className="flex justify-end pt-4 border-t">
            <Button variant="secondary" onClick={onCancel}>
              Cerrar
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Modo CREATE/EDIT
  return (
    <Form {...form}>
      <form 
        ref={formRef}  // ← Permite submit externo
        onSubmit={form.handleSubmit(onSubmit)} 
        className="w-full space-y-4"
      >
        {/* Grid fluido con campos */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          <FormField control={form.control} name="field1" ... />
          <FormField control={form.control} name="field2" ... />
        </div>

        {/* Botones de acción - solo si NO está controlado por modal */}
        {!hideActions && (
          <div className="flex gap-2 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-[3]">
              {isSubmitting ? 'Guardando...' : mode === 'edit' ? 'Guardar Cambios' : 'Crear'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
```

---

## 5. MODAL (El Envase)

**Ubicación:** `src/features/{feature}/modals/{Feature}Modal.tsx`

### Características

- Usa `headerContent` y `footerContent` props para header/footer fijos
- `ModalBody` va como children
- Pasa `hideActions={true}` y `formRef` al FormFields
- Controla el submit via `formRef.current.requestSubmit()`

### Estructura del Componente

```tsx
import { useRef } from 'react';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { FeatureFormFields } from '../forms/FeatureFormFields';
import { IconComponent } from 'lucide-react';

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
  const formRef = useRef<HTMLFormElement>(null);

  const getHeader = () => {
    switch (mode) {
      case 'view':
        return { title: 'Ver Elemento', description: 'Detalles del elemento' };
      case 'edit':
        return { title: 'Editar Elemento', description: 'Modifica los datos' };
      default:
        return { title: 'Nuevo Elemento', description: 'Crea un nuevo elemento' };
    }
  };

  const getSubmitText = () => {
    switch (mode) {
      case 'view': return 'Cerrar';
      case 'edit': return 'Guardar Cambios';
      default: return 'Crear';
    }
  };

  const handleSubmit = () => {
    if (mode === 'view') {
      onClose();
    } else if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  const header = getHeader();

  return (
    <ModalLayout 
      onClose={onClose} 
      size="lg"
      headerContent={
        <ModalHeader
          title={header.title}
          description={header.description}
          icon={IconComponent}
        />
      }
      footerContent={
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={onClose}
          submitText={getSubmitText()}
          onSubmit={handleSubmit}
        />
      }
    >
      <ModalBody>
        <FeatureFormFields
          projectId={modalData?.projectId}
          organizationId={modalData?.organizationId}
          itemId={modalData?.itemId}
          mode={mode}
          onSuccess={onClose}
          onCancel={onClose}
          hideActions={true}      // ← Oculta botones internos
          formRef={formRef}       // ← Permite submit desde ModalFooter
        />
      </ModalBody>
    </ModalLayout>
  );
}
```

---

## 6. LAYOUT FLUIDO (Container-Aware)

Usamos CSS Grid moderno para que el layout se adapte al contenedor:

```tsx
// Grid fluido - se adapta al espacio disponible
<div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
  <FormField ... />
  <FormField ... />
</div>
```

### Valores de minmax recomendados

| Tipo de campo | minmax |
|---------------|--------|
| Input numérico corto | `180px` |
| Select/Dropdown | `220px` |
| Input texto normal | `250px` |
| DatePicker | `200px` |
| Textarea | Siempre `grid-cols-1` |

---

## 7. REGISTRO EN registerModals.ts

```typescript
import { FeatureModal } from '@/features/feature/modals/FeatureModal';

registerModal('feature', FeatureModal as any, {
  ...config,
  mapDataToProps: (data) => ({
    projectId: data?.projectId,
    organizationId: data?.organizationId,
    itemId: data?.itemId,
    mode: data?.itemId ? (data?.mode || 'edit') : (data?.mode || 'create')
  })
});
```

---

## 8. EXPORTS EN index.ts

```typescript
// src/features/feature/index.ts

// Modal (para registro y uso general)
export { FeatureModal } from './modals/FeatureModal';

// FormFields (para uso en otros contextos)
export { FeatureFormFields } from './forms/FeatureFormFields';
```

---

## 9. TAMAÑOS DE MODAL

| Size | Ancho |
|------|-------|
| `sm` | 400px |
| `md` | 550px |
| `lg` | 750px (default) |
| `xl` | 1000px |
| `full` | 100% |

---

## 10. REGLAS A SEGUIR

### Estructura del Modal
1. **SIEMPRE usar** `headerContent` prop para el header
2. **SIEMPRE usar** `footerContent` prop para el footer
3. **ModalBody** va como children de ModalLayout
4. **Orden**: Layout → Header (prop) → Body (children) → Footer (prop)

### FormFields
5. **NO importa componentes de modal** - Nunca `ModalLayout`, `ModalHeader`, etc.
6. **Acepta `hideActions` y `formRef`** - Props opcionales para control externo
7. **Por defecto muestra botones** - `hideActions = false`
8. **Usa `ref={formRef}`** en el `<form>` para permitir submit externo

### Conexión Modal ↔ FormFields
9. **Modal pasa `hideActions={true}`** - Para ocultar botones del form
10. **Modal pasa `formRef`** - Para controlar submit desde ModalFooter
11. **Modal usa `formRef.current.requestSubmit()`** - En el handler de submit

### Testing
12. **Mantener `data-testid`** en elementos interactivos

---

## 11. BENEFICIOS

1. **Footer Fijo**: El footer siempre está visible, no scrollea
2. **Reutilización Total**: El mismo FormFields funciona en modal, página, sheet
3. **Testing Aislado**: Testea el form sin dependencias de modal
4. **Mantenimiento**: Cambios en modal no afectan lógica del form
5. **Flexibilidad**: Mover el form a cualquier contexto sin refactorizar

---

## 12. FORMULARIOS REFACTORIZADOS

| Feature | FormFields | Modal | Fecha |
|---------|------------|-------|-------|
| ClientPayment | `forms/ClientPaymentFormFields.tsx` | `modals/ClientPaymentModal.tsx` | 2025-12-10 |
| MaterialPayment | `forms/MaterialPaymentFormFields.tsx` | `modals/MaterialPaymentModal.tsx` | 2025-12-10 |
| PersonnelPayment | `forms/PersonnelPaymentFormFields.tsx` | `modals/PersonnelPaymentModal.tsx` | 2025-12-10 |
| NewMovement | (usa los 3 anteriores) | `modals/NewMovementModal.tsx` | 2025-12-10 |

---

## 13. FORMULARIOS PENDIENTES

- [ ] GeneralCostPaymentForm
- [ ] SubcontractFormModal
- [ ] ContactForm
- [ ] ProjectForm
- [ ] ClientForm
- [ ] SiteLogForm

---

## 14. CHECKLIST DE CREACIÓN

Al crear un nuevo modal:

- [ ] Crear `forms/FeatureFormFields.tsx` con toda la lógica
- [ ] FormFields acepta `hideActions` y `formRef` opcionales
- [ ] FormFields usa `ref={formRef}` en el `<form>`
- [ ] FormFields condiciona botones con `{!hideActions && ...}`
- [ ] Crear `modals/FeatureModal.tsx` como wrapper
- [ ] Modal usa `headerContent` prop para ModalHeader
- [ ] Modal usa `footerContent` prop para ModalFooter
- [ ] Modal usa `formRef` para controlar submit
- [ ] Modal pasa `hideActions={true}` al FormFields
- [ ] Registrar en `registerModals.ts`
- [ ] Exportar en `index.ts` del feature
- [ ] Agregar a la tabla de formularios refactorizados

---

## 15. CHECKLIST QA

- [ ] Probar CREATE - formulario vacío, submit funciona
- [ ] Probar EDIT - campos precargados correctamente
- [ ] Probar VIEW - solo lectura, botón Cerrar funciona
- [ ] Verificar FOOTER FIJO - scrollear contenido largo
- [ ] Probar en mobile (drawer)
- [ ] Verificar que no hay errores de import
- [ ] Verificar botones funcionan correctamente

---

## 16. EJEMPLO COMPLETO: NewMovementModal

Modal dinámico que cambia de formulario según selección:

```tsx
export function NewMovementModal({ modalData, onClose }: Props) {
  const [selectedType, setSelectedType] = useState<MovementType | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  return (
    <ModalLayout 
      onClose={onClose} 
      size={selectedType ? 'lg' : 'md'}
      headerContent={<ModalHeader ... />}
      footerContent={
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={onClose}
          submitText={getSubmitText()}
          onSubmit={handleSubmit}
          submitDisabled={!selectedType}
        />
      }
    >
      <ModalBody>
        <Select value={selectedType} onValueChange={setSelectedType}>
          ...
        </Select>
        
        {selectedType === 'client_payment' && (
          <ClientPaymentFormFields 
            hideActions={true} 
            formRef={formRef}
            onSuccess={onClose}
            onCancel={onClose}
          />
        )}
        {/* ... otros tipos */}
      </ModalBody>
    </ModalLayout>
  );
}
```
