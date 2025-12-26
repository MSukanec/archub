export interface TranslationKeys {
  table: {
    search: {
      placeholder: string;
      clear: string;
    };
    filter: {
      button: string;
      clear: string;
      noConfig: string;
    };
    sort: {
      button: string;
    };
    grouping: {
      button: string;
      title: string;
      none: string;
      noGroup: string;
    };
    export: {
      button: string;
      title: string;
      excel: string;
      pdf: string;
    };
    import: {
      button: string;
    };
    selection: {
      selectAll: string;
      selected: string;
      selectedPlural: string;
      deselect: string;
    };
    empty: {
      noData: string;
      noResults: string;
      tryDifferent: string;
    };
    inactive: {
      separator: string;
    };
    pagination: {
      showing: string;
      of: string;
      items: string;
      previous: string;
      next: string;
    };
  };
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    view: string;
    create: string;
    add: string;
    close: string;
    confirm: string;
    loading: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    yes: string;
    no: string;
    ok: string;
    back: string;
    next: string;
    previous: string;
    actions: string;
    more: string;
    less: string;
    all: string;
    none: string;
    select: string;
    search: string;
    filter: string;
    sort: string;
    refresh: string;
    download: string;
    upload: string;
    print: string;
    copy: string;
    paste: string;
    cut: string;
    undo: string;
    redo: string;
  };
  validation: {
    required: string;
    email: string;
    minLength: string;
    maxLength: string;
    min: string;
    max: string;
    pattern: string;
    positive: string;
    integer: string;
  };
  dates: {
    today: string;
    yesterday: string;
    tomorrow: string;
    thisWeek: string;
    lastWeek: string;
    thisMonth: string;
    lastMonth: string;
    thisYear: string;
    lastYear: string;
  };
  currency: {
    symbol: string;
    code: string;
  };
}

export const es: TranslationKeys = {
  table: {
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
  },
  common: {
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    edit: "Editar",
    view: "Ver",
    create: "Crear",
    add: "Agregar",
    close: "Cerrar",
    confirm: "Confirmar",
    loading: "Cargando...",
    error: "Error",
    success: "Éxito",
    warning: "Advertencia",
    info: "Información",
    yes: "Sí",
    no: "No",
    ok: "Aceptar",
    back: "Volver",
    next: "Siguiente",
    previous: "Anterior",
    actions: "Acciones",
    more: "Más",
    less: "Menos",
    all: "Todos",
    none: "Ninguno",
    select: "Seleccionar",
    search: "Buscar",
    filter: "Filtrar",
    sort: "Ordenar",
    refresh: "Actualizar",
    download: "Descargar",
    upload: "Subir",
    print: "Imprimir",
    copy: "Copiar",
    paste: "Pegar",
    cut: "Cortar",
    undo: "Deshacer",
    redo: "Rehacer",
  },
  validation: {
    required: "Este campo es requerido",
    email: "Email inválido",
    minLength: "Mínimo {min} caracteres",
    maxLength: "Máximo {max} caracteres",
    min: "Mínimo {min}",
    max: "Máximo {max}",
    pattern: "Formato inválido",
    positive: "Debe ser un número positivo",
    integer: "Debe ser un número entero",
  },
  dates: {
    today: "Hoy",
    yesterday: "Ayer",
    tomorrow: "Mañana",
    thisWeek: "Esta semana",
    lastWeek: "Semana pasada",
    thisMonth: "Este mes",
    lastMonth: "Mes pasado",
    thisYear: "Este año",
    lastYear: "Año pasado",
  },
  currency: {
    symbol: "$",
    code: "USD",
  },
};
