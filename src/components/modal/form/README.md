# 🧱 SISTEMA DE MODALES DE ARCHUB — GUÍA OFICIAL

Esta guía explica cómo construir, reemplazar o mantener cualquier modal dentro del sistema de modales nuevo de Archub.  
Debe seguirse **SIEMPRE**. No se deben volver a usar `CustomModalLayout`, `CustomModalHeader`, `CustomModalFooter`, ni estructuras anteriores.

---

## 📦 ESTRUCTURA DE ARCHIVOS

Todos los archivos del sistema viven dentro de:

src/components/modal/form/

yaml
Copiar
Editar

Los principales son:

| Archivo                    | Función                                                                 |
|----------------------------|-------------------------------------------------------------------------|
| `FormModalLayout.tsx`      | Ensambla header, panel y footer. No aplica padding.                    |
| `FormModalHeader.tsx`      | Header visual reutilizable con título, ícono, y acciones.              |
| `FormModalFooter.tsx`      | Footer estandarizado. Controla totalmente la estética de los botones.  |
| `modalPanelStore.ts`       | Zustand para cambiar entre `view`, `edit`, `subform`.                  |
| `ModalFactory.tsx`         | Muestra el modal correcto según tipo.                                  |
| `useGlobalModalStore.ts`   | Zustand para abrir/cerrar modales desde cualquier lugar.               |
| `types.ts`                 | Tipos base: `ModalType`, interfaces comunes.                           |

---

## ⚙️ FUNCIONAMIENTO GENERAL

Todos los modales usan una estructura común:

```tsx
<FormModalLayout
  viewPanel={...}
  editPanel={...}
  subformPanel={...}
  headerContent={...}
  footerContent={...}
  onClose={handleClose}
/>
La navegación entre paneles se maneja con:

const { currentPanel, setPanel } = useModalPanelStore();
Los botones que activan otros paneles deben usar setPanel('subform'), setPanel('edit'), etc.

✅ HEADER Y FOOTER
🧩 FormModalHeader
Se usa así:

<FormModalHeader
  title="Editar Movimiento"
  icon={Pen}
  leftActions={<Button onClick={() => setPanel('view')}>Volver</Button>}
  rightActions={<Button>Acción</Button>}
/>
Tiene padding interno y estilo integrado. No se le debe agregar padding externo.

✅ FormModalFooter
Se maneja por completo internamente. Solo recibe texto y handlers:

<FormModalFooter
  leftLabel="Cancelar"
  onLeftClick={handleCancel}
  rightLabel="Guardar"
  onRightClick={handleSave}
/>
Si se pasan los dos botones:

El izquierdo mide 25%

El derecho mide 75%

Si se pasa solo rightLabel, ocupa el 100%

⚠️ No se le pasa botones completos. Solo label y onClick.

🛑 PROHIBIDO
❌ No usar CustomModal* anteriores.

❌ No agregar padding directamente en FormModalLayout.tsx.

❌ No definir estilos de botones desde el modal individual.

❌ No modificar directamente ModalFactory.tsx sin seguir esta estructura.


🔁 ¿CÓMO CREAR UN NUEVO MODAL?
Crear NombreEntidadModal.tsx dentro de src/components/modal/modals/.

Usar FormModalLayout.

Controlar la navegación con modalPanelStore.

Agregar el nuevo modal a ModalFactory.tsx.

Desde cualquier parte de la app, podés abrirlo así:

const { openModal } = useGlobalModalStore();
openModal("nombreEntidad", { id: 123 });

# En el caso de necesitar componentes para buscar MIEMBROS (tipo creador) usar src/components/ui-custom/UserSelector.tsx.

# En el caso de usar campos de teléfono, usar src/components/ui-custom/PhoneInput.tsx.

# En el caso de que necesitemos la funcionalidad de usar sub-secciones, usar el componente src/components/modal/form/FormSubsectionButton.tsx.
  
# En el caso de que te pida REHACER un modal con estas nuevas lógicas, primero ANALIZAR que teníamos antes para replicar las funcionalidades correctamente.

Esta guía es la fuente de verdad del sistema de modales en Archub. Si Replit necesita saber cómo implementar o reemplazar un modal, DEBE seguir esta estructura exacta.