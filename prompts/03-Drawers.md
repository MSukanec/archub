# SEENCEL - Estándar de Drawers Agnósticos

Este documento define el patrón arquitectónico para crear drawers (paneles laterales) con contenido reutilizable.

---

## 1. PRINCIPIO FUNDAMENTAL

Los contenidos de drawer son **agnósticos al contexto**. Pueden usarse en:
- Drawers laterales (desliza desde la derecha)
- Modales (con estructura similar)
- Páginas completas (embebidos)
- Cualquier otro contenedor

---

## 2. ARQUITECTURA DE DRAWER

### Estructura Obligatoria

Todo drawer DEBE tener 3 partes en orden:

```
┌─────────────────────────────────┐
│  HEADER (fijo)                  │  ← DrawerHeader via headerContent prop
├─────────────────────────────────┤
│                                 │
│  BODY (scrollable)              │  ← DrawerBody como children
│                                 │
├─────────────────────────────────┤
│  FOOTER (fijo, opcional)        │  ← DrawerFooter via footerContent prop
└─────────────────────────────────┘
```

### Código Base

```tsx
// ✅ CORRECTO - Drawer con estructura completa
<DrawerLayout
  isOpen={isOpen}
  onClose={onClose}
  size="lg"
  headerContent={<DrawerHeader title="Título" icon={Icon} />}
  footerContent={<DrawerFooter ... />} // Opcional
>
  <DrawerBody>
    <DrawerSection title="Sección 1" icon={Icon1}>
      ...contenido...
    </DrawerSection>
    <DrawerSection title="Sección 2" icon={Icon2}>
      ...contenido...
    </DrawerSection>
  </DrawerBody>
</DrawerLayout>
```

---

## 3. ARQUITECTURA DE 2 ARCHIVOS

```
features/{feature}/
├── components/
│   ├── FeatureDetailContent.tsx    → Contenido agnóstico (CEREBRO)
│   └── FeatureDetailDrawer.tsx     → Contenedor del drawer (ENVASE)
```

---

## 4. CONTENT (El Cerebro)

**Ubicación:** `src/features/{feature}/components/{Feature}DetailContent.tsx`

### Características

- Contiene la lógica de datos (`useQuery`, `useMutation`)
- Contiene las secciones con `DrawerSection`
- Usa `hideActions` prop para control externo
- Ocupa el 100% del ancho disponible
- **NO** importa `DrawerLayout`, solo componentes internos

### Interface de Props

```typescript
export interface FeatureDetailContentProps {
  // Datos principales
  item: ItemType;
  
  // Callbacks
  onSuccess?: () => void;
  onCancel?: () => void;
  
  // Control externo
  hideActions?: boolean;
}
```

---

## 5. DRAWER (El Envase)

**Ubicación:** `src/features/{feature}/components/{Feature}DetailDrawer.tsx`

### Características

- Importa y usa `DrawerLayout`
- Pasa `headerContent` y opcionalmente `footerContent`
- Controla apertura/cierre

### Estructura del Componente

```tsx
import { DrawerLayout, DrawerHeader, DrawerBody } from '@/components/drawer';
import { FeatureDetailContent } from './FeatureDetailContent';

interface FeatureDetailDrawerProps {
  item: ItemType | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FeatureDetailDrawer({ item, isOpen, onClose }: FeatureDetailDrawerProps) {
  if (!item) return null;
  
  return (
    <DrawerLayout
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      headerContent={
        <DrawerHeader
          title={item.name}
          description={item.description}
          icon={IconComponent}
        />
      }
    >
      <DrawerBody noPadding>
        <FeatureDetailContent
          item={item}
          onSuccess={onClose}
          hideActions
        />
      </DrawerBody>
    </DrawerLayout>
  );
}
```

---

## 6. COMPONENTES BASE

### DrawerLayout

```tsx
<DrawerLayout
  isOpen={boolean}
  onClose={() => void}
  size="sm" | "md" | "lg" | "xl" | "full"
  side="left" | "right"           // Default: right
  headerContent={ReactNode}
  footerContent={ReactNode}       // Opcional
  preventEscapeClose={boolean}    // Default: false
  preventClickOutsideClose={boolean} // Default: false
  ariaLabel={string}
>
  {children}
</DrawerLayout>
```

