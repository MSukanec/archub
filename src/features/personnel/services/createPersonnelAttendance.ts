import { supabase } from '@/lib/supabase';

// TODO: Migrate to Express API endpoint once backend attendance endpoints are created
export interface CreatePersonnelAttendanceData {
  personnel_id: string;
  attendance_type: string; // 'full', 'half', 'absent', 'sick'
  hours_worked: number;
  description?: string;
  created_by: string;
  project_id: string;
  organization_id: string;
  work_date: string; // ISO date string YYYY-MM-DD
}

// Map modal attendance types to database values
// DB constraint: attendance_type can only be 'full' or 'half'
// DB constraint: status can be 'present', 'absent', 'leave', 'holiday'
function mapAttendanceType(type: string): { attendance_type: string; status: string } {
  switch (type) {
    case 'full':
      return { attendance_type: 'full', status: 'present' }
    case 'half':
      return { attendance_type: 'half', status: 'present' }
    case 'absent':
      return { attendance_type: 'full', status: 'absent' }
    case 'sick':
      return { attendance_type: 'full', status: 'leave' }
    default:
      return { attendance_type: 'full', status: 'present' }
  }
}

export async function createPersonnelAttendance(data: CreatePersonnelAttendanceData): Promise<any> {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }

  const { attendance_type, status } = mapAttendanceType(data.attendance_type)

  const { error } = await supabase
    .from('personnel_attendees')
    .insert({
      site_log_id: null,
      personnel_id: data.personnel_id,
      attendance_type,
      status,
      hours_worked: data.hours_worked,
      description: data.description,
      created_by: data.created_by,
      project_id: data.project_id,
      organization_id: data.organization_id,
      work_date: data.work_date,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error creating personnel attendance:', JSON.stringify(error, null, 2));
    console.error('Insert data was:', {
      personnel_id: data.personnel_id,
      attendance_type,
      status,
      hours_worked: data.hours_worked,
      work_date: data.work_date,
      project_id: data.project_id,
      organization_id: data.organization_id
    });
    throw new Error(`Failed to create attendance: ${error.message || error.code || 'Unknown error'}`);
  }

  return { success: true };
}
