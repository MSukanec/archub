🧩 README: Cómo crear un nuevo Modal en Archub (modo correcto)
✅ Arquitectura general
Todos los modales en Archub siguen esta estructura unificada:

ModalFactory.tsx → ComponenteModal.tsx → FormModalLayout.tsx
Nunca se debe usar CustomModal, CustomModalHeader, CustomModalFooter, ni CustomModalBody en los nuevos modales.
En su lugar se usa FormModalLayout con sus secciones internas bien definidas.

📁 Ubicación del archivo
Guardar el nuevo archivo en: src/components/modal/modals

🧱 Estructura mínima del archivo de modal
tsx
Copiar
Editar
import { FormModalLayout } from "@/components/form/modal/FormModalLayout"
import { FormModalBody } from "@/components/form/modal/FormModalBody"
import { FormModalFooter } from "@/components/form/modal/FormModalFooter"
import { FormModalHeader } from "@/components/form/modal/FormModalHeader"

export default function MemberFormModal() {
  return (
    <FormModalLayout>
      <FormModalHeader title="Invitar Miembro" />

      <FormModalBody>
        {/* Aquí van los campos del formulario */}
      </FormModalBody>

      <FormModalFooter
        cancelText="Cancelar"
        submitText="Invitar"
        onSubmit={() => {}} // reemplazar con la función real
      />
    </FormModalLayout>
  )
}
✅ Estilos y comportamiento
El modal entero debe tener bordes redondeados, aplicados en FormModalLayout.tsx mediante rounded-xl.

El modal no debe tener doble borde en el header. Eso ya está resuelto internamente con la línea decorativa.

Todos los contenidos deben ir dentro de FormModalBody, con scroll interno si el contenido es largo.

Los botones de acción deben ir siempre en FormModalFooter.

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