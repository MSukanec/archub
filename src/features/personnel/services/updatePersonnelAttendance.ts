import { supabase } from '@/lib/supabase';

// TODO: Migrate to Express API endpoint once backend attendance endpoints are created
export interface UpdatePersonnelAttendanceData {
  personnel_id: string;
  attendance_type: string;
  hours_worked: number;
  description?: string;
}

export interface UpdateAttendanceParams {
  workerContactId: string;
  attendanceDate: string;
  data: UpdatePersonnelAttendanceData;
}

export async function updatePersonnelAttendance(params: UpdateAttendanceParams): Promise<any> {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }

  // First, find the personnel_attendees record by date and personnel
  const { data: personnelRecord } = await supabase
    .from('project_personnel')
    .select('id')
    .eq('contact_id', params.workerContactId)
    .maybeSingle();

  if (!personnelRecord) {
    throw new Error('Personnel record not found');
  }

  const { error } = await supabase
    .from('personnel_attendees')
    .update({
      personnel_id: params.data.personnel_id,
      attendance_type: params.data.attendance_type,
      hours_worked: params.data.hours_worked,
      description: params.data.description,
      updated_at: new Date().toISOString()
    })
    .eq('personnel_id', personnelRecord.id)
    .gte('created_at', `${params.attendanceDate}T00:00:00`)
    .lte('created_at', `${params.attendanceDate}T23:59:59`);

  if (error) {
    console.error('Error updating personnel attendance:', error);
    throw error;
  }

  return { success: true };
}
