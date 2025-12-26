import { supabase } from '@/lib/supabase';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';
import type { SiteLogActivity, ActivityTimePeriod } from '../types';
/**
 * Obtiene actividad de usuarios en bitácoras por día.
 * 
 * Cuenta cuántas bitácoras creó cada miembro en el período especificado.
 * 
 * @param organizationId - ID de la organización
 * @param projectId - ID del proyecto
 * @param timePeriod - Período de análisis: 'week'(7 días), 'month'(30 días), 'year'(365 días)
 * @param membersData - Lista de miembros de la organización para cruzar con actividad
 * @returns Array con actividad por día, cada día tiene usuarios activos y total
 */
export async function getActivityData(
  organizationId: string,
  projectId: string,
  timePeriod: ActivityTimePeriod = 'week',
  membersData: any[]
): Promise<SiteLogActivity[]> {
  if (!supabase || !organizationId || !projectId || !membersData) {
    return [];
  }
  try {
    let daysBack: number;
    switch (timePeriod) {
      case 'week':
        daysBack = 7;
        break;
      case 'month':
        daysBack = 30;
        break;
      case 'year':
        daysBack = 365;
        break;
      default:
        daysBack = 7;
    }
    const { data: siteLogs, error } = await supabase
      .from('site_logs')
      .select(`
        id,
        created_by,
        created_at,
        project_id,
        creator:users!created_by(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('project_id', projectId)
      .gte('created_at', subDays(new Date(), daysBack).toISOString())
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching site log activity:', error);
      throw error;
    }
    const allSiteLogs = siteLogs || [];
    const memberMap = new Map();
    membersData.forEach((member: any) => {
      memberMap.set(member.user_id, {
        id: member.user_id,
        full_name: member.users?.full_name,
        avatar_url: member.users?.avatar_url
      });
    });
    const activityData: SiteLogActivity[] = [];
    
    for (let i = 0; i < daysBack; i++) {
      const currentDate = subDays(new Date(), daysBack - 1 - i);
      const dayStart = startOfDay(currentDate);
      const dayEnd = endOfDay(currentDate);
      const formattedDate = format(currentDate, 'dd/MM');
      const usersActivity: Record<string, any> = {};
      memberMap.forEach((userData, userId) => {
        usersActivity[userId] = {
          user_id: userId,
          full_name: userData.full_name || 'Usuario',
          avatar_url: userData.avatar_url,
          activity_count: 0
        };
      });
      allSiteLogs.filter(s => s.created_at >= dayStart.toISOString() && s.created_at <= dayEnd.toISOString())
        .forEach(siteLog => {
          if (siteLog.created_by && usersActivity[siteLog.created_by]) {
            usersActivity[siteLog.created_by].activity_count += 1;
          }
        });
      const activeUsers = Object.values(usersActivity).filter(user => user.activity_count > 0);
      const total = activeUsers.reduce((sum, user) => sum + user.activity_count, 0);
      activityData.push({
        date: formattedDate,
        users: activeUsers,
        total
      });
    }
    return activityData;
  } catch (error) {
    console.error('Error fetching site log activity:', error);
    return [];
  }
}
