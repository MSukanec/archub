import { SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "../../auth/helpers.js";
import { registerMemberEvent } from "../../billing/events.js";
import { suspendUserBonusCourseEnrollment } from "../checkout/shared/user-enrollments.js";

export interface RemoveMemberParams {
  organizationId: string;
  memberId: string;
  performedByUserId: string;
}

export interface RemoveMemberResult {
  success: boolean;
  enrollmentSuspended?: boolean;
}

/**
 * Remove a member from an organization (soft delete).
 * This handler:
 * 1. Validates the performing user is an admin/owner of the organization
 * 2. Validates the member exists and is active
 * 3. Sets is_active = false (soft delete)
 * 4. Suspends bonus course enrollment if org is founder
 * 5. Registers billing event
 */
export async function removeMember(
  supabase: SupabaseClient,
  params: RemoveMemberParams
): Promise<RemoveMemberResult> {
  const { organizationId, memberId, performedByUserId } = params;

  // AUTHORIZATION: Verify the performing user is an admin or owner of the organization
  const { data: performingMember, error: authError } = await supabase
    .from('organization_members')
    .select(`
      id, 
      is_active,
      roles!inner (name)
    `)
    .eq('user_id', performedByUserId)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .single();

  if (authError || !performingMember) {
    throw new HttpError(403, "You don't have permission to remove members from this organization");
  }

  const performingRole = (performingMember.roles as any)?.name?.toLowerCase() || '';
  if (!performingRole.includes('owner') && !performingRole.includes('admin')) {
    throw new HttpError(403, "Only organization owners and admins can remove members");
  }

  const { data: member, error: memberError } = await supabase
    .from('organization_members')
    .select('id, user_id, is_active, is_billable, role_id')
    .eq('id', memberId)
    .eq('organization_id', organizationId)
    .single();

  if (memberError || !member) {
    throw new HttpError(404, "Member not found");
  }

  if (!member.is_active) {
    return { success: true, enrollmentSuspended: false };
  }

  const { data: role } = await supabase
    .from('roles')
    .select('name')
    .eq('id', member.role_id)
    .single();

  if (role?.name === 'Owner') {
    throw new HttpError(400, "Cannot remove the organization owner");
  }

  const { error: updateError } = await supabase
    .from('organization_members')
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', memberId);

  if (updateError) {
    console.error('[removeMember] Error deactivating member:', updateError);
    throw new HttpError(500, 'Failed to remove member');
  }

  const enrollmentResult = await suspendUserBonusCourseEnrollment(
    supabase,
    member.user_id,
    organizationId
  );

  await registerMemberEvent(supabase, {
    organizationId,
    memberId: member.id,
    userId: member.user_id,
    eventType: 'member_removed',
    wasBillable: member.is_billable,
    isBillable: false,
    performedBy: performedByUserId,
  });

  console.log(`[removeMember] Member ${memberId} removed from org ${organizationId}, enrollment suspended: ${enrollmentResult.suspended}`);

  return { 
    success: true, 
    enrollmentSuspended: enrollmentResult.suspended 
  };
}
