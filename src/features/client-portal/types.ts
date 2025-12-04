export type ClientPortalTab = 'dashboard' | 'payments' | 'logs';

export interface ClientPortalProject {
  id: string;
  name: string;
  status: string;
  image_url?: string;
  city?: string;
  country?: string;
  start_date?: string;
  estimated_end?: string;
  project_type_name?: string;
  project_modality_name?: string;
}

export interface ClientPortalPayment {
  id: string;
  amount: number;
  currency_code: string;
  payment_date: string;
  status: string;
  reference?: string;
  notes?: string;
}

export interface ClientPortalSchedule {
  id: string;
  amount: number;
  currency_code: string;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
}

export interface ClientPortalSiteLog {
  id: string;
  log_date: string;
  comments?: string;
  weather?: string;
  entry_type_name?: string;
  ai_summary?: string;
  images?: string[];
}

export interface ClientPortalStats {
  total_commitment: number;
  total_paid: number;
  total_pending: number;
  next_due_date?: string;
  next_due_amount?: number;
  currency_code: string;
}
