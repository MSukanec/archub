export const DEFAULT_ITEMS_PER_PAGE = 100;

export const TABLE_LABELS = {
  search: {
    placeholder: "Buscar...",
    clear: "Limpiar",
  },
  filter: {
    button: "Filtros",
    clear: "Limpiar Filtros",
    noConfig: "Funcionalidad de filtros personalizada no configurada para esta tabla.",
  },
  sort: {
    button: "Ordenar",
  },
  grouping: {
    button: "Agrupar",
    title: "Agrupar por",
    none: "Sin agrupar",
    noGroup: "Sin grupo",
  },
  export: {
    button: "Exportar",
    title: "Exportar como",
    excel: "Exportar a Excel",
    pdf: "Exportar a PDF",
  },
  import: {
    button: "Importar",
  },
  selection: {
    selectAll: "Seleccionar todos",
    selected: "seleccionado",
    selectedPlural: "seleccionados",
    deselect: "Deseleccionar",
  },
  empty: {
    noData: "No hay datos disponibles",
    noResults: "No se encontraron resultados para",
    tryDifferent: "Intenta con términos diferentes o limpia la búsqueda",
  },
  inactive: {
    separator: "Completados",
  },
  pagination: {
    showing: "Mostrando",
    of: "de",
    items: "elementos",
    previous: "Anterior",
    next: "Siguiente",
  },
};

export const TABLE_ANIMATION = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.2, ease: "easeOut" },
};

export const TABLE_BULK_ANIMATION = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.2, ease: "easeOut" },
};
