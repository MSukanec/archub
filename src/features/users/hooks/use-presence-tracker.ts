import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { usePresenceStore } from '@/stores/presenceStore';
import { supabase } from '@/lib/supabase';

/**
 * Mapea rutas a identificadores de vistas
 * Solo identifica, NO traduce (la traducción está centralizada en view-name-translator.ts)
 */
function mapRouteToView(path: string): string {
  // Rutas específicas primero
  if (path === '/home') return 'home';
  if (path === '/') return 'landing';
  if (path === '/pricing-plan') return 'pricing';
  if (path === '/settings/pricing-plan') return 'pricing';
  if (path === '/profile') return 'profile';
  
  // Organization routes
  if (path.startsWith('/organization/dashboard')) return 'organization_dashboard';
  if (path.startsWith('/organization/projects')) return 'organization_projects';
  if (path.startsWith('/organization/preferences')) return 'organization_preferences';
  if (path.startsWith('/organization/activity')) return 'organization_activity';
  if (path.startsWith('/organization/members')) return 'organization_members';
  if (path.startsWith('/organization')) return 'organization';
  
  // Project routes
  if (path.startsWith('/project/dashboard')) return 'project_dashboard';
  if (path.startsWith('/project/details')) return 'project_details';
  if (path.startsWith('/project/gallery')) return 'project_gallery';
  if (path.startsWith('/project/documents')) return 'project_documents';
  if (path.startsWith('/project/tasks')) return 'project_tasks';
  if (path.startsWith('/project/team')) return 'project_team';
  if (path.startsWith('/project/moodboard')) return 'moodboard';
  if (path.startsWith('/project/sitelog')) return 'sitelog';
  if (path.startsWith('/project')) return 'project_data';
  
  // Financial & Budget routes
  if (path.startsWith('/budgets')) return 'budgets';
  if (path.startsWith('/construction')) return 'construction';
  if (path.startsWith('/contacts')) return 'contacts';
  if (path.startsWith('/organization/capital')) return 'capital';
  if (path.startsWith('/general-costs')) return 'general_costs';
  if (path.startsWith('/analysis')) return 'analysis';
  
  // Learning routes - Capture specific course view (viewing a single course)
  // Match /learning/courses/:id or /learning/course/:id
  const courseMatch = path.match(/^\/learning\/courses?\/([^/?]+)/);
  if (courseMatch) {
    const courseId = courseMatch[1];
    return `cursos_${courseId}`;
  }
  
  if (path.startsWith('/learning/dashboard')) return 'learning_dashboard';
  if (path.startsWith('/learning/courses')) return 'learning_courses';
  if (path.startsWith('/learning')) return 'learning';
  
  // Admin routes
  if (path.startsWith('/admin/dashboard')) return 'admin_dashboard';
  if (path.startsWith('/admin/administration')) return 'admin_administration';
  if (path.startsWith('/admin/support')) return 'admin_support';
  if (path.startsWith('/admin/payments')) return 'admin_payments';
  if (path.startsWith('/admin/courses')) return 'admin_courses';
  if (path.startsWith('/admin/costs')) return 'admin_costs';
  if (path.startsWith('/admin/tasks')) return 'admin_tasks';
  if (path.startsWith('/admin/general')) return 'admin_general';
  if (path.startsWith('/admin/layout')) return 'admin_layout';
  if (path.startsWith('/admin/ops')) return 'admin_ops';
  if (path.startsWith('/admin')) return 'admin';
  
  // Provider routes
  if (path.startsWith('/providers/products')) return 'provider_products';
  if (path.startsWith('/providers')) return 'providers';
  
  // Other common routes
  if (path.startsWith('/notifications')) return 'notifications';
  if (path.startsWith('/calendar')) return 'calendar';
  if (path.startsWith('/media')) return 'media';
  if (path.startsWith('/clients')) return 'clients';
  if (path.startsWith('/tasks')) return 'tasks';
  if (path.startsWith('/personnel')) return 'personnel';
  if (path.startsWith('/subcontracts')) return 'subcontracts';
  if (path.startsWith('/founders')) return 'founders';
  
  // Public routes (no tracking)
  if (path === '/login' || path === '/register' || path === '/forgot-password') {
    return 'auth';
  }
  
  // Onboarding
  if (path.startsWith('/onboarding') || path.startsWith('/select-mode')) {
    return 'onboarding';
  }
  
  // Default: usar el path directamente (sin barras)
  return path.replace(/\//g, '_').substring(1) || 'unknown';
}

/**
 * Hook para tracking automático de cambios de vista
 * Se ejecuta cada vez que el usuario navega a una nueva ruta
 * 
 * Incluye:
 * - Analítica de tiempo por vista (user_view_history)
 * - Presencia en tiempo real (user_presence)
 */
export function usePresenceTracker() {
  const [location] = useLocation();
  const { setCurrentView } = usePresenceStore();

  useEffect(() => {
    // No trackear rutas públicas de auth
    if (location === '/login' || location === '/register' || location === '/forgot-password' || location === '/') {
      return;
    }

    // Mapear ruta a nombre de vista
    const viewName = mapRouteToView(location);
    
    // FASE 1: Analytics - Cerrar vista anterior y abrir nueva (fire-and-forget)
    // No bloqueamos la navegación, las llamadas se ejecutan en background
    const trackViewChange = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return; // Solo trackear usuarios autenticados

        // Cerrar vista anterior (si existe) - no recibe parámetros
        const exitResult = await supabase.rpc('analytics_exit_previous_view');
        if (exitResult.error) {
          console.error('[Analytics] Exit error:', exitResult.error);
        }
        
        // Abrir nueva vista en analytics
        const enterResult = await supabase.rpc('analytics_enter_view', { p_view: viewName });
        if (enterResult.error) {
          console.error('[Analytics] Enter error:', enterResult.error);
        }
        
        // TAMBIÉN actualizar presencia en tiempo real
        const presenceResult = await supabase.rpc('presence_set_view', { p_view: viewName });
        if (presenceResult.error) {
          console.error('[Analytics] Presence error:', presenceResult.error);
        }
      } catch (error) {
        console.error('[Analytics] Unexpected error:', error);
      }
    };

    // Ejecutar tracking en background (no esperamos respuesta)
    trackViewChange();
    
    // FASE 2: Presencia - Actualizar estado en tiempo real (local)
    setCurrentView(viewName);
  }, [location, setCurrentView]);
}
