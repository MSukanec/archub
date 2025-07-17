🧩 README: Cómo crear un nuevo Modal en Archub (modo correcto)

✅ Arquitectura general
Todos los modales en Archub siguen esta estructura unificada:

ModalFactory.tsx → ComponenteModal.tsx → FormModalLayout.tsx
Nunca se debe usar CustomModal, CustomModalHeader, CustomModalFooter, ni CustomModalBody en los nuevos modales.
En su lugar se usa FormModalLayout con sus secciones internas bien definidas.

🔄 Tipos de modales soportados:
1. **Modales tradicionales (1/2 botones)**: Para formularios simples de crear/editar
2. **Modales de pasos múltiples**: Para workflows complejos como importación de Excel

📁 Ubicación del archivo
Guardar el nuevo archivo en: src/components/modal/modals

🧱 Estructura correcta del archivo de modal

## 📝 Modales Tradicionales (1/2 botones)
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

## 🔄 Modales de Pasos Múltiples
Para workflows complejos como importación de Excel, use esta estructura:

```typescript
import { FormModalLayout, FormModalStepHeader, FormModalStepFooter } from "@/components/modal/form"
import { StepModalConfig, StepModalFooterConfig } from "@/components/modal/form/types"

export default function MovementImportStepModal({ modalData, onClose }) {
  const [currentStep, setCurrentStep] = useState(1)
  
  // Configuración del paso actual
  const stepConfig: StepModalConfig = {
    currentStep,
    totalSteps: 3,
    stepTitle: 'Seleccionar archivo', // Opcional
    stepDescription: 'Descripción del paso' // Opcional
  }

  // Configuración del footer según el paso
  const getFooterConfig = (): StepModalFooterConfig => {
    switch (currentStep) {
      case 1:
        return {
          cancelAction: { label: 'Cancelar', onClick: onClose }
        }
      case 2:
        return {
          cancelAction: { label: 'Cancelar', onClick: onClose },
          previousAction: { label: 'Anterior', onClick: () => setCurrentStep(1) },
          nextAction: { label: 'Siguiente', onClick: () => setCurrentStep(3) }
        }
      case 3:
        return {
          cancelAction: { label: 'Cancelar', onClick: onClose },
          previousAction: { label: 'Anterior', onClick: () => setCurrentStep(2) },
          submitAction: { label: 'Finalizar', onClick: handleSubmit, loading: isLoading }
        }
    }
  }

  const headerContent = (
    <FormModalStepHeader
      title="Título del Modal"
      icon={Upload}
      stepConfig={stepConfig}
    />
  )

  const footerContent = (
    <FormModalStepFooter
      config={getFooterConfig()}
    />
  )

  return (
    <FormModalLayout
      headerContent={headerContent}
      footerContent={footerContent}
      stepContent={getCurrentStepContent()} // En lugar de viewPanel/editPanel
      onClose={onClose}
    />
  )
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

### Para modales tradicionales:
✗ NO usar <FormModalLayout><FormModalHeader>... - estructura JSX directa
✗ NO envolver editPanel en FormModalBody - FormModalLayout ya lo hace internamente
✗ NO devolver JSX directo - siempre usar la estructura de objetos como props
✗ NO seguir patrones antiguos de CustomModal - usar solo FormModalLayout
✗ NO usar FormModalBody directamente en editPanel - FormModalLayout maneja el layout automáticamente
✗ NO usar <div className="p-6"> u otros contenedores con padding - FormModalLayout ya incluye padding apropiado

### Para modales de pasos:
✗ NO usar viewPanel/editPanel con stepContent - son mutuamente excluyentes
✗ NO olvidar el stepContent prop - es requerido para modales de pasos
✗ NO hardcodear la configuración de botones - usar StepModalFooterConfig dinámico
✗ NO usar FormModalHeader en modales de pasos - usar FormModalStepHeader

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