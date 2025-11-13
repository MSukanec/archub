import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { usePresenceStore } from '@/stores/presenceStore';
import { supabase } from '@/lib/supabase';

/**
 * Mapea rutas a nombres de vistas legibles
 * Simplifica rutas complejas a nombres entendibles
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
  if (path.startsWith('/organization')) return 'organization';
  
  // Project routes
  if (path.startsWith('/project/dashboard')) return 'project_dashboard';
  if (path.startsWith('/project')) return 'project_data';
  if (path.startsWith('/budgets')) return 'budgets';
  if (path.startsWith('/construction')) return 'construction';
  
  // Contacts & Finances
  if (path.startsWith('/contacts')) return 'contacts';
  if (path.startsWith('/movements')) return 'movements';
  if (path.startsWith('/finances/capital')) return 'capital';
  if (path.startsWith('/finances/general-costs')) return 'general_costs';
  if (path.startsWith('/analysis')) return 'analysis';
  
  // Learning
  if (path.startsWith('/learning/dashboard')) return 'learning_dashboard';
  if (path.startsWith('/learning/courses')) return 'learning_courses';
  if (path.startsWith('/learning')) return 'learning';
  
  // Admin
  if (path.startsWith('/admin/dashboard')) return 'admin_dashboard';
  if (path.startsWith('/admin/administration')) return 'admin_administration';
  if (path.startsWith('/admin/support')) return 'admin_support';
  if (path.startsWith('/admin/payments')) return 'admin_payments';
  if (path.startsWith('/admin/courses')) return 'admin_courses';
  if (path.startsWith('/admin/costs')) return 'admin_costs';
  if (path.startsWith('/admin/tasks')) return 'admin_tasks';
  if (path.startsWith('/admin/general')) return 'admin_general';
  if (path.startsWith('/admin/layout')) return 'admin_layout';
  if (path.startsWith('/admin')) return 'admin';
  
  // Providers
  if (path.startsWith('/providers/products')) return 'provider_products';
  
  // Notifications
  if (path.startsWith('/notifications')) return 'notifications';
  
  // Calendar
  if (path.startsWith('/calendar')) return 'calendar';
  
  // Media
  if (path.startsWith('/media')) return 'media';
  
  // Clients
  if (path.startsWith('/clients')) return 'clients';
  
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

        // Cerrar vista anterior (si existe)
        await supabase.rpc('analytics_exit_previous_view');
        
        // Abrir nueva vista
        await supabase.rpc('analytics_enter_view', { p_view: viewName });
      } catch (error) {
        // Silenciar errores de analytics (no afectan la UX)
      }
    };

    // Ejecutar tracking en background (no esperamos respuesta)
    trackViewChange();
    
    // FASE 2: Presencia - Actualizar estado en tiempo real
    setCurrentView(viewName);
  }, [location, setCurrentView]);
}
