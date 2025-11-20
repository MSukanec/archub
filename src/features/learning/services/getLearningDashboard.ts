import { supabase } from '@/lib/supabase';
import type { LearningDashboard } from '../types';

/**
 * Obtiene el dashboard de aprendizaje del usuario.
 * 
 * Incluye:
 * - Cursos en los que está inscrito
 * - Completaciones recientes
 * - Lecciones favoritas
 * - Progreso general
 * 
 * @returns Dashboard de aprendizaje del usuario
 * @throws {Error} Si falla la autenticación o la petición HTTP
 */
export async function getLearningDashboard(): Promise<LearningDashboard> {
  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  
  if (!session) {
    throw new Error('No active session');
  }

  const response = await fetch('/api/learning/dashboard', {
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
