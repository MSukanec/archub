import type { LucideIcon } from 'lucide-react';

export type PricingMode = 'public' | 'dashboard';

export type BillingPeriod = 'monthly' | 'annual';

export type PlanSlug = 'free' | 'pro' | 'teams' | 'enterprise';

export interface PricingContentProps {
  mode: PricingMode;
}

export interface PricingSectionProps {
  mode: PricingMode;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  monthly_amount: number;
  annual_amount: number;
  features: PlanFeatures;
  billing_type: string;
  is_active?: boolean;
  status?: 'available' | 'coming_soon' | 'maintenance';
}

export interface PlanFeatures {
  max_projects?: number;
  max_members?: number;
  max_storage_mb?: number;
  max_file_size_mb?: number;
  max_ai_tokens?: number;
  export_pdf_custom?: boolean;
  [key: string]: any;
}

export interface PlanConfig {
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  cardHeader: string;
  description: string;
  features: string[];
  limits: PlanLimit[];
}

export interface PlanLimit {
  iconComponent: LucideIcon;
  value: string;
}

export interface ComparisonCategory {
  category: string;
  rows: ComparisonRow[];
}

export interface ComparisonRow {
  label: string;
  free: boolean | string;
  pro: boolean | string;
  teams: boolean | string;
}

export interface FAQ {
  question: string;
  answer: string | (() => JSX.Element);
}
