# Guía para Crear Modales en Seencel

## 📁 ARQUITECTURA DE CARPETAS (v2.0 - Enterprise SaaS Level)

La carpeta `src/components/modal/` está organizada siguiendo estándares de Linear, Vercel, Notion y Airtable:

```
src/components/modal/
├── foundation/          # Componentes base del modal (UI primitivos)
│   ├── ModalLayout.tsx         # Layout principal (portal, animaciones, focus trap)
│   ├── ModalHeader.tsx         # Cabecera con título, ícono, descripción
│   ├── ModalBody.tsx           # Cuerpo scrolleable
│   ├── ModalFooter.tsx         # Pie con botones de acción
│   ├── ModalStepHeader.tsx     # Header para modales multi-paso (wizard)
│   ├── ModalStepFooter.tsx     # Footer para modales multi-paso (wizard)
│   ├── ModalSectionButton.tsx  # Botón para subsecciones
│   ├── DrawerBase.tsx          # Drawer para mobile (slide-up)
│   └── index.ts
├── state/               # Estado global (Zustand stores)
│   ├── globalModalStore.ts     # Stack de modales, pushModal, popModal, closeAll
│   ├── panelStore.ts           # ⚠️ DEPRECATED - Migrar a useState local
│   └── index.ts
├── factory/             # Registry pattern para modales
│   ├── registry.ts             # Diccionario de modales con metadata
│   ├── registerModals.ts       # Registro de todos los 70+ modales
│   ├── types.ts                # Tipos de modales y datos
│   └── index.ts
├── ModalProvider.tsx    # ✨ NUEVO: Renderiza el stack de modales
├── ModalContainer.tsx   # ✨ NUEVO: Aplica config del registry
├── utils/               # Utilidades
│   ├── ModalErrorBoundary.tsx  # Manejo de errores con recovery
│   ├── modal-readiness.tsx     # Hook para verificar datos listos
│   └── modal-best-practices.tsx
└── index.ts             # Barrel export principal
```

## 🆕 CARACTERÍSTICAS v2.0

### 1. ModalProvider (Reemplaza ModalFactory)
El nuevo `ModalProvider` es el corazón del sistema:
- Escucha el stack de `globalModalStore`
- Renderiza cada modal con su z-index correcto
- Detecta mobile/desktop para usar DrawerBase o ModalLayout
- Maneja ESC y click en backdrop según config

```tsx
// En App.tsx
import { ModalProvider } from '@/components/modal';

function App() {
  return (
    <>
      <Router />
      <ModalProvider />
    </>
  );
}
```

### 2. Modal Stacking (Modales Apilados)
```typescript
import { useGlobalModalStore } from '@/components/modal';

const { openModal, pushModal, popModal, closeAll } = useGlobalModalStore();

openModal('project', { projectId: '123' }); // Reemplaza todo el stack
pushModal('delete-confirmation', { onConfirm: handleDelete }); // Apila encima
popModal(); // Cierra solo el superior
closeAll(); // Cierra todos
```

### 3. Dirty Form Blocking
```typescript
const { setBlockClose, clearBlockClose } = useGlobalModalStore();

// Cuando el form tiene cambios sin guardar
setBlockClose();

// Cuando se guarda o descarta
clearBlockClose();
```

### 4. Registry con Metadata
```typescript
import { registerModal } from '@/components/modal';

registerModal('my-modal', MyModalComponent, {
  category: 'project',        // admin | project | finance | organization | learning | general
  size: 'lg',                 // sm | md | lg | xl | full
  drawerOnMobile: true,       // Usar DrawerBase en mobile
  preventCloseOnBackdrop: false,
  preventCloseOnEsc: false,
  mapDataToProps: (data) => ({ projectId: data?.projectId }),
});
```

### 5. Tamaños de Modal
```typescript
<ModalLayout
  size="lg" // 'sm' | 'md' | 'lg' | 'xl' | 'full'
  // sm: 400px, md: 550px (default), lg: 750px, xl: 1000px, full: 100%
>
```

### 6. DrawerBase para Mobile
```typescript
import { DrawerBase } from '@/components/modal';

<DrawerBase
  isOpen={isOpen}
  onClose={onClose}
  snapPoint="auto" // 'auto' | 'half' | 'full'
  showDragHandle={true}
  dismissible={true}
  zIndex={50}
>
  {/* Contenido */}
</DrawerBase>
```

## 🎯 CÓMO CREAR UN MODAL

### Paso 1: Crear el componente
```tsx
// src/features/my-feature/modals/MyModal.tsx
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';

interface MyModalProps {
  modalData?: { itemId?: string };
  onClose: () => void;
}

export function MyModal({ modalData, onClose }: MyModalProps) {
  return (
    <ModalLayout onClose={onClose} size="md">
      <ModalHeader 
        title="Mi Modal"
        description="Descripción opcional"
      />
      <ModalBody>
        {/* Contenido */}
      </ModalBody>
      <ModalFooter>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="default">Guardar</Button>
      </ModalFooter>
    </ModalLayout>
  );
}
```

### Paso 2: Registrar en registerModals.ts
```tsx
// src/components/modal/factory/registerModals.ts
import { MyModal } from '@/features/my-feature/modals/MyModal';

registerModal('my-modal', MyModal, { 
  category: 'project', 
  size: 'md' 
});
```

### Paso 3: Abrir el modal
```tsx
import { useGlobalModalStore } from '@/components/modal';

function MyComponent() {
  const { openModal } = useGlobalModalStore();
  
  return (
    <Button onClick={() => openModal('my-modal', { itemId: '123' })}>
      Abrir Modal
    </Button>
  );
}
```

## ⚠️ DEPRECATED: panelStore

`useModalPanelStore` está deprecated. Para manejar paneles (view/edit/subform):

```tsx
// ❌ ANTES (deprecated)
const { currentPanel, setPanel } = useModalPanelStore();

// ✅ AHORA (recomendado)
const [currentPanel, setPanel] = useState<'view' | 'edit' | 'subform'>('view');
```

## 📋 MEJORES PRÁCTICAS

1. **Usa el registry** para configurar size, category, y comportamiento de cierre
2. **Usa pushModal** para confirmaciones y sub-modales
3. **Implementa setBlockClose/clearBlockClose** en forms importantes
4. **Usa ModalLayout directamente** solo en casos especiales
5. **Mantén los modales simples** - delega lógica compleja a hooks
