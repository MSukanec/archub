import { supabase } from '@/lib/supabase';
import { subDays, startOfDay, format } from 'date-fns';
import type { ActivityData } from '../types';
/**
 * Obtiene datos de actividad de una organización para los últimos 7 días.
 * 
 * Calcula actividad diaria contando:
 * - Movimientos financieros creados
 * - Tareas creadas
 * - Contactos creados
 * - Documentos subidos
 * 
 * @param organizationId - ID de la organización
 * @returns Array de datos de actividad con fecha y total, o array vacío si falla
 */
export async function getOrganizationActivity(
  organizationId: string
): Promise<ActivityData[]> {
  if (!supabase || !organizationId) return [];
  try {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return startOfDay(date);
    });
    const activityData: ActivityData[] = [];
    for (const date of last7Days) {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      const { count: movimientosCount } = await supabase
        .from('movements')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('movement_date', date.toISOString())
        .lt('movement_date', nextDay.toISOString());
      const { count: tareasCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDay.toISOString());
      const { count: contactosCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDay.toISOString());
      const { count: documentosCount } = await supabase
        .from('design_documents')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDay.toISOString());
      const movimientos = movimientosCount || 0;
      const tareas = tareasCount || 0;
      const contactos = contactosCount || 0;
      const documentos = documentosCount || 0;
      const total = movimientos + tareas + contactos + documentos;
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const dayName = dayNames[date.getDay()];
      const formattedDate = format(date, 'dd/MM');
      
      activityData.push({
        date: `${dayName} ${formattedDate}`,
        total
      });
    }
    return activityData;
  } catch (error) {
    console.error('Error fetching organization activity:', error);
    return [];
  }
}
