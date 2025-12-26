import { supabase } from '@/lib/supabase';

export interface SiteLogAttendee {
  site_log_id: string;
  personnel_id: string;
  attendance_type: string;
  hours_worked: number;
  description: string;
  created_by: string;
  project_id: string;
  organization_id: string;
}

/**
 * Reemplaza los asistentes de una bitácora.
 * 
 * Primero elimina todos los asistentes existentes de la bitácora,
 * luego inserta los nuevos asistentes proporcionados.
 * 
 * @param siteLogId - ID de la bitácora
 * @param attendees - Array de asistentes a agregar
 * @throws {Error} Si falla alguna operación en Supabase
 */
export async function replaceSiteLogAttendees(
  siteLogId: string,
  attendees: SiteLogAttendee[]
) {
  if (!supabase) {
    throw new Error('Error de conexión con la base de datos');
  }

  // Eliminar asistentes existentes
  const { error: deleteError } = await supabase
    .from('personnel_attendees')
    .delete()
    .eq('site_log_id', siteLogId);

  if (deleteError) {
    console.error('Error deleting attendees:', deleteError);
    throw new Error('No se pudieron eliminar los asistentes existentes');
  }

  // Si no hay asistentes nuevos, terminar aquí
  if (!attendees || attendees.length === 0) {
    return;
  }

  // Insertar nuevos asistentes
  const { error: insertError } = await supabase
    .from('personnel_attendees')
    .insert(attendees);

  if (insertError) {
    console.error('Error inserting attendees:', insertError);
    throw new Error('No se pudieron agregar los nuevos asistentes');
  }
}
