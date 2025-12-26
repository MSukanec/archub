/**
 * Users Query Keys
 * 
 * Centralized query keys for user-related data.
 * Following the pattern established by other features.
 */

export const usersKeys = {
  all: () => ['users'] as const,
  
  current: () => ['current-user'] as const,
  
  profile: (userId: string) => ['user-profile', userId] as const,
  
  preferences: (userId: string) => ['user-preferences', userId] as const,
  
  notifications: (userId: string) => ['notifications', userId] as const,
  
  organizations: (userId: string) => ['user-organizations', userId] as const,
} as const;

export type UsersQueryKey = ReturnType<typeof usersKeys[keyof typeof usersKeys]>;
