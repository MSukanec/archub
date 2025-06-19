---
📁 prompts/ai-modal-template.md
---

# 🧠 Archub – Modal Generation Template

Este archivo define el estándar para construir **modales reutilizables** en Archub.
Todos los modales deben funcionar perfectamente en **desktop y mobile**, y seguir esta estructura modular y responsiva.

---

## 📐 Diseño base del modal

- En **desktop**: el modal debe anclarse a la derecha (`right side panel`) ocupando el **100% del alto** (`h-full`) y un **ancho fijo** (`max-w-xl`, por ejemplo).
- En **mobile**: el modal debe ocupar **el 100% del viewport** (`w-full h-full`) y comportarse como una hoja deslizable (`bottom sheet style`).

---

## 🧩 Estructura por componentes

Cada modal debe componerse de los siguientes bloques:

- `CustomModalLayout.tsx` → envuelve todo el modal, gestiona visibilidad, tamaño, cierre, y transición entre mobile/desktop.
- `CustomModalHeader.tsx` → incluye título, descripción opcional y botón de cerrar (`X`).
- `CustomModalBody.tsx` → se usa para contener el formulario o contenido principal.
- `CustomModalFooter.tsx` → contiene los botones de acción (cancelar / guardar).

> ✳️ Los nombres deben seguir el mismo patrón que las páginas: `CustomModalHeader`, `CustomModalBody`, etc.

---

## 🖱️ Footer con acciones

- El `footer` debe tener **dos botones**:
  - **Cancelar** → ocupa el **25% del ancho** (ej. `w-1/4`)
  - **Guardar / Confirmar** → ocupa el **75% del ancho** (`w-3/4`)
- Ambos deben tener padding y borde redondeado (`rounded-2xl`, `p-3`)

---

## 🎯 Comportamiento

- Debe integrarse al sistema de apertura de modales que ya usamos en `mobileModalStore` o `desktopModalStore`.
- El botón `Nuevo Proyecto` en la vista `/proyectos` debe abrir este modal.
- El `submit` del formulario debe llamar una función `handleSave()` con validación.

---

## 🧱 Base visual

- Seguir inspiración visual del ejemplo `lemon squeezy` adjunto
- Usar dark mode por defecto (`bg-muted`, `text-muted-foreground`, etc.)
- Margen y padding: `gap-4`, `p-6`, `space-y-6`
- Transiciones suaves: `transition-all`, `duration-300`, `ease-in-out`

---

## 🎛️ Formulario dentro del body

- Usar los mismos componentes de entrada que ya estamos utilizando (`Input`, `Textarea`, `Select`, etc.)
- En el futuro pueden estilizarse con variantes específicas para modales, pero **por ahora usá los mismos**
- Cada bloque del body puede agruparse en un `CustomModalAccordion` opcional para secciones como “General”, “Avanzado”, “Licencias”, etc.

---

## 📦 Resultado esperado

Un modal completamente reutilizable y responsivo que se abre al hacer clic en “Nuevo proyecto” y permite editar contenido en forma clara, sin errores visuales.

Debe verse bien en desktop, tablet y mobile.

---

Este archivo es el **contexto obligatorio** para cualquier generación de modal en Archub.
