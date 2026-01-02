import { SupabaseClient } from "@supabase/supabase-js";

interface LogActivityParams {
  organization_id: string;
  user_id: string;
  action: string;
  target_table: string;
  target_id: string;
  metadata?: object;
}

export async function logOrganizationActivity(
  supabase: SupabaseClient,
  params: LogActivityParams
): Promise<void> {
  try {
    const { organization_id, user_id, action, target_table, target_id, metadata = {} } = params;

    if (target_id?.startsWith('temp-')) {
      console.debug(`Skipping activity log for temporary ID: ${target_id}`);
      return;
    }

    const { error } = await supabase
      .from('organization_activity_logs')
      .insert({
        organization_id,
        user_id,
        action,
        target_table,
        target_id,
        metadata,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('[logOrganizationActivity] Error logging activity:', error);
    }
  } catch (error) {
    console.error('[logOrganizationActivity] Error:', error);
  }
}

export const ACTIVITY_ACTIONS = {
  ADD_MEMBER: 'add_member',
  REMOVE_MEMBER: 'remove_member',
  UPDATE_MEMBER: 'update_member',
} as const;

export const TARGET_TABLES = {
  ORGANIZATION_MEMBERS: 'organization_members',
} as const;
