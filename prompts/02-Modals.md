# SEENCEL - Estándar de Modales con Formularios Agnósticos

Este documento define el patrón arquitectónico para crear modales con formularios reutilizables.

---

## 1. PRINCIPIO FUNDAMENTAL

Los formularios son **agnósticos al contexto**. Pueden usarse en:
- Modales
- Páginas completas
- Paneles laterales (Sheet)
- Cualquier otro contenedor

---

## 2. ARQUITECTURA DE 2 ARCHIVOS

```
forms/
├── FeatureFormFields.tsx    → Lógica del formulario (CEREBRO)

modals/
├── FeatureModal.tsx         → Contenedor del modal (ENVASE)
```

---

## 3. FORMFIELDS (El Cerebro)

**Ubicación:** `src/features/{feature}/forms/{Feature}FormFields.tsx`

### Características

- Contiene `react-hook-form` con `zodResolver`
- Contiene todos los hooks de datos (`useQuery`, `useMutation`)
- Contiene la lógica de submit y validaciones
- Incluye los botones de acción (Guardar/Cancelar)
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
  onCancel
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
        <div className="flex justify-end pt-4 border-t">
          <Button variant="secondary" onClick={onCancel}>
            Cerrar
          </Button>
        </div>
      </div>
    );
  }

  // Modo CREATE/EDIT
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
        {/* Grid fluido con campos */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          <FormField control={form.control} name="field1" ... />
          <FormField control={form.control} name="field2" ... />
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-[3]">
            {isSubmitting ? 'Guardando...' : mode === 'edit' ? 'Guardar Cambios' : 'Crear'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

---

## 4. MODAL (El Envase)

**Ubicación:** `src/features/{feature}/modals/{Feature}Modal.tsx`

### Características

- Solo importa y renderiza el FormFields
- Configura `ModalHeader` con título/descripción según mode
- **NO** usa `ModalFooter` (botones están en FormFields)
- Conecta `onSuccess` y `onCancel` a `onClose`

### Estructura del Componente

```tsx
import { ModalLayout, ModalHeader, ModalBody } from '@/components/modal';
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

  const header = getHeader();

  return (
    <ModalLayout onClose={onClose} size="lg">
      <ModalHeader
        title={header.title}
        description={header.description}
        icon={IconComponent}
      />
      <ModalBody>
        <FeatureFormFields
          projectId={modalData?.projectId}
          organizationId={modalData?.organizationId}
          itemId={modalData?.itemId}
          mode={mode}
          onSuccess={onClose}
          onCancel={onClose}
        />
      </ModalBody>
    </ModalLayout>
  );
}
```

---

## 5. LAYOUT FLUIDO (Container-Aware)

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

## 6. REGISTRO EN registerModals.ts

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

## 7. EXPORTS EN index.ts

```typescript
// src/features/feature/index.ts

// Modal (para registro y uso general)
export { FeatureModal } from './modals/FeatureModal';

// FormFields (para uso en otros contextos)
export { FeatureFormFields } from './forms/FeatureFormFields';
```

---

## 8. TAMAÑOS DE MODAL

| Size | Ancho |
|------|-------|
| `sm` | 400px |
| `md` | 550px |
| `lg` | 750px (default) |
| `xl` | 1000px |
| `full` | 100% |

---

## 9. REGLAS A SEGUIR

1. **FormFields NO importa componentes de modal** - Nunca `ModalLayout`, `ModalHeader`, etc.
2. **Botones van DENTRO del FormFields** - No en el Modal
3. **FormFields recibe `onSuccess` y `onCancel`** - Para notificar al parent
4. **Modal conecta callbacks a `onClose`** - `onSuccess={onClose}`, `onCancel={onClose}`
5. **Mantener `data-testid` en elementos interactivos**
6. **Usar grid fluido** - `grid-cols-[repeat(auto-fit,minmax(Xpx,1fr))]`

---

## 10. BENEFICIOS

1. **Reutilización Total**: El mismo FormFields funciona en modal, página, sheet
2. **Testing Aislado**: Testea el form sin dependencias de modal
3. **Mantenimiento**: Cambios en modal no afectan lógica del form
4. **Flexibilidad**: Mover el form a cualquier contexto sin refactorizar

---

## 11. FORMULARIOS REFACTORIZADOS

| Feature | FormFields | Modal | Fecha |
|---------|------------|-------|-------|
| ClientPayment | `forms/ClientPaymentFormFields.tsx` | `modals/ClientPaymentModal.tsx` | 2025-12-10 |
| MaterialPayment | `forms/MaterialPaymentFormFields.tsx` | `modals/MaterialPaymentModal.tsx` | 2025-12-10 |
| PersonnelPayment | `forms/PersonnelPaymentFormFields.tsx` | `modals/PersonnelPaymentModal.tsx` | 2025-12-10 |

---

## 12. FORMULARIOS PENDIENTES

- [ ] GeneralCostPaymentForm
- [ ] SubcontractFormModal
- [ ] ContactForm
- [ ] ProjectForm
- [ ] ClientForm
- [ ] SiteLogForm

---

## 13. CHECKLIST DE CREACIÓN

Al crear un nuevo modal:

- [ ] Crear `forms/FeatureFormFields.tsx` con toda la lógica
- [ ] Crear `modals/FeatureModal.tsx` como wrapper tonto
- [ ] FormFields NO importa componentes de modal
- [ ] FormFields incluye botones Cancelar/Guardar
- [ ] FormFields recibe `onSuccess` y `onCancel`
- [ ] Modal conecta `onSuccess={onClose}` y `onCancel={onClose}`
- [ ] Registrar en `registerModals.ts`
- [ ] Exportar en `index.ts` del feature
- [ ] Agregar a la tabla de formularios refactorizados

---

## 14. CHECKLIST QA

- [ ] Probar CREATE
- [ ] Probar EDIT (campos precargados)
- [ ] Probar VIEW (solo lectura)
- [ ] Probar en contenedor angosto
- [ ] Probar en mobile (drawer)
- [ ] Verificar que no hay errores de import
- [ ] Verificar botones funcionan correctamente
