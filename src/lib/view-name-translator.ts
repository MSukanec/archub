/**
 * Traductor centralizado de nombres de vistas
 * Usado tanto en analytics como en la vista del admin
 * ÚNICO LUGAR donde se definen las traducciones
 */

const VIEW_MAP: Record<string, string> = {
  'home': 'Inicio',
  'landing': 'Página de Inicio',
  'profile': 'Mi Perfil',
  'auth': 'Autenticación',
  'onboarding': 'Onboarding',
  'pricing': 'Planes de Precios',
  
  // Organization
  'organization_dashboard': 'Dashboard de Organización',
  'organization_projects': 'Proyectos',
  'organization_preferences': 'Preferencias de Organización',
  'organization_activity': 'Actividad de Organización',
  'organization_members': 'Miembros de Organización',
  'organization': 'Organización',
  
  // Project
  'project_dashboard': 'Dashboard del Proyecto',
  'project_details': 'Detalles del Proyecto',
  'project_gallery': 'Galería del Proyecto',
  'project_documents': 'Documentos del Proyecto',
  'project_tasks': 'Tareas del Proyecto',
  'project_team': 'Equipo del Proyecto',
  'project_data': 'Datos del Proyecto',
  'moodboard': 'Moodboard',
  'sitelog': 'Registro del Sitio',
  
  // Financial & Budget
  'budgets': 'Presupuestos',
  'construction': 'Construcción',
  'contacts': 'Contactos',
  'capital': 'Capital',
  'general_costs': 'Gastos Generales',
  'analysis': 'Análisis',
  
  // Learning
  'learning_dashboard': 'Dashboard de Capacitaciones',
  'learning_courses': 'Cursos',
  'learning': 'Capacitaciones',
  
  // Admin
  'admin_dashboard': 'Admin - Analytics',
  'admin_administration': 'Admin - Administración',
  'admin_support': 'Admin - Soporte',
  'admin_payments': 'Admin - Pagos',
  'admin_courses': 'Admin - Cursos',
  'admin_costs': 'Admin - Costos',
  'admin_tasks': 'Admin - Tareas',
  'admin_general': 'Admin - General',
  'admin_layout': 'Admin - Layout',
  'admin_ops': 'Admin - Operations Center',
  'admin': 'Admin',
  
  // Other
  'providers': 'Proveedores',
  'provider_products': 'Productos de Proveedor',
  'notifications': 'Notificaciones',
  'calendar': 'Calendario',
  'media': 'Multimedia',
  'clients': 'Clientes',
  'tasks': 'Tareas',
  'personnel': 'Personal',
  'subcontracts': 'Subcontratos',
  'founders': 'Programa Fundadores',
};

/**
 * Traduce un nombre de vista a su forma legible
 * Maneja casos especiales como cursos
 */
export function formatViewName(view: string | null): string {
  if (!view) return 'Sin ubicación';
  
  // Búsqueda en el mapa estático
  if (VIEW_MAP[view]) return VIEW_MAP[view];
  
  // Patrones dinámicos: cursos
  const coursePatterns = [
    /^courses_(.+)$/,
    /^cursos_(.+)$/,
    /^learning_course_(.+)$/,
    /^course_(.+)$/
  ];
  
  for (const pattern of coursePatterns) {
    const match = view.match(pattern);
    if (match) {
      const slug = match[1];
      const courseName = slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      return `Curso - ${courseName}`;
    }
  }
  
  // Default: capitalizar y reemplazar underscores
  return view.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
