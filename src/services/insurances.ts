import { supabase } from '@/lib/supabase'

export type Insurance = {
  id: string;
  organization_id: string;
  project_id?: string | null;
  personnel_id: string;  
  insurance_type: 'ART' | 'vida' | 'accidentes' | 'responsabilidad_civil' | 'salud' | 'otro';
  policy_number?: string | null;
  provider?: string | null;
  coverage_start: string; // ISO date
  coverage_end: string;   // ISO date
  reminder_days?: number[]; // default [30,15,7]
  certificate_attachment_id?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type InsuranceStatusRow = Insurance & {
  days_to_expiry: number;
  status: 'vigente' | 'por_vencer' | 'vencido';
  contact_id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  avatar_attachment_id?: string | null;
}

export type InsuranceFilters = {
  status?: ('vigente' | 'por_vencer' | 'vencido')[];
  type?: string[];
  provider?: string;
  contact_id?: string[];
  expires_before?: string;
  project_id?: string;
  text_search?: string;
}

export const listInsurances = async (filters: InsuranceFilters = {}) => {
  let query = supabase
    .from('personnel_insurance_view')
    .select('*')

  if (filters.status?.length) {
    query = query.in('status', filters.status)
  }

  if (filters.type?.length) {
    query = query.in('insurance_type', filters.type)
  }

  if (filters.provider) {
    query = query.ilike('provider', `%${filters.provider}%`)
  }

  if (filters.contact_id?.length) {
    query = query.in('contact_id', filters.contact_id)
  }

  if (filters.expires_before) {
    query = query.lte('coverage_end', filters.expires_before)
  }

  if (filters.project_id) {
    query = query.eq('project_id', filters.project_id)
  }

  if (filters.text_search) {
    // Search across contact name, provider, and policy number
    query = query.or(`full_name.ilike.%${filters.text_search}%,provider.ilike.%${filters.text_search}%,policy_number.ilike.%${filters.text_search}%`)
  }

  query = query.order('coverage_end', { ascending: true })

  const { data, error } = await query

  if (error) throw error
  return data as InsuranceStatusRow[]
}

export const getInsurance = async (id: string) => {
  const { data, error } = await supabase
    .from('personnel_insurances')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Insurance
}

export const createInsurance = async (payload: Omit<Insurance, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('personnel_insurances')
    .insert({
      ...payload,
      reminder_days: payload.reminder_days || [30, 15, 7]
      // No sobrescribir created_by - usar el que viene del payload
    })
    .select()
    .single()

  if (error) throw error
  return data as Insurance
}

export const updateInsurance = async (id: string, payload: Partial<Insurance>) => {
  const { data, error } = await supabase
    .from('personnel_insurances')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Insurance
}

export const deleteInsurance = async (id: string) => {
  const { error } = await supabase
    .from('personnel_insurances')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export const renewInsurance = async (
  prevId: string, 
  payload: {
    coverage_start: string;
    coverage_end: string;
    policy_number?: string;
    provider?: string;
    certificate_attachment_id?: string | null;
    notes?: string;
  }
) => {
  // Get the previous insurance data
  const previous = await getInsurance(prevId)
  
  // Create new insurance with updated data
  const newInsurance = await createInsurance({
    organization_id: previous.organization_id,
    project_id: previous.project_id,
    personnel_id: previous.personnel_id,
    insurance_type: previous.insurance_type,
    policy_number: payload.policy_number || previous.policy_number,
    provider: payload.provider || previous.provider,
    coverage_start: payload.coverage_start,
    coverage_end: payload.coverage_end,
    reminder_days: previous.reminder_days,
    certificate_attachment_id: payload.certificate_attachment_id,
    notes: payload.notes || previous.notes
  })

  return newInsurance
}

export const uploadCertificate = async (contactId: string, file: File) => {
  // Upload file to contact-files bucket
  const fileName = `${Date.now()}-${file.name}`
  const filePath = `${contactId}/insurance_certificates/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('contact-files')
    .upload(filePath, file)

  if (uploadError) throw uploadError

  // Create attachment record
  const { data: attachment, error: attachmentError } = await supabase
    .from('contact_attachments')
    .insert({
      contact_id: contactId,
      storage_bucket: 'contact-files',
      storage_path: filePath,
      file_name: file.name,
      size_bytes: file.size,
      mime_type: file.type,
      category: 'document'
    })
    .select()
    .single()

  if (attachmentError) throw attachmentError

  return attachment.id
}

export const getCertificatePublicUrl = async (attachmentId: string) => {
  const { data: attachment, error } = await supabase
    .from('contact_attachments')
    .select('storage_path')
    .eq('id', attachmentId)
    .single()

  if (error) throw error

  const { data } = supabase.storage
    .from('contact-files')
    .getPublicUrl(attachment.storage_path)

  return data.publicUrl
}