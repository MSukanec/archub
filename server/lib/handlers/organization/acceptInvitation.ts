// api/lib/handlers/organization/acceptInvitation.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "../../auth/helpers.js";
import { registerMemberEvent } from "../../billing/events.js";
import { reactivateUserBonusCourseEnrollment } from "../checkout/shared/user-enrollments.js";
import { logOrganizationActivity, ACTIVITY_ACTIONS, TARGET_TABLES } from "./logActivity.js";

export async function acceptInvitation(
  supabase: SupabaseClient,
  userId: string,
  invitationId: string
): Promise<{ success: boolean }> {
  if (!invitationId) {
    throw new HttpError(400, "invitationId is required");
  }

  // IDEMPOTENCY: Check if member already exists (in case of retry)
  const { data: invitation, error: invError } = await supabase
    .from('organization_invitations')
    .select('id, organization_id, role_id, user_id, status, invited_by')
    .eq('id', invitationId)
    .eq('user_id', userId)
    .maybeSingle();

  if (invError || !invitation) {
    throw new HttpError(404, "Invitation not found");
  }

  // If already accepted, check if member exists
  if (invitation.status === 'accepted') {
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', userId)
      .eq('organization_id', invitation.organization_id)
      .eq('is_active', true)
      .maybeSingle();

    if (existingMember) {
      // Already processed successfully - idempotent success
      return { success: true };
    }
    // Invitation accepted but member missing - continue to create
  } else if (invitation.status !== 'pending') {
    throw new HttpError(400, "Invitation already processed");
  }

  // Check for existing membership before creating (prevents duplicates)
  // RLS must allow users to see their own records (even inactive) for this to work
  const { data: existingMember } = await supabase
    .from('organization_members')
    .select('id, is_active, is_billable')
    .eq('user_id', userId)
    .eq('organization_id', invitation.organization_id)
    .maybeSingle();

  if (existingMember) {
    // Member record exists - reactivate if inactive, or just mark accepted
    if (!existingMember.is_active) {
      // Reactivate the inactive member with new role
      const { error: reactivateError } = await supabase
        .from('organization_members')
        .update({ 
          is_active: true,
          role_id: invitation.role_id,
          joined_at: new Date().toISOString(),
        })
        .eq('id', existingMember.id);

      if (reactivateError) {
        console.error('Error reactivating member:', reactivateError);
        throw new HttpError(500, 'Failed to reactivate member');
      }

      // Reactivate suspended bonus course enrollment if org is founder
      const enrollmentResult = await reactivateUserBonusCourseEnrollment(
        supabase,
        userId,
        invitation.organization_id
      );
      if (enrollmentResult.reactivated) {
        console.log(`[acceptInvitation] Reactivated bonus course enrollment for user ${userId}`);
      }

      // Register billing event for reactivation
      await registerMemberEvent(supabase, {
        organizationId: invitation.organization_id,
        memberId: existingMember.id,
        userId: userId,
        eventType: 'member_added',
        wasBillable: null,
        isBillable: existingMember.is_billable,
        performedBy: userId,
      });

      await logOrganizationActivity(supabase, {
        organization_id: invitation.organization_id,
        user_id: userId,
        action: ACTIVITY_ACTIONS.ADD_MEMBER,
        target_table: TARGET_TABLES.ORGANIZATION_MEMBERS,
        target_id: existingMember.id,
        metadata: { reactivated: true }
      });
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('organization_invitations')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitationId);

    if (updateError) {
      console.error('Error updating invitation status:', updateError);
    }

    return { success: true };
  }

  // TRANSACTIONAL: Update status FIRST, then create member
  // This prevents duplicate accepts since status check happens first
  const { error: updateError } = await supabase
    .from('organization_invitations')
    .update({ 
      status: 'accepted',
      accepted_at: new Date().toISOString()
    })
    .eq('id', invitationId)
    .eq('status', 'pending'); // Only update if still pending

  if (updateError) {
    console.error('Error updating invitation status:', updateError);
    throw new HttpError(500, 'Failed to update invitation status');
  }

  // Create organization member AFTER status update
  const { data: newMember, error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: invitation.organization_id,
      user_id: userId,
      role_id: invitation.role_id,
      invited_by: invitation.invited_by,
      is_active: true,
      is_billable: true,
    })
    .select('id, is_billable')
    .single();

  if (memberError) {
    console.error('Error creating organization member:', memberError);
    // Member creation failed but invitation is marked accepted
    // This is a safer failure mode than the reverse
    throw new HttpError(500, 'Failed to create organization member. Please contact support.');
  }

  // Register member_added event for billing
  await registerMemberEvent(supabase, {
    organizationId: invitation.organization_id,
    memberId: newMember.id,
    userId: userId,
    eventType: 'member_added',
    wasBillable: null,
    isBillable: newMember.is_billable,
    performedBy: userId,
  });

  await logOrganizationActivity(supabase, {
    organization_id: invitation.organization_id,
    user_id: userId,
    action: ACTIVITY_ACTIONS.ADD_MEMBER,
    target_table: TARGET_TABLES.ORGANIZATION_MEMBERS,
    target_id: newMember.id,
    metadata: { reactivated: false }
  });

  return { success: true };
}