### DrawerHeader

```tsx
<DrawerHeader
  title="Título"
  description="Descripción opcional"
  icon={LucideIcon}
  iconClassName="custom-classes"
  badge={<Badge>Tag</Badge>}
  actions={<Button>Acción</Button>}
  showBackButton={boolean}
  onBackClick={() => void}
/>
```

### DrawerBody

```tsx
<DrawerBody
  noPadding={boolean}  // Default: false (tiene px-6 py-4)
  className="custom-classes"
>
  {children}
</DrawerBody>
```

### DrawerFooter

```tsx
<DrawerFooter
  leftLabel="Cancelar"
  onLeftClick={() => void}
  submitText="Guardar"
  onSubmit={() => void}
  submitDisabled={boolean}
  submitLoading={boolean}
/>

// O con children custom:
<DrawerFooter>
  <CustomContent />
</DrawerFooter>
```

### DrawerSection

```tsx
<DrawerSection
  title="Nombre de Sección"
  icon={LucideIcon}
  badge={<Badge>3</Badge>}
  actions={<Button size="icon-sm">+</Button>}
  collapsible={boolean}           // Default: false
  defaultExpanded={boolean}       // Default: true
>
  {children}
</DrawerSection>
```

---

## 7. TAMAÑOS DE DRAWER

| Size | Ancho |
|------|-------|
| `sm` | 400px |
| `md` | 500px |
| `lg` | 600px (default) |
| `xl` | 800px |
| `full` | 100% |

---

## 8. INTEGRACIÓN EN PÁGINAS

```tsx
const MyPage = () => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleOpenDrawer = (item: Item) => {
    setSelectedItem(item);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedItem(null);
  };

  return (
    <>
      <Table
        data={items}
        onRowClick={handleOpenDrawer}
        ...
      />
      
      <FeatureDetailDrawer
        item={selectedItem}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
    </>
  );
};
```

---

## 9. REGLAS A SEGUIR

### Estructura del Drawer
1. **SIEMPRE usar** `headerContent` prop para el header
2. **OPCIONAL** `footerContent` prop para acciones del footer
3. **DrawerBody** va como children de DrawerLayout
4. **DrawerSection** para organizar contenido en secciones

### Content
5. **NO importa componentes de drawer layout** - Solo `DrawerSection`
6. **Acepta `hideActions`** - Prop opcional para control externo
7. **Usa hooks de datos** - `useQuery` y `useMutation` internos

### Testing
8. **Mantener `data-testid`** en elementos interactivos

---

## 10. DRAWERS IMPLEMENTADOS

| Feature | Content | Drawer | Fecha |
|---------|---------|--------|-------|
| Admin Organization | `OrganizationDetailContent.tsx` | `OrganizationDetailDrawer.tsx` | 2025-12-11 |

---

## 11. BENEFICIOS

1. **Reutilización Total**: El mismo Content funciona en drawer, modal, página
2. **Testing Aislado**: Testea el content sin dependencias de drawer
3. **Mantenimiento**: Cambios en drawer no afectan lógica del content
4. **Flexibilidad**: Mover el content a cualquier contexto sin refactorizar
5. **Patrón Familiar**: Sigue la misma arquitectura que los Modales

---

## 12. CHECKLIST DE CREACIÓN

Al crear un nuevo drawer:

- [ ] Crear `components/FeatureDetailContent.tsx` con toda la lógica
- [ ] Content usa `DrawerSection` para organizar contenido
- [ ] Content acepta `hideActions` opcional
- [ ] Crear `components/FeatureDetailDrawer.tsx` como wrapper
- [ ] Drawer usa `DrawerLayout` con `headerContent`
- [ ] Drawer pasa `hideActions={true}` si tiene footer externo
- [ ] Exportar en `index.ts` del feature
- [ ] Agregar a la tabla de drawers implementados

---

## 13. CHECKLIST QA

- [ ] Probar apertura/cierre del drawer
- [ ] Probar ESC para cerrar
- [ ] Probar click fuera para cerrar
- [ ] Verificar scroll del body
- [ ] Probar en mobile (responsive)
- [ ] Verificar que no hay errores de import
