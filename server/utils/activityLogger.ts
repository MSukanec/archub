import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Activity action types
 */
export type ActivityAction =
  // Contact actions
  | 'CREATE_CONTACT'
  | 'UPDATE_CONTACT'
  | 'DELETE_CONTACT'
  // Project actions
  | 'CREATE_PROJECT'
  | 'UPDATE_PROJECT'
  | 'DELETE_PROJECT'
  // Movement actions
  | 'CREATE_MOVEMENT'
  | 'UPDATE_MOVEMENT'
  | 'DELETE_MOVEMENT'
  // Budget actions
  | 'CREATE_BUDGET'
  | 'UPDATE_BUDGET'
  | 'DELETE_BUDGET'
  | 'CREATE_BUDGET_ITEM'
  | 'UPDATE_BUDGET_ITEM'
  | 'DELETE_BUDGET_ITEM'
  // Member actions
  | 'INVITE_MEMBER'
  | 'UPDATE_MEMBER'
  | 'REMOVE_MEMBER'
  // Partner actions
  | 'CREATE_PARTNER'
  | 'UPDATE_PARTNER'
  | 'DELETE_PARTNER'
  // Subcontract actions
  | 'CREATE_SUBCONTRACT'
  | 'UPDATE_SUBCONTRACT'
  | 'DELETE_SUBCONTRACT'
  // Plan actions
  | 'UPDATE_PLAN'
  // Payment actions
  | 'CREATE_PAYMENT'
  | 'UPDATE_PAYMENT'
  // Personnel actions
  | 'CREATE_PERSONNEL'
  | 'UPDATE_PERSONNEL'
  | 'DELETE_PERSONNEL';

/**
 * Parameters for logging an activity
 */
export interface LogActivityParams {
  supabase: SupabaseClient;
  organizationId: string;
  userId: string;
  action: ActivityAction;
  targetTable: string;
  targetId?: string;
  metadata?: Record<string, any>;
}

/**
 * Helper function to log user activity to Supabase
 * Calls the `log_activity()` RPC function in Supabase
 * 
 * @param params - Activity logging parameters
 * @returns Promise that resolves when activity is logged
 * 
 * @example
 * ```typescript
 * await logActivity({
 *   supabase: authenticatedSupabase,
 *   organizationId: 'org-123',
 *   userId: 'user-456',
 *   action: 'CREATE_CONTACT',
 *   targetTable: 'contacts',
 *   targetId: newContact.id,
 *   metadata: { name: newContact.full_name, email: newContact.email }
 * });
 * ```
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  const {
    supabase,
    organizationId,
    userId,
    action,
    targetTable,
    targetId,
    metadata
  } = params;

  try {
    const { error } = await supabase.rpc('log_activity', {
      p_organization_id: organizationId,
      p_user_id: userId,
      p_action: action,
      p_target_table: targetTable,
      p_target_id: targetId || null,
      p_metadata: metadata || null
    });

    if (error) {
      console.error('[ActivityLogger] Error logging activity:', error);
    }
  } catch (error) {
    console.error('[ActivityLogger] Exception logging activity:', error);
  }
}

/**
 * Helper to extract user's database ID from auth user
 */
export async function getUserDatabaseId(
  supabase: SupabaseClient,
  authId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .maybeSingle();

    if (error || !data) {
      console.error('[ActivityLogger] Error getting user database ID:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('[ActivityLogger] Exception getting user database ID:', error);
    return null;
  }
}
