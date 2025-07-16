🧩 README: Cómo crear un nuevo Modal en Archub (modo correcto)

✅ Arquitectura general
Todos los modales en Archub siguen esta estructura unificada:

ModalFactory.tsx → ComponenteModal.tsx → FormModalLayout.tsx
Nunca se debe usar CustomModal, CustomModalHeader, CustomModalFooter, ni CustomModalBody en los nuevos modales.
En su lugar se usa FormModalLayout con sus secciones internas bien definidas.

📁 Ubicación del archivo
Guardar el nuevo archivo en: src/components/modal/modals

🧱 Estructura correcta del archivo de modal

**IMPORTANTE**: Los modales deben seguir exactamente la estructura de BoardFormModal.tsx

```typescript
import { FormModalLayout } from "@/components/modal/form/FormModalLayout"
import { FormModalHeader } from "@/components/modal/form/FormModalHeader"
import { FormModalFooter } from "@/components/modal/form/FormModalFooter"

export function MemberFormModal({ modalData, onClose }) {
  // Lógica del modal aquí...

  const viewPanel = (
    // Contenido para modo vista (solo lectura)
    <div>Contenido de vista</div>
  );

  const editPanel = (
    // Contenido para modo edición/creación
    <div>Contenido de edición</div>
  );

  const headerContent = (
    <FormModalHeader 
      title="Invitar Miembro"
      icon={UserPlus}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel="Invitar"
      onRightClick={() => {/* función de submit */}}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
    />
  );
}
```

✅ Estilos y comportamiento

**ESTRUCTURA OBLIGATORIA:**
✓ Modal debe devolver FormModalLayout con props: viewPanel, editPanel, headerContent, footerContent
✓ FormModalLayout recibe estos objetos como props y maneja el layout interno automáticamente
✓ NUNCA usar JSX directo como <FormModalLayout><FormModalHeader>... - esto está PROHIBIDO
✓ Seguir exactamente el patrón de BoardFormModal.tsx - es el modelo de referencia OBLIGATORIO
✓ viewPanel: contenido de solo lectura (puede ser null si no aplica)
✓ editPanel: contenido de edición/creación con formularios (sin FormModalBody wrapper)
✓ headerContent: FormModalHeader con título e icono
✓ footerContent: FormModalFooter con botones de acción

**ERRORES COMUNES A EVITAR:**
✗ NO usar <FormModalLayout><FormModalHeader>... - estructura JSX directa
✗ NO envolver editPanel en FormModalBody - FormModalLayout ya lo hace
✗ NO devolver JSX directo - siempre usar la estructura de objetos como props
✗ NO seguir patrones antiguos de CustomModal - usar solo FormModalLayout

🔁 En ModalFactory.tsx
Asegurate de registrar correctamente el nuevo modal en ModalFactory.tsx. Por ejemplo:

case "member-form":
  return <MemberFormModal />

🧪 Test mínimo

Luego de implementarlo, abrí el modal desde la app y verificá:

✅ Se renderiza correctamente

✅ Tiene el título esperado

✅ Tiene los campos necesarios

✅ Tiene botones funcionales

✅ No hay doble línea en el header

✅ Tiene bordes redondeados en todo el contenedor