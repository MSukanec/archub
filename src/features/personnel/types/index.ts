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
  status: 'present'| 'absent'| 'half_day';
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
// ============ PERSONNEL PAYMENT TYPES ============
export interface PersonnelPayment {
  id: string;
  project_id: string;
  organization_id: string;
  personnel_id: string | null;
  amount: number;
  currency_id: string;
  exchange_rate: number | null;
  payment_date: string;
  notes: string | null;
  reference: string | null;
  wallet_id: string | null;
  status: 'confirmed'| 'pending'| 'rejected'| 'void';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
export interface PersonnelPaymentWithRelations extends PersonnelPayment {
  payment_month?: string;
  amount_in_base?: number;
  org_wallet_id?: string;
  is_deleted?: boolean;
  deleted_at?: string | null;
  currency: {
    id: string;
    code: string;
    symbol: string;
  } | null;
  wallet: {
    id: string;
    name: string;
    wallets?: {
      id: string;
      name: string;
    } | null;
  } | null;
  project: {
    id: string;
    name: string;
    color?: string;
  } | null;
  personnel: {
    id: string;
    status?: string;
    labor_type_id?: string;
    labor_type_name?: string;
    contact: {
      id: string;
      first_name: string;
      last_name: string;
      full_name: string;
      national_id?: string;
    } | null;
  } | null;
  creator?: {
    id: string;
    user: {
      id: string;
      full_name: string;
      avatar_url?: string;
    } | null;
  } | null;
}
