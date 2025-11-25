🧩 SEENCEL – ESTÁNDAR GLOBAL DE MODALES
Prompt para Replit – Auditoría y Refactorización Completa de un Modal

Replit, quiero que revises y refactorices el modal especificado según estas reglas estandarizadas de Seencel. Este sistema es universal y todos los modales deben cumplirlo.

A continuación describo todas las reglas obligatorias.
Tu tarea es:

✔ Revisar el archivo del modal
✔ Renombrarlo correctamente
✔ Unificar CREATE + EDIT + VIEW en un solo archivo
✔ Eliminar cualquier lógica duplicada
✔ Reemplazar cualquier contenedor propio por los componentes madre
✔ Mantener absolutamente toda la lógica madre del modal fuera del modal de negocio
✔ Ajustar imports, tipado, nombres y structure
✔ No romper ni modificar el sistema madre (ModalLayout / DrawerBase / ModalProvider)
🏛 1. NOMBRE Y ESTRUCTURA DEL ARCHIVO

El modal debe existir como un único archivo con este formato:

<Entidad>Form.tsx


Ejemplos:

ClientPaymentForm.tsx

GeneralCostsPaymentForm.tsx

TaskForm.tsx

ContactForm.tsx

BudgetItemForm.tsx

Si existen archivos duplicados como:

ClientPaymentModal.tsx

ClientPaymentEditModal.tsx

ClientPaymentViewModal.tsx

👉 Debes eliminarlos y unificarlos en uno solo: ClientPaymentForm.tsx
Asegurate de actualizar todos los imports.

⚙️ 2. PROPS OBLIGATORIOS

El componente debe recibir SIEMPRE:

interface ModalProps {
  modalData: any;  
  onClose: () => void;
  mode?: "create" | "edit" | "view";
}


Y debe comportarse según mode.

🎨 3. CONTENEDORES PROHIBIDOS

El modal NO puede:

crear contenedores div externos para layout

crear overlays

crear headers propios

crear footers propios

definir paddings, margins, z-index o posicionamiento

usar fixed, absolute, inset-0, overflow-hidden, etc.

Toda la estructura viene del sistema madre.

🏗 4. CONTENEDORES QUE SÍ DEBE USAR

El modal debe usar exclusivamente:

✔ ModalHeader

Para título, subtítulo, actions.
Nada de estilos extras.

✔ ModalBody / FormModalBody

Para contenido.
Nada de paddings manuales.
Nada de scroll manual.
Nada de fondos personalizados.

✔ ModalFooter

Para botones.
No agregar divs intermedios.

🧩 5. UN ÚNICO COMPONENTE PARA CREATE, EDIT Y VIEW

Debe haber un solo archivo/component que cubra:

CREATE

campos vacíos

inputs habilitados

botón “Crear”

EDIT

campos precargados

inputs habilitados

botón “Guardar cambios”

VIEW

⚠️ IMPORTANTE:
NO quiero inputs disabled porque se ven mal.

En MODO VIEW:

no hay form

no hay inputs

no hay submit

NO se muestran inputs con disabled

se debe mostrar una vista estéticamente pensada para ese tipo de entidad (aunque por ahora sea simple)

Ejemplo simple de view:

if (mode === "view") {
  return (
    <>
      <ModalHeader title={viewTitle} />
      <ModalBody>
        <ViewPanel data={modalData}/>
      </ModalBody>
    </>
  );
}


Después yo personalizaré cada view panel.

🧠 6. LOGICA DE NEGOCIO

El modal debe trabajar con data proveniente de modalData.

No debe leer directamente del store global del modal.

No debe manejar su propio overlay, navegación, stack ni z-index.

No debe duplicar lógica del sistema madre.

🛑 7. DEFINE CLARAMENTE LOS MODOS

El componente debe tener algo así:

const isCreate = mode === "create";
const isEdit = mode === "edit";
const isView = mode === "view";


Y actuar en consecuencia.

🧱 8. PROHIBIDO sobreescribir estilos madre

Cualquier cosa que haga esto:

❌ tailwind inline con spacing/padding de layout
❌ borders propios del modal
❌ shadows propios
❌ text-sizes que rompen el sistema
❌ max-width, min-width, min-h que rompan el diseño

👉 Debes eliminarlos.

🧪 9. TEST AUTOMÁTICO QUE DEBES HACER

Después de refactorizar:

Probar CREATE

Probar EDIT

Probar VIEW

Probar pushModal desde adentro (si aplica)

Verificar que todo funciona en Drawer (mobile)

Confirmar que no hay errores de import

Confirmar que los botones estén correctamente ubicados en ModalFooter

🧹 10. LIMPIEZA FINAL

Borrar archivos viejos (edit-modal, view-modal, etc.)

Quitar todo código muerto

Quitar console.logs

Normalizar nombres de funciones

Reordenar imports

📝 ORDEN DE TRABAJO PARA REPLIT

Replit, con toda la especificación anterior:

Revisá el archivo del modal indicado.

Renombralo correctamente como <Entidad>Form.tsx.

Unificá create/edit/view en un solo componente.

Eliminá cualquier contenedor o estilo que rompa la arquitectura.

Usá únicamente ModalHeader / ModalBody / ModalFooter.

Convertí VIEW en un panel visual limpio (sin inputs).

Ajustá imports y actualizá los registerModal.

Hacé QA completo del modal.

🟩 EJEMPLO DE USO (lo que yo le digo a Replit)

Vos solo copiás esto y lo pegás arriba del prompt:

Replit, aplicá este estándar al archivo:

src/features/clients/modals/ClientPaymentModal.tsx

Y dejalo perfecto según nuestro sistema de modales universales.


Listo.