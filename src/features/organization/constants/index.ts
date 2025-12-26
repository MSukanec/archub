/**
 * @deprecated Use organizationKeys from '@/core/query-keys'instead
 * This file is kept for backwards compatibility only.
 * 
 * Migration:
 * - import { organizationKeys, userOrgPreferencesKeys } from '@/core/query-keys'
 * - ORGANIZATION_QUERY_KEYS.members(id) → organizationKeys.members(id)
 * - USER_ORGANIZATION_PREFERENCES_QUERY_KEYS.detail(uid, oid) → userOrgPreferencesKeys.detail(uid, oid)
 */
// Re-export from centralized location for backwards compatibility
export { organizationKeys, userOrgPreferencesKeys } from '@/core/query-keys';
/** @deprecated Use organizationKeys from '@/core/query-keys'instead */
export const ORGANIZATION_QUERY_KEYS = {
  all: ['organization'] as const,
  members: (organizationId: string) => ['organization', 'members', organizationId] as const,
  stats: (organizationId: string) => ['organization', 'stats', organizationId] as const,
  activity: (organizationId: string) => ['organization', 'activity', organizationId] as const,
  activityLogs: (organizationId: string) => ['organization', 'activity-logs', organizationId] as const,
  wallets: (organizationId: string) => ['organization', 'wallets', organizationId] as const,
} as const;
/** @deprecated Use userOrgPreferencesKeys from '@/core/query-keys'instead */
export const USER_ORGANIZATION_PREFERENCES_QUERY_KEYS = {
  all: ['user-organization-preferences'] as const,
  detail: (userId: string, organizationId: string) => ['user-organization-preferences', 'detail', userId, organizationId] as const,
} as const;
