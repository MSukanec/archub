import { supabase } from '@/lib/supabase';

/**
 * Obtiene todas las bitácoras de un proyecto con sus relaciones completas.
 * 
 * Incluye:
 * - Eventos (site_log_events)
 * - Asistentes de personal (personnel_attendees)
 * - Equipamiento (site_log_equipment)
 * - Archivos multimedia (project_media)
 * 
 * @param projectId - ID del proyecto
 * @param organizationId - ID de la organización
 * @returns Array de site logs con todas las relaciones, o array vacío si no hay datos
 * @throws {Error} Si falla la query principal de Supabase
 */
export async function getSiteLogs(projectId: string, organizationId: string) {
  if (!supabase || !projectId || !organizationId) {
    return [];
  }

  const { data: logsData, error } = await supabase
    .from('site_logs')
    .select(`
      *,
      creator:organization_members(
        id,
        user:users(
          id,
          full_name,
          avatar_url
        )
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  if (!logsData || logsData.length === 0) {
    return [];
  }

  const logIds = logsData?.map(log => log.id) || [];

  if (logIds.length === 0) {
    return [];
  }

  const { data: eventsData, error: eventsError } = await supabase
    .from('site_log_events')
    .select(`
      *,
      event_type:event_types(
        id,
        name
      )
    `)
    .in('site_log_id', logIds);

  if (eventsError) {
    console.error('Error fetching site log events:', eventsError);
  }

  const { data: attendeesData, error: attendeesError } = await supabase
    .from('personnel_attendees')
    .select(`
      *,
      personnel:project_personnel(
        id,
        notes,
        contact:contacts(
          id,
          first_name,
          last_name
        )
      )
    `)
    .in('site_log_id', logIds);

  if (attendeesError) {
    console.error('Error fetching attendees:', attendeesError);
  }

  const { data: equipmentData, error: equipmentError } = await supabase
    .from('site_log_equipment')
    .select(`
      *,
      equipment:equipment(
        id,
        name
      )
    `)
    .in('site_log_id', logIds);

  if (equipmentError) {
    console.error('Error fetching equipment:', equipmentError);
  }

  const { data: filesData, error: filesError } = await supabase
    .from('project_media')
    .select('*')
    .in('site_log_id', logIds);

  if (filesError) {
    console.error('Error fetching files:', filesError);
  }

  const data = logsData.map(log => ({
    ...log,
    creator: log.creator?.user ? {
      id: log.creator.user.id,
      full_name: log.creator.user.full_name,
      avatar_url: log.creator.user.avatar_url
    } : null,
    events: eventsData?.filter(event => event.site_log_id === log.id) || [],
    attendees: attendeesData?.filter(attendee => attendee.site_log_id === log.id) || [],
    equipment: equipmentData?.filter(equip => equip.site_log_id === log.id) || [],
    files: filesData?.filter(file => file.site_log_id === log.id) || []
  }));

  return data || [];
}
