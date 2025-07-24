# Page Template Standard – Archub

## Estructura general

Todas las nuevas páginas deben:

1. Estar ubicadas en `src/pages/`.
2. Utilizar el componente `Layout` como wrapper general.
3. Usar la prop `headerProps` para configurar el `Header`.
4. En el caso de usar una tabla, usar src/components/ui-custom/Table.tsx.
5. En el caso de usuar un modal, usar la guia de src/prompts/ai-modal-template.md.
6. Usar src/components/layout/desktop/ActionBarDesktop.tsx con icono, titulo y botones ghost. En el caso de tener modal, agregar tambien el boton que lo abre al final de la segunda fila, con BUTTON version DEFAULT. Tambien deberíamos tener el boton de AYUDA que expanda y muestre la informacion de lo que hace la pagina. Si tiene tabs, tambien debería usarlas. Usa como referencia el action bar de pagina de CRONOGRAMA DE CONSTRUCCION.
7. Usar src/components/ui-custom/EmptyState.tsx debajo del action bar que contenga todo el contenido de la misma.

## Ejemplo base de una página

Notas importantes:

El contenido no necesita tener padding adicional, ya que el <main> lo incluye automáticamente (px-4 py-6).

El título debe ser parte del header, no dentro del contenido.

## Ejemplo de página

Revisa la pagina src/pages/construction/ConstructionLogs.tsx como ejemplo perfecto de todo lo que esta bien, action bar, orden de pagina, todo.