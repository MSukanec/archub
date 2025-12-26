import { supabase } from '@/lib/supabase';
import type { LearningDashboardFast } from '../types';

/**
 * Obtiene una versión optimizada del dashboard de aprendizaje.
 * 
 * Versión más rápida que incluye:
 * - Enrollments con información básica del curso
 * - Actividad reciente
 * 
 * Útil para cargas iniciales rápidas y actualizaciones frecuentes.
 * 
 * @returns Dashboard optimizado de aprendizaje
 * @throws {Error} Si falla la autenticación o la petición HTTP
 */
export async function getLearningDashboardFast(): Promise<LearningDashboardFast> {
  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  
  if (!session) {
    throw new Error('No active session');
  }

  const response = await fetch('/api/learning/dashboard-fast', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch learning dashboard' }));
    throw new Error(error.error || 'Failed to fetch learning dashboard');
  }

  return await response.json();
}
