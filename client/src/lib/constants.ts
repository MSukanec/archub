// Definiciones de constantes para la aplicación

// Nombre de la aplicación
export const APP_NAME = "ArchHub";
export const APP_SUBTITLE = "Gestión de Presupuestos";

// Categorías de materiales (se utilizan como fallback si el API no está disponible)
export const MATERIAL_CATEGORIES = [
  { value: "Materiales Básicos", label: "Materiales Básicos" },
  { value: "Instalaciones Eléctricas", label: "Instalaciones Eléctricas" },
  { value: "Instalaciones Sanitarias", label: "Instalaciones Sanitarias" },
  { value: "Acabados", label: "Acabados" },
  { value: "Otros", label: "Otros" }
];

// Categorías de tareas
export const TASK_CATEGORIES = [
  { value: "Estructuras", label: "Estructuras" },
  { value: "Instalaciones", label: "Instalaciones" },
  { value: "Acabados", label: "Acabados" },
  { value: "Limpieza", label: "Limpieza" },
  { value: "Otros", label: "Otros" }
];

// Estados de proyecto
export const PROJECT_STATUS = [
  { value: "planning", label: "Planificación" },
  { value: "in_progress", label: "En Progreso" },
  { value: "completed", label: "Completado" },
  { value: "cancelled", label: "Cancelado" }
];

// Alias para PROJECT_STATUS (para compatibilidad)
export const PROJECT_STATUS_OPTIONS = PROJECT_STATUS;

// Unidades de medida comunes
export const COMMON_UNITS = [
  { name: "m", description: "Metros (m)" },
  { name: "m2", description: "Metros Cuadrados (m²)" },
  { name: "m3", description: "Metros Cúbicos (m³)" },
  { name: "kg", description: "Kilogramos (kg)" },
  { name: "lt", description: "Litros (lt)" },
  { name: "pza", description: "Piezas" },
  { name: "bolsa", description: "Bolsa" },
  { name: "saco", description: "Saco" },
  { name: "global", description: "Global" },
  { name: "punto", description: "Punto" }
];

// Colores principales
export const THEME_COLORS = {
  primary: "#92c900",
  secondary: "#3a3a3a",
  background: "#f5f5f5",
  cardBackground: "#ffffff",
  headerBackground: "#ffffff",
  sidebarBackground: "#ffffff",
  textPrimary: "#1a1a1a",
  textSecondary: "#707070", // Cambiado a #707070 según solicitud
  danger: "#dc3545",
  success: "#28a745",
  warning: "#ffc107",
  info: "#17a2b8"
};

// Pestañas del dashboard
export const DASHBOARD_TABS = [
  { id: "overview", label: "General" },
  { id: "projects", label: "Proyectos" },
  { id: "materials", label: "Materiales" },
  { id: "budgets", label: "Presupuestos" }
];

// Exportar COMMON_UNITS también como UNITS para mantener compatibilidad
export const UNITS = COMMON_UNITS;