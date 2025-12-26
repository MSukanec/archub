export interface OrganizationMemberUser {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}
export interface OrganizationMemberRole {
  id: string;
  name: string;
  type: string;
}
export interface OrganizationMember {
  id: string;
  user_id: string;
  organization_id: string;
  role_id: string | null;
  joined_at: string | null;
  last_active_at: string | null;
  is_active: boolean;
  is_over_limit: boolean;
  users: OrganizationMemberUser | null;
  roles: OrganizationMemberRole | null;
}
export interface OrganizationStats {
  activeProjects: number;
  documentsLast30Days: number;
  generatedTasks: number;
  financialMovementsLast30Days: number;
}
export interface ActivityData {
  date: string;
  total: number;
}
export interface ActivityLog {
  id: string;
  organization_id: string;
  user_id: string;
  action: string;
  target_table: string;
  target_id: string;
  metadata: Record<string, any>;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    email: string;
  };
}
export interface OrganizationWallet {
  id: string;
  organization_id: string;
  wallet_id: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string | null;
  wallets: {
    id: string;
    name: string;
    created_at: string;
    is_active: boolean;
  };
}
export interface UserOrganizationPreferences {
  id: string;
  user_id: string;
  organization_id: string;
  last_project_id: string | null;
  created_at: string;
  updated_at: string;
}
export interface UpdateUserOrganizationPreferencesInput {
  organizationId: string;
  lastProjectId: string | null;
}
import type { BadgeVariant } from '@/components/ui/badge';
export interface ActivityDisplayInfo {
  icon: string;
  label: string;
  variant: BadgeVariant;
  description: string;
  title: string;
}
