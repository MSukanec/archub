import { supabase } from '@/lib/supabase';
import type { ProjectPersonnel } from '../types';
export async function getProjectPersonnel(
  projectId: string,
  organizationId: string
): Promise<ProjectPersonnel[]> {
  if (!supabase || !projectId) {
    return [];
  }
  const { data, error } = await supabase
    .from('project_personnel_view')
    .select(`
      id,
      project_id,
      contact_id,
      notes,
      start_date,
      end_date,
      status,
      labor_type_id,
      created_at,
      contact_first_name,
      contact_last_name,
      contact_display_name,
      labor_type_name,
      project_name,
      total_payments_count,
      total_paid_base,
      total_attendance_days,
      art_insurance_status
    `)
    .eq('project_id', projectId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Error fetching project personnel:', error);
    throw error;
  }
  return (data || []).map((row: any) => ({
    id: row.id,
    project_id: row.project_id,
    contact_id: row.contact_id,
    notes: row.notes,
    start_date: row.start_date,
    end_date: row.end_date,
    status: row.status,
    labor_type_id: row.labor_type_id,
    created_at: row.created_at,
    contact: row.contact_id ? {
      id: row.contact_id,
      first_name: row.contact_first_name,
      last_name: row.contact_last_name,
      full_name: row.contact_display_name,
      organization_id: organizationId
    } : null,
    labor_type: row.labor_type_id ? {
      id: row.labor_type_id,
      name: row.labor_type_name
    } : null,
    total_payments_count: row.total_payments_count,
    total_paid_base: row.total_paid_base,
    total_attendance_days: row.total_attendance_days,
    art_insurance_status: row.art_insurance_status
  })) as ProjectPersonnel[];
}
