# Prompt para refactorizar páginas completas:

# Componentes:
- Revisar que si hay una TABLE, use el nuevo compomente de src/components/shared/table segun las logicas de src/components/shared/table/AUDIT.md. Ademas quiero que todas las columnas de la tabla midan lo mismo.
- Revisar que si hay BADGES en uso, use el componente BADGE.tsx en su variable DEFAULT, sin nada hardcodeado (ni colores ni nada).
- Revisar que la página tenga en su header el mismo ícono que en su sidebar, y que tenga descripción en su prop.