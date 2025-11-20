export const ORGANIZATION_QUERY_KEYS = {
  all: ['organization'] as const,
  members: (organizationId: string) => [...ORGANIZATION_QUERY_KEYS.all, 'members', organizationId] as const,
  stats: (organizationId: string) => [...ORGANIZATION_QUERY_KEYS.all, 'stats', organizationId] as const,
  activity: (organizationId: string) => [...ORGANIZATION_QUERY_KEYS.all, 'activity', organizationId] as const,
  activityLogs: (organizationId: string) => [...ORGANIZATION_QUERY_KEYS.all, 'activity-logs', organizationId] as const,
  wallets: (organizationId: string) => [...ORGANIZATION_QUERY_KEYS.all, 'wallets', organizationId] as const,
} as const;

export const USER_ORGANIZATION_PREFERENCES_QUERY_KEYS = {
  all: ['user-organization-preferences'] as const,
  detail: (userId: string, organizationId: string) => [...USER_ORGANIZATION_PREFERENCES_QUERY_KEYS.all, userId, organizationId] as const,
} as const;
