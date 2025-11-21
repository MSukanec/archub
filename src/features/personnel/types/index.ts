// Additional feature-specific types
export interface ProjectPersonnel {
  id: string;
  project_id: string;
  contact_id: string;
  notes?: string;
  start_date?: string | null;
  end_date?: string | null;
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
    full_name?: string;
    organization_id: string;
  };
}

export interface PersonnelWithContact extends ProjectPersonnel {
  contact: {
    id: string;
    first_name: string;
    last_name: string;
    full_name?: string;
    organization_id: string;
  };
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
