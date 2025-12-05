export type ClientPortalTab = 'dashboard' | 'installments' | 'payments' | 'logs';

export interface ClientPortalProject {
  id: string;
  name: string;
  code: string | null;
  status: string;
  color: string | null;
  start_date: string | null;
  estimated_end: string | null;
  address: string | null;
  city: string | null;
  image_url: string | null;
}

export interface ClientPortalClient {
  id: string;
  project_client_id: string;
  contact_id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  unit: string | null;
  is_primary: boolean;
  role_name: string | null;
}

export interface ClientPortalCommitment {
  id: string;
  amount: number;
  currency_code: string;
  currency_symbol: string;
  commitment_method: string;
  unit_name: string | null;
}

export interface ClientPortalScheduleItem {
  id: string;
  due_date: string;
  amount: number;
  currency_code: string;
  currency_symbol: string;
  status: string;
  paid_at: string | null;
}

export interface ClientPortalPayment {
  id: string;
  amount: number;
  currency_code: string;
  currency_symbol: string;
  payment_date: string;
  reference: string | null;
  status: string;
  commitment_name: string | null;
  commitment_amount: number | null;
  commitment_currency_code: string | null;
  commitment_currency_symbol: string | null;
  commitment_percentage: number | null;
  cumulative_percentage: number | null;
  wallet_name: string | null;
  exchange_rate: number | null;
  receipt_url: string | null;
  receipt_name: string | null;
}

export interface ClientPortalSiteLogFile {
  id: string;
  file_url: string;
  file_name: string | null;
  file_type: string;
}

export interface ClientPortalSiteLogCreator {
  full_name: string | null;
  avatar_url: string | null;
}

export interface ClientPortalSiteLog {
  id: string;
  log_date: string;
  created_at: string | null;
  comments: string | null;
  weather: string | null;
  type_name: string | null;
  files: ClientPortalSiteLogFile[];
  creator: ClientPortalSiteLogCreator | null;
}

export interface ClientPortalStats {
  total_commitment: number;
  total_paid: number;
  total_pending: number;
  currency_code: string;
  currency_symbol: string;
  next_installment_date: string | null;
  next_installment_amount: number | null;
  project_progress: number;
}

export interface ClientPortalSettings {
  show_dashboard: boolean;
  show_installments: boolean;
  show_payments: boolean;
  show_logs: boolean;
  show_amounts: boolean;
  show_progress: boolean;
  allow_comments: boolean;
}

export interface ClientPortalData {
  project: ClientPortalProject;
  client: ClientPortalClient | null;
  clients: ClientPortalClient[];
  stats: ClientPortalStats;
  commitment: ClientPortalCommitment | null;
  schedule: ClientPortalScheduleItem[];
  payments: ClientPortalPayment[];
  site_logs: ClientPortalSiteLog[];
  is_admin_preview: boolean;
  settings: ClientPortalSettings;
}
