import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Suspend bonus course enrollment for a specific user.
 * Called when a member is removed from a founder organization.
 * Sets enrollment status to 'suspended' - data is preserved, but access is blocked.
 */
export async function suspendUserBonusCourseEnrollment(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string
): Promise<{ suspended: boolean; error?: string }> {
  const result = { suspended: false, error: undefined as string | undefined };

  try {
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      console.log('[UserEnrollment] Organization not found, skipping suspend');
      return result;
    }

    const settings = org.settings as Record<string, any> | null;
    if (!settings?.is_founder) {
      console.log('[UserEnrollment] Organization is not a founder, skipping suspend');
      return result;
    }

    const { data: appSetting, error: settingError } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'founder_bonus_course_id')
      .maybeSingle();

    if (settingError || !appSetting?.value) {
      console.log('[UserEnrollment] No founder_bonus_course_id configured, skipping suspend');
      return result;
    }

    const bonusCourseId = appSetting.value;

    const { data: updated, error: updateError } = await supabase
      .from('course_enrollments')
      .update({ 
        status: 'suspended',
        updated_at: new Date().toISOString()
      })
      .eq('course_id', bonusCourseId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .select('id');

    if (updateError) {
      console.error('[UserEnrollment] Error suspending enrollment:', updateError);
      result.error = updateError.message;
      return result;
    }

    result.suspended = (updated?.length || 0) > 0;
    if (result.suspended) {
      console.log(`[UserEnrollment] Suspended bonus course enrollment for user ${userId}`);
    }
    return result;

  } catch (error: any) {
    console.error('[UserEnrollment] Unexpected error suspending enrollment:', error);
    result.error = error.message;
    return result;
  }
}

/**
 * Reactivate bonus course enrollment for a specific user.
 * Called when a removed member rejoins a founder organization.
 * Changes 'suspended' enrollment back to 'active'.
 */
export async function reactivateUserBonusCourseEnrollment(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string
): Promise<{ reactivated: boolean; error?: string }> {
  const result = { reactivated: false, error: undefined as string | undefined };

  try {
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      console.log('[UserEnrollment] Organization not found, skipping reactivate');
      return result;
    }

    const settings = org.settings as Record<string, any> | null;
    if (!settings?.is_founder) {
      console.log('[UserEnrollment] Organization is not a founder, skipping reactivate');
      return result;
    }

    const { data: appSetting, error: settingError } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'founder_bonus_course_id')
      .maybeSingle();

    if (settingError || !appSetting?.value) {
      console.log('[UserEnrollment] No founder_bonus_course_id configured, skipping reactivate');
      return result;
    }

    const bonusCourseId = appSetting.value;

    const { data: updated, error: updateError } = await supabase
      .from('course_enrollments')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('course_id', bonusCourseId)
      .eq('user_id', userId)
      .eq('status', 'suspended')
      .select('id');

    if (updateError) {
      console.error('[UserEnrollment] Error reactivating enrollment:', updateError);
      result.error = updateError.message;
      return result;
    }

    result.reactivated = (updated?.length || 0) > 0;
    if (result.reactivated) {
      console.log(`[UserEnrollment] Reactivated bonus course enrollment for user ${userId}`);
    }
    return result;

  } catch (error: any) {
    console.error('[UserEnrollment] Unexpected error reactivating enrollment:', error);
    result.error = error.message;
    return result;
  }
}
