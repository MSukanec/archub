import { supabase } from '@/lib/supabase';

// TODO: Migrate to Express API endpoint once backend attendance endpoints are created
export interface CreatePersonnelAttendanceData {
  personnel_id: string;
  attendance_type: string;
  hours_worked: number;
  description?: string;
  created_by: string;
  project_id: string;
  organization_id: string;
  created_at: string;
}

export async function createPersonnelAttendance(data: CreatePersonnelAttendanceData): Promise<any> {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }

  const { error } = await supabase
    .from('personnel_attendees')
    .insert({
      site_log_id: null,
      personnel_id: data.personnel_id,
      attendance_type: data.attendance_type,
      hours_worked: data.hours_worked,
      description: data.description,
      created_by: data.created_by,
      project_id: data.project_id,
      organization_id: data.organization_id,
      created_at: data.created_at,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error creating personnel attendance:', error);
    throw error;
  }

  return { success: true };
}
