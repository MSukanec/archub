import { supabase } from '@/lib/supabase';
/**
 * Obtiene el tiempo de estudio del mes actual del usuario.
 * 
 * Llama al endpoint HTTP GET /api/user/study-time que calcula
 * el tiempo de estudio del usuario en el mes en curso.
 * 
 * El endpoint maneja la autenticación vía Bearer token,
 * por lo que no requiere parámetros adicionales.
 * 
 * Útil para:
 * - Mostrar estadísticas mensuales de estudio
 * - Dashboards de progreso temporal
 * - Reportes de actividad del usuario
 * 
 * @returns Objeto con { seconds_this_month: number }
 */
export async function getMonthlyStudyTime(): Promise<{ seconds_this_month: number }> {
  if (!supabase) {
    return { seconds_this_month: 0 };
  }
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { seconds_this_month: 0 };
    }
    const response = await fetch('/api/user/study-time', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    if (!response.ok) {
      return { seconds_this_month: 0 };
    }
    const data = await response.json();
    return { seconds_this_month: data?.seconds_this_month || 0 };
  } catch (error) {
    console.error('Error in getMonthlyStudyTime:', error);
    return { seconds_this_month: 0 };
  }
}
