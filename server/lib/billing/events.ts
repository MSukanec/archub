import { SupabaseClient } from "@supabase/supabase-js";

export type MemberEventType = 
  | 'member_added' 
  | 'member_removed' 
  | 'billable_enabled' 
  | 'billable_disabled';

export async function registerMemberEvent(
  supabase: SupabaseClient,
  params: {
    organizationId: string;
    memberId: string;
    userId: string | null;
    eventType: MemberEventType;
    wasBillable: boolean | null;
    isBillable: boolean | null;
    performedBy: string | null;
  }
) {
  const { data: subscription } = await supabase
    .from('organization_subscriptions')
    .select('id')
    .eq('organization_id', params.organizationId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase
    .from('organization_member_events')
    .insert({
      organization_id: params.organizationId,
      subscription_id: subscription?.id || null,
      member_id: params.memberId,
      user_id: params.userId,
      event_type: params.eventType,
      was_billable: params.wasBillable,
      is_billable: params.isBillable,
      performed_by: params.performedBy,
    });

  if (error) {
    console.error('[billing] Error registering member event:', error);
  } else {
    console.log('[billing] Member event registered:', {
      organizationId: params.organizationId,
      eventType: params.eventType,
      memberId: params.memberId
    });
  }
}
