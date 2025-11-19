/**
 * Types for the Clients feature
 * Based on database tables: project_clients, client_commitments, client_payments,
 * client_payment_schedule, client_roles, contacts
 */

// ========== Contact Types ==========

export interface Contact {
  id: string;
  organization_id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  location: string | null;
  notes: string | null;
  national_id: string | null;
  avatar_attachment_id: string | null;
  avatar_updated_at: string | null;
  is_local: boolean;
  display_name_override: string | null;
  linked_user_id: string | null;
  linked_at: string | null;
  sync_status: string | null;
  created_at: string;
  updated_at: string;
}

// ========== Client Role Types ==========

export interface ClientRole {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
}

// ========== Project Client Types ==========

export interface ProjectClient {
  id: string;
  project_id: string;
  contact_id: string;
  organization_id: string;
  unit: string | null;
  is_primary: boolean;
  notes: string | null;
  status: 'active' | 'inactive' | 'deleted' | 'potential' | 'rejected' | 'completed';
  client_role_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Project Client with relations
export interface ProjectClientWithRelations extends ProjectClient {
  contact: Contact | null;
  role: ClientRole | null;
}

// ========== Client Commitment Types ==========

export interface ClientCommitment {
  id: string;
  project_id: string;
  client_id: string;
  contact_id: string | null;
  organization_id: string;
  amount: number;
  currency_id: string;
  exchange_rate: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Client Commitment with relations
export interface ClientCommitmentWithRelations extends ClientCommitment {
  client: ProjectClientWithRelations | null;
  contact: Contact | null;
  currency: {
    id: string;
    code: string;
    symbol: string;
    name: string;
  } | null;
}

// ========== Client Payment Schedule Types ==========

export interface ClientPaymentSchedule {
  id: string;
  commitment_id: string;
  organization_id: string;
  due_date: string;
  amount: number;
  currency_id: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paid_at: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Client Payment Schedule with relations
export interface ClientPaymentScheduleWithRelations extends ClientPaymentSchedule {
  commitment: ClientCommitmentWithRelations | null;
  currency: {
    id: string;
    code: string;
    symbol: string;
    name: string;
  } | null;
}

// ========== Client Payment Types ==========

export interface ClientPayment {
  id: string;
  project_id: string;
  client_id: string | null;
  commitment_id: string | null;
  schedule_id: string | null;
  organization_id: string;
  amount: number;
  currency_id: string;
  exchange_rate: number;
  payment_date: string;
  notes: string | null;
  reference: string | null;
  wallet_id: string | null;
  status: 'confirmed' | 'pending' | 'rejected' | 'void';
  file_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Client Payment with relations
export interface ClientPaymentWithRelations extends ClientPayment {
  client: ProjectClientWithRelations | null;
  commitment: ClientCommitmentWithRelations | null;
  schedule: ClientPaymentScheduleWithRelations | null;
  currency: {
    id: string;
    code: string;
    symbol: string;
    name: string;
  } | null;
  wallet: {
    id: string;
    organization_id: string;
    wallet_id: string;
    is_active: boolean;
    is_default: boolean;
    wallets: {
      id: string;
      name: string;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    } | null;
  } | null;
  creator: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  project: {
    id: string;
    name: string;
    code: string | null;
    color: string;
  } | null;
}

// ========== Dashboard & Analytics Types ==========

export interface ClientFinancialSummary {
  client_id: string;
  currency_id: string;
  total_committed: number;
  total_paid: number;
  total_scheduled: number;
  balance_due: number;
  total_schedule_items: number;
  schedule_paid: number;
  schedule_pending: number;
  schedule_overdue: number;
  next_due_date: string | null;
  next_due_amount: number | null;
  last_payment_date: string | null;
  last_payment_amount: number | null;
}

export interface ClientDashboardData {
  clients: ProjectClientWithRelations[];
  commitments: ClientCommitmentWithRelations[];
  payments: ClientPaymentWithRelations[];
  schedule: ClientPaymentScheduleWithRelations[];
  financialSummaries: Array<{ clientId: string; summaries: ClientFinancialSummary[] }>;
}

// ========== List View Types ==========

export interface ClientListItem {
  id: string;
  contact: Contact | null;
  role: ClientRole | null;
  unit: string | null;
  is_primary: boolean;
  status: string;
  notes: string | null;
  created_at: string;
  financial: {
    currency_id: string;
    currency_code: string;
    currency_symbol: string;
    total_committed: number;
    total_paid: number;
    balance_due: number;
    next_due_date: string | null;
    next_due_amount: number | null;
    last_payment_date: string | null;
  }[];
}
