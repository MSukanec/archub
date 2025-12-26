/**
 * Helper functions for plan-related logic
 */

export type PlanCode = 'free' | 'pro' | 'teams' | 'premium';

/**
 * Checks if a plan is PRO or TEAMS (has advanced features)
 * @param planCode - The plan code to check
 * @returns true if plan is PRO or TEAMS
 */
export function isProOrTeams(planCode?: PlanCode | string | null): boolean {
  if (!planCode) return false;
  const plan = String(planCode).toLowerCase();
  return plan === 'pro' || plan === 'teams' || plan === 'premium';
}

/**
 * Gets a user-friendly plan name
 * @param planCode - The plan code
 * @returns Formatted plan name
 */
export function getPlanDisplayName(planCode?: PlanCode | string | null): string {
  if (!planCode) return 'Free';
  
  const plan = String(planCode).toLowerCase();
  
  switch (plan) {
    case 'pro':
      return 'Pro';
    case 'teams':
      return 'Teams';
    case 'premium':
      return 'Premium';
    default:
      return 'Free';
  }
}
