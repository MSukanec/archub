// Import types from shared schema to use in extensions
import type { Contact } from '../../../../shared/schema';

// Re-export types from shared schema if needed
export type { Contact } from '../../../../shared/schema';

// Additional feature-specific types
export interface ProjectPersonnel {
  id: string;
  project_id: string;
  contact_id: string;
  notes?: string;
  start_date?: string | null;
  end_date?: string | null;
  contact?: Contact;
}

export interface PersonnelWithContact extends ProjectPersonnel {
  contact: Contact;
}

export interface PersonnelAttendance {
  id: string;
  personnel_id: string;
  date: string;
  status: 'present' | 'absent' | 'half_day';
  notes?: string;
}

export interface PersonnelRates {
  id: string;
  personnel_id: string;
  organization_id: string;
  hourly_rate?: number;
  daily_rate?: number;
  currency_id?: string;
}

export interface PersonnelInsurance {
  id: string;
  personnel_id: string;
  organization_id: string;
  insurance_type: string;
  policy_number?: string;
  expiry_date?: string;
  provider?: string;
}
