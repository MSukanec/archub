# Puesta a punto de páginas

## Estructura general

Todas las páginas deben actualizarse de la siguiente forma:

1. Actualmente estan usando una action bar, que es src/components/layout/desktop/ActionBarDesktop.tsx. Esa action bar quedó obsoleta y ahora tenemos que suplantarla por src/components/layout/desktop/ActionBarDesktopRow.tsx.

Para eso, asegúrate de eliminar la vieja, usar la nueva y que tengan las mismas funcionalidades. Del lado derecho de la misma podemos tener un botón de acción BUTTON default, o en algunos casos un segundo botón pero con variable SECONDARY.

Del lado izquierdo deberíamos tener los botones que usan src/components/ui-custom/SelectableGhostButton.tsx. Esos botones normalmente van a ser filtros, ordenes, grupos, etc.

Asegurate de revisar las paginas src/pages/construction/ConstructionMaterials.tsx o src/pages/construction/ConstructionTasks.tsx para ver como están aplicado.

2. El header actual tiene el nombre de la página a su izquierda, y del lado derecho debería tener el selector de proyectos, SIEMPRE. Revisa tambien las páginas anteriores para ver cómo está aplicado.

3. Las páginas que en el viejo action bar tenían tabs, ahora pasan a tenerlo también en el header. Por favor revisa la pagina de src/pages/construction/ConstructionTasks.tsx par ver como se pone bien.