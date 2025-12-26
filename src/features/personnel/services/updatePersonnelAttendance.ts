import { supabase } from '@/lib/supabase';
// TODO: Migrate to Express API endpoint once backend attendance endpoints are created
export interface UpdatePersonnelAttendanceData {
  personnel_id: string;
  attendance_type: string; // 'full', 'half', 'absent', 'sick'
  hours_worked: number;
  description?: string;
}
export interface UpdateAttendanceParams {
  workerContactId: string;
  attendanceDate: string; // YYYY-MM-DD format
  data: UpdatePersonnelAttendanceData;
}
// Map modal attendance types to database values
// DB constraint: attendance_type can only be 'full'or 'half'
// DB constraint: status can be 'present', 'absent', 'leave', 'holiday'
function mapAttendanceType(type: string): { attendance_type: string; status: string } {
  switch (type) {
    case 'full':
      return { attendance_type: 'full', status: 'present'}
    case 'half':
      return { attendance_type: 'half', status: 'present'}
    case 'absent':
      return { attendance_type: 'full', status: 'absent'}
    case 'sick':
      return { attendance_type: 'full', status: 'leave'}
    default:
      return { attendance_type: 'full', status: 'present'}
  }
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
  const { attendance_type, status } = mapAttendanceType(params.data.attendance_type)
  const { error } = await supabase
    .from('personnel_attendees')
    .update({
      personnel_id: params.data.personnel_id,
      attendance_type,
      status,
      hours_worked: params.data.hours_worked,
      description: params.data.description,
      updated_at: new Date().toISOString()
    })
    .eq('personnel_id', personnelRecord.id)
    .eq('work_date', params.attendanceDate);
  if (error) {
    console.error('Error updating personnel attendance:', error);
    throw error;
  }
  return { success: true };
}
